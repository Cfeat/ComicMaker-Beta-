import { env } from 'node:process';
import { handleConfigRequest } from '../server/routes';

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return json(405, { error: 'Method not allowed. Use GET.' });
  }
  const result = handleConfigRequest({
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    IMAGE_API_KEY: env.IMAGE_API_KEY,
    IMAGE_API_BASE_URL: env.IMAGE_API_BASE_URL,
  });
  return json(result.status, result.data);
}
