import {
  itemDtoSchema,
  itemDetailDtoSchema,
  pageDtoSchema,
  type ItemInput,
} from '@borrowcircle/shared';
import { z } from 'zod';
import { http } from '../../lib/http';
export const itemApi = {
  list: (query: string) => http(`/items?${query}`, pageDtoSchema(itemDtoSchema)),
  detail: (id: string) => http(`/items/${id}`, itemDetailDtoSchema),
  create: (body: ItemInput) => http('/items', itemDtoSchema, { method: 'POST', body }),
  edit: (id: string, body: ItemInput) =>
    http(`/items/${id}`, itemDtoSchema, { method: 'PATCH', body }),
  archive: (id: string) => http(`/items/${id}`, z.undefined(), { method: 'DELETE', body: {} }),
};
