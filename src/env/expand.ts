import { parseEnvFile, serializeEnvFile } from './parser';
import { readFileSync, writeFileSync } from 'fs';

export interface ExpandResult {
  original: Record<string, string>;
  expanded: Record<string, string>;
  count: number;
  keys: string[];
}

/**
 * Expands all variable references in env values using the env map itself.
 * E.g. BASE_URL=http://localhost, API_URL=$BASE_URL/api => API_URL=http://localhost/api
 */
export function expandEnvVars(
  env: Record<string, string>,
  maxPasses = 10
): Record<string, string> {
  const result: Record<string, string> = { ...env };
  const VAR_PATTERN = /\$\{?([A-Z_][A-Z0-9_]*)\}?/g;

  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    for (const key of Object.keys(result)) {
      const expanded = result[key].replace(VAR_PATTERN, (match, ref) => {
        if (ref in result && result[ref] !== result[key]) {
          changed = true;
          return result[ref];
        }
        return match;
      });
      result[key] = expanded;
    }
    if (!changed) break;
  }

  return result;
}

export function expandEnvFile(filePath: string): ExpandResult {
  const raw = readFileSync(filePath, 'utf8');
  const original = parseEnvFile(raw);
  const expanded = expandEnvVars(original);

  const changedKeys = Object.keys(expanded).filter(
    (k) => expanded[k] !== original[k]
  );

  return {
    original,
    expanded,
    count: changedKeys.length,
    keys: changedKeys,
  };
}

export function formatExpandResult(result: ExpandResult): string {
  if (result.count === 0) {
    return 'No variables were expanded.';
  }
  const lines = result.keys.map(
    (k) => `  ${k}: "${result.original[k]}" → "${result.expanded[k]}"`
  );
  return `Expanded ${result.count} variable(s):\n${lines.join('\n')}`;
}
