import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { Turn } from "@/lib/types";
import { PATIENT_SYSTEM_PROMPT_BASE } from "@/lib/prompts";
import { scenarios } from "@/lib/scenarios";

export async function POST(req: NextRequest) {
  try {
    const { history, scenarioId }: { history: Turn[]; scenarioId: string } =
      await req.json();

    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 400 });
    }

    const systemPrompt =
      PATIENT_SYSTEM_PROMPT_BASE + "\n\n" + scenario.systemPrompt;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    type GeminiRole = "user" | "model";
    type GeminiContent = { role: GeminiRole; parts: { text: string }[] };

    let chatHistory: GeminiContent[];
    let currentMessage: string;

    if (history.length === 0) {
      // First turn: no prior context, seed w/ start signal
      chatHistory = [];
      currentMessage = "Hello, I'm here to listen. What brings you in today?";
    } else {
      // All turns except the last (trainee's latest message)
      const priorTurns = history.slice(0, -1);

      chatHistory = [
        { role: "user", parts: [{ text: "Hello, I'm here to listen. What brings you in today?" }] },
        ...priorTurns.map((turn): GeminiContent => ({
          role: turn.role === "patient" ? "model" : "user",
          parts: [{ text: turn.content }],
        })),
      ];

      currentMessage = history[history.length - 1].content;
    }

    const response = await ai.models.generateContent({
      model: process.env.MODEL ?? "gemma-4-26b-a4b-it",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: currentMessage }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL  // MINIMAL or HIGH, nothing else
        }
      }
    });

    const rawText = response.text ?? "";
    console.log(rawText);

    const jsonMatch = rawText.match(/\{[\s\S]*\}(?=[^}]*$)/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
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
      { status: 500 }
    );
  }
}
