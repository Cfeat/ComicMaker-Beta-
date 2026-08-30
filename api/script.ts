import { env } from 'node:process';
import { handleScriptRequest, toErrorResponse } from './lib/routes.js';

// Script generation includes server-side retries with backoff, so give the
// function headroom beyond the 10s default.
export const config = { maxDuration: 300 };

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  try {
    const result = await handleScriptRequest(body, {
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
