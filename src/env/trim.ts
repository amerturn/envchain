import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface TrimResult {
  original: Record<string, string>;
  trimmed: Record<string, string>;
  changed: string[];
}

/**
 * Trims leading/trailing whitespace from all env values.
 */
export function trimEnvValues(
  env: Record<string, string>
): TrimResult {
  const trimmed: Record<string, string> = {};
  const changed: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    const t = value.trim();
    trimmed[key] = t;
    if (t !== value) {
      changed.push(key);
    }
  }

  return { original: env, trimmed, changed };
}

/**
 * Reads an env file, trims all values, and writes it back.
 */
export function trimEnvFile(filePath: string): TrimResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(content);
  const result = trimEnvValues(env);
  fs.writeFileSync(filePath, serializeEnvFile(result.trimmed), 'utf8');
  return result;
}

export function formatTrimResult(result: TrimResult): string {
  if (result.changed.length === 0) {
    return 'No values required trimming.';
  }
  const lines = [`Trimmed ${result.changed.length} value(s):`, ''];
  for (const key of result.changed) {
    const before = JSON.stringify(result.original[key]);
    const after = JSON.stringify(result.trimmed[key]);
    lines.push(`  ${key}: ${before} → ${after}`);
  }
  return lines.join('\n');
}
