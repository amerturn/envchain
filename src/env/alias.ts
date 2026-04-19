import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface AliasMap { [from: string]: string }

export interface AliasResult {
  aliased: AliasMap;
  skipped: string[];
  output: Record<string, string>;
}

export function aliasEnvKeys(
  env: Record<string, string>,
  aliases: AliasMap,
  keepOriginal = false
): AliasResult {
  const output: Record<string, string> = { ...env };
  const aliased: AliasMap = {};
  const skipped: string[] = [];

  for (const [from, to] of Object.entries(aliases)) {
    if (!(from in env)) { skipped.push(from); continue; }
    output[to] = env[from];
    aliased[from] = to;
    if (!keepOriginal) delete output[from];
  }

  return { aliased, skipped, output };
}

export function aliasEnvFile(
  filePath: string,
  aliases: AliasMap,
  keepOriginal = false
): AliasResult {
  const env = parseEnvFile(fs.readFileSync(filePath, 'utf8'));
  return aliasEnvKeys(env, aliases, keepOriginal);
}

export function formatAliasResult(result: AliasResult): string {
  const lines: string[] = [];
  for (const [from, to] of Object.entries(result.aliased))
    lines.push(`  ${from} → ${to}`);
  if (result.skipped.length)
    lines.push(`  skipped (not found): ${result.skipped.join(', ')}`);
  return lines.length ? lines.join('\n') : '  no keys aliased';
}
