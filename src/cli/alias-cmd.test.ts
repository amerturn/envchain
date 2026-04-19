import { Command } from 'commander';
import { registerAliasCmd } from './alias-cmd';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpFile(content: string): string {
  const f = path.join(os.tmpdir(), `alias-cmd-${Date.now()}.env`);
  fs.writeFileSync(f, content);
  return f;
}

function run(args: string[]): string {
  const logs: string[] = [];
  const spy = jest.spyOn(console, 'log').mockImplementation((...a) => logs.push(a.join(' ')));
  const program = new Command();
  program.exitOverride();
  registerAliasCmd(program);
  try { program.parse(['node', 'envchain', ...args]); } catch {}
  spy.mockRestore();
  return logs.join('\n');
}

describe('alias-cmd', () => {
  it('renames a key and prints result', () => {
    const f = tmpFile('FOO=bar\nBAZ=qux\n');
    const out = run(['alias', f, '-m', 'FOO=FOO_NEW']);
    expect(out).toContain('FOO → FOO_NEW');
    expect(out).toContain('FOO_NEW=bar');
  });

  it('shows suggestions with --suggest', () => {
    const f = tmpFile('DATABASE_URL=postgres://localhost/db\n');
    const out = run(['alias', f, '--suggest']);
    expect(out).toContain('DATABASE_URL → DB_URL');
  });

  it('writes file with --write', () => {
    const f = tmpFile('A=1\n');
    run(['alias', f, '-m', 'A=ALPHA', '--write']);
    const content = fs.readFileSync(f, 'utf8');
    expect(content).toContain('ALPHA=1');
  });
});
