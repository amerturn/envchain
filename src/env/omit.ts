import { parseEnvFile, serializeEnvFile } from './parser';
import fs from 'fs';

export interface OmitResult {
  original: Record<string, string>;
  result: Record<string, string>;
  omitted: string[];
  notFound: string[];
}

export function omitEnvKeys(
  env: Record<string, string>,
  keys: string[]
): OmitResult {
  const omitted: string[] = [];
  const notFound: string[] = [];
  const result: Record<string, string> = { ...env };

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      delete result[key];
      omitted.push(key);
    } else {
      notFound.push(key);
    }
  }

  return { original: env, result, omitted, notFound };
}

export function omitEnvFile(
  filePath: string,
  keys: string[],
  write = false
): OmitResult {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(raw);
  const omitResult = omitEnvKeys(env, keys);

  if (write) {
    fs.writeFileSync(filePath, serializeEnvFile(omitResult.result), 'utf8');
  }

  return omitResult;
}

export function formatOmitResult(result: OmitResult): string {
  const lines: string[] = [];

  if (result.omitted.length > 0) {
    lines.push(`Omitted (${result.omitted.length}):`);
    for (const key of result.omitted) {
      lines.push(`  - ${key}`);
    }
  }

  if (result.notFound.length > 0) {
    lines.push(`Not found (${result.notFound.length}):`);
    for (const key of result.notFound) {
      lines.push(`  ? ${key}`);
    }
  }

  if (result.omitted.length === 0 && result.notFound.length === 0) {
    lines.push('No keys specified.');
  }

  return lines.join('\n');
}
