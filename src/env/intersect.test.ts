import { intersectEnvMaps, intersectEnvFiles, formatIntersectResult } from './intersect';
import fs from 'fs';
import os from 'os';
import path from 'path';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `envchain-intersect-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(p, content);
  return p;
}

describe('intersectEnvMaps', () => {
  it('returns keys present in both maps', () => {
    const a = { FOO: '1', BAR: '2', BAZ: '3' };
    const b = { FOO: 'x', BAZ: 'y', QUX: 'z' };
    const result = intersectEnvMaps(a, b);
    expect(result.keys.sort()).toEqual(['BAZ', 'FOO']);
    expect(result.env).toEqual({ FOO: '1', BAZ: '3' });
    expect(result.totalA).toBe(3);
    expect(result.totalB).toBe(3);
    expect(result.common).toBe(2);
  });

  it('returns empty when no common keys', () => {
    const result = intersectEnvMaps({ A: '1' }, { B: '2' });
    expect(result.keys).toEqual([]);
    expect(result.common).toBe(0);
  });

  it('values come from envA', () => {
    const result = intersectEnvMaps({ KEY: 'from-a' }, { KEY: 'from-b' });
    expect(result.env.KEY).toBe('from-a');
  });
});

describe('intersectEnvFiles', () => {
  it('reads and intersects two env files', () => {
    const a = tmpFile('FOO=1\nBAR=2\n');
    const b = tmpFile('FOO=x\nBAZ=3\n');
    const result = intersectEnvFiles(a, b);
    expect(result.keys).toEqual(['FOO']);
    expect(result.env.FOO).toBe('1');
  });
});

describe('formatIntersectResult', () => {
  it('formats result with common keys', () => {
    const result = { keys: ['FOO'], env: { FOO: 'bar' }, totalA: 2, totalB: 3, common: 1 };
    const out = formatIntersectResult(result);
    expect(out).toContain('1 key(s) in common');
    expect(out).toContain('FOO=bar');
  });

  it('formats empty result', () => {
    const result = { keys: [], env: {}, totalA: 1, totalB: 1, common: 0 };
    const out = formatIntersectResult(result);
    expect(out).toContain('no common keys');
  });
});
