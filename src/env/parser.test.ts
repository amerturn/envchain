import { parseEnvFile, serializeEnvFile } from './parser';

describe('parseEnvFile', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnvFile('FOO=bar\nBAZ=qux');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ key: 'FOO', value: 'bar' });
  });

  it('ignores blank lines and comments', () => {
    const result = parseEnvFile('# comment\n\nFOO=bar');
    expect(result).toHaveLength(1);
  });

  it('strips double-quoted values', () => {
    const result = parseEnvFile('FOO="hello world"');
    expect(result[0].value).toBe('hello world');
  });

  it('strips single-quoted values', () => {
    const result = parseEnvFile("FOO='hello'");
    expect(result[0].value).toBe('hello');
  });

  it('strips inline comments', () => {
    const result = parseEnvFile('FOO=bar # this is a comment');
    expect(result[0].value).toBe('bar');
  });

  it('attaches source when provided', () => {
    const result = parseEnvFile('FOO=bar', 'base.env');
    expect(result[0].source).toBe('base.env');
  });

  it('skips lines without equals sign', () => {
    const result = parseEnvFile('INVALID_LINE\nFOO=bar');
    expect(result).toHaveLength(1);
  });
});

describe('serializeEnvFile', () => {
  it('serializes simple vars', () => {
    const output = serializeEnvFile({ FOO: 'bar', BAZ: 'qux' });
    expect(output).toContain('FOO=bar');
    expect(output).toContain('BAZ=qux');
  });

  it('quotes values with spaces', () => {
    const output = serializeEnvFile({ MSG: 'hello world' });
    expect(output).toContain('MSG="hello world"');
  });

  it('ends with newline', () => {
    const output = serializeEnvFile({ A: '1' });
    expect(output.endsWith('\n')).toBe(true);
  });
});
