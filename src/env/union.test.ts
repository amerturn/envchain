import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { unionEnvMaps, unionEnvFiles, formatUnionResult } from './union';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `union-test-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(p, content);
  return p;
}

const files: string[] = [];
function track(p: string) { files.push(p); return p; }
beforeEach(() => files.length = 0);
afterEach(() => files.forEach(f => fs.existsSync(f) && fs.unlinkSync(f)));

describe('unionEnvMaps', () => {
  it('adds keys from extra that are missing in base', () => {
    const result = unionEnvMaps({ A: '1' }, { B: '2' });
    expect(result.merged).toEqual({ A: '1', B: '2' });
    expect(result.added).toContain('B');
  });

  it('keeps base value when key conflicts and preferExtra is false', () => {
    const result = unionEnvMaps({ A: 'base' }, { A: 'extra' });
    expect(result.merged.A).toBe('base');
    expect(result.kept).toContain('A');
    expect(result.added).toHaveLength(0);
  });

  it('uses extra value when preferExtra is true', () => {
    const result = unionEnvMaps({ A: 'base' }, { A: 'extra' }, true);
    expect(result.merged.A).toBe('extra');
    expect(result.kept).toContain('A');
  });

  it('handles empty extra', () => {
    const result = unionEnvMaps({ A: '1' }, {});
    expect(result.merged).toEqual({ A: '1' });
    expect(result.added).toHaveLength(0);
  });

  it('handles empty base', () => {
    const result = unionEnvMaps({}, { B: '2' });
    expect(result.merged).toEqual({ B: '2' });
    expect(result.added).toContain('B');
  });
});

describe('unionEnvFiles', () => {
  it('merges two env files', () => {
    const a = track(tmpFile('A=1\nB=2\n'));
    const b = track(tmpFile('B=99\nC=3\n'));
    const result = unionEnvFiles(a, b);
    expect(result.merged).toMatchObject({ A: '1', B: '2', C: '3' });
    expect(result.added).toContain('C');
  });
});

describe('formatUnionResult', () => {
  it('reports added and total keys', () => {
    const result = unionEnvMaps({ A: '1' }, { B: '2', C: '3' });
    const output = formatUnionResult(result);
    expect(output).toContain('Added keys (2)');
    expect(output).toContain('Total keys in union: 3');
  });

  it('reports no new keys when nothing added', () => {
    const result = unionEnvMaps({ A: '1' }, { A: '2' });
    const output = formatUnionResult(result);
    expect(output).toContain('No new keys added.');
  });
});
