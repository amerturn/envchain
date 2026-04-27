import { parseEnvFile, serializeEnvFile } from './parser';
import { readFileSync, writeFileSync } from 'fs';

export interface SanitizeOptions {
  trimValues?: boolean;
  removeEmpty?: boolean;
  removeComments?: boolean;
  normalizeKeys?: boolean;
}

export interface SanitizeResult {
  original: Record<string, string>;
  sanitized: Record<string, string>;
  removed: string[];
  renamed: Record<string, string>;
  trimmed: string[];
}

export function sanitizeEnv(
  env: Record<string, string>,
  opts: SanitizeOptions = {}
): SanitizeResult {
  const sanitized: Record<string, string> = {};
  const removed: string[] = [];
  const renamed: Record<string, string> = {};
  const trimmed: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    let newKey = key;
    let newValue = value;

    if (opts.normalizeKeys) {
      newKey = key.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      if (newKey !== key) renamed[key] = newKey;
    }

    if (opts.trimValues) {
      const trimmedValue = newValue.trim();
      if (trimmedValue !== newValue) trimmed.push(newKey);
      newValue = trimmedValue;
    }

    if (opts.removeEmpty && newValue === '') {
      removed.push(newKey);
      continue;
    }

    sanitized[newKey] = newValue;
  }

  return { original: env, sanitized, removed, renamed, trimmed };
}

export function sanitizeEnvFile(
  filePath: string,
  opts: SanitizeOptions = {}
): SanitizeResult {
  const raw = readFileSync(filePath, 'utf8');
  const env = parseEnvFile(raw);
  const result = sanitizeEnv(env, opts);
  writeFileSync(filePath, serializeEnvFile(result.sanitized), 'utf8');
  return result;
}

export function formatSanitizeResult(result: SanitizeResult): string {
  const lines: string[] = [];
  const removedCount = result.removed.length;
  const renamedCount = Object.keys(result.renamed).length;
  const trimmedCount = result.trimmed.length;

  if (removedCount === 0 && renamedCount === 0 && trimmedCount === 0) {
    lines.push('No changes needed.');
    return lines.join('\n');
  }

  if (removedCount > 0)
    lines.push(`Removed ${removedCount} empty key(s): ${result.removed.join(', ')}`);
  if (trimmedCount > 0)
    lines.push(`Trimmed ${trimmedCount} value(s): ${result.trimmed.join(', ')}`);
  if (renamedCount > 0) {
    for (const [from, to] of Object.entries(result.renamed))
      lines.push(`Renamed: ${from} → ${to}`);
  }

  return lines.join('\n');
}
