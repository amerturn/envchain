import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  uppercaseEnvKeys,
  uppercaseEnvFile,
  formatUppercaseResult,
} from './uppercase';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `uppercase-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('uppercaseEnvKeys', () => {
  it('uppercases lowercase keys', () => {
    const result = uppercaseEnvKeys({ api_key: 'abc', host: 'localhost' });
    expect(result.transformed).toEqual({ API_KEY: 'abc', HOST: 'localhost' });
    expect(result.renamedKeys).toHaveLength(2);
    expect(result.unchanged).toHaveLength(0);
  });

  it('leaves already-uppercase keys unchanged', () => {
    const result = uppercaseEnvKeys({ API_KEY: 'abc', HOST: 'localhost' });
    expect(result.transformed).toEqual({ API_KEY: 'abc', HOST: 'localhost' });
    expect(result.renamedKeys).toHaveLength(0);
    expect(result.unchanged).toEqual(['API_KEY', 'HOST']);
  });

  it('handles mixed-case keys', () => {
    const result = uppercaseEnvKeys({ Api_Key: 'x', ALREADY: 'y' });
    expect(result.transformed).toEqual({ API_KEY: 'x', ALREADY: 'y' });
    expect(result.renamedKeys).toEqual([{ from: 'Api_Key', to: 'API_KEY' }]);
    expect(result.unchanged).toEqual(['ALREADY']);
  });

  it('preserves values during rename', () => {
    const result = uppercaseEnvKeys({ secret: 'hunter2' });
    expect(result.transformed['SECRET']).toBe('hunter2');
  });
});

describe('uppercaseEnvFile', () => {
  let file: string;

  afterEach(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  it('rewrites file with uppercased keys', () => {
    file = tmpFile('db_host=localhost\ndb_port=5432\n');
    const result = uppercaseEnvFile(file);
    const written = fs.readFileSync(file, 'utf-8');
    expect(written).toContain('DB_HOST=localhost');
    expect(written).toContain('DB_PORT=5432');
    expect(result.renamedKeys).toHaveLength(2);
  });
});

describe('formatUppercaseResult', () => {
  it('reports all-uppercase message when nothing changed', () => {
    const result = uppercaseEnvKeys({ FOO: 'bar' });
    expect(formatUppercaseResult(result)).toMatch(/already uppercase/i);
  });

  it('lists renamed keys', () => {
    const result = uppercaseEnvKeys({ foo: '1', BAR: '2' });
    const output = formatUppercaseResult(result);
    expect(output).toContain('foo → FOO');
    expect(output).toContain('Unchanged: BAR');
  });
});
