import { Command } from 'commander';
import { registerIntersectCmd } from './intersect-cmd';
import fs from 'fs';
import os from 'os';
import path from 'path';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `envchain-icmd-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(p, content);
  return p;
}

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerIntersectCmd(program);
  return program;
}

describe('intersect command', () => {
  it('prints intersection to stdout', () => {
    const a = tmpFile('FOO=1\nBAR=2\n');
    const b = tmpFile('FOO=x\nBAZ=3\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    makeProgram().parse(['intersect', a, b], { from: 'user' });
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('FOO=1');
    expect(output).toContain('1 key(s) in common');
    spy.mockRestore();
  });

  it('writes output to file with --output', () => {
    const a = tmpFile('FOO=1\nBAR=2\n');
    const b = tmpFile('FOO=x\nBAR=y\n');
    const out = path.join(os.tmpdir(), `envchain-icmd-out-${Date.now()}.env`);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    makeProgram().parse(['intersect', a, b, '--output', out], { from: 'user' });
    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('FOO=1');
    expect(content).toContain('BAR=2');
    spy.mockRestore();
    fs.unlinkSync(out);
  });

  it('prints only keys with --no-values', () => {
    const a = tmpFile('FOO=1\n');
    const b = tmpFile('FOO=x\n');
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((v) => logs.push(v));
    makeProgram().parse(['intersect', a, b, '--no-values'], { from: 'user' });
    expect(logs).toContain('FOO');
    expect(logs.some((l) => l.includes('='))).toBe(false);
    jest.restoreAllMocks();
  });
});
