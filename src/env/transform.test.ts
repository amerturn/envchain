import { describe, it, expect } from 'vitest';
import { transformEnvValues, formatTransformResult } from './transform';

const env = { API_URL: 'http://localhost', SECRET: 'abc', PORT: '3000' };

describe('transformEnvValues', () => {
  it('uppercases values', () => {
    const r = transformEnvValues(env, ['SECRET'], [{ op: 'uppercase' }]);
    expect(r.transformed.SECRET).toBe('ABC');
    expect(r.changes).toHaveLength(1);
  });

  it('lowercases values', () => {
    const r = transformEnvValues(env, ['API_URL'], [{ op: 'lowercase' }]);
    expect(r.transformed.API_URL).toBe('http://localhost');
    expect(r.changes).toHaveLength(0);
  });

  it('applies prefix', () => {
    const r = transformEnvValues(env, ['PORT'], [{ op: 'prefix', value: 'PORT_' }]);
    expect(r.transformed.PORT).toBe('PORT_3000');
  });

  it('applies suffix', () => {
    const r = transformEnvValues(env, ['SECRET'], [{ op: 'suffix', value: '_v2' }]);
    expect(r.transformed.SECRET).toBe('abc_v2');
  });

  it('replaces substrings', () => {
    const r = transformEnvValues(env, ['API_URL'], [{ op: 'replace', from: 'localhost', to: 'example.com' }]);
    expect(r.transformed.API_URL).toBe('http://example.com');
  });

  it('skips missing keys', () => {
    const r = transformEnvValues(env, ['MISSING'], [{ op: 'uppercase' }]);
    expect(r.changes).toHaveLength(0);
  });

  it('chains multiple ops', () => {
    const r = transformEnvValues(env, ['SECRET'], [
      { op: 'uppercase' },
      { op: 'prefix', value: 'KEY_' }
    ]);
    expect(r.transformed.SECRET).toBe('KEY_ABC');
  });
});

describe('formatTransformResult', () => {
  it('returns no-change message', () => {
    const r = transformEnvValues(env, ['PORT'], [{ op: 'lowercase' }]);
    expect(formatTransformResult(r)).toBe('No changes made.');
  });

  it('formats changes', () => {
    const r = transformEnvValues(env, ['SECRET'], [{ op: 'uppercase' }]);
    const out = formatTransformResult(r);
    expect(out).toContain('SECRET');
    expect(out).toContain('abc');
    expect(out).toContain('ABC');
  });
});
