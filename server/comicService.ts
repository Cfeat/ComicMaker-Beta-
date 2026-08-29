import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { ComicScript } from '../types';

const SCRIPT_MODEL = 'gemini-2.5-flash';

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

export interface CreateComicScriptOptions {
  prompt: string;
  apiKey?: string;
}

export async function createComicScript({ prompt, apiKey }: CreateComicScriptOptions): Promise<ComicScript> {
  if (!apiKey) {
    throw new HttpError(
      500,
      'GEMINI_API_KEY is not configured on the server. Add it to .env.local (local dev) or to the project environment variables (Vercel).',
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: SCRIPT_MODEL,
        contents: `Create a funny or interesting 4-panel comic strip script based on this idea: "${prompt}". 
        Ensure the visual prompts are highly descriptive for an image generation model, specifying a consistent comic book art style (e.g., 'vibrant comic book style, thick outlines, cel shaded').`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: comicSchema,
          systemInstruction:
            'You are a creative comic book writer. You excel at breaking down stories into 4 visual panels with punchy dialogue.',
        },
      }),
    );

    const text = response.text;
    if (!text) {
      throw new HttpError(502, 'The script model returned an empty response. Try rephrasing your idea.');
    }

    let parsed: ComicScript;
    try {
      parsed = JSON.parse(text) as ComicScript;
    } catch {
      throw new HttpError(502, 'The script model returned malformed JSON. Please try again.');
    }

    if (!parsed || typeof parsed.title !== 'string' || !Array.isArray(parsed.panels) || parsed.panels.length === 0) {
      throw new HttpError(502, 'The script model returned an unexpected structure. Please try again.');
    }

    // The model does not guarantee unique/ordered panel numbers, so normalize
    // them from the array position.
    parsed.panels = parsed.panels.map((panel, index) => ({ ...panel, panel_number: index + 1 }));
    return parsed;
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
