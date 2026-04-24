import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface PrefixResult {
  added: string[];
  removed: string[];
  original: Record<string, string>;
  result: Record<string, string>;
}

export function prefixEnvKeys(
  env: Record<string, string>,
  prefix: string,
  strip = false
): PrefixResult {
  const added: string[] = [];
  const removed: string[] = [];
  const result: Record<string, string> = {};

  if (strip) {
    for (const [key, value] of Object.entries(env)) {
      if (key.startsWith(prefix)) {
        const newKey = key.slice(prefix.length);
        result[newKey] = value;
        removed.push(key);
        added.push(newKey);
      } else {
        result[key] = value;
      }
    }
  } else {
    for (const [key, value] of Object.entries(env)) {
      const newKey = `${prefix}${key}`;
      result[newKey] = value;
      added.push(newKey);
      removed.push(key);
    }
  }

  return { added, removed, original: env, result };
}

export function prefixEnvFile(
  filePath: string,
  prefix: string,
  strip = false
): PrefixResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(content);
  const prefixResult = prefixEnvKeys(env, prefix, strip);
  fs.writeFileSync(filePath, serializeEnvFile(prefixResult.result), 'utf8');
  return prefixResult;
}

export function formatPrefixResult(result: PrefixResult, strip: boolean): string {
  const lines: string[] = [];
  const action = strip ? 'stripped' : 'added';
  lines.push(`Prefix ${action}: ${result.added.length} key(s) renamed`);
  for (let i = 0; i < result.added.length; i++) {
    const from = strip ? result.removed[i] : result.removed[i];
    const to = result.added[i];
    lines.push(`  ${from} → ${to}`);
  }
  const unchanged = Object.keys(result.result).filter(
    (k) => !result.added.includes(k)
  ).length;
  if (unchanged > 0) {
    lines.push(`  (${unchanged} key(s) unchanged)`);
  }
  return lines.join('\n');
}
