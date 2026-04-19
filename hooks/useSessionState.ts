import { useReducer } from "react";
import { turnLoopReducer, initialTurnLoopState } from "@/lib/session";

export function useSessionState() {
  return useReducer(turnLoopReducer, initialTurnLoopState);
}
