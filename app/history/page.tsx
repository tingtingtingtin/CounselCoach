"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { loadSessions } from "@/lib/storage";
import { personas } from "@/lib/personas";
import { scenarios } from "@/lib/scenarios";
import { formatDuration, formatDate } from "@/lib/utils";
import type { SessionRecord } from "@/lib/types";

const easing = [0.22, 1, 0.36, 1] as const;

function getPersonaName(personaId: string) {
  return (
    personas.find((persona) => persona.id === personaId)?.patientName ??
    "Unknown patient"
  );
}

function getScenarioLabel(scenarioId: string) {
  return (
    scenarios.find((scenario) => scenario.id === scenarioId)?.label ??
    "Unknown scenario"
  );
}

function HistoryCard({ record }: { record: SessionRecord }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const patientName = getPersonaName(record.personaId);
  const scenarioLabel = getScenarioLabel(record.scenarioId);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easing }}
      className="rounded-sm border border-smoke-gray bg-pure-white p-md"
    >
      <div className="flex flex-col gap-xs md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
            Session Record
          </p>
          <h2 className="text-xl font-semibold text-forest-dark">
            {patientName}
          </h2>
          <p className="text-sm text-forest-medium mt-xxxs">
            {scenarioLabel} · {record.mode} mode
          </p>
        </div>

        <div className="grid grid-cols-2 gap-xxs text-sm text-forest-medium md:min-w-80">
          <div className="rounded-xs bg-smoke-gray/60 px-xs py-xxs">
            <div className="flex items-center gap-xxxs text-forest-light uppercase tracking-widest text-xs mb-xxxs">
              <Clock3 size={14} />
              <span>Duration</span>
            </div>
            <p className="text-forest-dark font-semibold">
              {formatDuration(record.durationSeconds * 1000)}
            </p>
          </div>
          <div className="rounded-xs bg-smoke-gray/60 px-xs py-xxs">
            <div className="flex items-center gap-xxxs text-forest-light uppercase tracking-widest text-xs mb-xxxs">
              <MessageCircle size={14} />
              <span>Turns</span>
            </div>
            <p className="text-forest-dark font-semibold">{record.turnCount}</p>
          </div>
          <div className="col-span-2 rounded-xs bg-smoke-gray/40 px-xs py-xxs flex items-center justify-between gap-xs">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxxs">
                Recorded
              </p>
              <p className="text-sm text-forest-dark">
                {formatDate(record.timestamp)}
              </p>
            </div>
            <div className="flex items-center gap-xxxs text-xs font-semibold uppercase tracking-widest text-forest-medium">
              <Sparkles size={14} />
              <span>Insights saved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-md grid gap-md lg:grid-cols-[1.1fr_0.9fr]">
        <section className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
            Summary
          </p>
          <div className="rounded-xs border border-smoke-gray bg-smoke-gray/20 p-sm">
            <p className="text-sm leading-relaxed text-forest-dark">
              {record.insights.summary ?? "No summary available."}
            </p>
          </div>
        </section>

        <section>
          <button
            type="button"
            onClick={() => setInsightsOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-xs text-left hover:cursor-pointer"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-light">
              Insights
            </span>
            {insightsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <motion.div
            initial={false}
            animate={insightsOpen ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1, marginTop: "12px" },
              closed: { height: 0, opacity: 0, marginTop: 0 },
            }}
            transition={{ duration: 0.22, ease: easing }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
                  Observations
                </p>
                <ul className="flex flex-col gap-xxs">
                  {record.insights.observations.map((item, index) => (
                    <li
                      key={index}
                      className="text-sm leading-relaxed text-forest-dark"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
                  Suggestions
                </p>
                <ul className="flex flex-col gap-xxs">
                  {record.insights.suggestions.map((item, index) => (
                    <li
                      key={index}
                      className="text-sm leading-relaxed text-forest-dark"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </section>

        <section>
          <button
            type="button"
            onClick={() => setTranscriptOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-xs text-left hover:cursor-pointer"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-light">
              Transcript
            </span>
            {transcriptOpen ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>

          <motion.div
            initial={false}
            animate={transcriptOpen ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1, marginTop: "12px" },
              closed: { height: 0, opacity: 0, marginTop: 0 },
            }}
            transition={{ duration: 0.22, ease: easing }}
            className="overflow-hidden"
          >
            <div className="rounded-xs border border-smoke-gray bg-smoke-gray/30 p-sm flex flex-col gap-xxs max-h-96 overflow-y-auto">
              {record.history.map((turn, index) => (
                <div
                  key={index}
                  className="text-sm leading-relaxed text-forest-dark"
                >
                  <span className="font-semibold">
                    {turn.role === "patient"
                      ? patientName.split(" ")[0]
                      : "You"}
                    :
                  </span>{" "}
                  {turn.content}
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </motion.article>
  );
}

export default function HistoryPage() {
  const sessions = useMemo<SessionRecord[]>(() => loadSessions(), []);

  const totalSessions = useMemo(() => sessions.length, [sessions]);

  return (
    <main className="w-full mx-auto font-sans bg-background">
      <section className="max-w-7xl mx-auto px-4 py-lg md:py-xl">
        <div className="max-w-3xl mb-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-light mb-xxs">
            Session Archive
          </p>
          <h1 className="text-3xl font-semibold text-forest-dark">
            Past insights and transcripts
          </h1>
          <p className="mt-sm text-sm leading-relaxed text-forest-medium">
            Review prior sessions, revisit observations, and expand transcripts
            when you need the full context.
          </p>
          <p className="mt-xs text-xs uppercase tracking-widest text-forest-light">
            {`${totalSessions} saved session${totalSessions === 1 ? "" : "s"}`}
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-sm border border-smoke-gray bg-pure-white p-md text-sm text-forest-medium">
            No saved sessions yet. Complete a session to populate this archive.
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            {sessions.map((record) => (
              <HistoryCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
