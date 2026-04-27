import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { auditTarget, formatAuditEntry, listSnapshots } from './audit';
import { writeSnapshot, snapshotPath } from './snapshot';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-audit-'));
}

describe('listSnapshots', () => {
  it('returns empty array for missing dir', () => {
    expect(listSnapshots('/nonexistent/path')).toEqual([]);
  });

  it('lists json files sorted', () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, 'b.json'), '{}');
    fs.writeFileSync(path.join(dir, 'a.json'), '{}');
    fs.writeFileSync(path.join(dir, 'c.txt'), '');
    const result = listSnapshots(dir);
    expect(result).toEqual(['a.json', 'b.json']);
  });

  it('returns empty array for dir with no json files', () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, 'notes.txt'), '');
    fs.writeFileSync(path.join(dir, 'data.csv'), '');
    expect(listSnapshots(dir)).toEqual([]);
  });
});

describe('auditTarget', () => {
  it('returns null when no snapshot exists', () => {
    const dir = tmpDir();
    const result = auditTarget('prod', dir, { FOO: 'bar' });
    expect(result).toBeNull();
  });

  it('detects added, removed, and changed keys', () => {
    const dir = tmpDir();
    const snapEnv = { FOO: 'old', BAR: 'keep', OLD: 'gone' };
    writeSnapshot(snapshotPath(dir, 'prod'), { target: 'prod', env: snapEnv, createdAt: new Date().toISOString() });

    const currentEnv = { FOO: 'new', BAR: 'keep', NEW: 'here' };
    const entry = auditTarget('prod', dir, currentEnv);

    expect(entry).not.toBeNull();
    expect(entry!.changed).toContain('FOO');
    expect(entry!.removed).toContain('OLD');
    expect(entry!.added).toContain('NEW');
    expect(entry!.added).not.toContain('BAR');
  });

  it('returns entry with empty arrays when env is unchanged', () => {
    const dir = tmpDir();
    const snapEnv = { FOO: 'bar', BAZ: 'qux' };
    writeSnapshot(snapshotPath(dir, 'prod'), { target: 'prod', env: snapEnv, createdAt: new Date().toISOString() });

    const entry = auditTarget('prod', dir, { FOO: 'bar', BAZ: 'qux' });

    expect(entry).not.toBeNull();
    expect(entry!.added).toEqual([]);
    expect(entry!.removed).toEqual([]);
    expect(entry!.changed).toEqual([]);
  });
});

describe('formatAuditEntry', () => {
  it('formats entry as readable string', () => {
    const entry = {
      timestamp: '2024-01-01T00:00:00.000Z',
      target: 'staging',
      snapshotFile: '/tmp/staging.json',
      added: ['NEW_KEY'],
      removed: [],
      changed: ['EXISTING'],
    };
    const output = formatAuditEntry(entry);
    expect(output).toContain('staging');
    expect(output).toContain('NEW_KEY');
    expect(output).toContain('EXISTING');
    expect(output).toContain('none');
  });
});
