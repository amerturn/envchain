import { scopeEnvKeys, scopeEnvFile, formatScopeResult } from './scope';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `scope-test-${Date.now()}.env`);
  fs.writeFileSync(p, content);
  return p;
}

describe('scopeEnvKeys', () => {
  it('prefixes keys with scope', () => {
    const result = scopeEnvKeys({ FOO: '1', BAR: '2' }, 'APP', { mode: 'prefix' });
    expect(result).toEqual({ APP_FOO: '1', APP_BAR: '2' });
  });

  it('suffixes keys with scope', () => {
    const result = scopeEnvKeys({ FOO: '1' }, 'PROD', { mode: 'suffix' });
    expect(result).toEqual({ FOO_PROD: '1' });
  });

  it('respects custom separator', () => {
    const result = scopeEnvKeys({ KEY: 'val' }, 'NS', { mode: 'prefix', separator: '__' });
    expect(result).toEqual({ NS__KEY: 'val' });
  });

  it('returns empty object for empty input', () => {
    expect(scopeEnvKeys({}, 'X', { mode: 'prefix' })).toEqual({});
  });
});

describe('scopeEnvFile', () => {
  it('reads file and scopes keys', () => {
    const f = tmpFile('DB_HOST=localhost\nDB_PORT=5432\n');
    const result = scopeEnvFile(f, 'STAGING', { mode: 'prefix' });
    expect(result.count).toBe(2);
    expect(result.scoped).toHaveProperty('STAGING_DB_HOST', 'localhost');
    expect(result.scoped).toHaveProperty('STAGING_DB_PORT', '5432');
  });
});

describe('formatScopeResult', () => {
  it('formats result with arrows', () => {
    const result = {
      original: { FOO: '1' },
      scoped: { APP_FOO: '1' },
      count: 1,
    };
    const out = formatScopeResult(result);
    expect(out).toContain('FOO → APP_FOO');
    expect(out).toContain('Scoped 1 key(s)');
  });
});
