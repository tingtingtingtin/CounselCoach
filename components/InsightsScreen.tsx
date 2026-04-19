"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Turn, InsightsResult } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface InsightsScreenProps {
  persona: { patientName: string };
  scenario: { label: string };
  history: Turn[];
  insights: InsightsResult | null;
  insightsLoading: boolean;
  startTime: number | null;
  endTime: number | null;
}

export function InsightsScreen({
  persona,
  scenario,
  history,
  insights,
  insightsLoading,
  startTime,
  endTime,
}: InsightsScreenProps) {
  const router = useRouter();
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const duration = startTime && endTime ? endTime - startTime : 0;
  const patientTurns = history.filter((t) => t.role === "patient").length;
  const firstName = persona.patientName.split(" ")[0];

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
