import { interpolateEnvVars } from './resolver';

export type MergeStrategy = 'override' | 'preserve' | 'error';

export interface MergeOptions {
  strategy?: MergeStrategy;
  interpolate?: boolean;
}

export interface MergeResult {
  env: Record<string, string>;
  conflicts: string[];
  merged: string[];
}

export function mergeEnvMaps(
  base: Record<string, string>,
  override: Record<string, string>,
  options: MergeOptions = {}
): MergeResult {
  const { strategy = 'override', interpolate = true } = options;
  const conflicts: string[] = [];
  const merged: string[] = [];
  const env = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (key in base && base[key] !== value) {
      conflicts.push(key);
      if (strategy === 'error') {
        throw new Error(`Merge conflict on key: ${key}`);
      } else if (strategy === 'preserve') {
        continue;
      }
    }
    if (!(key in base) || strategy === 'override') {
      env[key] = value;
      merged.push(key);
    }
  }

  return {
    env: interpolate ? interpolateEnvVars(env) : env,
    conflicts,
    merged,
  };
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [];
  if (result.merged.length) {
    lines.push(`Merged keys (${result.merged.length}): ${result.merged.join(', ')}`);
  }
  if (result.conflicts.length) {
    lines.push(`Conflicts resolved (${result.conflicts.length}): ${result.conflicts.join(', ')}`);
  }
  return lines.join('\n');
}
