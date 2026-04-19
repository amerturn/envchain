import { describe, it, expect } from 'vitest';
import { stripEnvKeys, stripEnvFile, formatStripResult } from './strip';

const sampleEnv = {
  APP_NAME: 'myapp',
  DB_PASSWORD: 'secret',
  API_KEY: 'abc123',
  PORT: '3000',
};

describe('stripEnvKeys', () => {
  it('removes specified keys', () => {
    const result = stripEnvKeys(sampleEnv, { keys: ['DB_PASSWORD', 'API_KEY'] });
    expect(result.removed).toEqual(['DB_PASSWORD', 'API_KEY']);
    expect(result.stripped).not.toHaveProperty('DB_PASSWORD');
    expect(result.stripped).toHaveProperty('APP_NAME');
  });

  it('removes keys matching pattern', () => {
    const result = stripEnvKeys(sampleEnv, { pattern: /_KEY$/ });
    expect(result.removed).toEqual(['API_KEY']);
    expect(result.stripped).not.toHaveProperty('API_KEY');
  });

  it('removes keys matching both keys and pattern', () => {
    const result = stripEnvKeys(sampleEnv, { keys: ['PORT'], pattern: /PASSWORD/ });
    expect(result.removed).toContain('PORT');
    expect(result.removed).toContain('DB_PASSWORD');
  });

  it('returns empty removed when no match', () => {
    const result = stripEnvKeys(sampleEnv, { keys: ['NONEXISTENT'] });
    expect(result.removed).toHaveLength(0);
    expect(result.stripped).toEqual(sampleEnv);
  });
});

describe('stripEnvFile', () => {
  it('parses and strips from file content', () => {
    const content = 'APP_NAME=myapp\nDB_PASSWORD=secret\nPORT=3000\n';
    const result = stripEnvFile(content, { keys: ['DB_PASSWORD'] });
    expect(result.removed).toEqual(['DB_PASSWORD']);
    expect(result.stripped).toHaveProperty('APP_NAME');
  });
});

describe('formatStripResult', () => {
  it('reports removed keys', () => {
    const result = stripEnvKeys(sampleEnv, { keys: ['API_KEY'] });
    const output = formatStripResult(result);
    expect(output).toContain('Removed 1 key(s)');
    expect(output).toContain('- API_KEY');
  });

  it('reports no keys removed', () => {
    const result = stripEnvKeys(sampleEnv, {});
    const output = formatStripResult(result);
    expect(output).toContain('No keys removed.');
  });
});
