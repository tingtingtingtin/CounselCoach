import type { SessionRecord } from "./types";

const STORAGE_KEY = "counselcoach_sessions";

export function saveSession(record: SessionRecord): void {
  try {
    const existing = loadSessions();
    const updated = [record, ...existing].slice(0, 20); // keep last 20
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (SSR or private mode)
  }
}

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}
