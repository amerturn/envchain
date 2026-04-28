import { parseEnvFile, serializeEnvFile } from './parser';
import { readFileSync, writeFileSync } from 'fs';

export interface NormalizeOptions {
  /** Quote all values */
  quoteAll?: boolean;
  /** Remove empty lines between entries */
  compact?: boolean;
  /** Sort keys alphabetically */
  sort?: boolean;
  /** Trim whitespace from values */
  trim?: boolean;
  /** Convert keys to uppercase */
  uppercaseKeys?: boolean;
}

export interface NormalizeResult {
  original: Record<string, string>;
  normalized: Record<string, string>;
  changes: NormalizeChange[];
  output: string;
}

export interface NormalizeChange {
  key: string;
  type: 'key_case' | 'value_trim' | 'value_quote';
  before: string;
  after: string;
}

/**
 * Normalize an env map according to the given options.
 * Returns the normalized map and a list of changes made.
 */
export function normalizeEnv(
  env: Record<string, string>,
  options: NormalizeOptions = {}
): NormalizeResult {
  const changes: NormalizeChange[] = [];
  const normalized: Record<string, string> = {};

  let entries = Object.entries(env);

  if (options.sort) {
    entries = entries.sort(([a], [b]) => a.localeCompare(b));
  }

  for (const [rawKey, rawValue] of entries) {
    let key = rawKey;
    let value = rawValue;

    if (options.uppercaseKeys && key !== key.toUpperCase()) {
      changes.push({ key: rawKey, type: 'key_case', before: key, after: key.toUpperCase() });
      key = key.toUpperCase();
    }

    if (options.trim) {
      const trimmed = value.trim();
      if (trimmed !== value) {
        changes.push({ key, type: 'value_trim', before: value, after: trimmed });
        value = trimmed;
      }
    }

    normalized[key] = value;
  }

  const output = serializeEnvFile(normalized);

  return { original: env, normalized, changes, output };
}

/**
 * Normalize an .env file on disk, writing the result back to the same path.
 */
export function normalizeEnvFile(
  filePath: string,
  options: NormalizeOptions = {}
): NormalizeResult {
  const raw = readFileSync(filePath, 'utf8');
  const env = parseEnvFile(raw);
  const result = normalizeEnv(env, options);
  writeFileSync(filePath, result.output, 'utf8');
  return result;
}

/**
 * Format a normalize result into a human-readable summary.
 */
export function formatNormalizeResult(result: NormalizeResult): string {
  if (result.changes.length === 0) {
    return 'No changes — env is already normalized.';
  }

  const lines: string[] = [`Normalized ${result.changes.length} value(s):`];

  for (const change of result.changes) {
    const label =
      change.type === 'key_case'
        ? 'key renamed'
        : change.type === 'value_trim'
        ? 'value trimmed'
        : 'value quoted';
    lines.push(`  ${change.key}: ${label} ("${change.before}" → "${change.after}")`);
  }

  return lines.join('\n');
}
