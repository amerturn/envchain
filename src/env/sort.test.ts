import { sortEnvKeys, sortEnvFile, formatSortResult } from './sort';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `sort-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('sortEnvKeys', () => {
  it('sorts keys ascending by default', () => {
    const env = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const result = sortEnvKeys(env);
    expect(Object.keys(result)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('sorts keys descending', () => {
    const env = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const result = sortEnvKeys(env, 'desc');
    expect(Object.keys(result)).toEqual(['ZEBRA', 'MANGO', 'APPLE']);
  });

  it('preserves values', () => {
    const env = { B: 'two', A: 'one' };
    const result = sortEnvKeys(env);
    expect(result).toEqual({ A: 'one', B: 'two' });
  });
});

describe('sortEnvFile', () => {
  it('rewrites file when unsorted', () => {
    const p = tmpFile('ZEBRA=1\nAPPLE=2\n');
    const result = sortEnvFile(p);
    expect(result.changed).toBe(true);
    const written = fs.readFileSync(p, 'utf8');
    expect(written.indexOf('APPLE')).toBeLessThan(written.indexOf('ZEBRA'));
    fs.unlinkSync(p);
  });

  it('does not rewrite file when already sorted', () => {
    const p = tmpFile('APPLE=2\nZEBRA=1\n');
    const before = fs.statSync(p).mtimeMs;
    const result = sortEnvFile(p);
    expect(result.changed).toBe(false);
    fs.unlinkSync(p);
  });
});

describe('formatSortResult', () => {
  it('returns already sorted message when unchanged', () => {
    const env = { A: '1' };
    const msg = formatSortResult({ original: env, sorted: env, changed: false }, 'asc');
    expect(msg).toContain('Already sorted');
  });

  it('lists sorted keys when changed', () => {
    const original = { B: '2', A: '1' };
    const sorted = { A: '1', B: '2' };
    const msg = formatSortResult({ original, sorted, changed: true }, 'asc');
    expect(msg).toContain('A');
    expect(msg).toContain('B');
  });
});
