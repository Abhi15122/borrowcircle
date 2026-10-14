import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { loginSchema, registerSchema, emptySchema } from '@borrowcircle/shared';
import * as auth from '../services/auth.service.js';
import { parseInput } from '../validation/request.js';

async function startSession(request: Request, userId: string) {
  await new Promise<void>((resolve, reject) =>
    request.session.regenerate((error) => (error ? reject(error) : resolve())),
  );
  request.session.userId = userId;
  request.session.csrfToken = randomBytes(32).toString('hex');
  await new Promise<void>((resolve, reject) =>
    request.session.save((error) => (error ? reject(error) : resolve())),
  );
}
export async function register(request: Request, response: Response) {
  const user = await auth.register(parseInput(registerSchema, request.body));
  await startSession(request, user.id);
  response.status(201).json({ user });
}
export async function login(request: Request, response: Response) {
  const user = await auth.login(parseInput(loginSchema, request.body));
  await startSession(request, user.id);
  response.json({ user });
}
export async function logout(request: Request, response: Response) {
  parseInput(emptySchema, request.body ?? {});
  await new Promise<void>((resolve, reject) =>
    request.session.destroy((error) => (error ? reject(error) : resolve())),
  );
  response
    .clearCookie('borrowcircle.sid', { path: '/', httpOnly: true, sameSite: 'lax' })
    .status(204)
    .end();
}
export async function me(request: Request, response: Response) {
  response.json({ user: await auth.currentUser(request.session.userId) });
}
