import { describe, it, expect } from 'vitest';
import { maskValue, maskEnv, formatMaskResult } from './mask';

describe('maskValue', () => {
  it('replaces all chars with asterisks by default', () => {
    expect(maskValue('secret123')).toBe('********');
  });

  it('respects visibleChars', () => {
    expect(maskValue('secret123', '*', 3)).toBe('******123');
  });

  it('handles empty string', () => {
    expect(maskValue('')).toBe('');
  });

  it('uses custom char', () => {
    expect(maskValue('abc', '#')).toBe('####');
  });
});

describe('maskEnv', () => {
  const env = {
    API_KEY: 'abc123',
    DATABASE_PASSWORD: 'hunter2',
    APP_NAME: 'myapp',
    SECRET_TOKEN: 'tok_xyz',
  };

  it('masks sensitive keys automatically', () => {
    const result = maskEnv(env);
    expect(result.masked['API_KEY']).toBe('********');
    expect(result.masked['DATABASE_PASSWORD']).toBe('********');
    expect(result.masked['APP_NAME']).toBe('myapp');
    expect(result.maskedKeys).toContain('API_KEY');
    expect(result.maskedKeys).toContain('DATABASE_PASSWORD');
  });

  it('masks only specified keys when keys option provided', () => {
    const result = maskEnv(env, { keys: ['APP_NAME'] });
    expect(result.masked['APP_NAME']).toBe('****');
    expect(result.masked['API_KEY']).toBe('abc123');
  });

  it('preserves original env', () => {
    const result = maskEnv(env);
    expect(result.original['API_KEY']).toBe('abc123');
  });

  it('supports visibleChars', () => {
    const result = maskEnv({ API_KEY: 'abcdef' }, { visibleChars: 2 });
    expect(result.masked['API_KEY']).toMatch(/\*+ef$/);
  });
});

describe('formatMaskResult', () => {
  it('includes masked key summary', () => {
    const result = maskEnv({ API_KEY: 'secret', FOO: 'bar' });
    const output = formatMaskResult(result);
    expect(output).toContain('FOO=bar');
    expect(output).toContain('Masked');
    expect(output).toContain('API_KEY');
  });
});
