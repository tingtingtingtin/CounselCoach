import OpenAI from "openai";
import { GoogleAuth } from "google-auth-library";

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

// --- Token cache ---

let cachedToken: { token: string; expiry: number } | null = null;

async function getAccessToken(): Promise<string> {
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

// --- Gemini via Vertex native REST ---

async function generateViaVertexNative({
  systemPrompt,
  history,
  message,
  useInsightsModel,
}: {
  systemPrompt: string;
  history: ChatMessage[];
  message: string;
  useInsightsModel: boolean;
}): Promise<string> {
  const PROJECT_ID = process.env.GCP_PROJECT_ID!;
  const REGION = process.env.GCP_LOCATION ?? "us-central1";
  const model = useInsightsModel
    ? (process.env.INSIGHTS_MODEL ?? "gemini-2.5-flash-001")
    : (process.env.MODEL ?? "gemini-2.5-flash-001");
  const accessToken = await getAccessToken();

  const endpoint = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${model}:generateContent`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [...history, { role: "user", parts: [{ text: message }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vertex native error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// --- Gemma 4 via Vertex OpenAI-compat endpoint (reserved, not active) ---

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateViaVertexOpenAI({
  systemPrompt,
  history,
  message,
}: {
  systemPrompt: string;
  history: ChatMessage[];
  message: string;
}): Promise<string> {
  const PROJECT_ID = process.env.GCP_CLOUD_PROJECT!;
  const REGION = process.env.GCP_CLOUD_LOCATION ?? "us-central1";
  const model = process.env.GEMMA_MODEL ?? "google/gemma-4-26b-a4b-it-maas";
  const accessToken = await getAccessToken();

  const baseURL =
    REGION === "global"
      ? `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/endpoints/openapi`
      : `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/openapi`;

  const client = new OpenAI({ baseURL, apiKey: accessToken });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((turn) => ({
      role: turn.role === "model" ? ("assistant" as const) : ("user" as const),
      content: turn.parts[0].text,
    })),
    { role: "user", content: message },
  ];

  const completion = await client.chat.completions.create({ model, messages });
  return completion.choices[0]?.message?.content ?? "";
}

// --- Unified entry point ---

export async function generateContent({
  systemPrompt,
  history,
  message,
  useInsightsModel = false,
}: {
  systemPrompt: string;
  history: ChatMessage[];
  message: string;
  useInsightsModel?: boolean;
}): Promise<string> {
  return generateViaVertexNative({
    systemPrompt,
    history,
    message,
    useInsightsModel,
  });
}

// --- JSON extraction ---

export function extractJSON(raw: string): unknown {
  const matches = raw.match(/\{[\s\S]*\}/g);
  if (!matches) throw new Error("No JSON object found in response");
  return JSON.parse(matches[matches.length - 1]);
}
