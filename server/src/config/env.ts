import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    APP_ORIGIN: z.url(),
    MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//),
    SESSION_SECRET: z
      .string()
      .min(32)
      .refine((value) => !value.startsWith('replace-'), 'Replace the example secret'),
    TRUST_PROXY: z.enum(['0', '1']).default('0'),
  })
  .superRefine((value, context) => {
    if (URL.canParse(value.APP_ORIGIN) && new URL(value.APP_ORIGIN).origin !== value.APP_ORIGIN)
      context.addIssue({
        code: 'custom',
        path: ['APP_ORIGIN'],
        message: 'Provide an origin without path or trailing slash',
      });
    if (value.NODE_ENV === 'production' && !value.APP_ORIGIN.startsWith('https://'))
      context.addIssue({
        code: 'custom',
        path: ['APP_ORIGIN'],
        message: 'Production requires HTTPS',
      });
  });
export function readEnvironment() {
  const result = schema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
    );
  return result.data;
}
export type Environment = ReturnType<typeof readEnvironment>;
