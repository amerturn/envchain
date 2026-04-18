import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadTargets, getTargetNames, requireTarget } from './loader';

function writeTmp(dir: string, filename: string, content: string) {
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-targets-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadTargets', () => {
  it('returns empty map when no targets defined', async () => {
    writeTmp(tmpDir, 'envchain.config.json', JSON.stringify({ version: 1 }));
    const targets = await loadTargets(tmpDir);
    expect(targets).toEqual({});
  });

  it('loads targets from config', async () => {
    const config = {
      targets: {
        dev: { stage: 'development', env: { NODE_ENV: 'development' } },
        prod: { stage: 'production', extends: ['dev'], env: { NODE_ENV: 'production' } },
      },
    };
    writeTmp(tmpDir, 'envchain.config.json', JSON.stringify(config));
    const targets = await loadTargets(tmpDir);
    expect(Object.keys(targets)).toEqual(['dev', 'prod']);
    expect(targets.dev.name).toBe('dev');
    expect(targets.prod.extends).toEqual(['dev']);
  });
});

describe('getTargetNames', () => {
  it('returns sorted keys', () => {
    const map = {
      z: { name: 'z', stage: 'z' },
      a: { name: 'a', stage: 'a' },
    };
    expect(getTargetNames(map)).toEqual(['z', 'a']);
  });
});

describe('requireTarget', () => {
  it('returns target if found', () => {
    const map = { dev: { name: 'dev', stage: 'development' } };
    expect(requireTarget('dev', map).name).toBe('dev');
  });

  it('throws with helpful message if not found', () => {
    const map = { dev: { name: 'dev', stage: 'development' } };
    expect(() => requireTarget('prod', map)).toThrow('Available targets: dev');
  });
});
