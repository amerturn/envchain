import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerSplitCmd } from './split-cmd';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `split-cmd-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function makeProgram() {
  const prog = new Command();
  prog.exitOverride();
  registerSplitCmd(prog);
  return prog;
}

describe('split-cmd', () => {
  let dir: string;
  let envFile: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'split-cmd-'));
    envFile = tmpFile('APP_HOST=localhost\nAPP_PORT=3000\nDB_HOST=pg\n');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    if (fs.existsSync(envFile)) fs.unlinkSync(envFile);
  });

  it('runs split with prefix strategy and writes files', () => {
    const prog = makeProgram();
    const logs: string[] = [];
    jest?.spyOn?.(console, 'log');
    prog.parse(['split', envFile, '--strategy', 'prefix', '--output-dir', dir], { from: 'user' });
    const files = fs.readdirSync(dir);
    expect(files.length).toBeGreaterThan(0);
    const appFile = files.find(f => f.startsWith('APP'));
    expect(appFile).toBeDefined();
  });

  it('dry-run does not write files', () => {
    const prog = makeProgram();
    prog.parse(['split', envFile, '--strategy', 'prefix', '--output-dir', dir, '--dry-run'], { from: 'user' });
    const files = fs.readdirSync(dir);
    expect(files.length).toBe(0);
  });

  it('exits on invalid strategy', () => {
    const prog = makeProgram();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
    expect(() =>
      prog.parse(['split', envFile, '--strategy', 'invalid', '--output-dir', dir], { from: 'user' })
    ).toThrow();
    exitSpy.mockRestore();
  });

  it('splits by alpha strategy', () => {
    const prog = makeProgram();
    prog.parse(['split', envFile, '--strategy', 'alpha', '--output-dir', dir], { from: 'user' });
    const files = fs.readdirSync(dir);
    expect(files.some(f => f.startsWith('A'))).toBe(true);
  });
});
