import type { Request, Response } from 'express';
import { isDatabaseReady } from '../services/health.service.js';
export async function health(_request: Request, response: Response) {
  const ready = await isDatabaseReady();
  response.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'unavailable' });
}
