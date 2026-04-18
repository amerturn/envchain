import { normalizeEnvVar } from '../config/schema';

export interface EnvVar {
  key: string;
  value: string;
  source?: string;
}

export interface ResolvedEnv {
  vars: Record<string, string>;
  sources: Record<string, string>;
}

/**
 * Merges multiple env layers, later layers take precedence.
 */
export function mergeEnvLayers(layers: EnvVar[][]): ResolvedEnv {
  const vars: Record<string, string> = {};
  const sources: Record<string, string> = {};

  for (const layer of layers) {
    for (const entry of layer) {
      const key = normalizeEnvVar(entry.key);
      vars[key] = entry.value;
      if (entry.source) {
        sources[key] = entry.source;
      }
    }
  }

  return { vars, sources };
}

/**
 * Resolves variable interpolation like ${VAR_NAME} within values.
 */
export function interpolateEnvVars(vars: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(vars)) {
    resolved[key] = value.replace(/\$\{([^}]+)\}/g, (_, name) => {
      const normalized = normalizeEnvVar(name);
      return vars[normalized] ?? process.env[normalized] ?? '';
    });
  }

  return resolved;
}

/**
 * Full resolution pipeline: merge layers then interpolate.
 */
export function resolveEnv(layers: EnvVar[][]): ResolvedEnv {
  const merged = mergeEnvLayers(layers);
  merged.vars = interpolateEnvVars(merged.vars);
  return merged;
}
