import { NextRequest, NextResponse } from "next/server";
import type { Turn } from "@/lib/types";
import { PATIENT_SYSTEM_PROMPT_BASE } from "@/lib/prompts";
import { scenarios } from "@/lib/scenarios";
import { personas } from "@/lib/personas";
import { generateContent, extractJSON } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const {
      history,
      scenarioId,
      personaId,
    }: {
      history: Turn[];
      scenarioId: string;
      personaId: string;
    } = await req.json();

    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 400 },
      );
    }

    const persona = personas.find((p) => p.id === personaId);
    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 400 });
    }

    const systemPrompt = `${PATIENT_SYSTEM_PROMPT_BASE}
## Your character
Name: ${persona.patientName}, age ${persona.age}
Background: ${persona.background}
Affect: ${persona.affect}
Opening line (first turn only): "${persona.presentingConcern}"
## Session behavior
${scenario.systemPrompt}`;

    const chatHistory = [
      {
        role: "user" as const,
        parts: [
          { text: "Hello, I'm here to listen. What brings you in today?" },
        ],
      },
      ...history.slice(0, -1).map((turn) => ({
        role: turn.role === "patient" ? ("model" as const) : ("user" as const),
        parts: [{ text: turn.content }],
      })),
    ];

    const currentMessage =
      history.length === 0
        ? "Hello, I'm here to listen. What brings you in today?"
        : history[history.length - 1].content;

    const raw = await generateContent({
      systemPrompt,
      history: history.length === 0 ? [] : chatHistory,
      message: currentMessage,
    });

    console.log(raw);

    const parsed = extractJSON(raw) as {
      patientUtterance: string;
      suggestions: string[];
    };

    return NextResponse.json({
      patientUtterance: parsed.patientUtterance,
      suggestions: parsed.suggestions ?? [],
    });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      { error: "Failed to generate patient response" },
      { status: 500 },
    );
  }
}
