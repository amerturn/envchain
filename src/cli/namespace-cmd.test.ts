import { describe, it, expect, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerNamespaceCmd } from './namespace-cmd';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `ns-cmd-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerNamespaceCmd(program);
  return program;
}

/** Reads the content of a file and returns it as a string. */
function readFile(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

describe('namespace-cmd', () => {
  let p: string;
  afterEach(() => p && fs.existsSync(p) && fs.unlinkSync(p));

  it('applies namespace prefix to file', () => {
    p = tmpFile('FOO=bar\nBAZ=qux\n');
    makeProgram().parse(['namespace', 'APP', p], { from: 'user' });
    const content = readFile(p);
    expect(content).toContain('APP__FOO=bar');
    expect(content).toContain('APP__BAZ=qux');
  });

  it('removes namespace prefix with --remove', () => {
    p = tmpFile('APP__FOO=bar\nAPP__BAZ=qux\n');
    makeProgram().parse(['namespace', 'APP', p, '--remove'], { from: 'user' });
    const content = readFile(p);
    expect(content).toContain('FOO=bar');
    expect(content).not.toContain('APP__FOO');
  });

  it('dry-run does not modify file', () => {
    p = tmpFile('KEY=val\n');
    const before = readFile(p);
    makeProgram().parse(['namespace', 'SVC', p, '--dry-run'], { from: 'user' });
    const after = readFile(p);
    expect(after).toBe(before);
  });

  it('exits with error when file not found', () => {
    const program = makeProgram();
    expect(() =>
      program.parse(['namespace', 'APP', '/nonexistent/path.env'], { from: 'user' })
    ).toThrow();
  });
});
