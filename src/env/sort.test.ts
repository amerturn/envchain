import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { sortEnvKeys, sortEnvFile, formatSortResult } from './sort';

function tmpFile(content: string): string {
  const p = join(tmpdir(), `sort-test-${Date.now()}.env`);
  writeFileSync(p, content);
  return p;
}

describe('sortEnvKeys', () => {
  it('sorts keys alphabetically', () => {
    const input = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const result = sortEnvKeys(input);
    expect(Object.keys(result)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('preserves values after sort', () => {
    const input = { Z: 'last', A: 'first' };
    const result = sortEnvKeys(input);
    expect(result['A']).toBe('first');
    expect(result['Z']).toBe('last');
  });

  it('handles empty map', () => {
    expect(sortEnvKeys({})).toEqual({});
  });
});

describe('sortEnvFile', () => {
  it('writes sorted env to output file', () => {
    const src = tmpFile('ZEBRA=1\nAPPLE=2\nMANGO=3\n');
    const out = join(tmpdir(), `sort-out-${Date.now()}.env`);
    const result = sortEnvFile(src, out);
    const written = readFileSync(out, 'utf8');
    expect(written).toContain('APPLE=2');
    expect(written.indexOf('APPLE')).toBeLessThan(written.indexOf('MANGO'));
    expect(result.sorted).toBe(3);
  });

  it('returns zero sorted for empty file', () => {
    const src = tmpFile('');
    const out = join(tmpdir(), `sort-out-empty-${Date.now()}.env`);
    const result = sortEnvFile(src, out);
    expect(result.sorted).toBe(0);
  });
});

describe('formatSortResult', () => {
  it('formats result message', () => {
    const msg = formatSortResult({ sorted: 4, output: '/tmp/out.env' });
    expect(msg).toContain('4');
    expect(msg).toContain('/tmp/out.env');
  });
});
