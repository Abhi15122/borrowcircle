import { z } from 'zod';
import { categories, conditions, requestStatuses } from '../constants/domain.js';
export const userDtoSchema = z.object({ id: z.string(), name: z.string() });
export const sessionDtoSchema = z.object({ user: userDtoSchema.nullable() });
export const tokenDtoSchema = z.object({ token: z.string() });
export const itemDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(categories),
  condition: z.enum(conditions),
  pickupArea: z.string(),
  imageUrl: z.string(),
  owner: userDtoSchema,
  archived: z.boolean(),
  onLoan: z.boolean(),
});
export const itemDetailDtoSchema = itemDtoSchema.extend({ reservedDates: z.array(z.string()) });
export const borrowRequestDtoSchema = z.object({
  id: z.string(),
  item: itemDtoSchema,
  borrower: userDtoSchema,
  owner: userDtoSchema,
  startDate: z.string(),
  endDate: z.string(),
  note: z.string(),
  status: z.enum(requestStatuses),
  createdAt: z.string(),
  handedOverAt: z.string().nullable(),
  returnedAt: z.string().nullable(),
});
export function pageDtoSchema<T extends z.ZodType>(schema: T) {
  return z.object({
    data: z.array(schema),
    page: z.number(),
    total: z.number(),
    pages: z.number(),
  });
}
export const errorDtoSchema = z.object({
  error: z.object({ message: z.string(), fields: z.record(z.string(), z.string()).optional() }),
});
