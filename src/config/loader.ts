import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { EnvChainConfig, EnvChainConfigSchema } from './schema';

const CONFIG_FILE_NAMES = ['envchain.yml', 'envchain.yaml', 'envchain.json'];

export function findConfigFile(cwd: string = process.cwd()): string | null {
  for (const name of CONFIG_FILE_NAMES) {
    const filePath = path.join(cwd, name);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

export function loadConfig(filePath: string): EnvChainConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  let parsed: unknown;
  if (ext === '.json') {
    parsed = JSON.parse(raw);
  } else if (ext === '.yml' || ext === '.yaml') {
    parsed = yaml.load(raw);
  } else {
    throw new Error(`Unsupported config format: ${ext}`);
  }

  const result = EnvChainConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid config:\n${issues}`);
  }

  return result.data;
}

export function loadConfigFromCwd(cwd?: string): EnvChainConfig {
  const filePath = findConfigFile(cwd);
  if (!filePath) {
    throw new Error('No envchain config file found. Run `envchain init` to create one.');
  }
  return loadConfig(filePath);
}
