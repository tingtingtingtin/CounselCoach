"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowUp, Lightbulb, PhoneOff } from "lucide-react";
import { Dialog } from "@base-ui/react";
import { AnimatePresence, motion } from "motion/react";
import type { Turn } from "@/lib/types";
import { personas, activePersonas } from "@/lib/personas";
import { scenarios } from "@/lib/scenarios";
import { useSessionState } from "@/hooks/useSessionState";
import { useSessionActions } from "@/hooks/useSessionActions";
import type { SessionEndPayload } from "./SessionContainer";
import { PatientAvatar } from "@/components/PatientAvatar";
import { PatientAura } from "@/components/PatientAura";
import { TraineeInput } from "@/components/TraineeInput";

interface CallSessionProps {
  personaId: string;
  scenarioId: string;
  volumeOn: boolean;
  onSessionEnd: (payload: SessionEndPayload) => void;
}

export function CallSession({
  personaId,
  scenarioId,
  volumeOn,
  onSessionEnd,
}: CallSessionProps) {
  const persona = personas.find((p) => p.id === personaId) ?? activePersonas[0];
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];

  const [state, dispatch] = useSessionState();
  const { history, suggestions, loading, audioPlaying, sessionStarted } = state;

  const [input, setInput] = useState("");
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [traineeSpeaking, setTraineeSpeaking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const handleAutoEnd = useCallback(
    (h: Turn[]) =>
      onSessionEnd({
        history: h,
        startTime: startTimeRef.current!,
        endTime: Date.now(),
      }),
    [onSessionEnd],
  );

  const { fetchPatientResponse } = useSessionActions({
    dispatch,
    audioRef,
    voiceId: persona.voiceId,
    personaId,
    scenarioId,
    history,
    sessionStarted,
    audioPlaying,
    volumeOn,
    onAutoEnd: handleAutoEnd,
  });

  async function handleAutoSubmit(text: string) {
    if (!text || loading || audioPlaying) return;
    const turn: Turn = {
      role: "trainee",
      content: text,
      timestamp: Date.now(),
    };
    dispatch({ type: "TRAINEE_TURN", turn });
    setInput("");
    setHintIndex(null);
    await fetchPatientResponse([...history, turn]);
  }

  function handleHint() {
    if (suggestions.length === 0) return;
    setHintIndex((prev) =>
      prev === null ? 0 : (prev + 1) % suggestions.length,
    );
  }

  const canShowHint = suggestions.length > 0 && !audioPlaying && !loading;
  const activeHintIndex =
    hintIndex !== null && suggestions[hintIndex] ? hintIndex : null;
  const shownHint =
    activeHintIndex !== null ? suggestions[activeHintIndex] : null;

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-sm font-sans text-center px-xs">
        <div className="w-30 h-30 rounded-circle bg-white/10 flex items-center justify-center text-white font-semibold text-3xl">
          {persona.avatarInitials}
        </div>
        <div>
          <p className="text-3xl font-medium text-white">
            {persona.patientName}
          </p>
          <p className="text-md text-white/50 mt-xxs">
            {persona.age} · {scenario.label}
          </p>
        </div>
        <p className="text-sm text-white/40 italic max-w-64 leading-relaxed">
          {persona.presentingConcern}
        </p>
        <button
          onClick={() => {
            startTimeRef.current = Date.now();
            dispatch({ type: "START_SESSION" });
            fetchPatientResponse([]);
          }}
          className="mt-xs px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity border-none"
        >
          Begin Session
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-600/20 flex flex-col items-center justify-center relative font-sans px-xs overflow-hidden">
      {/* Audio-reactive 3D aura behind avatar */}
      <PatientAura
        audioPlaying={audioPlaying}
        loading={loading}
        traineeSpeaking={traineeSpeaking}
      />

      {/* Contrast scrim to keep overlay UI legible over animated background */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 44%, rgba(8,14,12,0.10) 0%, rgba(8,14,12,0.18) 45%, rgba(8,14,12,0.40) 100%), linear-gradient(to bottom, rgba(8,14,12,0.32) 0%, rgba(8,14,12,0.14) 38%, rgba(8,14,12,0.28) 100%)",
        }}
      />

      {/* Centered avatar */}
      <div className="relative z-10">
        <PatientAvatar
          avatarInitials={persona.avatarInitials}
          patientName={persona.patientName}
          age={persona.age}
          scenarioLabel={scenario.label}
          audioPlaying={audioPlaying}
          loading={loading}
          callMode
        />
      </div>

      {/* Voice input — renders nothing when mic is available, fallback otherwise */}
      <div className="relative z-10 mt-md w-full max-w-2xl">
        <TraineeInput
          input={input}
          onInputChange={setInput}
          onSubmit={(e) => {
            e.preventDefault();
            handleAutoSubmit(input.trim());
          }}
          onAutoSubmit={handleAutoSubmit}
          loading={loading}
          audioPlaying={audioPlaying}
          inputMode="voice"
          onInputModeChange={() => {}}
          callMode
          onListeningChange={setTraineeSpeaking}
        />
      </div>

      {/* Mid controls: hint (left) + hang-up (right), anchored to avatar/content stack */}
      <div className="relative z-10 mt-lg flex items-center gap-lg">
        <button
          type="button"
          onClick={handleHint}
          disabled={!canShowHint}
          title={
            activeHintIndex === null
              ? "Hint"
              : `Hint ${activeHintIndex + 1} / ${suggestions.length}`
          }
          className={`flex items-center justify-center w-16 h-16 rounded-circle border border-white/20 bg-white/14 backdrop-blur-md transition-colors shadow-[0_12px_32px_rgba(0,0,0,0.24)] ${
            canShowHint
              ? "cursor-pointer hover:bg-white/22 text-white/92"
              : "cursor-not-allowed text-white/45"
          }`}
        >
          <Lightbulb size={26} />
        </button>

        <Dialog.Root open={endDialogOpen} onOpenChange={setEndDialogOpen}>
          <Dialog.Trigger className="flex items-center justify-center w-16 h-16 rounded-circle border border-white/20 bg-white/14 backdrop-blur-md cursor-pointer hover:bg-white/22 transition-colors shadow-[0_12px_32px_rgba(0,0,0,0.24)]">
            <PhoneOff size={26} className="text-white/95" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Popup className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-sm p-md shadow-lg max-w-2xl w-full font-sans">
              <Dialog.Title className="text-base font-semibold text-forest-dark mb-xxs">
                End this session?
              </Dialog.Title>
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
                    onSessionEnd({
                      history,
                      startTime: startTimeRef.current!,
                      endTime: Date.now(),
                    });
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

      {/* Hint chip */}
      <AnimatePresence>
        {shownHint && (
          <motion.div
            key={`${hintIndex}-${shownHint}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-3xl px-md z-10"
          >
            <div className="flex items-center gap-xs rounded-sm p-sm border border-white/20 bg-white/12 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.24)]">
              <p className="flex-1 text-base text-white leading-relaxed">
                {shownHint}
              </p>
              <button
                type="button"
                onClick={() => handleAutoSubmit(shownHint)}
                className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none text-white hover:opacity-80 transition-opacity"
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
