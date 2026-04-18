import { describe, it, expect } from 'vitest';
import { mergeEnvMaps, formatMergeResult } from './merge';

describe('mergeEnvMaps', () => {
  it('merges two non-overlapping maps', () => {
    const result = mergeEnvMaps({ A: '1' }, { B: '2' }, { interpolate: false });
    expect(result.env).toEqual({ A: '1', B: '2' });
    expect(result.conflicts).toEqual([]);
    expect(result.merged).toContain('B');
  });

  it('overrides by default on conflict', () => {
    const result = mergeEnvMaps({ A: '1' }, { A: '2' }, { interpolate: false });
    expect(result.env.A).toBe('2');
    expect(result.conflicts).toContain('A');
  });

  it('preserves base on conflict with preserve strategy', () => {
    const result = mergeEnvMaps({ A: '1' }, { A: '2' }, { strategy: 'preserve', interpolate: false });
    expect(result.env.A).toBe('1');
    expect(result.conflicts).toContain('A');
  });

  it('throws on conflict with error strategy', () => {
    expect(() =>
      mergeEnvMaps({ A: '1' }, { A: '2' }, { strategy: 'error', interpolate: false })
    ).toThrow('Merge conflict on key: A');
  });

  it('interpolates values after merge', () => {
    const result = mergeEnvMaps({ HOST: 'localhost' }, { URL: 'http://$HOST:3000' }, { interpolate: true });
    expect(result.env.URL).toBe('http://localhost:3000');
  });
});

describe('formatMergeResult', () => {
  it('formats merged and conflict counts', () => {
    const output = formatMergeResult({ env: {}, conflicts: ['A'], merged: ['B', 'C'] });
    expect(output).toContain('Merged keys (2)');
    expect(output).toContain('Conflicts resolved (1)');
  });

  it('omits empty sections', () => {
    const output = formatMergeResult({ env: {}, conflicts: [], merged: ['X'] });
    expect(output).not.toContain('Conflicts');
  });
});
