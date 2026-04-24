import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { prefixEnvKeys, prefixEnvFile, formatPrefixResult } from './prefix';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `prefix-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('prefixEnvKeys', () => {
  it('adds a prefix to all keys', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = prefixEnvKeys(env, 'APP_');
    expect(result.result).toEqual({ APP_FOO: 'bar', APP_BAZ: 'qux' });
    expect(result.added).toContain('APP_FOO');
    expect(result.removed).toContain('FOO');
  });

  it('strips a prefix from matching keys', () => {
    const env = { APP_FOO: 'bar', APP_BAZ: 'qux', OTHER: 'val' };
    const result = prefixEnvKeys(env, 'APP_', true);
    expect(result.result).toEqual({ FOO: 'bar', BAZ: 'qux', OTHER: 'val' });
    expect(result.added).toContain('FOO');
    expect(result.removed).toContain('APP_FOO');
  });

  it('leaves keys without the prefix unchanged when stripping', () => {
    const env = { APP_FOO: 'bar', UNRELATED: 'yes' };
    const result = prefixEnvKeys(env, 'APP_', true);
    expect(result.result['UNRELATED']).toBe('yes');
    expect(result.added).not.toContain('UNRELATED');
  });

  it('handles empty env', () => {
    const result = prefixEnvKeys({}, 'X_');
    expect(result.result).toEqual({});
    expect(result.added).toHaveLength(0);
  });
});

describe('prefixEnvFile', () => {
  let filePath: string;

  afterEach(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  it('rewrites file with prefixed keys', () => {
    filePath = tmpFile('FOO=bar\nBAZ=qux\n');
    const result = prefixEnvFile(filePath, 'TEST_');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('TEST_FOO=bar');
    expect(content).toContain('TEST_BAZ=qux');
    expect(result.added).toHaveLength(2);
  });
});

describe('formatPrefixResult', () => {
  it('formats add result', () => {
    const env = { FOO: 'bar' };
    const result = prefixEnvKeys(env, 'APP_');
    const out = formatPrefixResult(result, false);
    expect(out).toContain('added');
    expect(out).toContain('FOO → APP_FOO');
  });

  it('formats strip result', () => {
    const env = { APP_FOO: 'bar' };
    const result = prefixEnvKeys(env, 'APP_', true);
    const out = formatPrefixResult(result, true);
    expect(out).toContain('stripped');
    expect(out).toContain('APP_FOO → FOO');
  });
});
