import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { omitEnvKeys, omitEnvFile, formatOmitResult } from './omit';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `omit-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('omitEnvKeys', () => {
  it('removes specified keys', () => {
    const env = { FOO: 'foo', BAR: 'bar', BAZ: 'baz' };
    const result = omitEnvKeys(env, ['FOO', 'BAZ']);
    expect(result.result).toEqual({ BAR: 'bar' });
    expect(result.omitted).toEqual(['FOO', 'BAZ']);
    expect(result.notFound).toEqual([]);
  });

  it('reports keys not found', () => {
    const env = { FOO: 'foo' };
    const result = omitEnvKeys(env, ['FOO', 'MISSING']);
    expect(result.omitted).toEqual(['FOO']);
    expect(result.notFound).toEqual(['MISSING']);
  });

  it('does not mutate original env', () => {
    const env = { FOO: 'foo', BAR: 'bar' };
    omitEnvKeys(env, ['FOO']);
    expect(env).toEqual({ FOO: 'foo', BAR: 'bar' });
  });

  it('returns empty result when all keys are omitted', () => {
    const env = { A: '1', B: '2' };
    const result = omitEnvKeys(env, ['A', 'B']);
    expect(result.result).toEqual({});
    expect(result.omitted).toHaveLength(2);
  });
});

describe('omitEnvFile', () => {
  let file: string;

  afterEach(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  it('omits keys from file without writing', () => {
    file = tmpFile('FOO=foo\nBAR=bar\nBAZ=baz\n');
    const result = omitEnvFile(file, ['FOO', 'BAZ'], false);
    expect(result.result).toEqual({ BAR: 'bar' });
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('FOO=foo');
  });

  it('writes result back when write=true', () => {
    file = tmpFile('FOO=foo\nBAR=bar\n');
    omitEnvFile(file, ['FOO'], true);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).not.toContain('FOO');
    expect(content).toContain('BAR=bar');
  });
});

describe('formatOmitResult', () => {
  it('formats omitted and not-found keys', () => {
    const result = {
      original: { FOO: 'foo' },
      result: {},
      omitted: ['FOO'],
      notFound: ['BAR'],
    };
    const output = formatOmitResult(result);
    expect(output).toContain('Omitted (1)');
    expect(output).toContain('- FOO');
    expect(output).toContain('Not found (1)');
    expect(output).toContain('? BAR');
  });

  it('shows fallback message when no keys given', () => {
    const result = { original: {}, result: {}, omitted: [], notFound: [] };
    expect(formatOmitResult(result)).toContain('No keys specified.');
  });
});
