import { readFileSync, writeFileSync } from 'fs';
import { parseEnvFile, serializeEnvFile } from './parser';

export interface TruncateResult {
  truncated: Record<string, string>;
  changes: string[];
}

/**
 * Truncate env values that exceed `maxLength` characters.
 * Returns a new map and the list of keys that were truncated.
 */
export function truncateEnvValues(
  env: Record<string, string>,
  maxLength = 255
): TruncateResult {
  const truncated: Record<string, string> = {};
  const changes: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    if (value.length > maxLength) {
      truncated[key] = value.slice(0, maxLength);
      changes.push(key);
    } else {
      truncated[key] = value;
    }
  }

  return { truncated, changes };
}

/**
 * Read an env file, truncate values, write back, and return the result.
 */
export function truncateEnvFile(filePath: string, maxLength = 255): TruncateResult {
  const raw = readFileSync(filePath, 'utf8');
  const env = parseEnvFile(raw);
  const result = truncateEnvValues(env, maxLength);

  if (result.changes.length > 0) {
    writeFileSync(filePath, serializeEnvFile(result.truncated), 'utf8');
  }

  return result;
}

/**
 * Format a human-readable summary of the truncate operation.
 */
export function formatTruncateResult(result: TruncateResult): string {
  if (result.changes.length === 0) {
    return 'No values truncated.';
  }

  const lines = [
    `Truncated ${result.changes.length} value(s):`,
    ...result.changes.map((key) => `  - ${key}`),
  ];

  return lines.join('\n');
}
