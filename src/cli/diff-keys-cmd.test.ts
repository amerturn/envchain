import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerDiffKeysCmd } from './diff-keys-cmd';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `dkcmd-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(p, content);
  return p;
}

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerDiffKeysCmd(program);
  return program;
}

describe('diff-keys command', () => {
  it('prints diff result for two env files', () => {
    const base = tmpFile('A=1\nB=2\n');
    const target = tmpFile('A=1\nC=3\n');
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    makeProgram().parse(['diff-keys', base, target], { from: 'user' });
    console.log = orig;
    const output = logs.join('\n');
    expect(output).toContain('+ C');
    expect(output).toContain('- B');
  });

  it('outputs JSON when --json flag is set', () => {
    const base = tmpFile('X=1\n');
    const target = tmpFile('Y=2\n');
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    makeProgram().parse(['diff-keys', '--json', base, target], { from: 'user' });
    console.log = orig;
    const parsed = JSON.parse(logs[0]);
    expect(parsed.added).toContain('Y');
    expect(parsed.removed).toContain('X');
  });

  it('shows no differences message for identical files', () => {
    const base = tmpFile('A=1\n');
    const target = tmpFile('A=1\n');
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    makeProgram().parse(['diff-keys', base, target], { from: 'user' });
    console.log = orig;
    expect(logs.join('\n')).toContain('No key differences found.');
  });
});
