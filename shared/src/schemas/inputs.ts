import { z } from 'zod';
import { categories, conditions, requestActions } from '../constants/domain.js';
import {
  communityToday,
  durationInDays,
  isAllowedDuration,
  isCalendarDate,
} from '../utils/dates.js';

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const password = z.string().min(10, 'Use at least 10 characters').max(128);
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const registerSchema = z
  .object({ name: z.string().trim().min(2).max(60), email, password })
  .strict();
export const itemSchema = z
  .object({
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().min(10).max(2000),
    category: z.enum(categories),
    condition: z.enum(conditions),
    pickupArea: z.string().trim().min(3).max(100),
    imageUrl: z
      .union([
        z.literal(''),
        z
          .url()
          .max(1000)
          .refine((value) => value.startsWith('https://'), 'Use an HTTPS image URL'),
      ])
      .default(''),
  })
  .strict();
export const dateSchema = z.string().refine(isCalendarDate, 'Choose a valid calendar date');

function validateRange(value: { startDate: string; endDate: string }, context: z.RefinementCtx) {
  if (value.startDate < communityToday())
    context.addIssue({
      code: 'custom',
      path: ['startDate'],
      message: 'Start date cannot be in the past',
    });
  if (!isAllowedDuration(durationInDays(value.startDate, value.endDate))) {
    context.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'Choose 1–14 days, including both dates',
    });
  }
}
export const borrowSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
    note: z.string().trim().max(500).default(''),
  })
  .strict()
  .superRefine(validateRange);
export const idSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier') });
export const actionParamsSchema = idSchema.extend({ action: z.enum(requestActions) });
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});
export const itemQuerySchema = paginationSchema
  .extend({
    search: z.string().trim().max(100).default(''),
    category: z.enum(categories).optional(),
    mine: z.enum(['true']).optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (Boolean(value.startDate) !== Boolean(value.endDate)) {
      context.addIssue({ code: 'custom', path: ['endDate'], message: 'Choose both dates' });
    } else if (value.startDate && value.endDate)
      validateRange({ startDate: value.startDate, endDate: value.endDate }, context);
  });
export const requestQuerySchema = paginationSchema
  .extend({ view: z.enum(['borrowing', 'lending']).default('borrowing') })
  .strict();
export const emptySchema = z.object({}).strict();
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type BorrowInput = z.infer<typeof borrowSchema>;
export type ItemQuery = z.infer<typeof itemQuerySchema>;
export type RequestQuery = z.infer<typeof requestQuerySchema>;
