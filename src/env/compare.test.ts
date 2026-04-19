import { compareEnvMaps, compareEnvFiles, formatCompareResult } from './compare';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function tmpFile(name: string, content: string): string {
  const p = join(tmpdir(), name);
  writeFileSync(p, content);
  return p;
}

describe('compareEnvMaps', () => {
  it('detects keys only in a', () => {
    const r = compareEnvMaps({ A: '1' }, {});
    expect(r.onlyInA).toEqual({ A: '1' });
  });

  it('detects keys only in b', () => {
    const r = compareEnvMaps({}, { B: '2' });
    expect(r.onlyInB).toEqual({ B: '2' });
  });

  it('detects changed values', () => {
    const r = compareEnvMaps({ X: 'old' }, { X: 'new' });
    expect(r.changed).toEqual({ X: { a: 'old', b: 'new' } });
  });

  it('detects unchanged values', () => {
    const r = compareEnvMaps({ Y: 'same' }, { Y: 'same' });
    expect(r.unchanged).toEqual({ Y: 'same' });
  });
});

describe('compareEnvFiles', () => {
  it('compares two env files', () => {
    const a = tmpFile('cmp_a.env', 'FOO=1\nBAR=2\n');
    const b = tmpFile('cmp_b.env', 'FOO=1\nBAZ=3\n');
    const r = compareEnvFiles(a, b);
    expect(r.unchanged).toEqual({ FOO: '1' });
    expect(r.onlyInA).toEqual({ BAR: '2' });
    expect(r.onlyInB).toEqual({ BAZ: '3' });
  });
});

describe('formatCompareResult', () => {
  it('returns no differences message when equal', () => {
    const r = compareEnvMaps({ A: '1' }, { A: '1' });
    expect(formatCompareResult(r)).toBe('(no differences)');
  });

  it('formats differences', () => {
    const r = compareEnvMaps({ A: 'x' }, { A: 'y', B: 'z' });
    const out = formatCompareResult(r);
    expect(out).toContain('~ A: x → y');
    expect(out).toContain('> B=z');
  });
});
