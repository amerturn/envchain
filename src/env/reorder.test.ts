import fs from 'fs';
import os from 'os';
import path from 'path';
import { reorderEnvKeys, reorderEnvFile, formatReorderResult } from './reorder';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `reorder-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('reorderEnvKeys', () => {
  it('reorders keys according to provided order', () => {
    const env = { C: '3', A: '1', B: '2' };
    const result = reorderEnvKeys(env, ['A', 'B', 'C']);
    expect(Object.keys(result)).toEqual(['A', 'B', 'C']);
  });

  it('appends unknown keys at the end', () => {
    const env = { D: '4', A: '1', B: '2' };
    const result = reorderEnvKeys(env, ['A', 'B']);
    expect(Object.keys(result)).toEqual(['A', 'B', 'D']);
  });

  it('ignores order keys not present in env', () => {
    const env = { A: '1', B: '2' };
    const result = reorderEnvKeys(env, ['Z', 'A', 'B']);
    expect(Object.keys(result)).toEqual(['A', 'B']);
  });

  it('preserves values', () => {
    const env = { B: 'bee', A: 'ay' };
    const result = reorderEnvKeys(env, ['A', 'B']);
    expect(result).toEqual({ A: 'ay', B: 'bee' });
  });
});

describe('reorderEnvFile', () => {
  it('rewrites file with new order and reports changed=true', () => {
    const f = tmpFile('C=3\nA=1\nB=2\n');
    const result = reorderEnvFile(f, ['A', 'B', 'C']);
    expect(result.changed).toBe(true);
    expect(result.reordered).toEqual(['A', 'B', 'C']);
    const written = fs.readFileSync(f, 'utf8');
    expect(written).toMatch(/A=1/);
  });

  it('reports changed=false when order is already correct', () => {
    const f = tmpFile('A=1\nB=2\nC=3\n');
    const result = reorderEnvFile(f, ['A', 'B', 'C']);
    expect(result.changed).toBe(false);
  });
});

describe('formatReorderResult', () => {
  it('returns no-change message when unchanged', () => {
    const msg = formatReorderResult({ original: ['A'], reordered: ['A'], changed: false });
    expect(msg).toContain('No changes');
  });

  it('lists reordered keys with markers', () => {
    const msg = formatReorderResult({
      original: ['B', 'A'],
      reordered: ['A', 'B'],
      changed: true,
    });
    expect(msg).toContain('A');
    expect(msg).toContain('*');
    expect(msg).toContain('2 key(s) reordered.');
  });
});
