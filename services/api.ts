import { ComicScript, ComicStyle, IMAGE_MODELS, ImageModel, ScriptModel, ServerConfig, STYLE_PRESETS } from '../types';

// Carries the HTTP status so callers can decide whether to retry and what
// message to show (401 = key rejected, 429 = rate limited, ...).
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function postJson<TResponse>(path: string, body: unknown, signal?: AbortSignal): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'The request could not be sent.');
  }

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (result as { error?: string } | null)?.error ?? `The request failed with status ${response.status}.`;
    throw new ApiError(response.status, message);
  }
  return result as TResponse;
}

export function fetchComicScript(prompt: string, scriptModel: ScriptModel, signal?: AbortSignal): Promise<ComicScript> {
  return postJson<ComicScript>('/api/script', { prompt, scriptModel }, signal);
}

export async function fetchServerConfig(): Promise<ServerConfig> {
  const response = await fetch('/api/config');
  const result = (await response.json().catch(() => null)) as ServerConfig | null;
  if (!response.ok || !result?.providers) {
    throw new ApiError(response.ok ? 502 : response.status, 'Could not load the server configuration.');
  }
  return result;
}

export async function generatePanelImage(
  visualPrompt: string,
  model: ImageModel,
  style: ComicStyle,
  signal?: AbortSignal,
): Promise<string> {
  const modelConfig = IMAGE_MODELS.find((entry) => entry.value === model);
  const styledPrompt = `${visualPrompt.trim()} Style: ${STYLE_PRESETS[style].suffix}.`;
  const { image } = await postJson<{ image: string }>(
    '/api/image',
    {
      prompt: styledPrompt,
      model,
      ...(modelConfig?.size ? { size: modelConfig.size } : {}),
    },
    signal,
  );

  if (typeof image !== 'string' || image.length === 0) {
    throw new ApiError(502, 'The image API returned no image data.');
  }
  return image.startsWith('data:') ? image : urlToDataUrl(image, signal);
}

// The image API may answer with a URL instead of base64. Convert it to a data
// URL so the PNG export works; if the fetch is blocked (CORS) we fall back to
// the raw URL, which still renders but may not be exportable.
async function urlToDataUrl(url: string, signal?: AbortSignal): Promise<string> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return url;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Could not read the image data.'));
      };
      reader.onerror = () => reject(new Error('Could not read the image data.'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

// Maps low-level failures to actionable messages instead of one generic
// "AI might be busy" banner for every case.
export function describeApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return `${fallback} The server could not be reached. Check your connection and try again.`;
    if (error.status === 401 || error.status === 403)
      return `${fallback} The API key was rejected (${error.status}). Check the server configuration.`;
    if (error.status === 404)
      return `${fallback} The API endpoint was not found. If you deployed only the static build, the /api functions are missing — see the README for deployment notes.`;
    if (error.status === 429) return `${fallback} The AI service is rate limited or out of quota. Wait a moment and try again.`;
    return `${fallback} ${error.message}`;
  }
  return fallback;
}
