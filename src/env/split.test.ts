import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { splitEnvKeys, splitEnvFile, formatSplitResult, writeSplitFiles } from './split';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `split-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('splitEnvKeys', () => {
  const env = { APP_HOST: 'localhost', APP_PORT: '3000', DB_HOST: 'pg', DB_PASS: 'secret', REDIS_URL: 'redis://localhost' };

  it('splits by prefix using underscore delimiter', () => {
    const result = splitEnvKeys(env, 'prefix', { delimiter: '_' });
    expect(result.chunks['APP']).toEqual({ APP_HOST: 'localhost', APP_PORT: '3000' });
    expect(result.chunks['DB']).toEqual({ DB_HOST: 'pg', DB_PASS: 'secret' });
    expect(result.chunks['REDIS']).toEqual({ REDIS_URL: 'redis://localhost' });
    expect(result.chunkCount).toBe(3);
    expect(result.totalKeys).toBe(5);
  });

  it('splits by alpha bucket', () => {
    const result = splitEnvKeys(env, 'alpha');
    expect(Object.keys(result.chunks)).toContain('A');
    expect(Object.keys(result.chunks)).toContain('D');
    expect(Object.keys(result.chunks)).toContain('R');
  });

  it('splits by size', () => {
    const result = splitEnvKeys(env, 'size', { chunkSize: 2 });
    expect(result.chunks['chunk_0']).toBeDefined();
    expect(Object.keys(result.chunks['chunk_0']).length).toBe(2);
    expect(result.chunkCount).toBe(3);
  });

  it('handles empty env', () => {
    const result = splitEnvKeys({}, 'prefix');
    expect(result.totalKeys).toBe(0);
    expect(result.chunkCount).toBe(0);
  });
});

describe('splitEnvFile', () => {
  it('reads and splits a file', () => {
    const p = tmpFile('APP_HOST=localhost\nDB_HOST=pg\n');
    const result = splitEnvFile(p, 'prefix');
    expect(result.chunks['APP']).toEqual({ APP_HOST: 'localhost' });
    expect(result.chunks['DB']).toEqual({ DB_HOST: 'pg' });
    fs.unlinkSync(p);
  });
});

describe('formatSplitResult', () => {
  it('formats summary', () => {
    const result = splitEnvKeys({ APP_X: '1', DB_Y: '2' }, 'prefix');
    const out = formatSplitResult(result);
    expect(out).toContain('Split 2 keys into 2 chunk(s)');
    expect(out).toContain('[APP]');
    expect(out).toContain('[DB]');
  });
});

describe('writeSplitFiles', () => {
  let dir: string;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'split-')); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('writes one file per chunk', () => {
    const result = splitEnvKeys({ APP_X: '1', DB_Y: '2' }, 'prefix');
    const written = writeSplitFiles(result, dir);
    expect(written.length).toBe(2);
    for (const f of written) expect(fs.existsSync(f)).toBe(true);
  });
});
