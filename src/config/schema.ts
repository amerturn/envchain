import { z } from 'zod';

export const EnvVarSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  secret: z.boolean().default(false),
  description: z.string().optional(),
});

export const TargetSchema = z.object({
  name: z.string().min(1),
  extends: z.string().optional(),
  env: z.record(z.string(), z.union([z.string(), EnvVarSchema])).default({}),
});

export const EnvChainConfigSchema = z.object({
  version: z.literal('1').default('1'),
  targets: z.array(TargetSchema).min(1),
});

export type EnvVar = z.infer<typeof EnvVarSchema>;
export type Target = z.infer<typeof TargetSchema>;
export type EnvChainConfig = z.infer<typeof EnvChainConfigSchema>;

export function normalizeEnvVar(value: string | EnvVar): EnvVar {
  if (typeof value === 'string') {
    return { key: '', value, secret: false };
  }
  return value;
}
