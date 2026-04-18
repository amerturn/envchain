import { loadConfigFromCwd } from '../config/loader';
import { requireTarget, getTargetNames } from '../targets/loader';
import { resolveTargetChain, flattenTargetEnv } from '../targets/target';
import { resolveEnv } from '../env/resolver';
import { spawnSync } from 'child_process';

export interface RunOptions {
  target: string;
  command: string[];
  cwd?: string;
}

export async function runWithEnv(options: RunOptions): Promise<number> {
  const { target: targetName, command, cwd = process.cwd() } = options;

  if (command.length === 0) {
    throw new Error('No command provided');
  }

  const config = await loadConfigFromCwd(cwd);
  const availableTargets = getTargetNames(config);

  if (!availableTargets.includes(targetName)) {
    throw new Error(
      `Target "${targetName}" not found. Available targets: ${availableTargets.join(', ')}`
    );
  }

  const target = requireTarget(config, targetName);
  const chain = resolveTargetChain(config, targetName);
  const flatEnv = flattenTargetEnv(chain);
  const resolved = resolveEnv(flatEnv, process.env as Record<string, string>);

  const [bin, ...args] = command;

  const result = spawnSync(bin, args, {
    cwd,
    env: { ...process.env, ...resolved },
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}
