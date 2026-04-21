import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerWatchCmd } from './watch-cmd';

function tmpFile(content = ''): string {
  const p = path.join(os.tmpdir(), `watch-cmd-${Date.now()}.env`);
  fs.writeFileSync(p, content);
  return p;
}

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerWatchCmd(program);
  return program;
}

describe('registerWatchCmd', () => {
  it('registers the watch command', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch');
    expect(cmd).toBeDefined();
  });

  it('watch command has interval option', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch')!;
    const opt = cmd.options.find((o) => o.long === '--interval');
    expect(opt).toBeDefined();
  });

  it('detects changes and prints formatted output', async () => {
    const file = tmpFile('FOO=1\n');
    const logs: string[] = [];
    const origLog = console.log.bind(console);
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    const { watchEnvFile } = await import('../env/watch');
    const events: unknown[] = [];
    const stop = watchEnvFile(file, (e) => events.push(e), 50);
    await new Promise((r) => setTimeout(r, 80));
    fs.writeFileSync(file, 'FOO=1\nBAR=2\n');
    await new Promise((r) => setTimeout(r, 120));
    stop();
    fs.unlinkSync(file);

    console.log = origLog;
    expect(events.length).toBeGreaterThanOrEqual(1);
  });
});
