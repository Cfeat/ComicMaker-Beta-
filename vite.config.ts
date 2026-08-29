import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';
import { cwd } from 'node:process';
import { handleImageRequest, handleScriptRequest, toErrorResponse, type RouteResult } from './server/routes';

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Serves the exact same route handlers as the Vercel functions in /api, so
// local dev behaves like production while the API keys stay server-side
// (they are read from .env.local WITHOUT the VITE_ prefix, so Vite never
// bundles them into the client).
function devApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'comicgen-dev-api',
    configureServer(server) {
      const mount = (path: string, route: (body: unknown) => Promise<RouteResult>) => {
        server.middlewares.use(path, async (req, res) => {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
            return;
          }
          try {
            const body = await readJsonBody(req);
            const result = await route(body);
            sendJson(res, result.status, result.data);
          } catch (error) {
            const result = toErrorResponse(error);
            sendJson(res, result.status, result.data);
          }
        });
      };
      mount('/api/script', (body) => handleScriptRequest(body, env));
      mount('/api/image', (body) => handleImageRequest(body, env));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '');
  return {
    plugins: [react(), devApiPlugin(env)],
  };
});
