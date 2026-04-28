import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { truncateEnvValues, truncateEnvFile, formatTruncateResult } from './truncate';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `truncate-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('truncateEnvValues', () => {
  it('truncates values exceeding maxLength', () => {
    const env = { KEY: 'abcdefghij', SHORT: 'hi' };
    const result = truncateEnvValues(env, { maxLength: 5 });
    expect(result.truncated.KEY).toBe('ab...');
    expect(result.truncated.SHORT).toBe('hi');
    expect(result.affected).toEqual(['KEY']);
  });

  it('uses custom suffix', () => {
    const env = { KEY: 'abcdefghij' };
    const result = truncateEnvValues(env, { maxLength: 6, suffix: '--' });
    expect(result.truncated.KEY).toBe('abcd--');
  });

  it('only truncates specified keys', () => {
    const env = { A: 'longvalue123', B: 'longvalue456' };
    const result = truncateEnvValues(env, { maxLength: 5, keys: ['A'] });
    expect(result.truncated.A).toBe('lo...');
    expect(result.truncated.B).toBe('longvalue456');
    expect(result.affected).toEqual(['A']);
  });

  it('returns empty affected when nothing truncated', () => {
    const env = { KEY: 'short' };
    const result = truncateEnvValues(env, { maxLength: 20 });
    expect(result.affected).toHaveLength(0);
    expect(result.truncated).toEqual(env);
  });
});

describe('truncateEnvFile', () => {
  let file: string;

  afterEach(() => { if (fs.existsSync(file)) fs.unlinkSync(file); });

  it('truncates values in a file and writes result', () => {
    file = tmpFile('TOKEN=averylongtokenthatexceedslimit\nNAME=bob\n');
    const result = truncateEnvFile(file, { maxLength: 10 });
    expect(result.affected).toContain('TOKEN');
    const written = fs.readFileSync(file, 'utf8');
    expect(written).toContain('TOKEN=');
    expect(written).not.toContain('averylongtokenthatexceedslimit');
  });
});

describe('formatTruncateResult', () => {
  it('reports no changes when nothing truncated', () => {
    const result = { original: { A: 'hi' }, truncated: { A: 'hi' }, affected: [] };
    expect(formatTruncateResult(result)).toBe('No values were truncated.');
  });

  it('lists affected keys', () => {
    const result = {
      original: { A: 'toolongvalue' },
      truncated: { A: 'to...' },
      affected: ['A'],
    };
    const out = formatTruncateResult(result);
    expect(out).toContain('Truncated 1 value(s)');
    expect(out).toContain('A:');
    expect(out).toContain('toolongvalue');
    expect(out).toContain('to...');
  });
});
