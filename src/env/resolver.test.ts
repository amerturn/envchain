import { mergeEnvLayers, interpolateEnvVars, resolveEnv } from './resolver';

describe('mergeEnvLayers', () => {
  it('merges single layer', () => {
    const result = mergeEnvLayers([[{ key: 'FOO', value: 'bar', source: 'base' }]]);
    expect(result.vars).toEqual({ FOO: 'bar' });
    expect(result.sources).toEqual({ FOO: 'base' });
  });

  it('later layers override earlier ones', () => {
    const result = mergeEnvLayers([
      [{ key: 'FOO', value: 'base', source: 'base' }],
      [{ key: 'FOO', value: 'override', source: 'prod' }],
    ]);
    expect(result.vars.FOO).toBe('override');
    expect(result.sources.FOO).toBe('prod');
  });

  it('normalizes keys to uppercase', () => {
    const result = mergeEnvLayers([[{ key: 'my_var', value: '1' }]]);
    expect(result.vars['MY_VAR']).toBe('1');
  });
});

describe('interpolateEnvVars', () => {
  it('resolves references within vars', () => {
    const result = interpolateEnvVars({ BASE_URL: 'https://example.com', API_URL: '${BASE_URL}/api' });
    expect(result.API_URL).toBe('https://example.com/api');
  });

  it('falls back to process.env', () => {
    process.env.EXISTING_VAR = 'from-process';
    const result = interpolateEnvVars({ DERIVED: '${EXISTING_VAR}/suffix' });
    expect(result.DERIVED).toBe('from-process/suffix');
    delete process.env.EXISTING_VAR;
  });

  it('leaves unresolved refs as empty string', () => {
    const result = interpolateEnvVars({ VAL: '${MISSING_VAR}' });
    expect(result.VAL).toBe('');
  });
});

describe('resolveEnv', () => {
  it('merges and interpolates in one step', () => {
    const result = resolveEnv([
      [{ key: 'HOST', value: 'localhost' }],
      [{ key: 'URL', value: 'http://${HOST}:3000' }],
    ]);
    expect(result.vars.URL).toBe('http://localhost:3000');
  });
});
