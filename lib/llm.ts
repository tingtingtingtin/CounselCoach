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
    credentials: process.env.GCP_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
      : undefined, // falls back to ADC locally
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

/**
 * Normalize a model-generated pseudo-JSON string into valid JSON.
 *
 * Handles two failure modes in a single pass:
 *   1. Python-dict-style single-quote delimiters  {'key': 'value'}
 *   2. Unescaped double quotes inside double-quoted strings  "he said "hi""
 *
 * Rules applied per character:
 *   - Both ' and " are treated as string openers when outside a string.
 *   - Output always uses " as delimiter.
 *   - Escaped single quotes inside single-quoted strings (\'') become plain '.
 *   - Literal " inside single-quoted strings are escaped to \".
 *   - An unescaped " inside a double-quoted string that is NOT followed by a
 *     JSON structural character (, } ] :) is treated as an inner quote and
 *     escaped to \".
 */
function normalizeJSON(s: string): string {
  let out = "";
  let inString = false;
  let delimiter = "";

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (ch === "\\") {
      const next = s[i + 1] ?? "";
      if (inString && delimiter === "'" && next === "'") {
        // \' inside a single-quoted string → plain apostrophe in JSON output
        out += "'";
        i++;
      } else {
        out += ch + next;
        i++;
      }
      continue;
    }

    if (!inString) {
      if (ch === '"' || ch === "'") {
        inString = true;
        delimiter = ch;
        out += '"';
      } else {
        out += ch;
      }
      continue;
    }

    // --- inside a string ---
    if (ch === delimiter) {
      if (delimiter === "'") {
        // single-quoted string closes normally
        inString = false;
        delimiter = "";
        out += '"';
      } else {
        // double-quoted string: only close if followed by a structural char
        const isClosing = /^\s*[,}\]:]/.test(s.slice(i + 1));
        if (isClosing) {
          inString = false;
          delimiter = "";
          out += '"';
        } else {
          out += '\\"'; // inner unescaped quote
        }
      }
    } else if (ch === '"' && delimiter === "'") {
      // literal " inside a single-quoted string must be escaped in JSON
      out += '\\"';
    } else {
      out += ch;
    }
  }

  return out;
}

export function extractJSON(raw: string): unknown {
  const matches = raw.match(/\{[\s\S]*\}/g);
  if (!matches) throw new Error("No JSON object found in response");
  const candidate = matches[matches.length - 1];
  try {
    return JSON.parse(candidate);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return JSON.parse(normalizeJSON(candidate));
    }
    throw e;
  }
}
