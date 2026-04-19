"use client";

import {
  Suspense,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { Turn } from "@/lib/types";
import { scenarios } from "@/lib/scenarios";
import { personas, activePersonas } from "@/lib/personas";
import { PatientAvatar } from "@/components/PatientAvatar";
import { ConversationPanel } from "@/components/ConversationPanel";
import { SuggestionList } from "@/components/SuggestionList";
import { TraineeInput } from "@/components/TraineeInput";
import { ErrorBanner } from "@/components/ErrorBanner";

interface SessionState {
  history: Turn[];
  suggestions: string[];
  loading: boolean;
  audioPlaying: boolean;
  error: string | null;
  sessionStarted: boolean;
}

type SessionAction =
  | { type: "START_SESSION" }
  | { type: "PATIENT_TURN"; turn: Turn; suggestions: string[] }
  | { type: "TRAINEE_TURN"; turn: Turn }
  | { type: "AUDIO_START" }
  | { type: "AUDIO_END" }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" };

const initialState: SessionState = {
  history: [],
  suggestions: [],
  loading: false,
  audioPlaying: false,
  error: null,
  sessionStarted: false,
};

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "START_SESSION":
      return { ...state, sessionStarted: true, loading: true };
    case "PATIENT_TURN":
      return {
        ...state,
        history: [...state.history, action.turn],
        suggestions: action.suggestions,
        loading: false,
        error: null,
      };
    case "TRAINEE_TURN":
      return {
        ...state,
        history: [...state.history, action.turn],
        suggestions: [],
        loading: true,
      };
    case "AUDIO_START":
      return { ...state, audioPlaying: true };
    case "AUDIO_END":
      return { ...state, audioPlaying: false };
    case "ERROR":
      return { ...state, error: action.message, loading: false };
    case "RETRY":
      return { ...state, error: null, loading: true };
  }
}

const SessionContent = () => {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenarioId") ?? scenarios[0].id;
  const personaId = searchParams.get("personaId") ?? activePersonas[0].id;

  const persona = personas.find((p) => p.id === personaId) ?? activePersonas[0];
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];
  const firstName = persona.patientName.split(" ")[0];

  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const { history, suggestions, loading, audioPlaying, error } = state;

  const [input, setInput] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading, audioPlaying]);

  const playUtterance = useCallback(
    async (text: string) => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId: persona.voiceId }),
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
    [persona.voiceId],
  );

  const fetchPatientResponse = useCallback(
    async (currentHistory: Turn[]) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history: currentHistory,
            scenarioId,
            personaId,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const patientTurn: Turn = {
          role: "patient",
          content: data.patientUtterance,
          timestamp: Date.now(),
        };

        dispatch({
          type: "PATIENT_TURN",
          turn: patientTurn,
          suggestions: data.suggestions ?? [],
        });

        await playUtterance(data.patientUtterance);
      } catch {
        dispatch({
          type: "ERROR",
          message:
            "Could not reach the patient. Check your network or try again.",
        });
      }
    },
    [scenarioId, personaId, playUtterance],
  );

  function handleBeginSession() {
    dispatch({ type: "START_SESSION" });
    fetchPatientResponse([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || audioPlaying) return;

    const traineeTurn: Turn = {
      role: "trainee",
      content: text,
      timestamp: Date.now(),
    };

    dispatch({ type: "TRAINEE_TURN", turn: traineeTurn });
    setInput("");

    await fetchPatientResponse([...history, traineeTurn]);
  }

  function handleRetry() {
    dispatch({ type: "RETRY" });
    fetchPatientResponse(history);
  }

  // Pre-session: show patient info and a begin button
  if (!state.sessionStarted) {
    return (
      <div className="max-w-3xl mx-auto px-xs py-md flex flex-col min-h-screen font-sans items-center justify-center gap-xs text-center">
        <div className="w-16 h-16 rounded-circle bg-smoke-gray flex items-center justify-center text-forest-medium font-semibold text-xl">
          {persona.avatarInitials}
        </div>
        <div>
          <p className="text-xl font-medium text-forest-dark">
            {persona.patientName}
          </p>
          <p className="text-sm text-forest-medium mt-xxs">
            {persona.age} · {scenario.label}
          </p>
        </div>
        <p className="text-sm text-forest-medium max-w-sm leading-relaxed italic">
          &ldquo;{persona.presentingConcern}&rdquo;
        </p>
        <button
          onClick={handleBeginSession}
          className="mt-xs px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
        >
          Begin Session
        </button>
      </div>
    );
  }

  // Active session
  return (
    <div className="max-w-3xl mx-auto px-xs py-md flex flex-col min-h-screen font-sans">
      <PatientAvatar
        avatarInitials={persona.avatarInitials}
        patientName={persona.patientName}
        age={persona.age}
        scenarioLabel={scenario.label}
        audioPlaying={audioPlaying}
        loading={loading}
      />

      <ConversationPanel
        history={history}
        loading={loading}
        audioPlaying={audioPlaying}
        firstName={firstName}
        bottomRef={bottomRef}
      />

      <SuggestionList
        suggestions={suggestions}
        loading={loading}
        audioPlaying={audioPlaying}
        onSelectSuggestion={setInput}
      />

      {error && <ErrorBanner error={error} onRetry={handleRetry} />}

      <TraineeInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        loading={loading}
        audioPlaying={audioPlaying}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page shell — wraps SessionContent in Suspense for useSearchParams
// ---------------------------------------------------------------------------

export default function SessionPage() {
  return (
    <Suspense>
      <SessionContent />
    </Suspense>
  );
}
