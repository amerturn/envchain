import { parseEnvFile, serializeEnvFile } from './parser';
import fs from 'fs';

export interface IntersectResult {
  keys: string[];
  env: Record<string, string>;
  totalA: number;
  totalB: number;
  common: number;
}

/**
 * Returns only the keys present in BOTH envA and envB.
 * The values from envA take precedence.
 */
export function intersectEnvMaps(
  envA: Record<string, string>,
  envB: Record<string, string>
): IntersectResult {
  const keysA = new Set(Object.keys(envA));
  const keysB = new Set(Object.keys(envB));
  const commonKeys = [...keysA].filter((k) => keysB.has(k));

  const env: Record<string, string> = {};
  for (const key of commonKeys) {
    env[key] = envA[key];
  }

  return {
    keys: commonKeys,
    env,
    totalA: keysA.size,
    totalB: keysB.size,
    common: commonKeys.length,
  };
}

export function intersectEnvFiles(fileA: string, fileB: string): IntersectResult {
  const envA = parseEnvFile(fs.readFileSync(fileA, 'utf8'));
  const envB = parseEnvFile(fs.readFileSync(fileB, 'utf8'));
  return intersectEnvMaps(envA, envB);
}

export function formatIntersectResult(result: IntersectResult): string {
  const lines: string[] = [
    `Intersection: ${result.common} key(s) in common (of ${result.totalA} / ${result.totalB})`,
  ];
  if (result.common === 0) {
    lines.push('  (no common keys)');
  } else {
    for (const key of result.keys) {
      lines.push(`  ${key}=${result.env[key]}`);
    }
  }
  return lines.join('\n');
}
