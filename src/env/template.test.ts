import { applyTemplate, formatTemplateResult } from './template';
import { describe, it, expect } from 'vitest';

describe('applyTemplate', () => {
  it('substitutes braced placeholders', () => {
    const env = { API_URL: 'https://${HOST}/api' };
    const ctx = { HOST: 'example.com' };
    const result = applyTemplate(env, ctx);
    expect(result.output.API_URL).toBe('https://example.com/api');
    expect(result.substituted).toContain('API_URL');
    expect(result.missing).toHaveLength(0);
  });

  it('substitutes bare $VAR placeholders', () => {
    const env = { DB_URL: 'postgres://$DB_HOST:5432/db' };
    const ctx = { DB_HOST: 'localhost' };
    const result = applyTemplate(env, ctx);
    expect(result.output.DB_URL).toBe('postgres://localhost:5432/db');
    expect(result.substituted).toContain('DB_URL');
  });

  it('records missing keys and leaves empty string', () => {
    const env = { TOKEN: '${SECRET_TOKEN}' };
    const result = applyTemplate(env, {});
    expect(result.output.TOKEN).toBe('');
    expect(result.missing).toContain('TOKEN');
    expect(result.substituted).toHaveLength(0);
  });

  it('handles multiple placeholders in one value', () => {
    const env = { ENDPOINT: '${SCHEME}://${HOST}:${PORT}' };
    const ctx = { SCHEME: 'https', HOST: 'api.dev', PORT: '443' };
    const result = applyTemplate(env, ctx);
    expect(result.output.ENDPOINT).toBe('https://api.dev:443');
    expect(result.substituted).toContain('ENDPOINT');
  });

  it('does not modify values without placeholders', () => {
    const env = { PLAIN: 'no-substitution' };
    const result = applyTemplate(env, { PLAIN: 'ignored' });
    expect(result.output.PLAIN).toBe('no-substitution');
    expect(result.substituted).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });
});

describe('formatTemplateResult', () => {
  it('shows substituted and missing counts', () => {
    const result = { output: {}, substituted: ['A', 'B'], missing: ['C'] };
    const text = formatTemplateResult(result);
    expect(text).toContain('Substituted (2)');
    expect(text).toContain('Missing refs (1)');
  });

  it('shows fallback when no placeholders', () => {
    const result = { output: {}, substituted: [], missing: [] };
    expect(formatTemplateResult(result)).toContain('No placeholders found.');
  });
});
