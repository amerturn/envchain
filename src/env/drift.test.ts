import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { detectDrift, formatDriftReport } from './drift';
import { writeSnapshot } from './snapshot';

function tmpDir() {
  let dir = '';
  beforeEach(async () => { dir = await fs.mkdtemp(path.join(os.tmpdir(), 'drift-')); });
  afterEach(async () => { await fs.rm(dir, { recursive: true }); });
  return { get: () => dir };
}

describe('detectDrift', () => {
  const d = tmpDir();

  it('reports no drift when env matches snapshot', async () => {
    const env = { FOO: 'bar', BAZ: '1' };
    const id = await writeget(), 'prod', env);
    const report = await detectDrift('prod', env, d.get(), id);
    expect(report.drifted).toBe(false);
    expect(report.diffadded).toHaveLength(0);
    expect(report.diff.removed).toHaveLength(0);
    expect(report.diff.changed).toHaveLength(0);
  });

  it('detects added keys', async () => {
    const base = { FOO: 'bar' };
    const id = await writeSnapshot(d.get(), 'prod', base);
    const current = { FOO: 'bar', NEW_KEY: 'val' };
    const report = await detectDrift('prod', current, d.get(), id);
    expect(report.drifted).toBe(true);
    expect(report.diff.added).toContain('NEW_KEY');
  });

  it('detects changed values', async () => {
    const base = { FOO: 'old' };
    const id = await writeSnapshot(d.get(), 'staging', base);
    const current = { FOO: 'new' };
    const report = await detectDrift('staging', current, d.get(), id);
    expect(report.drifted).toBe(true);
    expect(report.diff.changed.map(c => c.key)).toContain('FOO');
  });
});

describe('formatDriftReport', () => {
  it('includes target and snapshot id', async () => {
    const report = { target: 'prod', snapshotId: 'abc123', drifted: false, diff: { added: [], removed: [], changed: [] } };
    const out = formatDriftReport(report);
    expect(out).toContain('prod');
    expect(out).toContain('abc123');
    expect(out).toContain('IN SYNC');
  });
});
