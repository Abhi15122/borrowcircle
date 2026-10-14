import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors.js';
export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  // Express identifies error middleware by its four-argument signature.
  void _next;
  if (error instanceof AppError) {
    response
      .status(error.status)
      .json({ error: { message: error.message, ...(error.fields && { fields: error.fields }) } });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: { message: 'Request body must be valid JSON' } });
    return;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    response.status(413).json({ error: { message: 'Request body is too large' } });
    return;
  }
  // Do not log request bodies, database URLs, or session data.
  console.error('Unhandled request failure:', error instanceof Error ? error.name : 'UnknownError');
  response.status(500).json({ error: { message: 'Something went wrong; please try again' } });
};
