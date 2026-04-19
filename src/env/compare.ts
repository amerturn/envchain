import { parseEnvFile } from './parser';
import { readFileSync } from 'fs';

export interface CompareResult {
  onlyInA: Record<string, string>;
  onlyInB: Record<string, string>;
  changed: Record<string, { a: string; b: string }>;
  unchanged: Record<string, string>;
}

export function compareEnvMaps(
  a: Record<string, string>,
  b: Record<string, string>
): CompareResult {
  const result: CompareResult = { onlyInA: {}, onlyInB: {}, changed: {}, unchanged: {} };
  for (const [k, v] of Object.entries(a)) {
    if (!(k in b)) result.onlyInA[k] = v;
    else if (b[k] !== v) result.changed[k] = { a: v, b: b[k] };
    else result.unchanged[k] = v;
  }
  for (const [k, v] of Object.entries(b)) {
    if (!(k in a)) result.onlyInB[k] = v;
  }
  return result;
}

export function compareEnvFiles(pathA: string, pathB: string): CompareResult {
  const a = parseEnvFile(readFileSync(pathA, 'utf8'));
  const b = parseEnvFile(readFileSync(pathB, 'utf8'));
  return compareEnvMaps(a, b);
}

export function formatCompareResult(result: CompareResult): string {
  const lines: string[] = [];
  for (const k of Object.keys(result.onlyInA)) lines.push(`< ${k}=${result.onlyInA[k]}`);
  for (const k of Object.keys(result.onlyInB)) lines.push(`> ${k}=${result.onlyInB[k]}`);
  for (const [k, { a, b }] of Object.entries(result.changed)) {
    lines.push(`~ ${k}: ${a} → ${b}`);
  }
  if (lines.length === 0) return '(no differences)';
  return lines.join('\n');
}
