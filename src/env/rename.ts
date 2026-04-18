import { parseEnvFile, serializeEnvFile } from './parser';

export interface RenameEntry {
  from: string;
  to: string;
}

export interface RenameResult {
  renamed: RenameEntry[];
  missing: string[];
  conflicts: string[];
  output: Record<string, string>;
}

export function renameEnvKeys(
  env: Record<string, string>,
  renames: RenameEntry[]
): RenameResult {
  const output = { ...env };
  const renamed: RenameEntry[] = [];
  const missing: string[] = [];
  const conflicts: string[] = [];

  for (const { from, to } of renames) {
    if (!(from in output)) {
      missing.push(from);
      continue;
    }
    if (to in output && to !== from) {
      conflicts.push(to);
      continue;
    }
    output[to] = output[from];
    delete output[from];
    renamed.push({ from, to });
  }

  return { renamed, missing, conflicts, output };
}

export function formatRenameResult(result: RenameResult): string {
  const lines: string[] = [];
  if (result.renamed.length) {
    lines.push('Renamed:');
    for (const { from, to } of result.renamed) {
      lines.push(`  ${from} -> ${to}`);
    }
  }
  if (result.missing.length) {
    lines.push('Missing keys:');
    for (const k of result.missing) lines.push(`  ${k}`);
  }
  if (result.conflicts.length) {
    lines.push('Conflicts (target key already exists):');
    for (const k of result.conflicts) lines.push(`  ${k}`);
  }
  return lines.join('\n');
}
