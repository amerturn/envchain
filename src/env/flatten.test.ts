import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { flattenEnvKeys, flattenEnvFile, formatFlattenResult } from './flatten';

function tmpFile(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'flatten-'));
  const file = join(dir, '.env');
  writeFileSync(file, content, 'utf-8');
  return file;
}

describe('flattenEnvKeys', () => {
  it('returns unchanged result when no options provided', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = flattenEnvKeys(env);
    expect(result.flattened).toEqual(env);
    expect(result.changed).toHaveLength(0);
  });

  it('adds prefix to keys that lack it', () => {
    const env = { NAME: 'alice', APP_REGION: 'us-east' };
    const result = flattenEnvKeys(env, { prefix: 'APP' });
    expect(result.flattened['APP_NAME']).toBe('alice');
    expect(result.flattened['APP_REGION']).toBe('us-east');
    expect(result.changed).toContain('NAME');
    expect(result.changed).not.toContain('APP_REGION');
  });

  it('uppercases all keys', () => {
    const env = { foo: 'bar', baz: 'qux' };
    const result = flattenEnvKeys(env, { uppercase: true });
    expect(result.flattened['FOO']).toBe('bar');
    expect(result.flattened['BAZ']).toBe('qux');
    expect(result.changed).toEqual(['foo', 'baz']);
  });

  it('combines prefix and uppercase', () => {
    const env = { name: 'test' };
    const result = flattenEnvKeys(env, { prefix: 'app', uppercase: true });
    expect(result.flattened['APP_NAME']).toBe('test');
    expect(result.changed).toContain('name');
  });

  it('respects custom separator', () => {
    const env = { KEY: 'val' };
    const result = flattenEnvKeys(env, { prefix: 'NS', separator: '__' });
    expect(result.flattened['NS__KEY']).toBe('val');
  });
});

describe('flattenEnvFile', () => {
  it('reads and flattens a .env file', () => {
    const file = tmpFile('HOST=localhost\nPORT=3000\n');
    const result = flattenEnvFile(file, { prefix: 'SVC', uppercase: true });
    expect(result.flattened['SVC_HOST']).toBe('localhost');
    expect(result.flattened['SVC_PORT']).toBe('3000');
  });
});

describe('formatFlattenResult', () => {
  it('reports no changes when keys are unchanged', () => {
    const env = { FOO: 'bar' };
    const result = flattenEnvKeys(env);
    expect(formatFlattenResult(result)).toContain('No keys were changed');
  });

  it('reports changed keys', () => {
    const env = { name: 'x' };
    const result = flattenEnvKeys(env, { prefix: 'APP' });
    const output = formatFlattenResult(result);
    expect(output).toContain('Flattened 1 key(s)');
  });
});
