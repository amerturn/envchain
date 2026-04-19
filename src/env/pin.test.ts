import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  pinEnvKeys,
  writePinFile,
  readPinFile,
  pinFilePath,
  formatPinResult,
} from './pin';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pin-test-'));
}

describe('pinEnvKeys', () => {
  it('returns entries for matching keys', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = pinEnvKeys(env, ['FOO'], 'prod');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('FOO');
    expect(result[0].value).toBe('bar');
    expect(result[0].target).toBe('prod');
  });

  it('skips keys not in env', () => {
    const result = pinEnvKeys({ A: '1' }, ['B']);
    expect(result).toHaveLength(0);
  });
});

describe('writePinFile / readPinFile', () => {
  it('writes and reads pin entries', () => {
    const dir = tmpDir();
    const fp = pinFilePath(dir);
    const entries = pinEnvKeys({ KEY: 'val' }, ['KEY'], 'staging');
    writePinFile(fp, entries);
    const read = readPinFile(fp);
    expect(read).toHaveLength(1);
    expect(read[0].key).toBe('KEY');
  });

  it('merges without duplicates on re-pin', () => {
    const dir = tmpDir();
    const fp = pinFilePath(dir);
    writePinFile(fp, [{ key: 'X', value: '1', pinnedAt: '', target: 'prod' }]);
    writePinFile(fp, [{ key: 'X', value: '2', pinnedAt: '', target: 'prod' }]);
    const read = readPinFile(fp);
    expect(read).toHaveLength(1);
    expect(read[0].value).toBe('2');
  });

  it('returns empty array when file missing', () => {
    expect(readPinFile('/nonexistent/path.json')).toEqual([]);
  });
});

describe('formatPinResult', () => {
  it('formats entries', () => {
    const entries = [{ key: 'A', value: '1', pinnedAt: '', target: 'prod' }];
    expect(formatPinResult(entries)).toContain('pinned A=1 [prod]');
  });

  it('handles empty', () => {
    expect(formatPinResult([])).toBe('No keys pinned.');
  });
});
