import { squashEnvMaps, squashEnvFiles, formatSquashResult } from './squash';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpFile(content: string): string {
  const fp = path.join(os.tmpdir(), `squash-test-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(fp, content);
  return fp;
}

describe('squashEnvMaps', () => {
  it('merges layers with later layers winning', () => {
    const result = squashEnvMaps([
      { FOO: 'base', BAR: 'base' },
      { FOO: 'override' },
    ]);
    expect(result.squashed.FOO).toBe('override');
    expect(result.squashed.BAR).toBe('base');
  });

  it('tracks kept keys', () => {
    const result = squashEnvMaps([{ A: '1' }, { B: '2' }]);
    expect(result.kept).toContain('A');
    expect(result.kept).toContain('B');
  });

  it('handles empty layers', () => {
    const result = squashEnvMaps([]);
    expect(result.squashed).toEqual({});
    expect(result.kept).toHaveLength(0);
  });

  it('handles single layer', () => {
    const result = squashEnvMaps([{ X: 'hello' }]);
    expect(result.squashed).toEqual({ X: 'hello' });
  });

  it('removed is empty when all keys survive', () => {
    const result = squashEnvMaps([{ A: '1' }, { A: '2' }]);
    expect(result.removed).toHaveLength(0);
  });
});

describe('squashEnvFiles', () => {
  it('reads and squashes env files', () => {
    const f1 = tmpFile('FOO=base\nBAR=keep\n');
    const f2 = tmpFile('FOO=override\n');
    const result = squashEnvFiles([f1, f2]);
    expect(result.squashed.FOO).toBe('override');
    expect(result.squashed.BAR).toBe('keep');
  });
});

describe('formatSquashResult', () => {
  it('includes summary line', () => {
    const result = squashEnvMaps([{ A: '1' }, { A: '2', B: '3' }]);
    const output = formatSquashResult(result);
    expect(output).toContain('Squashed');
    expect(output).toContain('A=2');
    expect(output).toContain('B=3');
  });
});
