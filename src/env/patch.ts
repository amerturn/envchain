import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface PatchOperation {
  op: 'set' | 'unset' | 'rename';
  key: string;
  value?: string;
  newKey?: string;
}

export interface PatchResult {
  applied: PatchOperation[];
  skipped: PatchOperation[];
  env: Record<string, string>;
}

export function patchEnv(
  env: Record<string, string>,
  ops: PatchOperation[]
): PatchResult {
  const result: Record<string, string> = { ...env };
  const applied: PatchOperation[] = [];
  const skipped: PatchOperation[] = [];

  for (const op of ops) {
    if (op.op === 'set') {
      if (op.value === undefined) { skipped.push(op); continue; }
      result[op.key] = op.value;
      applied.push(op);
    } else if (op.op === 'unset') {
      if (!(op.key in result)) { skipped.push(op); continue; }
      delete result[op.key];
      applied.push(op);
    } else if (op.op === 'rename') {
      if (!op.newKey || !(op.key in result)) { skipped.push(op); continue; }
      result[op.newKey] = result[op.key];
      delete result[op.key];
      applied.push(op);
    } else {
      skipped.push(op);
    }
  }

  return { applied, skipped, env: result };
}

export function patchEnvFile(filePath: string, ops: PatchOperation[]): PatchResult {
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const env = parseEnvFile(raw);
  const result = patchEnv(env, ops);
  fs.writeFileSync(filePath, serializeEnvFile(result.env), 'utf8');
  return result;
}

export function formatPatchResult(result: PatchResult): string {
  const lines: string[] = [];
  if (result.applied.length > 0) {
    lines.push('Applied:');
    for (const op of result.applied) {
      if (op.op === 'set') lines.push(`  set ${op.key}=${op.value}`);
      else if (op.op === 'unset') lines.push(`  unset ${op.key}`);
      else if (op.op === 'rename') lines.push(`  rename ${op.key} -> ${op.newKey}`);
    }
  }
  if (result.skipped.length > 0) {
    lines.push('Skipped:');
    for (const op of result.skipped) {
      lines.push(`  ${op.op} ${op.key} (no-op or invalid)`);
    }
  }
  return lines.join('\n');
}
