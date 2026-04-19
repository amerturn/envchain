import { Command } from 'commander';
import { registerImportCmd } from './import-cmd';
import fs from 'fs';
import os from 'os';
import path from 'path';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `envchain-icmd-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function run(argv: string[]): { stdout: string; code: number } {
  const logs: string[] = [];
  const spy = jest.spyOn(console, 'log').mockImplementation((...a) => logs.push(a.join(' ')));
  const program = new Command();
  program.exitOverride();
  registerImportCmdtry {
    program.parse(['node', 'envchain', ...argv]);
  } catch {}
  spy  return { stdout: logs.join('\n'), code: 0 };
}

describe('import-cmd', () => {
  it('imports vars from source into target', () => {
    const source = tmpFile('NEW_KEY=hello\n');
    const target = tmpFile('EXISTING=1\n');
    const { stdout } = run(['importtarget', target]);
    expect(stdout).toContain('NEW_KEY');
    const content = fs.readFileSync(target, 'utf8');
    expect(content).toContain('NEW_KEY=hello');
  });

  it('skips existing keys by default', () => {
    const source = tmpFile('A=99\n');
    const target = tmpFile('A=1\n');
    run(['import', source, '--target', target]);
    const content = fs.readFileSync(target, 'utf8');
    expect(content).toContain('A=1');
  });

  it('dry-run does not write file', () => {
    const source = tmpFile('Z=new\n');
    const target = tmpFile('A=1\n');
    const before = fs.readFileSync(target, 'utf8');
    run(['import', source, '--target', target, '--dry-run']);
    const after = fs.readFileSync(target, 'utf8');
    expect(after).toBe(before);
  });
});
