import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';
import { createApp } from '../server/src/app.js';
import { connectDatabase } from '../server/src/config/database.js';
import { readEnvironment } from '../server/src/config/env.js';

let appPromise: Promise<Express> | undefined;

async function initializeApp(): Promise<Express> {
  const environment = readEnvironment();
  await connectDatabase(environment.MONGODB_URI);
  return createApp(environment, { serveClient: false }).app;
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    // Concurrent requests share initialization and reuse the database pools.
    appPromise ??= initializeApp().catch((error: unknown) => {
      appPromise = undefined;
      throw error;
    });
    const app = await appPromise;
    app(request, response);
  } catch (error: unknown) {
    console.error(
      'API initialization failed:',
      error instanceof Error ? error.name : 'UnknownError',
    );
    response.writeHead(503, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Retry-After': '5',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(
      JSON.stringify({ error: { message: 'Service unavailable; please try again shortly' } }),
    );
  }
}
