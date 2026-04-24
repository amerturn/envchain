import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { lowercaseEnvKeys, lowercaseEnvFile, formatLowercaseResult } from './lowercase';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `envchain-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('lowercaseEnvKeys', () => {
  it('lowercases uppercase keys', () => {
    const result = lowercaseEnvKeys({ API_KEY: 'abc', DB_HOST: 'localhost' });
    expect(result.lowercased).toEqual({ api_key: 'abc', db_host: 'localhost' });
    expect(result.changed).toEqual(['API_KEY', 'DB_HOST']);
    expect(result.unchanged).toEqual([]);
  });

  it('leaves already lowercase keys unchanged', () => {
    const result = lowercaseEnvKeys({ api_key: 'abc', port: '3000' });
    expect(result.lowercased).toEqual({ api_key: 'abc', port: '3000' });
    expect(result.changed).toEqual([]);
    expect(result.unchanged).toEqual(['api_key', 'port']);
  });

  it('handles mixed case keys', () => {
    const result = lowercaseEnvKeys({ ApiKey: 'val', already: 'ok' });
    expect(result.lowercased).toEqual({ apikey: 'val', already: 'ok' });
    expect(result.changed).toContain('ApiKey');
    expect(result.unchanged).toContain('already');
  });

  it('preserves values unchanged', () => {
    const result = lowercaseEnvKeys({ MY_VAR: 'Hello World' });
    expect(result.lowercased['my_var']).toBe('Hello World');
  });
});

describe('lowercaseEnvFile', () => {
  let filePath: string;

  afterEach(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  it('rewrites file with lowercased keys', () => {
    filePath = tmpFile('API_KEY=secret\nPORT=3000\n');
    const result = lowercaseEnvFile(filePath);
    const written = fs.readFileSync(filePath, 'utf-8');
    expect(written).toContain('api_key=secret');
    expect(written).toContain('port=3000');
    expect(result.changed).toHaveLength(2);
  });
});

describe('formatLowercaseResult', () => {
  it('reports no changes when all keys already lowercase', () => {
    const result = lowercaseEnvKeys({ foo: 'bar' });
    expect(formatLowercaseResult(result)).toContain('No keys needed lowercasing.');
  });

  it('lists changed keys', () => {
    const result = lowercaseEnvKeys({ FOO: 'bar', BAZ: 'qux' });
    const output = formatLowercaseResult(result);
    expect(output).toContain('FOO → foo');
    expect(output).toContain('BAZ → baz');
  });
});
