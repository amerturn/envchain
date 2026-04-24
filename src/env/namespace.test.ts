import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  namespaceEnvKeys,
  unnamespaceEnvKeys,
  namespaceEnvFile,
  formatNamespaceResult,
} from './namespace';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `ns-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('namespaceEnvKeys', () => {
  it('prefixes all keys with namespace', () => {
    const result = namespaceEnvKeys({ FOO: 'bar', BAZ: 'qux' }, 'APP');
    expect(result.namespaced).toEqual({ APP__FOO: 'bar', APP__BAZ: 'qux' });
    expect(result.count).toBe(2);
  });

  it('normalises namespace to uppercase', () => {
    const result = namespaceEnvKeys({ KEY: 'val' }, 'myapp');
    expect(Object.keys(result.namespaced)[0]).toBe('MYAPP__KEY');
  });

  it('supports custom separator', () => {
    const result = namespaceEnvKeys({ KEY: 'val' }, 'SVC', '_');
    expect(result.namespaced).toEqual({ SVC_KEY: 'val' });
  });
});

describe('unnamespaceEnvKeys', () => {
  it('strips matching namespace prefix', () => {
    const env = { APP__FOO: 'bar', APP__BAZ: 'qux', OTHER: 'keep' };
    const result = unnamespaceEnvKeys(env, 'APP');
    expect(result.namespaced).toEqual({ FOO: 'bar', BAZ: 'qux', OTHER: 'keep' });
  });

  it('leaves non-matching keys unchanged', () => {
    const env = { X__KEY: 'v' };
    const result = unnamespaceEnvKeys(env, 'APP');
    expect(result.namespaced).toEqual({ X__KEY: 'v' });
  });
});

describe('namespaceEnvFile', () => {
  let p: string;
  afterEach(() => fs.existsSync(p) && fs.unlinkSync(p));

  it('rewrites file with namespaced keys', () => {
    p = tmpFile('FOO=bar\nBAZ=qux\n');
    const result = namespaceEnvFile(p, 'SVC');
    const content = fs.readFileSync(p, 'utf8');
    expect(content).toContain('SVC__FOO=bar');
    expect(content).toContain('SVC__BAZ=qux');
    expect(result.count).toBe(2);
  });
});

describe('formatNamespaceResult', () => {
  it('includes namespace and key list', () => {
    const result = namespaceEnvKeys({ A: '1' }, 'NS');
    const out = formatNamespaceResult(result, 'NS');
    expect(out).toContain('Namespace: NS');
    expect(out).toContain('NS__A');
  });
});
