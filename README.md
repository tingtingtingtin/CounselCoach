# CounselCoach

Practice therapy conversations with an AI patient before the sessions that matter.

[counselcoach.tech](https://counselcoach.tech)

---

## Overview

CounselCoach is a therapist training simulator. A voiced AI patient presents a clinical scenario — the trainee responds by text or voice, receives real-time suggested responses, and gets a post-session debrief with observations and suggestions.

Two modes: **Chat** (transcript + suggestions visible) and **Call** (voice only, no transcript, closer to a real session).

---

## Tech Stack

- **Framework** — Next.js App Router, TypeScript
- **Styling** — Tailwind CSS v4, Base UI
- **3D** — React Three Fiber, Drei
- **Animation** — Framer Motion
- **Patient LLM** — Gemma 4 26B A4B / Gemini 2.5 Flash via GCP Vertex AI
- **Insights LLM** — Gemini 2.5 Flash via GCP Vertex AI
- **TTS** — ElevenLabs
- **STT** — Browser SpeechRecognition API
- **Deployment** — Vercel

---

## Project Structure

```
app/
  page.tsx                  # Landing page — persona, scenario, mode selection
  session/
    page.tsx                # Session router — renders ChatSession or CallSession
    ChatSession.tsx         # Chat mode session UI
    CallSession.tsx         # Call mode session UI
    InsightsScreen.tsx      # Post-session debrief
  api/
    chat/route.ts           # Patient utterance + suggestion generation
    tts/route.ts            # ElevenLabs TTS proxy
    insights/route.ts       # Post-session insights generation

lib/
  personas.ts               # Patient personas with voice IDs and affect
  scenarios.ts              # Scenario definitions and behavioral prompts
  prompts.ts                # LLM system prompts
  types.ts                  # Shared TypeScript types
  llm.ts                    # Vertex AI client — Gemma and Gemini
  storage.ts                # localStorage session persistence
  useSessionState.ts        # Shared useReducer hook for session state
  useSessionActions.ts      # Shared fetch + audio logic
```

---

## Running Locally

```bash
git clone https://github.com/tingtingtingtin/counselcoach
cd counselcoach
npm install
```

`.env.local` and fill in your keys:

```
ELEVENLABS_API_KEY=
GCP_CLOUD_PROJECT=
GCP_CLOUD_LOCATION=us-central1
MODEL=gemini-2.5-flash-001
INSIGHTS_MODEL=gemini-2.5-flash-001
GCP_SERVICE_ACCOUNT_KEY=
```

For `GCP_SERVICE_ACCOUNT_KEY`, paste the full contents of your GCP service account JSON as a single string.

```bash
npm run dev
```

---

## Future Improvements

- Polyfill for Web Speech API (cross-browser compatibility)
- Mobile responsiveness
- Accessibility (a11y) with ARIA-tags
