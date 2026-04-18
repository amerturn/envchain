import { readSnapshot, snapshotPath } from './snapshot';
import { diffEnv } from './diff';
import { flattenTargetEnv } from '../targets/target';
import { requireTarget } from '../targets/loader';
import * as fs from 'fs';
import * as path from 'path';

export interface PromoteResult {
  from: string;
  to: string;
  applied: Record<string, string>;
  skipped: string[];
}

export async function promoteEnv(
  fromTarget: string,
  toTarget: string,
  snapshotsDir: string,
  configDir: string,
  overwrite = false
): Promise<PromoteResult> {
  const fromSnap = snapshotPath(snapshotsDir, fromTarget);
  if (!fs.existsSync(fromSnap)) {
    throw new Error(`No snapshot found for target: ${fromTarget}`);
  }

  const snapshot = await readSnapshot(fromSnap);
  const toTargetDef = requireTarget(toTarget, configDir);
  const toEnv = flattenTargetEnv(toTargetDef);

  const diffs = diffEnv(toEnv, snapshot.env);
  const applied: Record<string, string> = {};
  const skipped: string[] = [];

  for (const d of diffs) {
    if (d.type === 'added' || (d.type === 'changed' && overwrite)) {
      applied[d.key] = d.next!;
    } else if (d.type === 'changed' && !overwrite) {
      skipped.push(d.key);
    }
  }

  return { from: fromTarget, to: toTarget, applied, skipped };
}

export function formatPromoteResult(result: PromoteResult): string {
  const lines: string[] = [
    `Promote: ${result.from} → ${result.to}`,
    `Applied (${Object.keys(result.applied).length}):`,
    ...Object.entries(result.applied).map(([k, v]) => `  + ${k}=${v}`),
  ];
  if (result.skipped.length > 0) {
    lines.push(`Skipped (${result.skipped.length}) — use --overwrite to apply:`);
    result.skipped.forEach(k => lines.push(`  ~ ${k}`));
  }
  return lines.join('\n');
}
