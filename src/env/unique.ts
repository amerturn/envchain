import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface UniqueResult {
  original: Record<string, string>;
  unique: Record<string, string>;
  duplicates: Array<{ key: string; values: string[] }>;
}

/**
 * Given multiple env maps, returns only keys that appear in exactly one map.
 * Keys appearing in more than one map are considered duplicates.
 */
export function uniqueEnvMaps(
  maps: Record<string, string>[]
): UniqueResult {
  const keyCounts = new Map<string, string[]>();

  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) {
      if (!keyCounts.has(key)) {
        keyCounts.set(key, []);
      }
      keyCounts.get(key)!.push(value);
    }
  }

  const unique: Record<string, string> = {};
  const duplicates: Array<{ key: string; values: string[] }> = [];
  const original: Record<string, string> = {};

  for (const map of maps) {
    Object.assign(original, map);
  }

  for (const [key, values] of keyCounts.entries()) {
    if (values.length === 1) {
      unique[key] = values[0];
    } else {
      duplicates.push({ key, values });
    }
  }

  return { original, unique, duplicates };
}

export function uniqueEnvFiles(filePaths: string[]): UniqueResult {
  const maps = filePaths.map((p) => parseEnvFile(fs.readFileSync(p, 'utf8')));
  return uniqueEnvMaps(maps);
}

export function formatUniqueResult(result: UniqueResult): string {
  const lines: string[] = [];
  const uniqueCount = Object.keys(result.unique).length;
  const dupCount = result.duplicates.length;

  lines.push(`Unique keys: ${uniqueCount}, Duplicate keys: ${dupCount}`);

  if (result.duplicates.length > 0) {
    lines.push('');
    lines.push('Duplicates:');
    for (const { key, values } of result.duplicates) {
      lines.push(`  ${key}: [${values.map((v) => JSON.stringify(v)).join(', ')}]`);
    }
  }

  if (uniqueCount > 0) {
    lines.push('');
    lines.push('Unique:');
    for (const [key, value] of Object.entries(result.unique)) {
      lines.push(`  ${key}=${JSON.stringify(value)}`);
    }
  }

  return lines.join('\n');
}
