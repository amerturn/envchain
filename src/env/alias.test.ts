import { aliasEnvKeys, aliasEnvFile, formatAliasResult } from './alias';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpFile(content: string): string {
  const f = path.join(os.tmpdir(), `alias-test-${Date.now()}.env`);
  fs.writeFileSync(f, content);
  return f;
}

describe('aliasEnvKeys', () => {
  const env = { FOO: 'bar', BAZ: 'qux' };

  it('renames key', () => {
    const r = aliasEnvKeys(env, { FOO: 'FOO_NEW' });
    expect(r.output['FOO_NEW']).toBe('bar');
    expect('FOO' in r.output).toBe(false);
    expect(r.aliased).toEqual({ FOO: 'FOO_NEW' });
  });

  it('keeps original when flag set', () => {
    const r = aliasEnvKeys(env, { FOO: 'FOO_ALIAS' }, true);
    expect(r.output['FOO']).toBe('bar');
    expect(r.output['FOO_ALIAS']).toBe('bar');
  });

  it('records skipped keys', () => {
    const r = aliasEnvKeys(env, { MISSING: 'X' });
    expect(r.skipped).toContain('MISSING');
  });
});

describe('aliasEnvFile', () => {
  it('reads file and aliases', () => {
    const f = tmpFile('A=1\nB=2\n');
    const r = aliasEnvFile(f, { A: 'ALPHA' });
    expect(r.output['ALPHA']).toBe('1');
    expect('A' in r.output).toBe(false);
  });
});

describe('formatAliasResult', () => {
  it('formats aliased keys', () => {
    const r = aliasEnvKeys({ FOO: 'bar' }, { FOO: 'FOO_NEW' });
    expect(formatAliasResult(r)).toContain('FOO → FOO_NEW');
  });

  it('shows no keys aliased', () => {
    const r = aliasEnvKeys({}, {});
    expect(formatAliasResult(r)).toBe('  no keys aliased');
  });
});
