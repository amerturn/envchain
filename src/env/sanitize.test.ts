import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { sanitizeEnv, sanitizeEnvFile, formatSanitizeResult } from './sanitize';

const tmpFile = (content: string): string => {
  const p = join(tmpdir(), `sanitize-test-${Date.now()}.env`);
  writeFileSync(p, content, 'utf8');
  return p;
};

describe('sanitizeEnv', () => {
  it('trims whitespace from values', () => {
    const result = sanitizeEnv({ KEY: '  hello  ' }, { trimValues: true });
    expect(result.sanitized.KEY).toBe('hello');
    expect(result.trimmed).toContain('KEY');
  });

  it('removes empty values when removeEmpty is set', () => {
    const result = sanitizeEnv({ A: '', B: 'val' }, { removeEmpty: true });
    expect(result.sanitized).not.toHaveProperty('A');
    expect(result.removed).toContain('A');
    expect(result.sanitized.B).toBe('val');
  });

  it('normalizes keys to uppercase with underscores', () => {
    const result = sanitizeEnv({ 'my-key': 'v' }, { normalizeKeys: true });
    expect(result.sanitized).toHaveProperty('MY_KEY');
    expect(result.renamed['my-key']).toBe('MY_KEY');
  });

  it('applies multiple options together', () => {
    const result = sanitizeEnv(
      { 'bad-key': '  val  ', empty: '' },
      { trimValues: true, removeEmpty: true, normalizeKeys: true }
    );
    expect(result.sanitized.BAD_KEY).toBe('val');
    expect(result.removed).toContain('EMPTY');
  });

  it('returns no changes for clean env', () => {
    const result = sanitizeEnv({ KEY: 'value' });
    expect(result.removed).toHaveLength(0);
    expect(result.trimmed).toHaveLength(0);
    expect(Object.keys(result.renamed)).toHaveLength(0);
  });
});

describe('sanitizeEnvFile', () => {
  let filePath: string;

  afterEach(() => {
    try { unlinkSync(filePath); } catch {}
  });

  it('reads, sanitizes, and writes back the file', () => {
    filePath = tmpFile('KEY=  hello  \nEMPTY=\n');
    const result = sanitizeEnvFile(filePath, { trimValues: true, removeEmpty: true });
    const written = readFileSync(filePath, 'utf8');
    expect(written).toContain('KEY=hello');
    expect(written).not.toContain('EMPTY');
    expect(result.removed).toContain('EMPTY');
  });
});

describe('formatSanitizeResult', () => {
  it('shows no changes message when nothing changed', () => {
    const result = sanitizeEnv({ KEY: 'val' });
    expect(formatSanitizeResult(result)).toBe('No changes needed.');
  });

  it('reports removed and trimmed keys', () => {
    const result = sanitizeEnv({ A: '  v  ', B: '' }, { trimValues: true, removeEmpty: true });
    const output = formatSanitizeResult(result);
    expect(output).toContain('Removed');
    expect(output).toContain('Trimmed');
  });
});
