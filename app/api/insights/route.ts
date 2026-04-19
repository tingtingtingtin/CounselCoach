import { NextRequest, NextResponse } from "next/server";
import type { Turn } from "@/lib/types";
import { INSIGHTS_SYSTEM_PROMPT } from "@/lib/prompts";
import { createLLMClient } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const {
      history,
    }: { history: Turn[]; personaId: string; scenarioId: string } =
      await req.json();

    const transcript = history
      .map(
        (t) => `${t.role === "patient" ? "Patient" : "Trainee"}: ${t.content}`,
      )
      .join("\n");

    const { client, model } = await createLLMClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: INSIGHTS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is the session transcript:\n\n${transcript}`,
        },
      ],
      stream: false,
    });

    const rawText = response.choices[0].message.content ?? "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/g);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[jsonMatch.length - 1]) as {
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
