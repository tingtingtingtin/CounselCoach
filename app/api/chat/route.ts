import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleAuth } from "google-auth-library";
import type { Turn } from "@/lib/types";
import { PATIENT_SYSTEM_PROMPT_BASE } from "@/lib/prompts";
import { scenarios } from "@/lib/scenarios";
import { personas } from "@/lib/personas";

let cachedToken: { token: string; expiry: number } | null = null;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedToken.expiry) {
    return cachedToken.token;
  }
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const client = await auth.getClient();
  const result = await client.getAccessToken();
  cachedToken = {
    token: result.token!,
    expiry: Date.now() + 55 * 60 * 1000,
  };
  return cachedToken.token;
}

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

    const PROJECT_ID = process.env.GCP_PROJECT_ID!;
    const REGION = process.env.GCP_LOCATION ?? "global";
    const MODEL = process.env.MODEL ?? "google/gemma-4-26b-a4b-it-maas";

    const baseURL =
      REGION === "global"
        ? `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/endpoints/openapi`
        : `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/openapi`;

    const accessToken = await getAccessToken();

    const client = new OpenAI({
      baseURL,
      apiKey: accessToken,
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
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
