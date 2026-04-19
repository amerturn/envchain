import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export type ScopeMode = 'prefix' | 'suffix';

export interface ScopeOptions {
  mode: ScopeMode;
  separator?: string;
}

export interface ScopeResult {
  original: Record<string, string>;
  scoped: Record<string, string>;
  count: number;
}

export function scopeEnvKeys(
  env: Record<string, string>,
  scope: string,
  options: ScopeOptions
): Record<string, string> {
  const sep = options.separator ?? '_';
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    const newKey =
      options.mode === 'prefix'
        ? `${scope}${sep}${key}`
        : `${key}${sep}${scope}`;
    result[newKey] = value;
  }
  return result;
}

export function scopeEnvFile(
  filePath: string,
  scope: string,
  options: ScopeOptions
): ScopeResult {
  const raw = fs.readFileSync(filePath, 'utf8');
  const original = parseEnvFile(raw);
  const scoped = scopeEnvKeys(original, scope, options);
  return { original, scoped, count: Object.keys(scoped).length };
}

export function formatScopeResult(result: ScopeResult): string {
  const lines: string[] = [`Scoped ${result.count} key(s):`, ''];
  for (const [orig, scoped] of zip(Object.keys(result.original), Object.keys(result.scoped))) {
    lines.push(`  ${orig} → ${scoped}`);
  }
  return lines.join('\n');
}

function zip<A, B>(a: A[], b: B[]): [A, B][] {
  return a.map((v, i) => [v, b[i]]);
}
