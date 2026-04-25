import { parseEnvFile, serializeEnvFile } from './parser';
import fs from 'fs';

export interface UnionResult {
  merged: Record<string, string>;
  added: string[];
  kept: string[];
}

/**
 * Produces the union of two env maps.
 * Keys in `base` are preserved; keys only in `extra` are added.
 * When a key exists in both, `base` wins unless `preferExtra` is true.
 */
export function unionEnvMaps(
  base: Record<string, string>,
  extra: Record<string, string>,
  preferExtra = false
): UnionResult {
  const merged: Record<string, string> = { ...base };
  const added: string[] = [];
  const kept: string[] = [];

  for (const [key, value] of Object.entries(extra)) {
    if (!(key in base)) {
      merged[key] = value;
      added.push(key);
    } else if (preferExtra) {
      merged[key] = value;
      kept.push(key);
    } else {
      kept.push(key);
    }
  }

  return { merged, added, kept };
}

export function unionEnvFiles(
  basePath: string,
  extraPath: string,
  preferExtra = false
): UnionResult {
  const base = parseEnvFile(fs.readFileSync(basePath, 'utf8'));
  const extra = parseEnvFile(fs.readFileSync(extraPath, 'utf8'));
  return unionEnvMaps(base, extra, preferExtra);
}

export function formatUnionResult(result: UnionResult): string {
  const lines: string[] = [];
  if (result.added.length > 0) {
    lines.push(`Added keys (${result.added.length}): ${result.added.join(', ')}`);
  } else {
    lines.push('No new keys added.');
  }
  if (result.kept.length > 0) {
    lines.push(`Existing keys retained (${result.kept.length}): ${result.kept.join(', ')}`);
  }
  lines.push(`Total keys in union: ${Object.keys(result.merged).length}`);
  return lines.join('\n');
}
