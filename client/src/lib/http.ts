import { errorDtoSchema, tokenDtoSchema } from '@borrowcircle/shared';
import type { z } from 'zod';
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
async function decode(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('The service is temporarily unavailable; please try again', response.status);
  }
  if (!response.ok) {
    const parsed = errorDtoSchema.safeParse(data);
    throw new ApiError(
      parsed.success ? parsed.data.error.message : 'Request failed',
      response.status,
      parsed.success ? parsed.data.error.fields : undefined,
    );
  }
  return data;
}
export async function http<T>(
  path: string,
  schema: z.ZodType<T>,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (method !== 'GET') {
    // Fetch for each mutation so session rotation cannot leave a stale cached CSRF token.
    const token = await http('/auth/csrf', tokenDtoSchema);
    headers['X-CSRF-Token'] = token.token;
  }
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new ApiError('Could not reach BorrowCircle; please try again', 0);
  }
  const parsed = schema.safeParse(await decode(response));
  if (!parsed.success) throw new ApiError('Could not load this information; please try again', 502);
  return parsed.data;
}
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong; please try again';
}
