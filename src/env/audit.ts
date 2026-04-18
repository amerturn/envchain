import { readSnapshot, snapshotPath } from './snapshot';
import { diffEnv, formatDiff } from './diff';
import * as fs from 'fs';
import * as path from 'path';

export interface AuditEntry {
  timestamp: string;
  target: string;
  snapshotFile: string;
  added: string[];
  removed: string[];
  changed: string[];
}

export function listSnapshots(snapshotDir: string): string[] {
  if (!fs.existsSync(snapshotDir)) return [];
  return fs
    .readdirSync(snapshotDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

export function auditTarget(
  target: string,
  snapshotDir: string,
  currentEnv: Record<string, string>
): AuditEntry | null {
  const snapFile = snapshotPath(snapshotDir, target);
  if (!fs.existsSync(snapFile)) return null;

  const snapshot = readSnapshot(snapFile);
  const diff = diffEnv(snapshot.env, currentEnv);

  return {
    timestamp: new Date().toISOString(),
    target,
    snapshotFile: snapFile,
    added: diff.filter((d) => d.type === 'added').map((d) => d.key),
    removed: diff.filter((d) => d.type === 'removed').map((d) => d.key),
    changed: diff.filter((d) => d.type === 'changed').map((d) => d.key),
  };
}

export function formatAuditEntry(entry: AuditEntry): string {
  const lines: string[] = [
    `Audit for target: ${entry.target}`,
    `Timestamp: ${entry.timestamp}`,
    `Snapshot: ${entry.snapshotFile}`,
    `Added (${entry.added.length}): ${entry.added.join(', ') || 'none'}`,
    `Removed (${entry.removed.length}): ${entry.removed.join(', ') || 'none'}`,
    `Changed (${entry.changed.length}): ${entry.changed.join(', ') || 'none'}`,
  ];
  return lines.join('\n');
}
