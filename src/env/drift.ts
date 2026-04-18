import { resolveEnv } from './resolver';
import { diffEnv, formatDiff } from './diff';
import { readSnapshot } from './snapshot';
import type { EnvMap } from '../config/schema';

export interface DriftReport {
  target: string;
  snapshotId: string;
  drifted: boolean;
  diff: ReturnType<typeof diffEnv>;
}

export async function detectDrift(
  target: string,
  currentEnv: EnvMap,
  snapshotDir: string,
  snapshotId: string
): Promise<DriftReport> {
  const snapshot = await readSnapshot(snapshotDir, target, snapshotId);
  const diff = diffEnv(snapshot.env, currentEnv);
  const drifted = diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;
  return { target, snapshotId, drifted, diff };
}

export function formatDriftReport(report: DriftReport): string {
  const lines: string[] = [];
  lines.push(`Drift report for target: ${report.target}`);
  lines.push(`Snapshot: ${report.snapshotId}`);
  lines.push(`Status: ${report.drifted ? 'DRIFTED' : 'IN SYNC'}`);
  if (report.drifted) {
    lines.push('');
    lines.push(formatDiff(report.diff));
  }
  return lines.join('\n');
}
