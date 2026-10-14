import { sessionDtoSchema, type LoginInput, type RegisterInput } from '@borrowcircle/shared';
import { z } from 'zod';
import { http } from '../../lib/http';
export const authApi = {
  me: () => http('/auth/me', sessionDtoSchema),
  login: (body: LoginInput) => http('/auth/login', sessionDtoSchema, { method: 'POST', body }),
  register: (body: RegisterInput) =>
    http('/auth/register', sessionDtoSchema, { method: 'POST', body }),
  logout: () => http('/auth/logout', z.undefined(), { method: 'POST', body: {} }),
};
