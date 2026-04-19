export type Role = "patient" | "trainee";

export interface Turn {
  role: Role;
  content: string;
  timestamp: number;
}

export interface ConversationState {
  history: Turn[];
  isPatientSpeaking: boolean;
  audioPlaying: boolean;
  suggestions: string[];
  inputMode: "text" | "voice";
  sessionComplete: boolean;
}

export interface Scenario {
  id: string;
  label: string;
  description: string;
  systemPrompt: string;
}

export interface InsightsResult {
  observations: string[];
  suggestions: string[];
}
