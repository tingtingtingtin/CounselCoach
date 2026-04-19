import OpenAI from "openai";
import { GoogleAuth } from "google-auth-library";

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

export async function createLLMClient(): Promise<{
  client: OpenAI;
  model: string;
}> {
  const PROJECT_ID = process.env.GCP_PROJECT_ID!;
  const REGION = process.env.GCP_LOCATION ?? "global";
  const model = process.env.MODEL ?? "google/gemma-4-26b-a4b-it-maas";

  const baseURL =
    REGION === "global"
      ? `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/endpoints/openapi`
      : `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/openapi`;

  const accessToken = await getAccessToken();

  return {
    client: new OpenAI({ baseURL, apiKey: accessToken }),
    model,
  };
}
