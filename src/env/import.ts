import { parseEnvFile, serializeEnvFile } from './parser';
import { mergeEnvMaps } from './merge';
import fs from 'fs';
import path from 'path';

export interface ImportResult {
  added: string[];
  skipped: string[];
  merged: Record<string, string>;
}

export type ImportStrategy = 'overwrite' | 'skip' | 'prompt';

export function importEnv(
  base: Record<string, string>,
  incoming: Record<string, string>,
  strategy: ImportStrategy = 'skip'
): ImportResult {
  const added: string[] = [];
  const skipped: string[] = [];
  const merged = { ...base };

  for (const [key, value] of Object.entries(incoming)) {
    if (key in base && strategy === 'skip') {
      skipped.push(key);
    } else {
      added.push(key);
      merged[key] = value;
    }
  }

  return { added, skipped, merged };
}

export function importEnvFile(
  targetPath: string,
  sourcePath: string,
  strategy: ImportStrategy = 'skip'
): ImportResult {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }
  const base = fs.existsSync(targetPath)
    ? parseEnvFile(fs.readFileSync(targetPath, 'utf8'))
    : {};
  const incoming = parseEnvFile(fs.readFileSync(sourcePath, 'utf8'));
  const result = importEnv(base, incoming, strategy);
  fs.writeFileSync(targetPath, serializeEnvFile(result.merged), 'utf8');
  return result;
}

export function formatImportResult(result: ImportResult): string {
  const lines: string[] = [];
  if (result.added.length)
    lines.push(`Added/overwritten (${result.added.length}): ${result.added.join(', ')}`);
  if (result.skipped.length)
    lines.push(`Skipped (${result.skipped.length}): ${result.skipped.join(', ')}`);
  if (!result.added.length && !result.skipped.length)
    lines.push('No changes made.');
  return lines.join('\n');
}
