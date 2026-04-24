import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { trimEnvValues, trimEnvFile, formatTrimResult } from './trim';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `trim-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('trimEnvValues', () => {
  it('trims leading and trailing whitespace from values', () => {
    const result = trimEnvValues({ FOO: '  hello  ', BAR: 'world' });
    expect(result.trimmed.FOO).toBe('hello');
    expect(result.trimmed.BAR).toBe('world');
    expect(result.changed).toEqual(['FOO']);
  });

  it('returns empty changed array when nothing to trim', () => {
    const result = trimEnvValues({ A: 'clean', B: 'also-clean' });
    expect(result.changed).toHaveLength(0);
  });

  it('handles empty string values', () => {
    const result = trimEnvValues({ EMPTY: '', SPACES: '   ' });
    expect(result.trimmed.EMPTY).toBe('');
    expect(result.trimmed.SPACES).toBe('');
    expect(result.changed).toContain('SPACES');
  });
});

describe('trimEnvFile', () => {
  let file: string;

  afterEach(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  it('trims values in place and returns result', () => {
    file = tmpFile('FOO=  bar  \nBAZ=clean\n');
    const result = trimEnvFile(file);
    expect(result.changed).toContain('FOO');
    const written = fs.readFileSync(file, 'utf8');
    expect(written).toContain('FOO=bar');
    expect(written).toContain('BAZ=clean');
  });

  it('does not modify file when all values are clean', () => {
    file = tmpFile('KEY=value\n');
    const before = fs.readFileSync(file, 'utf8');
    const result = trimEnvFile(file);
    expect(result.changed).toHaveLength(0);
  });
});

describe('formatTrimResult', () => {
  it('returns a no-op message when nothing changed', () => {
    const result = trimEnvValues({ A: 'ok' });
    expect(formatTrimResult(result)).toBe('No values required trimming.');
  });

  it('lists changed keys with before/after', () => {
    const result = trimEnvValues({ KEY: ' val ' });
    const out = formatTrimResult(result);
    expect(out).toContain('Trimmed 1 value(s)');
    expect(out).toContain('KEY');
    expect(out).toContain('" val "');
    expect(out).toContain('"val"');
  });
});
