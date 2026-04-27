import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { diffEnvKeys, diffEnvKeyFiles, formatDiffKeysResult } from './diff-keys';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `diff-keys-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(p, content);
  return p;
}

describe('diffEnvKeys', () => {
  it('detects added keys', () => {
    const result = diffEnvKeys({ A: '1' }, { A: '1', B: '2' });
    expect(result.added).toEqual(['B']);
    expect(result.removed).toEqual([]);
    expect(result.common).toEqual(['A']);
  });

  it('detects removed keys', () => {
    const result = diffEnvKeys({ A: '1', B: '2' }, { A: '1' });
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual(['B']);
  });

  it('returns empty diff for identical maps', () => {
    const result = diffEnvKeys({ A: '1' }, { A: '1' });
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.common).toEqual(['A']);
  });
});

describe('diffEnvKeyFiles', () => {
  it('reads and diffs two env files', () => {
    const base = tmpFile('A=1\nB=2\n');
    const target = tmpFile('A=1\nC=3\n');
    const result = diffEnvKeyFiles(base, target);
    expect(result.added).toEqual(['C']);
    expect(result.removed).toEqual(['B']);
  });
});

describe('formatDiffKeysResult', () => {
  it('formats added and removed keys', () => {
    const out = formatDiffKeysResult({ added: ['C'], removed: ['B'], common: ['A'] });
    expect(out).toContain('+ C');
    expect(out).toContain('- B');
    expect(out).toContain('Common keys: 1');
  });

  it('shows no differences message', () => {
    const out = formatDiffKeysResult({ added: [], removed: [], common: ['A'] });
    expect(out).toContain('No key differences found.');
  });
});
