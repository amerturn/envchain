export type TargetStage = 'development' | 'staging' | 'production' | string;

export interface Target {
  name: string;
  stage: TargetStage;
  extends?: string[];
  env?: Record<string, string>;
  envFile?: string;
}

export interface TargetMap {
  [name: string]: Target;
}

export function resolveTargetChain(
  targetName: string,
  targets: TargetMap,
  visited: string[] = []
): Target[] {
  if (visited.includes(targetName)) {
    throw new Error(`Circular target dependency detected: ${[...visited, targetName].join(' -> ')}`);
  }

  const target = targets[targetName];
  if (!target) {
    throw new Error(`Target "${targetName}" not found`);
  }

  const chain: Target[] = [];

  if (target.extends && target.extends.length > 0) {
    for (const parentName of target.extends) {
      const parentChain = resolveTargetChain(parentName, targets, [...visited, targetName]);
      chain.push(...parentChain);
    }
  }

  chain.push(target);
  return chain;
}

export function flattenTargetEnv(chain: Target[]): Record<string, string> {
  return chain.reduce<Record<string, string>>((acc, target) => {
    return { ...acc, ...(target.env ?? {}) };
  }, {});
}
