import { NextRequest, NextResponse } from "next/server";
import type { Turn } from "@/lib/types";
import { PATIENT_SYSTEM_PROMPT_BASE } from "@/lib/prompts";
import { scenarios } from "@/lib/scenarios";
import { personas } from "@/lib/personas";
import { createLLMClient } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const {
      history,
      scenarioId,
      personaId,
    }: { history: Turn[]; scenarioId: string; personaId: string } =
      await req.json();

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

    const { client, model: MODEL } = await createLLMClient();

    const messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [
      { role: "system", content: systemPrompt },
      ...(history.length === 0
        ? [
            {
              role: "user" as const,
              content: "Hello, I'm here to listen. What brings you in today?",
            },
          ]
        : [
            {
              role: "user" as const,
              content: "Hello, I'm here to listen. What brings you in today?",
            },
            ...history.slice(0, -1).map((turn) => ({
              role:
                turn.role === "patient"
                  ? ("assistant" as const)
                  : ("user" as const),
              content: turn.content,
            })),
            {
              role: "user" as const,
              content: history[history.length - 1].content,
            },
          ]),
    ];

    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      stream: false,
    });

    const rawText = response.choices[0].message.content ?? "";
    console.log(rawText);

    const jsonMatch = rawText.match(/\{[\s\S]*\}/g);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }

    const parsed = JSON.parse(jsonMatch[jsonMatch.length - 1]) as {
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
