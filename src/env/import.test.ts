import { importEnv, importEnvFile, formatImportResult } from './import';
import fs from 'fs';
import os from 'os';
import path from 'path';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `envchain-import-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('importEnv', () => {
  it('adds new keys from incoming', () => {
    const result = importEnv({ A: '1' }, { B: '2' });
    expect(result.added).toContain('B');
    expect(result.merged).toEqual({ A: '1', B: '2' });
  });

  it('skips existing keys with skip strategy', () => {
    const result = importEnv({ A: '1' }, { A: '99', B: '2' }, 'skip');
    expect(result.skipped).toContain('A');
    expect(result.merged.A).toBe('1');
    expect(result.merged.B).toBe('2');
  });

  it('overwrites existing keys with overwrite strategy', () => {
    const result = importEnv({ A: '1' }, { A: '99' }, 'overwrite');
    expect(result.merged.A).toBe('99');
    expect(result.skipped).toHaveLength(0);
  });
});

describe('importEnvFile', () => {
  it('merges source into target file', () => {
    const target = tmpFile('A=1\n');
    const source = tmpFile('B=2\nC=3\n');
    const result = importEnvFile(target, source, 'skip');
    expect(result.added).toEqual(expect.arrayContaining(['B', 'C']));
    const content = fs.readFileSync(target, 'utf8');
    expect(content).toContain('B=2');
  });

  it('creates target file if missing', () => {
    const target = path.join(os.tmpdir(), `missing-${Date.now()}.env`);
    const source = tmpFile('X=hello\n');
    importEnvFile(target, source);
    expect(fs.existsSync(target)).toBe(true);
    fs.unlinkSync(target);
  });
});

describe('formatImportResult', () => {
  it('formats added and skipped', () => {
    const out = formatImportResult({ added: ['A'], skipped: ['B'], merged: {} });
    expect(out).toContain('Added');
    expect(out).toContain('Skipped');
  });

  it('shows no changes message', () => {
    const out = formatImportResult({ added: [], skipped: [], merged: {} });
    expect(out).toContain('No changes');
  });
});
