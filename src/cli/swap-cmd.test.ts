import { describe, it, expect, afterEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerSwapCmd } from './swap-cmd';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `swap-cmd-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSwapCmd(program);
  return program;
}

describe('swap-cmd', () => {
  const files: string[] = [];
  afterEach(() => { for (const f of files) { try { fs.unlinkSync(f); } catch {} } files.length = 0; });

  it('swaps two keys in a file', () => {
    const file = tmpFile('FOO=hello\nBAR=world\n');
    files.push(file);
    const program = makeProgram();
    program.parse(['swap', file, '--pair', 'FOO:BAR'], { from: 'user' });
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('FOO=world');
    expect(content).toContain('BAR=hello');
  });

  it('outputs JSON when --json is passed', () => {
    const file = tmpFile('A=1\nB=2\n');
    files.push(file);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (s: string) => logs.push(s);
    const program = makeProgram();
    program.parse(['swap', file, '--pair', 'A:B', '--json'], { from: 'user' });
    console.log = orig;
    const parsed = JSON.parse(logs[0]);
    expect(parsed.swapped).toHaveLength(1);
  });

  it('dry-run does not modify file', () => {
    const file = tmpFile('X=foo\nY=bar\n');
    files.push(file);
    const program = makeProgram();
    program.parse(['swap', file, '--pair', 'X:Y', '--dry-run'], { from: 'user' });
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('X=foo');
    expect(content).toContain('Y=bar');
  });

  it('exits on missing --pair', () => {
    const file = tmpFile('A=1\n');
    files.push(file);
    const program = makeProgram();
    expect(() => program.parse(['swap', file], { from: 'user' })).toThrow();
  });
});
