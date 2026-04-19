import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface GroupResult {
  groups: Record<string, Record<string, string>>;
  ungrouped: Record<string, string>;
}

export function groupEnvKeys(
  env: Record<string, string>,
  delimiter = '_'
): GroupResult {
  const groups: Record<string, Record<string, string>> = {};
  const ungrouped: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    const idx = key.indexOf(delimiter);
    if (idx > 0) {
      const prefix = key.slice(0, idx);
      const rest = key.slice(idx + 1);
      if (!groups[prefix]) groups[prefix] = {};
      groups[prefix][rest] = value;
    } else {
      ungrouped[key] = value;
    }
  }

  return { groups, ungrouped };
}

export function groupEnvFile(filePath: string, delimiter = '_'): GroupResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(content);
  return groupEnvKeys(env, delimiter);
}

export function formatGroupResult(result: GroupResult): string {
  const lines: string[] = [];

  for (const [prefix, keys] of Object.entries(result.groups)) {
    lines.push(`[${prefix}]`);
    for (const [k, v] of Object.entries(keys)) {
      lines.push(`  ${k}=${v}`);
    }
  }

  if (Object.keys(result.ungrouped).length > 0) {
    lines.push('[ungrouped]');
    for (const [k, v] of Object.entries(result.ungrouped)) {
      lines.push(`  ${k}=${v}`);
    }
  }

  const total = Object.values(result.groups).reduce((s, g) => s + Object.keys(g).length, 0);
  lines.push(`\n${Object.keys(result.groups).length} group(s), ${total} grouped key(s), ${Object.keys(result.ungrouped).length} ungrouped.`);
  return lines.join('\n');
}
