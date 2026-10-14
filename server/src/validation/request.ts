import type { Request } from 'express';
import type { z } from 'zod';
import { AppError } from '../utils/errors.js';

export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) fields[issue.path.join('.') || 'form'] ??= issue.message;
  throw new AppError(400, 'Please check the submitted information', fields);
}
export function authenticatedId(request: Request): string {
  if (!request.session.userId) throw new AppError(401, 'Please sign in');
  return request.session.userId;
}
