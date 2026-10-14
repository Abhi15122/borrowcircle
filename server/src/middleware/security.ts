import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { AppError } from '../utils/errors.js';

export const requireAuthentication: RequestHandler = (request, _response, next) => {
  if (!request.session.userId) return next(new AppError(401, 'Please sign in'));
  next();
};
export function csrfProtection(origin: string): RequestHandler {
  return (request, _response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
    const headerOrigin = request.get('origin');
    if (headerOrigin && headerOrigin !== origin)
      return next(new AppError(403, 'Request origin is not allowed'));
    if (request.get('sec-fetch-site') === 'cross-site')
      return next(new AppError(403, 'Cross-site request is not allowed'));
    const supplied = request.get('x-csrf-token');
    const expected = request.session.csrfToken;
    if (
      !supplied ||
      !expected ||
      !/^[a-f\d]{64}$/.test(supplied) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    ) {
      return next(new AppError(403, 'Security token expired; refresh and try again'));
    }
    next();
  };
}
export const csrfToken: RequestHandler = (request, response) => {
  request.session.csrfToken ??= randomBytes(32).toString('hex');
  response.set('Cache-Control', 'no-store').json({ token: request.session.csrfToken });
};
