import { lintEnv, formatLintResult } from './lint';

describe('lintEnv', () => {
  it('returns ok with no issues for clean env', () => {
    const result = lintEnv('prod', { API_URL: 'https://example.com', PORT: '8080' });
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('warns on non-upper-snake-case keys', () => {
    const result = lintEnv('dev', { apiUrl: 'x' });
    expect(result.issues.some(i => i.key === 'apiUrl' && i.severity === 'warn')).toBe(true);
  });

  it('warns on empty values', () => {
    const result = lintEnv('dev', { MY_VAR: '' });
    expect(result.issues.some(i => i.message.includes('empty value'))).toBe(true);
  });

  it('errors on short sensitive key values', () => {
    const result = lintEnv('prod', { SECRET: 'abc' });
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.severity === 'error' && i.key === 'SECRET')).toBe(true);
  });

  it('warns on newline in value', () => {
    const result = lintEnv('dev', { NOTE: 'line1\nline2' });
    expect(result.issues.some(i => i.message.includes('newline'))).toBe(true);
  });
});

describe('formatLintResult', () => {
  it('shows success message when no issues', () => {
    const out = formatLintResult({ target: 'prod', issues: [], ok: true });
    expect(out).toContain('no issues found');
  });

  it('shows issue lines', () => {
    const result = lintEnv('dev', { secret: 'x' });
    const out = formatLintResult(result);
    expect(out).toContain('issue(s)');
  });
});
