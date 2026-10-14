import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import type { Environment } from './config/env.js';
import { csrfProtection } from './middleware/security.js';
import { errorHandler } from './middleware/errors.js';
import { apiRoutes } from './routes/api.js';
import { AppError } from './utils/errors.js';

export function createApp(environment: Environment, options: { serveClient?: boolean } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (environment.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.use(
    helmet({ contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'https:', 'data:'] } } }),
  );
  app.use(express.json({ limit: '16kb' }));
  const store = MongoStore.create({
    mongoUrl: environment.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 3600,
    mongoOptions: { maxPoolSize: 10, minPoolSize: 0, maxIdleTimeMS: 60_000 },
  });
  app.use(
    session({
      name: 'borrowcircle.sid',
      secret: environment.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        httpOnly: true,
        secure: environment.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000,
      },
    }),
  );
  app.use('/api', (_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', csrfProtection(environment.APP_ORIGIN), apiRoutes());
  app.use('/api', () => {
    throw new AppError(404, 'API endpoint not found');
  });
  if (environment.NODE_ENV === 'production' && options.serveClient !== false) {
    const clientPath = fileURLToPath(new URL('../../client/dist/', import.meta.url));
    app.use(express.static(clientPath));
    app.get('/{*path}', (_request, response) =>
      response.sendFile(path.join(clientPath, 'index.html')),
    );
  }
  app.use(errorHandler);
  return { app, store };
}
