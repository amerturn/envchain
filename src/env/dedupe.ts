import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface DedupeResult {
  original: Record<string, string>;
  deduped: Record<string, string>;
  duplicates: Array<{ key: string; keptValue: string; droppedValues: string[] }>;
}

/**
 * Deduplicate env keys, keeping the last occurrence (like shell semantics).
 */
export function dedupeEnv(
  entries: Array<[string, string]>
): DedupeResult {
  const seen = new Map<string, string[]>();

  for (const [key, value] of entries) {
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(value);
  }

  const deduped: Record<string, string> = {};
  const original: Record<string, string> = {};
  const duplicates: DedupeResult['duplicates'] = [];

  for (const [key, values] of seen.entries()) {
    const keptValue = values[values.length - 1];
    deduped[key] = keptValue;
    original[key] = values[0];

    if (values.length > 1) {
      duplicates.push({
        key,
        keptValue,
        droppedValues: values.slice(0, -1),
      });
    }
  }

  return { original, deduped, duplicates };
}

export function dedupeEnvFile(filePath: string): DedupeResult {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parseEnvFile(raw);
  // Re-parse preserving order with duplicates
  const entries: Array<[string, string]> = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    entries.push([key, value]);
  }
  return dedupeEnv(entries);
}

export function formatDedupeResult(result: DedupeResult): string {
  if (result.duplicates.length === 0) {
    return 'No duplicate keys found.';
  }
  const lines = [`Found ${result.duplicates.length} duplicate key(s):`];
  for (const { key, keptValue, droppedValues } of result.duplicates) {
    lines.push(`  ${key}: kept "${keptValue}", dropped [${droppedValues.map(v => `"${v}"`).join(', ')}]`);
  }
  return lines.join('\n');
}
