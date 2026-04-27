import { parseEnvFile } from './parser';
import * as fs from 'fs';

export interface DiffKeysResult {
  added: string[];
  removed: string[];
  common: string[];
}

export function diffEnvKeys(
  baseMap: Record<string, string>,
  targetMap: Record<string, string>
): DiffKeysResult {
  const baseKeys = new Set(Object.keys(baseMap));
  const targetKeys = new Set(Object.keys(targetMap));

  const added = [...targetKeys].filter((k) => !baseKeys.has(k));
  const removed = [...baseKeys].filter((k) => !targetKeys.has(k));
  const common = [...baseKeys].filter((k) => targetKeys.has(k));

  return { added, removed, common };
}

export function diffEnvKeyFiles(
  basePath: string,
  targetPath: string
): DiffKeysResult {
  const baseMap = parseEnvFile(fs.readFileSync(basePath, 'utf8'));
  const targetMap = parseEnvFile(fs.readFileSync(targetPath, 'utf8'));
  return diffEnvKeys(baseMap, targetMap);
}

export function formatDiffKeysResult(result: DiffKeysResult): string {
  const lines: string[] = [];
  if (result.added.length > 0) {
    lines.push(`Added keys (${result.added.length}):`);
    result.added.forEach((k) => lines.push(`  + ${k}`));
  }
  if (result.removed.length > 0) {
    lines.push(`Removed keys (${result.removed.length}):`);
    result.removed.forEach((k) => lines.push(`  - ${k}`));
  }
  if (result.added.length === 0 && result.removed.length === 0) {
    lines.push('No key differences found.');
  }
  lines.push(`Common keys: ${result.common.length}`);
  return lines.join('\n');
}
