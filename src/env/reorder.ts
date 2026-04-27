import { parseEnvFile, serializeEnvFile } from './parser';
import fs from 'fs';

export interface ReorderResult {
  original: string[];
  reordered: string[];
  changed: boolean;
}

/**
 * Reorder env keys according to a provided key order list.
 * Keys not in the order list are appended at the end in their original relative order.
 */
export function reorderEnvKeys(
  env: Record<string, string>,
  order: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  const remaining = new Set(Object.keys(env));

  for (const key of order) {
    if (key in env) {
      result[key] = env[key];
      remaining.delete(key);
    }
  }

  for (const key of remaining) {
    result[key] = env[key];
  }

  return result;
}

export function reorderEnvFile(
  filePath: string,
  order: string[]
): ReorderResult {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(raw);
  const original = Object.keys(env);
  const reordered = reorderEnvKeys(env, order);
  const reorderedKeys = Object.keys(reordered);
  const changed =
    original.length !== reorderedKeys.length ||
    original.some((k, i) => k !== reorderedKeys[i]);

  if (changed) {
    fs.writeFileSync(filePath, serializeEnvFile(reordered), 'utf8');
  }

  return { original, reordered: reorderedKeys, changed };
}

export function formatReorderResult(result: ReorderResult): string {
  if (!result.changed) {
    return 'No changes — keys already in desired order.';
  }
  const lines: string[] = ['Reordered keys:'];
  result.reordered.forEach((key, i) => {
    const prev = result.original[i];
    const marker = prev !== key ? ' *' : '';
    lines.push(`  ${i + 1}. ${key}${marker}`);
  });
  lines.push(`\n${result.reordered.length} key(s) reordered.`);
  return lines.join('\n');
}
