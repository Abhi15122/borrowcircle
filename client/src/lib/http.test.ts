import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { http } from './http';
afterEach(() => vi.unstubAllGlobals());
describe('HTTP failure feedback', () => {
  it('handles a non-JSON service failure without exposing a parser error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(http('/items', z.array(z.string()))).rejects.toMatchObject({
      message: 'The service is temporarily unavailable; please try again',
      status: 503,
    });
  });
  it('rejects malformed successful responses with a useful message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ invalid: true })));
    await expect(http('/items', z.array(z.string()))).rejects.toMatchObject({
      status: 502,
      message: 'Could not load this information; please try again',
    });
  });
  it('reports connection failure without exposing browser internals', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(http('/items', z.array(z.string()))).rejects.toMatchObject({
      status: 0,
      message: 'Could not reach BorrowCircle; please try again',
    });
  });
  it('preserves validated server field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { message: 'Email already registered', fields: { email: 'Already used' } } },
            { status: 409 },
          ),
        ),
    );
    await expect(http('/auth/me', z.object({ user: z.string() }))).rejects.toMatchObject({
      status: 409,
      fields: { email: 'Already used' },
    });
  });
});
