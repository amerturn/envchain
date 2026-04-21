import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { patchEnv, patchEnvFile, formatPatchResult, PatchOperation } from './patch';

function tmpFile(): string {
  return path.join(os.tmpdir(), `patch-test-${Date.now()}.env`);
}

describe('patchEnv', () => {
  it('applies set operation', () => {
    const env = { FOO: 'bar' };
    const result = patchEnv(env, [{ op: 'set', key: 'BAZ', value: 'qux' }]);
    expect(result.env).toEqual({ FOO: 'bar', BAZ: 'qux' });
    expect(result.applied).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
  });

  it('applies unset operation', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = patchEnv(env, [{ op: 'unset', key: 'FOO' }]);
    expect(result.env).toEqual({ BAZ: 'qux' });
    expect(result.applied).toHaveLength(1);
  });

  it('skips unset for missing key', () => {
    const env = { FOO: 'bar' };
    const result = patchEnv(env, [{ op: 'unset', key: 'MISSING' }]);
    expect(result.skipped).toHaveLength(1);
    expect(result.env).toEqual({ FOO: 'bar' });
  });

  it('applies rename operation', () => {
    const env = { OLD_KEY: 'value' };
    const result = patchEnv(env, [{ op: 'rename', key: 'OLD_KEY', newKey: 'NEW_KEY' }]);
    expect(result.env).toEqual({ NEW_KEY: 'value' });
    expect(result.applied).toHaveLength(1);
  });

  it('skips rename for missing key', () => {
    const env = { FOO: 'bar' };
    const result = patchEnv(env, [{ op: 'rename', key: 'MISSING', newKey: 'OTHER' }]);
    expect(result.skipped).toHaveLength(1);
  });

  it('skips set when value is undefined', () => {
    const env = { FOO: 'bar' };
    const result = patchEnv(env, [{ op: 'set', key: 'BAZ' }]);
    expect(result.skipped).toHaveLength(1);
  });
});

describe('patchEnvFile', () => {
  let file: string;
  beforeEach(() => { file = tmpFile(); fs.writeFileSync(file, 'FOO=bar\nBAZ=qux\n'); });
  afterEach(() => { if (fs.existsSync(file)) fs.unlinkSync(file); });

  it('patches a file and writes result', () => {
    const result = patchEnvFile(file, [{ op: 'set', key: 'NEW', value: '123' }]);
    expect(result.applied).toHaveLength(1);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('NEW=123');
  });
});

describe('formatPatchResult', () => {
  it('formats applied and skipped ops', () => {
    const ops: PatchOperation[] = [{ op: 'set', key: 'A', value: '1' }];
    const result = patchEnv({}, ops);
    const out = formatPatchResult(result);
    expect(out).toContain('Applied:');
    expect(out).toContain('set A=1');
  });
});
