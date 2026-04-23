import { parseEnvFile } from './parser';
import { readFileSync } from 'fs';

export interface FlattenOptions {
  prefix?: string;
  separator?: string;
  uppercase?: boolean;
}

export interface FlattenResult {
  original: Record<string, string>;
  flattened: Record<string, string>;
  changed: string[];
}

export function flattenEnvKeys(
  env: Record<string, string>,
  options: FlattenOptions = {}
): FlattenResult {
  const { prefix = '', separator = '_', uppercase = false } = options;
  const flattened: Record<string, string> = {};
  const changed: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    let newKey = key;

    if (prefix) {
      const cleanPrefix = prefix.endsWith(separator) ? prefix.slice(0, -separator.length) : prefix;
      if (!key.startsWith(cleanPrefix + separator)) {
        newKey = `${cleanPrefix}${separator}${key}`;
      }
    }

    if (uppercase) {
      newKey = newKey.toUpperCase();
    }

    flattened[newKey] = value;

    if (newKey !== key) {
      changed.push(key);
    }
  }

  return { original: env, flattened, changed };
}

export function flattenEnvFile(
  filePath: string,
  options: FlattenOptions = {}
): FlattenResult {
  const content = readFileSync(filePath, 'utf-8');
  const env = parseEnvFile(content);
  return flattenEnvKeys(env, options);
}

export function formatFlattenResult(result: FlattenResult): string {
  const lines: string[] = [];
  const { changed, flattened } = result;

  if (changed.length === 0) {
    lines.push('No keys were changed.');
  } else {
    lines.push(`Flattened ${changed.length} key(s):`);
    for (const key of changed) {
      const newKey = Object.keys(flattened).find(
        k => flattened[k] === result.original[key] && k !== key
      ) ?? key;
      lines.push(`  ${key} → ${newKey}`);
    }
  }

  return lines.join('\n');
}
