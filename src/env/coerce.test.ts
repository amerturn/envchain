import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  coerceValue,
  coerceEnv,
  coerceEnvFile,
  formatCoerceResult,
} from './coerce';

function tmpFile(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content, 'utf8');
  return p;
}

describe('coerceValue', () => {
  it('coerces truthy strings to boolean true', () => {
    for (const v of ['1', 'true', 'yes', 'on', 'TRUE', 'YES']) {
      expect(coerceValue(v, 'boolean')).toBe('true');
    }
  });

  it('coerces falsy strings to boolean false', () => {
    for (const v of ['0', 'false', 'no', 'off']) {
      expect(coerceValue(v, 'boolean')).toBe('false');
    }
  });

  it('throws on unrecognised boolean value', () => {
    expect(() => coerceValue('maybe', 'boolean')).toThrow();
  });

  it('coerces numeric strings', () => {
    expect(coerceValue('42', 'number')).toBe('42');
    expect(coerceValue('3.14', 'number')).toBe('3.14');
  });

  it('throws on non-numeric string for number type', () => {
    expect(() => coerceValue('abc', 'number')).toThrow();
  });

  it('passes valid JSON through unchanged', () => {
    expect(coerceValue('{"a":1}', 'json')).toBe('{"a":1}');
  });

  it('wraps plain string in JSON quotes', () => {
    expect(coerceValue('hello', 'json')).toBe('"hello"');
  });

  it('returns string unchanged for string type', () => {
    expect(coerceValue('anything', 'string')).toBe('anything');
  });
});

describe('coerceEnv', () => {
  it('applies rules and records changes', () => {
    const env = { ENABLED: 'yes', PORT: '8080', NAME: 'app' };
    const result = coerceEnv(env, [
      { key: 'ENABLED', type: 'boolean' },
      { key: 'PORT', type: 'number' },
    ]);
    expect(result.coerced.ENABLED).toBe('true');
    expect(result.coerced.PORT).toBe('8080');
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].key).toBe('ENABLED');
    expect(result.errors).toHaveLength(0);
  });

  it('records errors for invalid coercions without throwing', () => {
    const env = { VALUE: 'not-a-number' };
    const result = coerceEnv(env, [{ key: 'VALUE', type: 'number' }]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].key).toBe('VALUE');
  });

  it('skips keys not present in env', () => {
    const result = coerceEnv({}, [{ key: 'MISSING', type: 'boolean' }]);
    expect(result.changes).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

describe('coerceEnvFile', () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'coerce-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('reads, coerces, and writes back the file', () => {
    const p = tmpFile(dir, '.env', 'DEBUG=yes\nPORT=3000\n');
    const result = coerceEnvFile(p, [
      { key: 'DEBUG', type: 'boolean' },
    ]);
    const written = readFileSync(p, 'utf8');
    expect(written).toContain('DEBUG=true');
    expect(result.changes[0].key).toBe('DEBUG');
  });
});

describe('formatCoerceResult', () => {
  it('shows no-op message when nothing changed', () => {
    const result = { original: {}, coerced: {}, changes: [], errors: [] };
    expect(formatCoerceResult(result)).toContain('No coercions applied');
  });

  it('formats changes and errors', () => {
    const result = {
      original: { A: 'yes', B: 'bad' },
      coerced: { A: 'true', B: 'bad' },
      changes: [{ key: 'A', from: 'yes', to: 'true', type: 'boolean' as const }],
      errors: [{ key: 'B', value: 'bad', type: 'number' as const, reason: 'Cannot coerce' }],
    };
    const out = formatCoerceResult(result);
    expect(out).toContain('coerced  A');
    expect(out).toContain('error    B');
    expect(out).toContain('1 coerced, 1 error(s)');
  });
});
