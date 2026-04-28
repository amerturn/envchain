import { parseEnvFile, serializeEnvFile } from './parser';
import fs from 'fs';

export interface TruncateOptions {
  maxLength: number;
  suffix?: string;
  keys?: string[];
}

export interface TruncateResult {
  original: Record<string, string>;
  truncated: Record<string, string>;
  affected: string[];
}

export function truncateEnvValues(
  env: Record<string, string>,
  options: TruncateOptions
): TruncateResult {
  const { maxLength, suffix = '...', keys } = options;
  const truncated: Record<string, string> = {};
  const affected: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    const shouldProcess = !keys || keys.includes(key);
    if (shouldProcess && value.length > maxLength) {
      const cutAt = Math.max(0, maxLength - suffix.length);
      truncated[key] = value.slice(0, cutAt) + suffix;
      affected.push(key);
    } else {
      truncated[key] = value;
    }
  }

  return { original: env, truncated, affected };
}

export function truncateEnvFile(
  filePath: string,
  options: TruncateOptions
): TruncateResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(content);
  const result = truncateEnvValues(env, options);
  fs.writeFileSync(filePath, serializeEnvFile(result.truncated), 'utf8');
  return result;
}

export function formatTruncateResult(result: TruncateResult): string {
  if (result.affected.length === 0) {
    return 'No values were truncated.';
  }
  const lines = result.affected.map((key) => {
    const before = result.original[key];
    const after = result.truncated[key];
    return `  ${key}: "${before}" → "${after}"`;
  });
  return `Truncated ${result.affected.length} value(s):\n${lines.join('\n')}`;
}
