import { groupEnvKeys, formatGroupResult } from './group';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `group-test-${Date.now()}.env`);
  fs.writeFileSync(p, content);
  return p;
}

describe('groupEnvKeys', () => {
  it('groups keys by prefix', () => {
    const env = { DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'test', PLAIN: 'val' };
    const result = groupEnvKeys(env);
    expect(result.groups['DB']).toEqual({ HOST: 'localhost', PORT: '5432' });
    expect(result.groups['APP']).toEqual({ NAME: 'test' });
    expect(result.ungrouped).toEqual({ PLAIN: 'val' });
  });

  it('returns all keys as ungrouped when no delimiter found', () => {
    const env = { FOO: '1', BAR: '2' };
    const result = groupEnvKeys(env);
    expect(result.groups).toEqual({});
    expect(result.ungrouped).toEqual({ FOO: '1', BAR: '2' });
  });

  it('supports custom delimiter', () => {
    const env = { 'DB.HOST': 'localhost', 'DB.PORT': '5432' };
    const result = groupEnvKeys(env, '.');
    expect(result.groups['DB']).toEqual({ HOST: 'localhost', PORT: '5432' });
  });

  it('handles empty env', () => {
    const result = groupEnvKeys({});
    expect(result.groups).toEqual({});
    expect(result.ungrouped).toEqual({});
  });

  it('handles keys with multiple delimiters by grouping on first occurrence', () => {
    const env = { DB_HOST_PRIMARY: 'host1', DB_HOST_SECONDARY: 'host2' };
    const result = groupEnvKeys(env);
    expect(result.groups['DB']).toEqual({ HOST_PRIMARY: 'host1', HOST_SECONDARY: 'host2' });
  });
});

describe('formatGroupResult', () => {
  it('formats grouped output', () => {
    const result = {
      groups: { DB: { HOST: 'localhost' } },
      ungrouped: { PLAIN: 'val' },
    };
    const out = formatGroupResult(result);
    expect(out).toContain('[DB]');
    expect(out).toContain('HOST=localhost');
    expect(out).toContain('[ungrouped]');
    expect(out).toContain('PLAIN=val');
    expect(out).toContain('1 group(s)');
  });

  it('omits ungrouped section when all keys are grouped', () => {
    const result = {
      groups: { DB: { HOST: 'localhost' } },
      ungrouped: {},
    };
    const out = formatGroupResult(result);
    expect(out).not.toContain('[ungrouped]');
  });
});
