import { createComicScript, generateImage, HttpError } from './comicService';
import { IMAGE_MODELS } from '../types';

export interface ServerEnv {
  GEMINI_API_KEY?: string;
  IMAGE_API_KEY?: string;
  IMAGE_API_BASE_URL?: string;
}

export interface RouteResult {
  status: number;
  data: unknown;
}

const ALLOWED_MODELS = new Set<string>(IMAGE_MODELS.map((entry) => entry.value));
const SIZE_PATTERN = /^\d{3,4}x\d{3,4}$/;
const MAX_SCRIPT_PROMPT_LENGTH = 2000;
const MAX_IMAGE_PROMPT_LENGTH = 4000;

function readStringField(body: unknown, field: string): string | undefined {
  const value = (body as Record<string, unknown> | null)?.[field];
  return typeof value === 'string' ? value : undefined;
}

export async function handleScriptRequest(body: unknown, env: ServerEnv): Promise<RouteResult> {
  const prompt = readStringField(body, 'prompt')?.trim();
  if (!prompt) return { status: 400, data: { error: 'A "prompt" string is required.' } };
  if (prompt.length > MAX_SCRIPT_PROMPT_LENGTH) {
    return { status: 400, data: { error: `Prompt is too long (max ${MAX_SCRIPT_PROMPT_LENGTH} characters).` } };
  }
  const script = await createComicScript({ prompt, apiKey: env.GEMINI_API_KEY });
  return { status: 200, data: script };
}

export async function handleImageRequest(body: unknown, env: ServerEnv): Promise<RouteResult> {
  const prompt = readStringField(body, 'prompt')?.trim();
  const model = readStringField(body, 'model');
  const size = readStringField(body, 'size');

  if (!prompt) return { status: 400, data: { error: 'A "prompt" string is required.' } };
  if (prompt.length > MAX_IMAGE_PROMPT_LENGTH) {
    return { status: 400, data: { error: `Prompt is too long (max ${MAX_IMAGE_PROMPT_LENGTH} characters).` } };
  }
  if (!model || !ALLOWED_MODELS.has(model)) {
    return { status: 400, data: { error: 'Unsupported image model.' } };
  }
  if (size !== undefined && !SIZE_PATTERN.test(size)) {
    return { status: 400, data: { error: 'Invalid size format, expected e.g. "1024x1024".' } };
  }

  const image = await generateImage({
    prompt,
    model,
    size,
    baseUrl: env.IMAGE_API_BASE_URL,
    apiKey: env.IMAGE_API_KEY,
  });
  return { status: 200, data: image };
}

export function toErrorResponse(error: unknown): RouteResult {
  if (error instanceof HttpError) return { status: error.status, data: { error: error.message } };
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  console.error('Unhandled API error:', error);
  return { status: 500, data: { error: message } };
}
