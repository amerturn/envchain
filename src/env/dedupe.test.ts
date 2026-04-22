import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { dedupeEnv, dedupeEnvFile, formatDedupeResult } from './dedupe';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `dedupe-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('dedupeEnv', () => {
  it('returns no duplicates when all keys are unique', () => {
    const result = dedupeEnv([['A', '1'], ['B', '2'], ['C', '3']]);
    expect(result.duplicates).toHaveLength(0);
    expect(result.deduped).toEqual({ A: '1', B: '2', C: '3' });
  });

  it('keeps last value for duplicate keys', () => {
    const result = dedupeEnv([['A', 'first'], ['B', '2'], ['A', 'last']]);
    expect(result.deduped['A']).toBe('last');
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].key).toBe('A');
    expect(result.duplicates[0].droppedValues).toEqual(['first']);
  });

  it('handles multiple duplicates of the same key', () => {
    const result = dedupeEnv([['X', 'a'], ['X', 'b'], ['X', 'c']]);
    expect(result.deduped['X']).toBe('c');
    expect(result.duplicates[0].droppedValues).toEqual(['a', 'b']);
  });
});

describe('dedupeEnvFile', () => {
  it('deduplicates keys in a file', () => {
    const f = tmpFile('FOO=one\nBAR=hello\nFOO=two\n');
    const result = dedupeEnvFile(f);
    expect(result.deduped['FOO']).toBe('two');
    expect(result.duplicates).toHaveLength(1);
    fs.unlinkSync(f);
  });

  it('handles files with no duplicates', () => {
    const f = tmpFile('A=1\nB=2\n');
    const result = dedupeEnvFile(f);
    expect(result.duplicates).toHaveLength(0);
    fs.unlinkSync(f);
  });
});

describe('formatDedupeResult', () => {
  it('returns clean message when no duplicates', () => {
    const result = dedupeEnv([['A', '1']]);
    expect(formatDedupeResult(result)).toBe('No duplicate keys found.');
  });

  it('lists duplicate keys with kept and dropped values', () => {
    const result = dedupeEnv([['KEY', 'old'], ['KEY', 'new']]);
    const output = formatDedupeResult(result);
    expect(output).toContain('1 duplicate key(s)');
    expect(output).toContain('KEY');
    expect(output).toContain('"new"');
    expect(output).toContain('"old"');
  });
});
