import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export type SortOrder = 'asc' | 'desc';

export interface SortResult {
  original: Record<string, string>;
  sorted: Record<string, string>;
  changed: boolean;
}

export function sortEnvKeys(
  env: Record<string, string>,
  order: SortOrder = 'asc'
): Record<string, string> {
  const keys = Object.keys(env).sort((a, b) =>
    order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  );
  return Object.fromEntries(keys.map((k) => [k, env[k]]));
}

export function sortEnvFile(
  filePath: string,
  order: SortOrder = 'asc'
): SortResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const original = parseEnvFile(content);
  const sorted = sortEnvKeys(original, order);
  const changed =
    JSON.stringify(Object.keys(original)) !==
    JSON.stringify(Object.keys(sorted));
  if (changed) {
    fs.writeFileSync(filePath, serializeEnvFile(sorted), 'utf8');
  }
  return { original, sorted, changed };
}

export function formatSortResult(result: SortResult, order: SortOrder): string {
  if (!result.changed) return `Already sorted (${order}).`;
  const lines: string[] = [`Sorted keys (${order}):`];
  Object.keys(result.sorted).forEach((k) => lines.push(`  ${k}`));
  return lines.join('\n');
}
