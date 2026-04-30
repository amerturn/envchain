import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { swapEnvKeys, swapEnvFile, formatSwapResult } from './swap';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `swap-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('swapEnvKeys', () => {
  it('swaps values of two existing keys', () => {
    const env = { A: 'alpha', B: 'beta', C: 'gamma' };
    const result = swapEnvKeys(env, [['A', 'B']]);
    expect(result.output.A).toBe('beta');
    expect(result.output.B).toBe('alpha');
    expect(result.output.C).toBe('gamma');
    expect(result.swapped).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
  });

  it('skips identical key pairs', () => {
    const env = { A: 'alpha' };
    const result = swapEnvKeys(env, [['A', 'A']]);
    expect(result.skipped[0].reason).toBe('keys are identical');
    expect(result.output.A).toBe('alpha');
  });

  it('skips when neither key exists', () => {
    const env = { C: 'gamma' };
    const result = swapEnvKeys(env, [['A', 'B']]);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toBe('neither key exists');
  });

  it('handles swap when only one key exists', () => {
    const env = { A: 'alpha' };
    const result = swapEnvKeys(env, [['A', 'B']]);
    expect(result.output.B).toBe('alpha');
    expect(result.output.A).toBeUndefined();
    expect(result.swapped).toHaveLength(1);
  });

  it('handles multiple pairs', () => {
    const env = { X: '1', Y: '2', P: 'a', Q: 'b' };
    const result = swapEnvKeys(env, [['X', 'Y'], ['P', 'Q']]);
    expect(result.output.X).toBe('2');
    expect(result.output.Y).toBe('1');
    expect(result.output.P).toBe('b');
    expect(result.output.Q).toBe('a');
  });
});

describe('swapEnvFile', () => {
  let file: string;
  afterEach(() => { try { fs.unlinkSync(file); } catch {} });

  it('writes swapped env back to file', () => {
    file = tmpFile('A=hello\nB=world\n');
    const result = swapEnvFile(file, [['A', 'B']]);
    const written = fs.readFileSync(file, 'utf8');
    expect(written).toContain('A=world');
    expect(written).toContain('B=hello');
    expect(result.swapped).toHaveLength(1);
  });
});

describe('formatSwapResult', () => {
  it('formats swapped pairs', () => {
    const result = { swapped: [{ from: 'A', to: 'B' }], skipped: [], output: {} };
    expect(formatSwapResult(result)).toContain('A <-> B');
  });

  it('shows nothing message when empty', () => {
    expect(formatSwapResult({ swapped: [], skipped: [], output: {} })).toBe('Nothing to swap.');
  });
});
