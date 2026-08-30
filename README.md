# ComicGen AI

Turn a one-line idea into a 4-panel comic strip: **Google Gemini** writes the script (fully editable), then an **OpenAI-compatible image API** draws each panel in the art style of your choice.

## Features

- **Bilingual UI (中文/English)** with a corner language toggle — Chinese by default, preference remembered per browser
- **Built-in user guide** (corner “Help” button): full walkthrough, what every option means, and troubleshooting
- AI script generation with your choice of writer: **Gemini 2.5 Flash** (structured output) or **GPT models via the OpenAI-compatible proxy** (`gpt-5.5`, `gpt-5.6-sol`, `gpt-5.6-terra`) — the GPT writers reuse the image API key, no Gemini key needed
- **Review & edit step** — tweak the title, dialogue, captions and visual prompts *before* any image is generated, so you don't waste API calls on a script you don't like
- Art-style presets: Comic Book / Manga / Noir / Watercolor / Cartoon
- Per-panel redraw, cancel button mid-run, automatic retries with exponential backoff on rate limits
- The app auto-detects which script providers have keys configured (via `GET /api/config`) and disables the rest
- Export the finished strip as a PNG

## Architecture & Security

The browser never sees any API keys. All AI calls go through two serverless endpoints:

```
Browser ──POST /api/script──▶ server routes ──▶ Gemini (or GPT chat models via the proxy)
Browser ──POST /api/image ──▶ server routes ──▶ OpenAI-compatible image API (panels)
Browser ──GET  /api/config──▶ server routes ──▶ which script providers have keys configured
```

- **Local dev:** `npm run dev` serves these endpoints through a Vite plugin (`vite.config.ts`) that runs the exact same route handlers, reading keys from `.env.local`.
- **Production (Vercel):** the functions in [`api/`](./api) are picked up automatically. Set the environment variables in *Project → Settings → Environment Variables*.

The keys live only in server-side environment variables. Never prefix them with `VITE_` — Vite bundles every `VITE_*` variable into the client where anyone can read it.

## Project Structure

```
api/                    # Vercel serverless functions (script, image, config)
  lib/                  # Shared server-side route and AI service logic
i18n/                   # zh/en translation dictionaries + LanguageProvider
services/
  api.ts                # Browser-side API client (fetch /api/*, error mapping, URL→dataURL)
  retry.ts              # Abortable exponential-backoff retry helper
hooks/
  useComicGenerator.ts  # Workflow state machine: script → review → images → export
components/             # InputForm, ScriptEditor, ComicPanel, ErrorBoundary
types.ts                # Shared types + model/style constants (single source of truth)
```

## Getting Started

**Prerequisites:** Node.js 18+ (20 recommended), npm.

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Open http://localhost:5173.

### Environment variables (`.env.local`)

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Optional. Google AI Studio key — only needed if you want Gemini as a script writer |
| `IMAGE_API_KEY` | Bearer token for the OpenAI-compatible API (image generation + GPT script models) |
| `IMAGE_API_BASE_URL` | Optional. Base URL of the API (defaults to `https://api.guigesama.xyz/v1`) |

## Deploying to Vercel

1. Import the repository into Vercel (the Vite preset is auto-detected; the `api/` functions need no configuration).
2. Add `GEMINI_API_KEY` and `IMAGE_API_KEY` (and `IMAGE_API_BASE_URL` if not using the default) under *Settings → Environment Variables*.
3. Deploy.

### Deployment notes & limits

- Functions are configured with `maxDuration: 300` because text and image generation can take several minutes. The effective maximum still depends on the Vercel plan.
- Vercel caps serverless response bodies at ~4.5 MB: 1024×1024 PNGs (base64) are fine, but the **4K model can exceed the cap** and may fail on Vercel while working locally.
- If the image API rejects the `size` parameter for a model, adjust `IMAGE_MODELS` in `types.ts` (set `size: undefined` to omit it).
- Deploying the static build alone (without the functions) will break generation — the app calls relative `/api/*` endpoints.

## Roadmap ideas

- Comic history persistence (IndexedDB)
- Configurable panel count (currently fixed at 4)
- Vitest unit tests for the retry/service logic, ESLint + CI
- i18n / Chinese UI
