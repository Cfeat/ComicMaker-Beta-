import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { ComicScript, ScriptProvider } from '../types';

export const DEFAULT_IMAGE_API_BASE_URL = 'https://api.guigesama.xyz/v1';

// Error type shared by the Vercel functions and the Vite dev proxy so both
// surfaces return the same JSON shape: { error: string } with a proper status.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const SCRIPT_SYSTEM_INSTRUCTION =
  'You are a creative comic book writer. You excel at breaking down stories into 4 visual panels with punchy dialogue.';

const comicSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A catchy title for the comic strip.',
    },
    panels: {
      type: Type.ARRAY,
      description: 'An array of exactly 4 panels for the comic strip.',
      items: {
        type: Type.OBJECT,
        properties: {
          panel_number: { type: Type.INTEGER },
          description: {
            type: Type.STRING,
            description: 'A narrative description of what happens in this panel.',
          },
          visual_prompt: {
            type: Type.STRING,
            description:
              'A detailed visual description for an AI image generator. Include details about style (comic book style), characters, setting, lighting, and composition. Ensure it describes the scene visually without focusing on text.',
          },
          dialogue: {
            type: Type.STRING,
            description: 'Spoken dialogue for a character, if any. Keep it brief.',
            nullable: true,
          },
          character: {
            type: Type.STRING,
            description: 'The name of the character speaking.',
            nullable: true,
          },
          caption: {
            type: Type.STRING,
            description: "Narrator caption text, if any (e.g., 'Meanwhile...', 'Later that day...').",
            nullable: true,
          },
        },
        required: ['panel_number', 'description', 'visual_prompt'],
      },
    },
  },
  required: ['title', 'panels'],
};

// Used for providers without structured output support (OpenAI-compatible
// chat models): the shape is described in the prompt and the reply is parsed
// defensively.
const SCRIPT_JSON_SHAPE = `{
  "title": "A catchy title for the comic strip",
  "panels": [
    {
      "panel_number": 1,
      "description": "A narrative description of what happens in this panel",
      "visual_prompt": "A detailed visual description for an AI image generator, including art style, characters, setting, lighting and composition",
      "dialogue": "The spoken words only, brief — or null",
      "character": "The name of the character speaking — or null",
      "caption": "Narrator caption text, e.g. 'Meanwhile...' — or null"
    }
  ]
}`;

function buildScriptUserPrompt(prompt: string): string {
  return `Create a funny or interesting 4-panel comic strip script based on this idea: "${prompt}".
Ensure the visual prompts are highly descriptive for an image generation model, specifying a consistent comic book art style (e.g., 'vibrant comic book style, thick outlines, cel shaded').
Put the speaker's name in the "character" field and only their spoken words in "dialogue" (never a "Name:" prefix inside dialogue).

Respond with ONLY a valid JSON object (no markdown fences, no commentary) using exactly this structure, with exactly 4 panels:
${SCRIPT_JSON_SHAPE}`;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isRateLimitError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  const code = (error as { code?: number } | null)?.code;
  const message = String((error as Error | null)?.message ?? '').toLowerCase();
  return (
    status === 429 ||
    code === 429 ||
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('resource_exhausted')
  );
}

async function withRetry<T>(operation: () => Promise<T>, retries = 3, baseDelayMs = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isRateLimitError(error)) {
      console.warn(`Rate limit hit. Retrying in ${baseDelayMs / 1000}s... (${retries} retries left)`);
      await delay(baseDelayMs);
      return withRetry(operation, retries - 1, baseDelayMs * 2);
    }
    throw error;
  }
}

// Extracts JSON from a model reply even when it is wrapped in markdown fences
// or surrounded by prose.
function parseJsonText(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new HttpError(502, 'The script model returned no JSON. Please try again.');
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new HttpError(502, 'The script model returned malformed JSON. Please try again.');
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

// Shared by both providers: validates the structure and re-numbers panels
// from the array position (the models do not guarantee unique panel numbers).
function normalizeScript(parsed: unknown): ComicScript {
  const record = (parsed ?? {}) as { title?: unknown; panels?: unknown };
  if (typeof record.title !== 'string' || !record.title.trim() || !Array.isArray(record.panels) || record.panels.length === 0) {
    throw new HttpError(502, 'The script model returned an unexpected structure. Please try again.');
  }
  const panels = (record.panels as unknown[]).map((panel, index) => {
    const p = (panel ?? {}) as Record<string, unknown>;
    const visualPrompt = typeof p.visual_prompt === 'string' ? p.visual_prompt.trim() : '';
    if (!visualPrompt) {
      throw new HttpError(502, `Panel ${index + 1} is missing a visual prompt. Please try again.`);
    }
    return {
      panel_number: index + 1,
      description: typeof p.description === 'string' ? p.description.trim() : '',
      visual_prompt: visualPrompt,
      dialogue: optionalString(p.dialogue),
      character: optionalString(p.character),
      caption: optionalString(p.caption),
    };
  });
  return { title: record.title.trim(), panels };
}

export interface CreateComicScriptOptions {
  prompt: string;
  model: string;
  provider: ScriptProvider;
  geminiApiKey?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
}

export async function createComicScript(options: CreateComicScriptOptions): Promise<ComicScript> {
  return options.provider === 'gemini'
    ? createScriptWithGemini(options.prompt, options.model, options.geminiApiKey)
    : createScriptWithOpenAI(options.prompt, options.model, options.openaiApiKey, options.openaiBaseUrl);
}

async function createScriptWithGemini(prompt: string, model: string, apiKey?: string): Promise<ComicScript> {
  if (!apiKey) {
    throw new HttpError(
      500,
      'GEMINI_API_KEY is not configured on the server. Pick a GPT script model instead, or add the key to .env.local (local dev) / the Vercel environment variables.',
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model,
        contents: `Create a funny or interesting 4-panel comic strip script based on this idea: "${prompt}". 
        Ensure the visual prompts are highly descriptive for an image generation model, specifying a consistent comic book art style (e.g., 'vibrant comic book style, thick outlines, cel shaded').`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: comicSchema,
          systemInstruction: SCRIPT_SYSTEM_INSTRUCTION,
        },
      }),
    );

    const text = response.text;
    if (!text) {
      throw new HttpError(502, 'The script model returned an empty response. Try rephrasing your idea.');
    }
    return normalizeScript(parseJsonText(text));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const status =
      typeof (error as { status?: number })?.status === 'number' &&
      (error as { status: number }).status >= 400 &&
      (error as { status: number }).status < 500
        ? (error as { status: number }).status
        : 502;
    const message = (error as Error | null)?.message ?? 'Unknown error from the script model.';
    throw new HttpError(status, `Script generation failed: ${message}`);
  }
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

function extractApiErrorMessage(raw: string, fallback: string): string {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    return parsed?.error?.message || fallback;
  } catch {
    return fallback;
  }
}

async function createScriptWithOpenAI(
  prompt: string,
  model: string,
  apiKey?: string,
  baseUrl?: string,
): Promise<ComicScript> {
  if (!apiKey) {
    throw new HttpError(
      500,
      'IMAGE_API_KEY is not configured on the server, which is required for GPT script models. Add it to .env.local (local dev) / the Vercel environment variables.',
    );
  }

  const endpoint = `${(baseUrl || DEFAULT_IMAGE_API_BASE_URL).replace(/\/+$/, '')}/chat/completions`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
  const messages = [
    { role: 'system', content: SCRIPT_SYSTEM_INSTRUCTION },
    { role: 'user', content: buildScriptUserPrompt(prompt) },
  ];

  try {
    const content = await withRetry(async () => {
      let response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } }),
      });

      // Some OpenAI-compatible backends reject the response_format parameter;
      // fall back to prompt-only JSON mode once in that case.
      if (response.status === 400) {
        const raw = await response.text();
        if (!raw.toLowerCase().includes('response_format')) {
          throw new HttpError(400, extractApiErrorMessage(raw, 'The script model rejected the request.'));
        }
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model, messages }),
        });
      }

      const result = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
      if (!response.ok) {
        throw new HttpError(
          response.status,
          result?.error?.message || `Script generation failed with status ${response.status}.`,
        );
      }

      const text = result?.choices?.[0]?.message?.content;
      if (!text) {
        throw new HttpError(502, 'The script model returned an empty response. Please try again.');
      }
      return text;
    });

    return normalizeScript(parseJsonText(content));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, `Script generation failed: ${(error as Error | null)?.message ?? 'unknown error'}`);
  }
}

interface ImageApiResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
}

export interface GenerateImageOptions {
  prompt: string;
  model: string;
  size?: string;
  baseUrl?: string;
  apiKey?: string;
}

// No server-side retry here on purpose: image generation is slow, and a retry
// loop inside a serverless function risks hitting its execution time limit.
// The client retries with backoff instead (see services/retry.ts).
export async function generateImage({
  prompt,
  model,
  size,
  baseUrl,
  apiKey,
}: GenerateImageOptions): Promise<{ image: string }> {
  if (!apiKey) {
    throw new HttpError(
      500,
      'IMAGE_API_KEY is not configured on the server. Add it to .env.local (local dev) or to the project environment variables (Vercel).',
    );
  }

  const endpoint = `${(baseUrl || DEFAULT_IMAGE_API_BASE_URL).replace(/\/+$/, '')}/images/generations`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, prompt, n: 1, ...(size ? { size } : {}) }),
    });
  } catch (error) {
    throw new HttpError(502, `Could not reach the image API: ${(error as Error).message}`);
  }

  const result = (await response.json().catch(() => null)) as ImageApiResponse | null;
  if (!response.ok) {
    throw new HttpError(
      response.status,
      result?.error?.message || `Image generation failed with status ${response.status}.`,
    );
  }

  const image = result?.data?.[0];
  if (image?.b64_json) return { image: `data:image/png;base64,${image.b64_json}` };
  if (image?.url) return { image: image.url };
  throw new HttpError(502, 'No image data found in the image API response.');
}
