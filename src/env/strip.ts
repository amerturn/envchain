import { parseEnvFile, serializeEnvFile } from './parser';

export interface StripOptions {
  keys?: string[];
  pattern?: RegExp;
}

export interface StripResult {
  original: Record<string, string>;
  stripped: Record<string, string>;
  removed: string[];
}

export function stripEnvKeys(
  env: Record<string, string>,
  options: StripOptions
): StripResult {
  const removed: string[] = [];
  const stripped: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    const matchesKey = options.keys?.includes(key);
    const matchesPattern = options.pattern?.test(key);
    if (matchesKey || matchesPattern) {
      removed.push(key);
    } else {
      stripped[key] = value;
    }
  }

  return { original: env, stripped, removed };
}

export function stripEnvFile(
  content: string,
  options: StripOptions
): StripResult {
  const env = parseEnvFile(content);
  return stripEnvKeys(env, options);
}

export function formatStripResult(result: StripResult): string {
  const lines: string[] = [];
  if (result.removed.length === 0) {
    lines.push('No keys removed.');
  } else {
    lines.push(`Removed ${result.removed.length} key(s):`);
    for (const key of result.removed) {
      lines.push(`  - ${key}`);
    }
  }
  lines.push('');
  lines.push('Resulting env:');
  lines.push(serializeEnvFile(result.stripped));
  return lines.join('\n');
}
