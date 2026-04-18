import { loadConfig } from '../config/loader';
import { Target, TargetMap } from './target';

export interface EnvchainConfig {
  targets?: Record<string, Omit<Target, 'name'>>;
  [key: string]: unknown;
}

export async function loadTargets(cwd: string = process.cwd()): Promise<TargetMap> {
  const raw = await loadConfig(cwd) as EnvchainConfig;

  if (!raw.targets || typeof raw.targets !== 'object') {
    return {};
  }

  const targetMap: TargetMap = {};

  for (const [name, def] of Object.entries(raw.targets)) {
    targetMap[name] = {
      name,
      stage: def.stage ?? name,
      extends: def.extends,
      env: def.env,
      envFile: def.envFile,
    };
  }

  return targetMap;
}

export function getTargetNames(targets: TargetMap): string[] {
  return Object.keys(targets);
}

export function requireTarget(name: string, targets: TargetMap): Target {
  const target = targets[name];
  if (!target) {
    const available = getTargetNames(targets);
    throw new Error(
      `Target "${name}" not found. Available targets: ${available.join(', ') || '(none)'}`
    );
  }
  return target;
}
