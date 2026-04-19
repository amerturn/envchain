import { Command } from 'commander';
import { registerCompareCmd } from './compare-cmd';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function tmpFile(name: string, content: string): string {
  const p = join(tmpdir(), name);
  writeFileSync(p, content);
  return p;
}

function run(args: string[]): string {
  const program = new Command();
  program.exitOverride();
  registerCompareCmd(program);
  const logs: string[] = [];
  jest.spyOn(console, 'log').mockImplementation((...a) => logs.push(a.join(' ')));
  program.parse(['node', 'envchain', ...args]);
  jest.restoreAllMocks();
  return logs.join('\n');
}

describe('compare-cmd', () => {
  const a = tmpFile('cmd_cmp_a.env', 'FOO=1\nBAR=old\n');
  const b = tmpFile('cmd_cmp_b.env', 'FOO=1\nBAR=new\nBAZ=3\n');

  it('shows formatted diff', () => {
    const out = run(['compare', a, b]);
    expect(out).toContain('~ BAR: old → new');
    expect(out).toContain('> BAZ=3');
  });

  it('outputs json when --json flag is set', () => {
    const out = run(['compare', a, b, '--json']);
    const parsed = JSON.parse(out);
    expect(parsed.changed).toHaveProperty('BAR');
  });

  it('hides unchanged with --only-changed', () => {
    const out = run(['compare', a, b, '--only-changed']);
    expect(out).not.toContain('FOO');
    expect(out).toContain('BAR');
  });
});
