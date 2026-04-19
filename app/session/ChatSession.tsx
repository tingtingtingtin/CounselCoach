"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog } from "@base-ui/react";
import type { Turn } from "@/lib/types";
import { personas, activePersonas } from "@/lib/personas";
import { scenarios } from "@/lib/scenarios";
import { useSessionState } from "@/hooks/useSessionState";
import { useSessionActions } from "@/hooks/useSessionActions";
import type { SessionEndPayload } from "./SessionContainer";
import { PatientAvatar } from "@/components/PatientAvatar";
import { ConversationPanel } from "@/components/ConversationPanel";
import { SuggestionList } from "@/components/SuggestionList";
import { TraineeInput } from "@/components/TraineeInput";
import { ErrorBanner } from "@/components/ErrorBanner";

interface ChatSessionProps {
  personaId: string;
  scenarioId: string;
  initialInputMode: "text" | "voice";
  volumeOn: boolean;
  onSessionEnd: (payload: SessionEndPayload) => void;
}

export function ChatSession({
  personaId,
  scenarioId,
  initialInputMode,
  volumeOn,
  onSessionEnd,
}: ChatSessionProps) {
  const persona = personas.find((p) => p.id === personaId) ?? activePersonas[0];
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];
  const firstName = persona.patientName.split(" ")[0];

  const [state, dispatch] = useSessionState();
  const { history, suggestions, loading, audioPlaying, error, sessionStarted } = state;

  const [input, setInput] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "voice">(initialInputMode);
  const [endDialogOpen, setEndDialogOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);

  const handleAutoEnd = useCallback(
    (h: Turn[]) => onSessionEnd({ history: h, startTime: startTimeRef.current!, endTime: Date.now() }),
    [onSessionEnd],
  );

  const { fetchPatientResponse } = useSessionActions({
    dispatch, audioRef,
    voiceId: persona.voiceId, personaId, scenarioId,
    history, sessionStarted, audioPlaying, volumeOn,
    onAutoEnd: handleAutoEnd,
  });

  function handleBeginSession() {
    startTimeRef.current = Date.now();
    dispatch({ type: "START_SESSION" });
    fetchPatientResponse([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || audioPlaying) return;
    const turn: Turn = { role: "trainee", content: text, timestamp: Date.now() };
    dispatch({ type: "TRAINEE_TURN", turn });
    setInput("");
    await fetchPatientResponse([...history, turn]);
  }

  async function handleAutoSubmit(text: string) {
    if (!text || loading || audioPlaying) return;
    const turn: Turn = { role: "trainee", content: text, timestamp: Date.now() };
    dispatch({ type: "TRAINEE_TURN", turn });
    await fetchPatientResponse([...history, turn]);
  }

  if (!sessionStarted) {
    return (
      <div className="max-w-3xl mx-auto px-xs py-md flex flex-col my-24 font-sans items-center justify-center gap-xs text-center">
        <div className="w-16 h-16 rounded-circle bg-smoke-gray flex items-center justify-center text-forest-medium font-semibold text-xl">
          {persona.avatarInitials}
        </div>
        <div>
          <p className="text-xl font-medium text-forest-dark">{persona.patientName}</p>
          <p className="text-sm text-forest-medium mt-xxs">{persona.age} · {scenario.label}</p>
        </div>
        <div className="mt-sm">
          <p className="text-sm text-left mb-xxxs">Presenting Concern</p>
          <blockquote className="pl-xs border-l-4 border-forest-light">
            <p className="text-sm text-forest-medium italic leading-relaxed">{persona.presentingConcern}</p>
          </blockquote>
        </div>
        <button
          onClick={handleBeginSession}
          className="mt-xs px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity border-none"
        >
          Begin Session
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-xs py-md flex flex-col min-h-screen font-sans">
      <div className="flex justify-between items-start mb-sm">
        <PatientAvatar
          avatarInitials={persona.avatarInitials}
          patientName={persona.patientName}
          age={persona.age}
          scenarioLabel={scenario.label}
          audioPlaying={audioPlaying}
          loading={loading}
        />
        <Dialog.Root open={endDialogOpen} onOpenChange={setEndDialogOpen}>
          <Dialog.Trigger className="text-sm text-forest-medium border border-forest-light rounded-sm px-xs py-xxxs cursor-pointer bg-transparent hover:border-forest-dark transition-colors">
            End Session
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 bg-black/30 z-40" />
            <Dialog.Popup className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-sm p-md shadow-lg max-w-2xl w-full font-sans">
              <Dialog.Title className="text-base font-semibold text-forest-dark mb-xxs">End this session?</Dialog.Title>
              <Dialog.Description className="text-sm text-forest-medium mb-sm">
                Your conversation will be reviewed for insights.
              </Dialog.Description>
              <div className="flex gap-xxs justify-end">
                <Dialog.Close className="px-sm py-xxs rounded-circle border border-forest-light text-forest-dark text-sm cursor-pointer bg-transparent hover:border-forest-dark transition-colors">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={() => {
                    setEndDialogOpen(false);
                    onSessionEnd({ history, startTime: startTimeRef.current!, endTime: Date.now() });
                  }}
                  className="px-sm py-xxs rounded-circle bg-forest-dark text-white text-sm font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity"
                >
                  End Session
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

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

      {error && (
        <ErrorBanner
          error={error}
          onRetry={() => { dispatch({ type: "RETRY" }); fetchPatientResponse(history); }}
        />
      )}

      <TraineeInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onAutoSubmit={handleAutoSubmit}
        loading={loading}
        audioPlaying={audioPlaying}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
      />
    </div>
  );
}
