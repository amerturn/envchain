import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig, findConfigFile } from './loader';

function writeTmp(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-'));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('loadConfig', () => {
  it('loads a valid YAML config', () => {
    const filePath = writeTmp('envchain.yml', `
version: "1"
targets:
  - name: production
    env:
      API_URL: https://api.example.com
      DB_PASS:
        key: DB_PASS
        value: secret123
        secret: true
`);
    const config = loadConfig(filePath);
    expect(config.version).toBe('1');
    expect(config.targets[0].name).toBe('production');
  });

  it('loads a valid JSON config', () => {
    const filePath = writeTmp('envchain.json', JSON.stringify({
      version: '1',
      targets: [{ name: 'staging', env: { NODE_ENV: 'staging' } }],
    }));
    const config = loadConfig(filePath);
    expect(config.targets[0].name).toBe('staging');
  });

  it('throws on missing file', () => {
    expect(() => loadConfig('/nonexistent/path/envchain.yml')).toThrow('Config file not found');
  });

  it('throws on invalid config schema', () => {
    const filePath = writeTmp('envchain.yml', `version: "1"
targets: []
`);
    expect(() => loadConfig(filePath)).toThrow('Invalid config');
  });
});

describe('findConfigFile', () => {
  it('returns null when no config file exists', () => {
    expect(findConfigFile(os.tmpdir())).toBeNull();
  });

  it('finds envchain.yml in a directory', () => {
    const filePath = writeTmp('envchain.yml', `version: "1"
targets:
  - name: dev
`);
    const dir = path.dirname(filePath);
    expect(findConfigFile(dir)).toBe(filePath);
  });
});
