import { describe, it, expect, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerLowercaseCmd } from './lowercase-cmd';

function tmpFile(content: string): string {
  const p = path.join(os.tmpdir(), `envchain-lc-test-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerLowercaseCmd(program);
  return program;
}

describe('lowercase-cmd', () => {
  let filePath: string;

  afterEach(() => {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  it('lowercases keys in file', () => {
    filePath = tmpFile('API_KEY=secret\nPORT=8080\n');
    const program = makeProgram();
    program.parse(['lowercase', filePath], { from: 'user' });
    const written = fs.readFileSync(filePath, 'utf-8');
    expect(written).toContain('api_key=secret');
    expect(written).toContain('port=8080');
  });

  it('dry-run does not modify file', () => {
    filePath = tmpFile('MY_VAR=hello\n');
    const original = fs.readFileSync(filePath, 'utf-8');
    const program = makeProgram();
    program.parse(['lowercase', '--dry-run', filePath], { from: 'user' });
    const after = fs.readFileSync(filePath, 'utf-8');
    expect(after).toBe(original);
  });

  it('exits with error for missing file', () => {
    const program = makeProgram();
    expect(() =>
      program.parse(['lowercase', '/nonexistent/.env'], { from: 'user' })
    ).toThrow();
  });
});
