import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { applyDefaults, applyDefaultsFile, formatDefaultsResult } from './defaults';

function tmpFile(content: string): string {
  const file = path.join(os.tmpdir(), `defaults-test-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

describe('applyDefaults', () => {
  it('applies defaults for missing keys', () => {
    const result = applyDefaults({ FOO: 'bar' }, { FOO: 'default_foo', BAZ: 'default_baz' });
    expect(result.applied).toEqual({ BAZ: 'default_baz' });
    expect(result.skipped).toEqual({ FOO: 'bar' });
    expect(result.output.BAZ).toBe('default_baz');
    expect(result.output.FOO).toBe('bar');
  });

  it('applies defaults for empty string values', () => {
    const result = applyDefaults({ FOO: '' }, { FOO: 'filled' });
    expect(result.applied).toEqual({ FOO: 'filled' });
    expect(result.skipped).toEqual({});
    expect(result.output.FOO).toBe('filled');
  });

  it('does not overwrite non-empty existing values', () => {
    const result = applyDefaults({ KEY: 'existing' }, { KEY: 'default' });
    expect(result.skipped).toEqual({ KEY: 'existing' });
    expect(result.applied).toEqual({});
    expect(result.output.KEY).toBe('existing');
  });

  it('returns empty applied/skipped when no defaults given', () => {
    const result = applyDefaults({ A: '1' }, {});
    expect(result.applied).toEqual({});
    expect(result.skipped).toEqual({});
    expect(result.output).toEqual({ A: '1' });
  });
});

describe('applyDefaultsFile', () => {
  let file: string;

  afterEach(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  it('writes defaults into an env file', () => {
    file = tmpFile('EXISTING=hello\n');
    const result = applyDefaultsFile(file, { EXISTING: 'ignored', NEW_KEY: 'new_val' });
    expect(result.applied).toEqual({ NEW_KEY: 'new_val' });
    const written = fs.readFileSync(file, 'utf8');
    expect(written).toContain('NEW_KEY=new_val');
    expect(written).toContain('EXISTING=hello');
  });
});

describe('formatDefaultsResult', () => {
  it('shows applied and skipped keys', () => {
    const result = {
      applied: { FOO: 'bar' },
      skipped: { BAZ: 'existing' },
      output: { FOO: 'bar', BAZ: 'existing' },
    };
    const out = formatDefaultsResult(result);
    expect(out).toContain('Applied defaults');
    expect(out).toContain('+ FOO=bar');
    expect(out).toContain('Skipped');
    expect(out).toContain('~ BAZ');
  });

  it('returns message when no defaults specified', () => {
    const out = formatDefaultsResult({ applied: {}, skipped: {}, output: {} });
    expect(out).toBe('No default keys specified.');
  });
});
