import { expandEnvVars, expandEnvFile, formatExpandResult } from './expand';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

function tmpFile(content: string): string {
  const p = join(tmpdir(), `expand-test-${randomBytes(4).toString('hex')}.env`);
  writeFileSync(p, content, 'utf8');
  return p;
}

describe('expandEnvVars', () => {
  it('expands simple variable references', () => {
    const env = { HOST: 'localhost', URL: 'http://$HOST:3000' };
    const result = expandEnvVars(env);
    expect(result.URL).toBe('http://localhost:3000');
    expect(result.HOST).toBe('localhost');
  });

  it('expands braced variable references', () => {
    const env = { BASE: '/app', LOGS: '${BASE}/logs' };
    const result = expandEnvVars(env);
    expect(result.LOGS).toBe('/app/logs');
  });

  it('handles chained expansions across passes', () => {
    const env = { A: 'hello', B: '$A world', C: '$B!' };
    const result = expandEnvVars(env);
    expect(result.C).toBe('hello world!');
  });

  it('leaves unresolvable references unchanged', () => {
    const env = { URL: 'http://$UNKNOWN/path' };
    const result = expandEnvVars(env);
    expect(result.URL).toBe('http://$UNKNOWN/path');
  });

  it('does not mutate the original object', () => {
    const env = { A: 'x', B: '$A-y' };
    expandEnvVars(env);
    expect(env.B).toBe('$A-y');
  });
});

describe('expandEnvFile', () => {
  it('returns expanded result with changed keys', () => {
    const f = tmpFile('HOST=localhost\nURL=http://$HOST/api\n');
    const result = expandEnvFile(f);
    expect(result.count).toBe(1);
    expect(result.keys).toContain('URL');
    expect(result.expanded.URL).toBe('http://localhost/api');
  });

  it('returns count 0 when nothing to expand', () => {
    const f = tmpFile('FOO=bar\nBAZ=qux\n');
    const result = expandEnvFile(f);
    expect(result.count).toBe(0);
    expect(result.keys).toHaveLength(0);
  });
});

describe('formatExpandResult', () => {
  it('reports no changes when count is 0', () => {
    const out = formatExpandResult({ original: {}, expanded: {}, count: 0, keys: [] });
    expect(out).toMatch(/No variables were expanded/);
  });

  it('lists changed keys with before/after values', () => {
    const out = formatExpandResult({
      original: { URL: 'http://$HOST' },
      expanded: { URL: 'http://localhost' },
      count: 1,
      keys: ['URL'],
    });
    expect(out).toMatch('URL');
    expect(out).toMatch('http://$HOST');
    expect(out).toMatch('http://localhost');
  });
});
