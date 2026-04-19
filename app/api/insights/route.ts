import { NextRequest, NextResponse } from "next/server";
import type { Turn } from "@/lib/types";
import { INSIGHTS_SYSTEM_PROMPT } from "@/lib/prompts";
import { generateContent, extractJSON } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const {
      history,
    }: {
      history: Turn[];
      personaId: string;
      scenarioId: string;
    } = await req.json();

    const transcript = history
      .map(
        (t) => `${t.role === "patient" ? "Patient" : "Trainee"}: ${t.content}`,
      )
      .join("\n");

    const raw = await generateContent({
      systemPrompt: INSIGHTS_SYSTEM_PROMPT,
      history: [],
      message: `Here is the session transcript:\n\n${transcript}`,
      useInsightsModel: true,
    });

    const parsed = extractJSON(raw) as {
      observations: string[];
      suggestions: string[];
    };

    return NextResponse.json({
      observations: parsed.observations ?? [],
      suggestions: parsed.suggestions ?? [],
    });
  } catch (err) {
    console.error("[/api/insights]", err);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}
