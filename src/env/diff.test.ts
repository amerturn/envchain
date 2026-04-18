import { diffEnv, formatDiff } from './diff';

describe('diffEnv', () => {
  it('detects added keys', () => {
    const result = diffEnv({}, { FOO: 'bar' });
    expect(result).toEqual([{ key: 'FOO', type: 'added', newValue: 'bar' }]);
  });

  it('detects removed keys', () => {
    const result = diffEnv({ FOO: 'bar' }, {});
    expect(result).toEqual([{ key: 'FOO', type: 'removed', oldValue: 'bar' }]);
  });

  it('detects changed keys', () => {
    const result = diffEnv({ FOO: 'bar' }, { FOO: 'baz' });
    expect(result).toEqual([{ key: 'FOO', type: 'changed', oldValue: 'bar', newValue: 'baz' }]);
  });

  it('ignores unchanged keys', () => {
    const result = diffEnv({ FOO: 'bar' }, { FOO: 'bar' });
    expect(result).toEqual([]);
  });

  it('returns entries sorted by key', () => {
    const result = diffEnv({}, { Z: '1', A: '2', M: '3' });
    expect(result.map((e) => e.key)).toEqual(['A', 'M', 'Z']);
  });

  it('handles mixed changes', () => {
    const base = { A: '1', B: '2', C: '3' };
    const next = { A: '1', B: 'changed', D: 'new' };
    const result = diffEnv(base, next);
    expect(result).toHaveLength(3);
    expect(result.find((e) => e.key === 'B')?.type).toBe('changed');
    expect(result.find((e) => e.key === 'C')?.type).toBe('removed');
    expect(result.find((e) => e.key === 'D')?.type).toBe('added');
  });
});

describe('formatDiff', () => {
  it('returns no changes message for empty diff', () => {
    expect(formatDiff([])).toBe('(no changes)');
  });

  it('formats added entry', () => {
    const out = formatDiff([{ key: 'FOO', type: 'added', newValue: 'bar' }]);
    expect(out).toBe('+ FOO=bar');
  });

  it('formats removed entry', () => {
    const out = formatDiff([{ key: 'FOO', type: 'removed', oldValue: 'old' }]);
    expect(out).toBe('- FOO=old');
  });

  it('formats changed entry', () => {
    const out = formatDiff([{ key: 'FOO', type: 'changed', oldValue: 'a', newValue: 'b' }]);
    expect(out).toBe('~ FOO: a → b');
  });
});
