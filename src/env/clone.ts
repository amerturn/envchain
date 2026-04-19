import { EnvMap } from "../config/schema";

export interface CloneResult {
  source: string;
  target: string;
  added: string[];
  skipped: string[];
}

export function cloneEnv(
  sourceEnv: EnvMap,
  targetEnv: EnvMap,
  opts: { overwrite?: boolean; keys?: string[] } = {}
): { merged: EnvMap; result: CloneResult } {
  const keys = opts.keys ?? Object.keys(sourceEnv);
  const merged: EnvMap = { ...targetEnv };
  const added: string[] = [];
  const skipped: string[] = [];

  for (const key of keys) {
    if (!(key in sourceEnv)) continue;
    if (!opts.overwrite && key in targetEnv) {
      skipped.push(key);
    } else {
      merged[key] = sourceEnv[key];
      added.push(key);
    }
  }

  return { merged, result: { source: "", target: "", added, skipped } };
}

export function formatCloneResult(result: CloneResult): string {
  const lines: string[] = [
    `Clone: ${result.source} → ${result.target}`,
    `  Added   : ${result.added.length} key(s)`,
    `  Skipped : ${result.skipped.length} key(s)`,
  ];
  if (result.added.length) lines.push(`  Keys added: ${result.added.join(", ")}`);
  if (result.skipped.length) lines.push(`  Keys skipped: ${result.skipped.join(", ")}`);
  return lines.join("\n");
}
