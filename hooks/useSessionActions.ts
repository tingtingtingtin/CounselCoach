import { useCallback, useEffect, useRef } from "react";
import type { Turn } from "@/lib/types";
import type { TurnLoopAction } from "@/lib/session";
import { apiFetchPatientResponse, TURN_LIMIT } from "@/lib/session";

interface UseSessionActionsArgs {
  dispatch: React.Dispatch<TurnLoopAction>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  voiceId: string;
  personaId: string;
  scenarioId: string;
  history: Turn[];
  sessionStarted: boolean;
  audioPlaying: boolean;
  volumeOn: boolean;
  onAutoEnd: (history: Turn[]) => void;
}

export function useSessionActions({
  dispatch,
  audioRef,
  voiceId,
  personaId,
  scenarioId,
  history,
  sessionStarted,
  audioPlaying,
  volumeOn,
  onAutoEnd,
}: UseSessionActionsArgs) {
  const isClosingTurnRef = useRef(false);

  const playUtterance = useCallback(
    async (text: string) => {
      if (!volumeOn) {
        // Volume off — skip TTS, immediately unblock input
        dispatch({ type: "AUDIO_START" });
        dispatch({ type: "AUDIO_END" });
        return;
      }
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId }),
        });
        if (!res.ok) return;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        if (audioRef.current) {
          audioRef.current.pause();
          if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        dispatch({ type: "AUDIO_START" });

        audio.onended = () => {
          dispatch({ type: "AUDIO_END" });
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          dispatch({ type: "AUDIO_END" });
          URL.revokeObjectURL(url);
        };

        await audio.play();
      } catch {
        dispatch({ type: "AUDIO_END" });
      }
    },
    [dispatch, audioRef, voiceId, volumeOn],
  );

  const fetchPatientResponse = useCallback(
    async (currentHistory: Turn[]) => {
      const patientTurnCount = currentHistory.filter(
        (t) => t.role === "patient",
      ).length;
      const isClosing = patientTurnCount >= TURN_LIMIT;
      try {
        const data = await apiFetchPatientResponse(
          currentHistory,
          scenarioId,
          personaId,
        );
        const patientTurn: Turn = {
          role: "patient",
          content: data.patientUtterance,
          timestamp: Date.now(),
        };
        dispatch({
          type: "PATIENT_TURN",
          turn: patientTurn,
          suggestions: isClosing ? [] : (data.suggestions ?? []),
        });
        if (isClosing) isClosingTurnRef.current = true;
        await playUtterance(data.patientUtterance);
      } catch {
        dispatch({
          type: "ERROR",
          message:
            "Could not reach the patient. Check your network or try again.",
        });
      }
    },
    [dispatch, scenarioId, personaId, playUtterance],
  );

  useEffect(() => {
    if (isClosingTurnRef.current && !audioPlaying && sessionStarted) {
      isClosingTurnRef.current = false;
      onAutoEnd(history);
    }
  }, [audioPlaying, history, sessionStarted, onAutoEnd]);

  return { fetchPatientResponse };
}
