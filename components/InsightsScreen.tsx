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
  const summary = insights?.summary ?? "";
  const observations = insights?.observations ?? [];
  const suggestions = insights?.suggestions ?? [];

  return (
    <div className="max-w-3xl mx-auto px-xs py-md font-sans">
      <div className="rounded-sm border border-smoke-gray bg-pure-white p-md">
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

        <div className="flex flex-col gap-sm">
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
              Summary
            </p>
            <div className="rounded-xs border border-smoke-gray bg-smoke-gray/20 p-sm min-h-20">
              {insightsLoading ? (
                <div className="flex flex-col gap-xxs pt-xxs">
                  <div className="h-4 rounded-xs bg-smoke-gray animate-pulse" />
                  <div className="h-4 rounded-xs bg-smoke-gray animate-pulse w-8/12" />
                </div>
              ) : summary ? (
                <p className="text-sm text-forest-dark leading-relaxed">
                  {summary}
                </p>
              ) : (
                <p className="text-sm text-forest-medium italic">
                  No summary available.
                </p>
              )}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
              Observations
            </p>
            <div className="rounded-xs border border-smoke-gray bg-smoke-gray/20 p-sm min-h-44">
              {insightsLoading ? (
                <div className="flex flex-col gap-xxs pt-xxs">
                  <div className="h-4 rounded-xs bg-smoke-gray animate-pulse" />
                  <div className="h-4 rounded-xs bg-smoke-gray animate-pulse w-11/12" />
                  <div className="h-4 rounded-xs bg-smoke-gray animate-pulse w-10/12" />
                </div>
              ) : observations.length > 0 ? (
                <ul className="flex flex-col gap-xxs">
                  {observations.map((obs, i) => (
                    <li
                      key={i}
                      className="text-sm text-forest-dark leading-relaxed"
                    >
                      {obs}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-forest-medium italic">
                  No observations available.
                </p>
              )}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
              Suggestions
            </p>
            <div className="rounded-xs border border-smoke-gray bg-smoke-gray/20 p-sm min-h-44">
              {insightsLoading ? (
                <div className="flex flex-col gap-xxs pt-xxs">
                  <div className="h-4 rounded-xs bg-smoke-gray animate-pulse" />
                  <div className="h-4 rounded-xs bg-smoke-gray animate-pulse w-10/12" />
                  <div className="h-4 rounded-xs bg-smoke-gray animate-pulse w-9/12" />
                </div>
              ) : suggestions.length > 0 ? (
                <ul className="flex flex-col gap-xxs">
                  {suggestions.map((sug, i) => (
                    <li
                      key={i}
                      className="text-sm text-forest-dark leading-relaxed"
                    >
                      {sug}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-forest-medium italic">
                  No suggestions available.
                </p>
              )}
            </div>
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
              <div className="mt-xs rounded-xs border border-smoke-gray bg-smoke-gray/20 p-sm max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-xxs">
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
              </div>
            )}
          </section>
        </div>

        <div className="mt-md flex flex-col sm:flex-row gap-xxs">
          <button
            onClick={() => router.push("/")}
            className="px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity border-none"
          >
            Start New Session
          </button>
          <button
            onClick={() => router.push("/history")}
            className="px-sm py-xxs rounded-circle bg-pure-white text-forest-dark font-semibold text-base cursor-pointer border border-smoke-gray hover:border-forest-light transition-colors"
          >
            Check History
          </button>
        </div>
      </div>
    </div>
  );
}
