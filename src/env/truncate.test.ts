import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  truncateEnvValues,
  truncateEnvFile,
  formatTruncateResult,
} from './truncate';

function tmpFile(content: string): string {
  const path = join(tmpdir(), `truncate-test-${Date.now()}.env`);
  writeFileSync(path, content, 'utf8');
  return path;
}

const files: string[] = [];

afterEach(() => {
  for (const f of files.splice(0)) {
    try { unlinkSync(f); } catch {}
  }
});

describe('truncateEnvValues', () => {
  it('truncates values exceeding maxLength', () => {
    const env = { SHORT: 'hi', LONG: 'a'.repeat(200) };
    const result = truncateEnvValues(env, 100);
    expect(result.truncated.SHORT).toBe('hi');
    expect(result.truncated.LONG).toHaveLength(100);
    expect(result.changes).toEqual(['LONG']);
  });

  it('does not truncate values within limit', () => {
    const env = { A: 'hello', B: 'world' };
    const result = truncateEnvValues(env, 50);
    expect(result.changes).toHaveLength(0);
    expect(result.truncated).toEqual(env);
  });

  it('uses default maxLength of 255', () => {
    const env = { KEY: 'x'.repeat(300) };
    const result = truncateEnvValues(env);
    expect(result.truncated.KEY).toHaveLength(255);
    expect(result.changes).toEqual(['KEY']);
  });

  it('handles empty env map', () => {
    const result = truncateEnvValues({});
    expect(result.changes).toHaveLength(0);
    expect(result.truncated).toEqual({});
  });
});

describe('truncateEnvFile', () => {
  it('reads, truncates, and writes back', () => {
    const path = tmpFile(`A=short\nB=${'z'.repeat(300)}\n`);
    files.push(path);
    const result = truncateEnvFile(path, 100);
    expect(result.changes).toContain('B');
    expect(result.changes).not.toContain('A');
  });
});

describe('formatTruncateResult', () => {
  it('reports changed keys', () => {
    const out = formatTruncateResult({ truncated: {}, changes: ['FOO', 'BAR'] });
    expect(out).toContain('FOO');
    expect(out).toContain('BAR');
    expect(out).toContain('2');
  });

  it('reports no changes', () => {
    const out = formatTruncateResult({ truncated: {}, changes: [] });
    expect(out).toContain('No values truncated');
  });
});
