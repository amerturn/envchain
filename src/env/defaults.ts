import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface DefaultsResult {
  applied: Record<string, string>;
  skipped: Record<string, string>;
  output: Record<string, string>;
}

/**
 * Apply default values to env keys that are missing or empty.
 * Existing non-empty values are preserved (skipped).
 */
export function applyDefaults(
  env: Record<string, string>,
  defaults: Record<string, string>
): DefaultsResult {
  const applied: Record<string, string> = {};
  const skipped: Record<string, string> = {};
  const output: Record<string, string> = { ...env };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const existing = env[key];
    if (existing === undefined || existing === '') {
      output[key] = defaultValue;
      applied[key] = defaultValue;
    } else {
      skipped[key] = existing;
    }
  }

  return { applied, skipped, output };
}

/**
 * Read an env file, apply defaults, and write the result back.
 */
export function applyDefaultsFile(
  filePath: string,
  defaults: Record<string, string>
): DefaultsResult {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(raw);
  const result = applyDefaults(env, defaults);
  fs.writeFileSync(filePath, serializeEnvFile(result.output), 'utf8');
  return result;
}

export function formatDefaultsResult(result: DefaultsResult): string {
  const lines: string[] = [];
  const appliedKeys = Object.keys(result.applied);
  const skippedKeys = Object.keys(result.skipped);

  if (appliedKeys.length === 0 && skippedKeys.length === 0) {
    return 'No default keys specified.';
  }

  if (appliedKeys.length > 0) {
    lines.push(`Applied defaults (${appliedKeys.length}):`);
    for (const key of appliedKeys) {
      lines.push(`  + ${key}=${result.applied[key]}`);
    }
  }

  if (skippedKeys.length > 0) {
    lines.push(`Skipped (already set) (${skippedKeys.length}):`);
    for (const key of skippedKeys) {
      lines.push(`  ~ ${key}`);
    }
  }

  return lines.join('\n');
}
