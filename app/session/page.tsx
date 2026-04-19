"use client";

import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import type { Turn } from "@/lib/types";

const SCENARIO_ID = "resistant-patient";
const VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17";

interface SessionState {
  history: Turn[];
  suggestions: string[];
  loading: boolean;
  audioPlaying: boolean;
  error: string | null;
  sessionStarted: boolean;
}

type SessionAction =
  | { type: "PATIENT_TURN"; turn: Turn; suggestions: string[] }
  | { type: "TRAINEE_TURN"; turn: Turn }
  | { type: "AUDIO_START" }
  | { type: "AUDIO_END" }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" }
  | { type: "START_SESSION" };

const initialState: SessionState = {
  history: [],
  suggestions: [],
  loading: false,
  audioPlaying: false,
  error: null,
  sessionStarted: false,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
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

export default function SessionPage() {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const { history, suggestions, loading, audioPlaying, error } = state;

  const [input, setInput] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const playUtterance = useCallback(async (text: string) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId: VOICE_ID }),
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
  }, []);

  const fetchPatientResponse = useCallback(
    async (currentHistory: Turn[]) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ history: currentHistory, scenarioId: SCENARIO_ID }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const patientTurn: Turn = {
          role: "patient",
          content: data.patientUtterance,
          timestamp: Date.now(),
        };

        dispatch({ type: "PATIENT_TURN", turn: patientTurn, suggestions: data.suggestions ?? [] });

        await playUtterance(data.patientUtterance);
      } catch {
        dispatch({ type: "ERROR", message: "Could not reach the patient. Check your network or try again." });
      }
    },
    [playUtterance]
  );

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading, audioPlaying]);

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

  const handleBeginSession = () => {
    dispatch({ type: "START_SESSION" });
    fetchPatientResponse([]);
  }

  const inputDisabled = loading || audioPlaying;

  if (!state.sessionStarted) {
    return (
      <div className="max-w-3xl mx-auto px-xs py-md flex flex-col min-h-screen font-sans items-center justify-center">
        <h1 className="text-xl font-medium text-forest-dark mb-sm">Resistant Patient</h1>
        <p className="text-sm text-forest-medium mb-md">Marcus Webb · 38</p>
        <button
          onClick={handleBeginSession}
          className="px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer"
        >
          Begin Session
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-xs py-md flex flex-col min-h-screen font-sans">
      {/* Header */}
      <div className="mb-sm">
        <h1 className="text-xl font-medium text-forest-dark">Resistant Patient</h1>
        <p className="text-sm text-forest-medium mt-xxs">Marcus Webb · 38</p>
      </div>

      {/* Conversation panel */}
      <div className="border border-smoke-gray rounded-sm p-sm min-h-80 max-h-[60vh] overflow-y-auto mb-xs flex flex-col gap-xxs flex-1">
        {history.length === 0 && !loading && (
          <p className="text-forest-light text-sm italic m-auto text-center">
            Starting session…
          </p>
        )}

        {history.map((turn, i) => (
          <div
            key={i}
            className={`flex ${turn.role === "trainee" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-3/4 px-xs py-xxs text-base leading-relaxed text-forest-dark rounded-sm ${
                turn.role === "trainee" ? "bg-primary-yellow" : "bg-smoke-gray"
              }`}
            >
              {turn.content}
            </div>
          </div>
        ))}

        {loading && (
          <p className="text-forest-light text-sm italic">Marcus is thinking…</p>
        )}

        {audioPlaying && !loading && (
          <p className="text-forest-light text-sm italic">Marcus is speaking…</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && !audioPlaying && (
        <div className="mb-xs">
          <p className="text-xs font-semibold tracking-widest uppercase text-forest-light mb-xxs">
            Suggested responses
          </p>
          <div className="flex flex-col gap-xxs">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="px-xs py-xxs rounded-circle border border-forest-light text-forest-medium text-sm text-left cursor-pointer hover:bg-smoke-gray transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-xs px-xs py-xxs rounded-xs bg-clay-red text-forest-dark text-sm mb-xxs">
          <span className="flex-1">{error}</span>
          <button onClick={handleRetry} className="font-semibold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-xxs items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={inputDisabled}
          placeholder={
            loading ? "Wait for patient…" : audioPlaying ? "Listening…" : "Your response…"
          }
          className={`flex-1 px-sm py-xxs rounded-circle border border-forest-light text-base text-forest-dark outline-none font-sans transition-colors ${
            inputDisabled ? "bg-smoke-gray opacity-60" : "bg-white"
          }`}
        />
        <button
          type="submit"
          disabled={inputDisabled || !input.trim()}
          className={`px-sm py-xxs rounded-circle bg-primary-yellow border-none text-forest-dark font-semibold text-base font-sans whitespace-nowrap transition-opacity ${
            inputDisabled || !input.trim() ? "opacity-45 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          Send
        </button>
      </form>
    </div>
  );
}