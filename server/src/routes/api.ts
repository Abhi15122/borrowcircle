import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import * as items from '../controllers/item.controller.js';
import * as requests from '../controllers/request.controller.js';
import { csrfToken, requireAuthentication } from '../middleware/security.js';
import { health } from '../controllers/health.controller.js';
export function apiRoutes() {
  const router = Router();
  router.get('/health', health);
  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { message: 'Too many authentication attempts; try again in 15 minutes' } },
  });
  router.get('/auth/csrf', csrfToken);
  router.post('/auth/register', authLimit, auth.register);
  router.post('/auth/login', authLimit, auth.login);
  router.post('/auth/logout', requireAuthentication, auth.logout);
  router.get('/auth/me', auth.me);
  router.get('/items', items.list);
  router.get('/items/:id', items.detail);
  router.post('/items', requireAuthentication, items.create);
  router.patch('/items/:id', requireAuthentication, items.edit);
  router.delete('/items/:id', requireAuthentication, items.archive);
  router.post('/items/:id/requests', requireAuthentication, requests.create);
  router.get('/requests', requireAuthentication, requests.list);
  router.post('/requests/:id/:action', requireAuthentication, requests.action);
  return router;
}
