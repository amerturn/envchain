import { parseEnvFile, serializeEnvFile } from './parser';
import fs from 'fs';

export interface SwapResult {
  swapped: Array<{ from: string; to: string }>;
  skipped: Array<{ key: string; reason: string }>;
  output: Record<string, string>;
}

/**
 * Swap the keys of two env vars in a map.
 * Each pair is [keyA, keyB]; their values are exchanged.
 */
export function swapEnvKeys(
  env: Record<string, string>,
  pairs: Array<[string, string]>
): SwapResult {
  const output = { ...env };
  const swapped: SwapResult['swapped'] = [];
  const skipped: SwapResult['skipped'] = [];

  for (const [a, b] of pairs) {
    if (a === b) {
      skipped.push({ key: a, reason: 'keys are identical' });
      continue;
    }
    const hasA = Object.prototype.hasOwnProperty.call(output, a);
    const hasB = Object.prototype.hasOwnProperty.call(output, b);
    if (!hasA && !hasB) {
      skipped.push({ key: `${a}/${b}`, reason: 'neither key exists' });
      continue;
    }
    const valA = output[a];
    const valB = output[b];
    if (hasA) output[b] = valA;
    else delete output[b];
    if (hasB) output[a] = valB;
    else delete output[a];
    swapped.push({ from: a, to: b });
  }

  return { swapped, skipped, output };
}

export function swapEnvFile(
  filePath: string,
  pairs: Array<[string, string]>
): SwapResult {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(raw);
  const result = swapEnvKeys(env, pairs);
  fs.writeFileSync(filePath, serializeEnvFile(result.output), 'utf8');
  return result;
}

export function formatSwapResult(result: SwapResult): string {
  const lines: string[] = [];
  if (result.swapped.length > 0) {
    lines.push('Swapped:');
    for (const { from, to } of result.swapped) {
      lines.push(`  ${from} <-> ${to}`);
    }
  }
  if (result.skipped.length > 0) {
    lines.push('Skipped:');
    for (const { key, reason } of result.skipped) {
      lines.push(`  ${key}: ${reason}`);
    }
  }
  if (lines.length === 0) lines.push('Nothing to swap.');
  return lines.join('\n');
}
