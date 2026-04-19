"use client";

import { useState, useCallback } from "react";
import type { Turn, InsightsResult, SessionRecord } from "@/lib/types";
import { personas, activePersonas } from "@/lib/personas";
import { scenarios } from "@/lib/scenarios";
import { apiFetchInsights } from "@/lib/session";
import { saveSession } from "@/lib/storage";
import { InsightsScreen } from "@/components/InsightsScreen";
import { ChatSession } from "./ChatSession";
import { CallSession } from "./CallSession";

export interface SessionEndPayload {
  history: Turn[];
  startTime: number;
  endTime: number;
}

interface SessionContainerProps {
  personaId: string;
  scenarioId: string;
  mode: "chat" | "call";
  initialInputMode: "text" | "voice";
  volumeOn: boolean;
}

export function SessionContainer({
  personaId,
  scenarioId,
  mode,
  initialInputMode,
  volumeOn,
}: SessionContainerProps) {
  const persona = personas.find((p) => p.id === personaId) ?? activePersonas[0];
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];

  const [phase, setPhase] = useState<"session" | "insights">("session");
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [payload, setPayload] = useState<SessionEndPayload | null>(null);

  const handleSessionEnd = useCallback(
    async (p: SessionEndPayload) => {
      setPayload(p);
      setPhase("insights");
      setInsightsLoading(true);
      try {
        const data = await apiFetchInsights(p.history, personaId, scenarioId);
        setInsights(data);

        const record: SessionRecord = {
          id: crypto.randomUUID(),
          timestamp: p.startTime,
          personaId,
          scenarioId,
          mode,
          durationSeconds: Math.round((p.endTime - p.startTime) / 1000),
          turnCount: p.history.filter((t) => t.role === "patient").length,
          history: p.history,
          insights: data,
        };
        saveSession(record);
      } catch {
        setInsights({
          summary: "Unable to summarize this session.",
          observations: ["Unable to load insights."],
          suggestions: [],
        });
      }
      setInsightsLoading(false);
    },
    [personaId, scenarioId, mode],
  );

  if (phase === "insights" && payload) {
    return (
      <InsightsScreen
        persona={persona}
        scenario={scenario}
        history={payload.history}
        insights={insights}
        insightsLoading={insightsLoading}
        startTime={payload.startTime}
        endTime={payload.endTime}
      />
    );
  }

  if (mode === "call") {
    return (
      <CallSession
        personaId={personaId}
        scenarioId={scenarioId}
        volumeOn={volumeOn}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  return (
    <ChatSession
      personaId={personaId}
      scenarioId={scenarioId}
      initialInputMode={initialInputMode}
      volumeOn={volumeOn}
      onSessionEnd={handleSessionEnd}
    />
  );
}
