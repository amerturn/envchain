import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { uniqueEnvMaps, uniqueEnvFiles, formatUniqueResult } from './unique';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `unique-test-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('uniqueEnvMaps', () => {
  it('returns all keys when no overlap', () => {
    const result = uniqueEnvMaps([{ A: '1' }, { B: '2' }]);
    expect(result.unique).toEqual({ A: '1', B: '2' });
    expect(result.duplicates).toHaveLength(0);
  });

  it('identifies duplicate keys across maps', () => {
    const result = uniqueEnvMaps([{ A: '1', B: 'x' }, { A: '2', C: 'y' }]);
    expect(result.unique).toEqual({ B: 'x', C: 'y' });
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].key).toBe('A');
    expect(result.duplicates[0].values).toEqual(['1', '2']);
  });

  it('handles empty maps', () => {
    const result = uniqueEnvMaps([{}, {}]);
    expect(result.unique).toEqual({});
    expect(result.duplicates).toHaveLength(0);
  });

  it('handles single map — all keys are unique', () => {
    const result = uniqueEnvMaps([{ FOO: 'bar', BAZ: 'qux' }]);
    expect(result.unique).toEqual({ FOO: 'bar', BAZ: 'qux' });
    expect(result.duplicates).toHaveLength(0);
  });

  it('original contains all keys from all maps', () => {
    const result = uniqueEnvMaps([{ A: '1' }, { A: '2', B: '3' }]);
    expect(result.original).toMatchObject({ A: '2', B: '3' });
  });
});

describe('uniqueEnvFiles', () => {
  it('reads files and returns unique keys', () => {
    const f1 = tmpFile('SHARED=1\nONLY_A=hello\n');
    const f2 = tmpFile('SHARED=2\nONLY_B=world\n');
    const result = uniqueEnvFiles([f1, f2]);
    expect(result.unique).toEqual({ ONLY_A: 'hello', ONLY_B: 'world' });
    expect(result.duplicates[0].key).toBe('SHARED');
  });
});

describe('formatUniqueResult', () => {
  it('formats result with duplicates and unique keys', () => {
    const result = uniqueEnvMaps([{ A: '1', B: 'x' }, { A: '2', C: 'y' }]);
    const output = formatUniqueResult(result);
    expect(output).toContain('Unique keys: 2');
    expect(output).toContain('Duplicate keys: 1');
    expect(output).toContain('A:');
    expect(output).toContain('B=');
    expect(output).toContain('C=');
  });

  it('omits duplicates section when none exist', () => {
    const result = uniqueEnvMaps([{ X: '1' }, { Y: '2' }]);
    const output = formatUniqueResult(result);
    expect(output).not.toContain('Duplicates:');
  });
});
