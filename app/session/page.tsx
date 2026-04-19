"use client";

import {
  Suspense,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "@base-ui/react";
import type { Turn, InsightsResult } from "@/lib/types";
import { scenarios } from "@/lib/scenarios";
import { personas, activePersonas } from "@/lib/personas";
import { PatientAvatar } from "@/components/PatientAvatar";
import { ConversationPanel } from "@/components/ConversationPanel";
import { SuggestionList } from "@/components/SuggestionList";
import { TraineeInput } from "@/components/TraineeInput";
import { ErrorBanner } from "@/components/ErrorBanner";
import { formatDuration } from "@/lib/utils";

const TURN_LIMIT = 8; // patient utterances before closing turn

interface SessionState {
  history: Turn[];
  suggestions: string[];
  loading: boolean;
  audioPlaying: boolean;
  error: string | null;
  sessionStarted: boolean;
  sessionComplete: boolean;
  insights: InsightsResult | null;
  insightsLoading: boolean;
}

type SessionAction =
  | { type: "START_SESSION" }
  | { type: "PATIENT_TURN"; turn: Turn; suggestions: string[] }
  | { type: "TRAINEE_TURN"; turn: Turn }
  | { type: "AUDIO_START" }
  | { type: "AUDIO_END" }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" }
  | { type: "SESSION_COMPLETE" }
  | { type: "INSIGHTS_LOADING" }
  | { type: "INSIGHTS_LOADED"; insights: InsightsResult };

const initialState: SessionState = {
  history: [],
  suggestions: [],
  loading: false,
  audioPlaying: false,
  error: null,
  sessionStarted: false,
  sessionComplete: false,
  insights: null,
  insightsLoading: false,
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
    case "SESSION_COMPLETE":
      return { ...state, sessionComplete: true, insightsLoading: true };
    case "INSIGHTS_LOADING":
      return { ...state, insightsLoading: true };
    case "INSIGHTS_LOADED":
      return { ...state, insights: action.insights, insightsLoading: false };
  }
}

const SessionContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenarioId") ?? scenarios[0].id;
  const personaId = searchParams.get("personaId") ?? activePersonas[0].id;

  const persona = personas.find((p) => p.id === personaId) ?? activePersonas[0];
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];
  const firstName = persona.patientName.split(" ")[0];

  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const {
    history,
    suggestions,
    loading,
    audioPlaying,
    error,
    sessionComplete,
    insights,
    insightsLoading,
  } = state;

  const [input, setInput] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isClosingTurnRef = useRef(false);

  const fetchInsights = useCallback(
    async (finalHistory: Turn[]) => {
      setEndTime(Date.now());
      dispatch({ type: "SESSION_COMPLETE" });
      try {
        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history: finalHistory,
            personaId,
            scenarioId,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InsightsResult = await res.json();
        dispatch({ type: "INSIGHTS_LOADED", insights: data });
      } catch {
        dispatch({
          type: "INSIGHTS_LOADED",
          insights: {
            observations: ["Unable to load insights."],
            suggestions: [],
          },
        });
      }
    },
    [personaId, scenarioId],
  );

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

  // After closing turn audio finishes, fetch insights
  useEffect(() => {
    if (
      isClosingTurnRef.current &&
      !audioPlaying &&
      state.sessionStarted &&
      !sessionComplete
    ) {
      isClosingTurnRef.current = false;
      fetchInsights(history);
    }
  }, [
    audioPlaying,
    history,
    state.sessionStarted,
    sessionComplete,
    fetchInsights,
  ]);

  const fetchPatientResponse = useCallback(
    async (currentHistory: Turn[]) => {
      const patientTurnCount = currentHistory.filter(
        (t) => t.role === "patient",
      ).length;
      const isClosing = patientTurnCount >= TURN_LIMIT;

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
          suggestions: isClosing ? [] : (data.suggestions ?? []),
        });

        if (isClosing) {
          isClosingTurnRef.current = true;
        }

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
    setStartTime(Date.now());
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

  async function handleAutoSubmit(text: string) {
    if (!text || loading || audioPlaying) return;

    const traineeTurn: Turn = {
      role: "trainee",
      content: text,
      timestamp: Date.now(),
    };

    dispatch({ type: "TRAINEE_TURN", turn: traineeTurn });
    await fetchPatientResponse([...history, traineeTurn]);
  }

  function handleRetry() {
    dispatch({ type: "RETRY" });
    fetchPatientResponse(history);
  }

  function handleConfirmEnd() {
    setEndDialogOpen(false);
    fetchInsights(history);
  }

  // --- Insights screen ---
  if (sessionComplete) {
    const duration = startTime && endTime ? endTime - startTime : 0;
    const patientTurns = history.filter((t) => t.role === "patient").length;

    return (
      <div className="max-w-3xl mx-auto px-xs py-md font-sans">
        <div className="mb-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
            Session Complete
          </p>
          <h1 className="text-2xl font-medium text-forest-dark">
            {persona.patientName}
          </h1>
          <p className="text-sm text-forest-medium mt-xxxs">
            {scenario.label} · {patientTurns} turns · {formatDuration(duration)}
          </p>
        </div>

        {insightsLoading ? (
          <div className="py-lg text-center text-forest-medium text-sm">
            Generating insights…
          </div>
        ) : insights ? (
          <div className="flex flex-col gap-md">
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xs">
                Observations
              </p>
              <ul className="flex flex-col gap-xxs">
                {insights.observations.map((obs, i) => (
                  <li
                    key={i}
                    className="text-sm text-forest-dark leading-relaxed"
                  >
                    {obs}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xs">
                Suggestions
              </p>
              <ul className="flex flex-col gap-xxs">
                {insights.suggestions.map((sug, i) => (
                  <li
                    key={i}
                    className="text-sm text-forest-dark leading-relaxed"
                  >
                    {sug}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <button
                type="button"
                onClick={() => setTranscriptOpen((o) => !o)}
                className="text-sm text-forest-medium underline cursor-pointer bg-transparent border-none p-0"
              >
                {transcriptOpen ? "Hide Transcript" : "Review Transcript"}
              </button>
              {transcriptOpen && (
                <div className="mt-xs flex flex-col gap-xxs border-t border-smoke-gray pt-xs">
                  {history.map((turn, i) => (
                    <div
                      key={i}
                      className={`text-sm ${turn.role === "patient" ? "text-forest-medium" : "text-forest-dark"}`}
                    >
                      <span className="font-semibold">
                        {turn.role === "patient" ? firstName : "You"}:
                      </span>{" "}
                      {turn.content}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        <button
          onClick={() => router.push("/")}
          className="mt-lg px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity border-none"
        >
          Start New Session
        </button>
      </div>
    );
  }

  // --- Pre-session ---
  if (!state.sessionStarted) {
    return (
      <div className="max-w-3xl mx-auto px-xs py-md flex flex-col my-24 font-sans items-center justify-center gap-xs text-center">
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
        <div className="mt-sm">
          <p className="text-sm text-left mb-xxxs">Presenting Concern</p>
          <blockquote className="pl-xs border-l-4 border-forest-light">
            <p className="text-sm text-forest-medium italic leading-relaxed">
              {persona.presentingConcern}
            </p>
          </blockquote>
        </div>
        <button
          onClick={handleBeginSession}
          className="mt-xs px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
        >
          Begin Session
        </button>
      </div>
    );
  }

  // --- Active session ---
  return (
    <div className="max-w-3xl mx-auto px-xs py-md flex flex-col min-h-screen font-sans">
      <div className="flex justify-between">
        <PatientAvatar
          avatarInitials={persona.avatarInitials}
          patientName={persona.patientName}
          age={persona.age}
          scenarioLabel={scenario.label}
          audioPlaying={audioPlaying}
          loading={loading}
        />
        <div className="justify-end mb-xs">
          <Dialog.Root open={endDialogOpen} onOpenChange={setEndDialogOpen}>
            <Dialog.Trigger className="text-sm text-forest-medium border border-forest-light rounded-sm px-xs py-xxxs cursor-pointer bg-transparent hover:border-forest-dark transition-colors">
              End Session
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 bg-black/30 z-40" />
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
                    onClick={handleConfirmEnd}
                    className="px-sm py-xxs rounded-circle bg-forest-dark text-white text-sm font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity"
                  >
                    End Session
                  </button>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
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

      {error && <ErrorBanner error={error} onRetry={handleRetry} />}

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
};

export default function SessionPage() {
  return (
    <Suspense>
      <SessionContent />
    </Suspense>
  );
}
