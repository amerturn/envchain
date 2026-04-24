import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface UppercaseResult {
  original: Record<string, string>;
  transformed: Record<string, string>;
  renamedKeys: Array<{ from: string; to: string }>;
  unchanged: string[];
}

export function uppercaseEnvKeys(
  env: Record<string, string>
): UppercaseResult {
  const transformed: Record<string, string> = {};
  const renamedKeys: Array<{ from: string; to: string }> = [];
  const unchanged: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    const upper = key.toUpperCase();
    transformed[upper] = value;
    if (upper !== key) {
      renamedKeys.push({ from: key, to: upper });
    } else {
      unchanged.push(key);
    }
  }

  return { original: env, transformed, renamedKeys, unchanged };
}

export function uppercaseEnvFile(filePath: string): UppercaseResult {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const env = parseEnvFile(raw);
  const result = uppercaseEnvKeys(env);
  fs.writeFileSync(filePath, serializeEnvFile(result.transformed), 'utf-8');
  return result;
}

export function formatUppercaseResult(result: UppercaseResult): string {
  const lines: string[] = [];

  if (result.renamedKeys.length === 0) {
    lines.push('All keys are already uppercase.');
    return lines.join('\n');
  }

  lines.push(`Uppercased ${result.renamedKeys.length} key(s):`);
  for (const { from, to } of result.renamedKeys) {
    lines.push(`  ${from} → ${to}`);
  }

  if (result.unchanged.length > 0) {
    lines.push(`Unchanged: ${result.unchanged.join(', ')}`);
  }

  return lines.join('\n');
}
