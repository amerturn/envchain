import { describe, it, expect } from 'vitest';
import { extractEnvKeys, extractEnvFile, formatExtractResult } from './extract';

describe('extractEnvKeys', () => {
  it('extracts specified keys', () => {
    const env = { FOO: 'foo', BAR: 'bar', BAZ: 'baz' };
    const result = extractEnvKeys(env, ['FOO', 'BAZ']);
    expect(result.extracted).toEqual({ FOO: 'foo', BAZ: 'baz' });
    expect(result.remaining).toEqual({ BAR: 'bar' });
    expect(result.keys).toEqual(['FOO', 'BAZ']);
  });

  it('ignores missing keys', () => {
    const env = { FOO: 'foo' };
    const result = extractEnvKeys(env, ['FOO', 'MISSING']);
    expect(result.extracted).toEqual({ FOO: 'foo' });
    expect(result.keys).toEqual(['FOO']);
  });

  it('returns empty extracted when no keys match', () => {
    const env = { FOO: 'foo' };
    const result = extractEnvKeys(env, ['NOPE']);
    expect(result.extracted).toEqual({});
    expect(result.remaining).toEqual({ FOO: 'foo' });
  });

  it('does not mutate original env', () => {
    const env = { FOO: 'foo', BAR: 'bar' };
    extractEnvKeys(env, ['FOO']);
    expect(env).toEqual({ FOO: 'foo', BAR: 'bar' });
  });
});

describe('extractEnvFile', () => {
  it('splits env file content', () => {
    const source = 'FOO=foo\nBAR=bar\nBAZ=baz\n';
    const { extractedContent, remainingContent, keys } = extractEnvFile(source, ['FOO', 'BAZ']);
    expect(keys).toEqual(['FOO', 'BAZ']);
    expect(extractedContent).toContain('FOO=foo');
    expect(remainingContent).toContain('BAR=bar');
    expect(remainingContent).not.toContain('FOO');
  });
});

describe('formatExtractResult', () => {
  it('formats result with extracted keys', () => {
    const result = { extracted: { FOO: 'foo' }, remaining: { BAR: 'bar' }, keys: ['FOO'] };
    const out = formatExtractResult(result);
    expect(out).toContain('Extracted 1 key(s)');
    expect(out).toContain('+ FOO');
    expect(out).toContain('Remaining: 1');
  });

  it('formats empty result', () => {
    const result = { extracted: {}, remaining: { BAR: 'bar' }, keys: [] };
    expect(formatExtractResult(result)).toContain('No matching keys found.');
  });
});
