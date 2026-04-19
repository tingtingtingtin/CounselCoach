import type { Turn, InsightsResult } from "./types";

export const TURN_LIMIT = 8;

export interface TurnLoopState {
  history: Turn[];
  suggestions: string[];
  loading: boolean;
  audioPlaying: boolean;
  error: string | null;
  sessionStarted: boolean;
}

export type TurnLoopAction =
  | { type: "START_SESSION" }
  | { type: "PATIENT_TURN"; turn: Turn; suggestions: string[] }
  | { type: "TRAINEE_TURN"; turn: Turn }
  | { type: "AUDIO_START" }
  | { type: "AUDIO_END" }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" };

export const initialTurnLoopState: TurnLoopState = {
  history: [],
  suggestions: [],
  loading: false,
  audioPlaying: false,
  error: null,
  sessionStarted: false,
};

export function turnLoopReducer(
  state: TurnLoopState,
  action: TurnLoopAction,
): TurnLoopState {
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

export async function apiFetchPatientResponse(
  history: Turn[],
  scenarioId: string,
  personaId: string,
): Promise<{ patientUtterance: string; suggestions: string[] }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, scenarioId, personaId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiFetchInsights(
  history: Turn[],
  personaId: string,
  scenarioId: string,
): Promise<InsightsResult> {
  const res = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, personaId, scenarioId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
