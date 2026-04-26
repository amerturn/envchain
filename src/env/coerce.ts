import { parseEnvFile, serializeEnvFile } from './parser';
import { readFileSync, writeFileSync } from 'fs';

export type CoerceType = 'string' | 'number' | 'boolean' | 'json';

export interface CoerceRule {
  key: string;
  type: CoerceType;
}

export interface CoerceResult {
  original: Record<string, string>;
  coerced: Record<string, string>;
  changes: Array<{ key: string; from: string; to: string; type: CoerceType }>;
  errors: Array<{ key: string; value: string; type: CoerceType; reason: string }>;
}

export function coerceValue(value: string, type: CoerceType): string {
  switch (type) {
    case 'boolean': {
      const lower = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on'].includes(lower)) return 'true';
      if (['0', 'false', 'no', 'off'].includes(lower)) return 'false';
      throw new Error(`Cannot coerce "${value}" to boolean`);
    }
    case 'number': {
      const n = Number(value.trim());
      if (isNaN(n)) throw new Error(`Cannot coerce "${value}" to number`);
      return String(n);
    }
    case 'json': {
      try {
        JSON.parse(value);
        return value;
      } catch {
        // attempt to coerce plain string to JSON string
        return JSON.stringify(value);
      }
    }
    case 'string':
    default:
      return String(value);
  }
}

export function coerceEnv(
  env: Record<string, string>,
  rules: CoerceRule[]
): CoerceResult {
  const coerced = { ...env };
  const changes: CoerceResult['changes'] = [];
  const errors: CoerceResult['errors'] = [];

  for (const { key, type } of rules) {
    if (!(key in env)) continue;
    const from = env[key];
    try {
      const to = coerceValue(from, type);
      if (to !== from) {
        coerced[key] = to;
        changes.push({ key, from, to, type });
      }
    } catch (err) {
      errors.push({ key, value: from, type, reason: (err as Error).message });
    }
  }

  return { original: env, coerced, changes, errors };
}

export function coerceEnvFile(filePath: string, rules: CoerceRule[]): CoerceResult {
  const content = readFileSync(filePath, 'utf8');
  const env = parseEnvFile(content);
  const result = coerceEnv(env, rules);
  writeFileSync(filePath, serializeEnvFile(result.coerced), 'utf8');
  return result;
}

export function formatCoerceResult(result: CoerceResult): string {
  const lines: string[] = [];
  if (result.changes.length === 0 && result.errors.length === 0) {
    lines.push('No coercions applied.');
    return lines.join('\n');
  }
  for (const { key, from, to, type } of result.changes) {
    lines.push(`  coerced  ${key}: "${from}" -> "${to}" (${type})`);
  }
  for (const { key, value, type, reason } of result.errors) {
    lines.push(`  error    ${key}: "${value}" cannot be coerced to ${type} — ${reason}`);
  }
  lines.push(`\n${result.changes.length} coerced, ${result.errors.length} error(s).`);
  return lines.join('\n');
}
