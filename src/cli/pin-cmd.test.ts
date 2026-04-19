import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Command } from 'commander';
import { registerPinCmd } from './pin-cmd';

function tmpDir() {
  return mkdtempSync(join(tmpdir(), 'pin-cmd-'));
}

function writeEnv(dir: string, name: string, content: string) {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

describe('registerPinCmd', () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  it('pins specified keys and writes pin file', () => {
    const envFile = writeEnv(dir, '.env', 'FOO=bar\nBAZ=qux\n');
    const program = new Command();
    registerPinCmd(program);
    process.chdir(dir);
    program.parse(['node', 'envchain', 'pin', envFile, '--keys', 'FOO', '--target', 'test']);
    const { readPinFile, pinFilePath } = require('../env/pin');
    const pins = readPinFile(pinFilePath('test'));
    expect(pins['FOO']).toBe('bar');
    expect(pins['BAZ']).toBeUndefined();
  });

  it('pins all keys when no --keys flag given', () => {
    const envFile = writeEnv(dir, '.env', 'A=1\nB=2\n');
    const program = new Command();
    registerPinCmd(program);
    process.chdir(dir);
    program.parse(['node', 'envchain', 'pin', envFile, '--target', 'all']);
    const { readPinFile, pinFilePath } = require('../env/pin');
    const pins = readPinFile(pinFilePath('all'));
    expect(pins['A']).toBe('1');
    expect(pins['B']).toBe('2');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });
});
