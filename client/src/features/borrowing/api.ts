import {
  borrowRequestDtoSchema,
  pageDtoSchema,
  type BorrowInput,
  type RequestAction,
} from '@borrowcircle/shared';
import { http } from '../../lib/http';
export const requestApi = {
  create: (id: string, body: BorrowInput) =>
    http(`/items/${id}/requests`, borrowRequestDtoSchema, { method: 'POST', body }),
  list: (view: 'borrowing' | 'lending', page: number) =>
    http(`/requests?view=${view}&page=${page}`, pageDtoSchema(borrowRequestDtoSchema)),
  action: (id: string, action: RequestAction) =>
    http(`/requests/${id}/${action}`, borrowRequestDtoSchema, { method: 'POST', body: {} }),
};
