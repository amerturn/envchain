import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface LowercaseResult {
  original: Record<string, string>;
  lowercased: Record<string, string>;
  changed: string[];
  unchanged: string[];
}

export function lowercaseEnvKeys(
  env: Record<string, string>
): LowercaseResult {
  const lowercased: Record<string, string> = {};
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    const newKey = key.toLowerCase();
    if (newKey !== key) {
      changed.push(key);
    } else {
      unchanged.push(key);
    }
    lowercased[newKey] = value;
  }

  return { original: env, lowercased, changed, unchanged };
}

export function lowercaseEnvFile(filePath: string): LowercaseResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = parseEnvFile(content);
  const result = lowercaseEnvKeys(env);
  fs.writeFileSync(filePath, serializeEnvFile(result.lowercased), 'utf-8');
  return result;
}

export function formatLowercaseResult(result: LowercaseResult): string {
  const lines: string[] = [];
  if (result.changed.length === 0) {
    lines.push('No keys needed lowercasing.');
    return lines.join('\n');
  }
  lines.push(`Lowercased ${result.changed.length} key(s):`);
  for (const key of result.changed) {
    lines.push(`  ${key} → ${key.toLowerCase()}`);
  }
  if (result.unchanged.length > 0) {
    lines.push(`${result.unchanged.length} key(s) already lowercase.`);
  }
  return lines.join('\n');
}
