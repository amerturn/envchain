import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import yargs from 'yargs';
import { registerTransformCmd } from './transform-cmd';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'tc-')); });
afterEach(() => rmSync(dir, { recursive: true }));

function envFile(name: string, content: string) {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

async function run(args: string[]) {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(' '));
  try {
    await registerTransformCmd(yargs()).parseAsync(args);
  } finally {
    console.log = orig;
  }
  return logs;
}

describe('transform-cmd', () => {
  it('reports no changes when nothing matches', async () => {
    const p = envFile('.env', 'FOO=bar\n');
    const logs = await run(['transform', p, '--keys', 'MISSING', '--uppercase']);
    expect(logs.join('\n')).toContain('No changes');
  });

  it('uppercases a value and prints diff', async () => {
    const p = envFile('.env', 'FOO=hello\n');
    const logs = await run(['transform', p, '--keys', 'FOO', '--uppercase']);
    expect(logs.join('\n')).toContain('HELLO');
  });

  it('writes file when --write flag set', async () => {
    const p = envFile('.env', 'FOO=hello\n');
    await run(['transform', p, '--keys', 'FOO', '--uppercase', '--write']);
    const content = readFileSync(p, 'utf8');
    expect(content).toContain('HELLO');
  });
});
