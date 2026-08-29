import { env } from 'node:process';
import { handleImageRequest, toErrorResponse } from '../server/routes';

// Image generation can take tens of seconds, so raise the limit beyond the
// 10s default.
export const config = { maxDuration: 60 };

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed. Use POST.' });
  }
  const body = await request.json().catch(() => null);
  try {
    const result = await handleImageRequest(body, {
      GEMINI_API_KEY: env.GEMINI_API_KEY,
      IMAGE_API_KEY: env.IMAGE_API_KEY,
      IMAGE_API_BASE_URL: env.IMAGE_API_BASE_URL,
    });
    return json(result.status, result.data);
  } catch (error) {
    const result = toErrorResponse(error);
    return json(result.status, result.data);
  }
}
