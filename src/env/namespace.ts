import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface NamespaceResult {
  original: Record<string, string>;
  namespaced: Record<string, string>;
  count: number;
}

/**
 * Apply a namespace prefix to all keys, grouping them under a common identifier.
 * e.g. namespaceEnvKeys({ FOO: 'bar' }, 'APP') => { APP__FOO: 'bar' }
 */
export function namespaceEnvKeys(
  env: Record<string, string>,
  namespace: string,
  separator = '__'
): NamespaceResult {
  const namespaced: Record<string, string> = {};
  const ns = namespace.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  for (const [key, value] of Object.entries(env)) {
    namespaced[`${ns}${separator}${key}`] = value;
  }
  return { original: env, namespaced, count: Object.keys(namespaced).length };
}

/**
 * Strip a namespace prefix from all matching keys.
 */
export function unnamespaceEnvKeys(
  env: Record<string, string>,
  namespace: string,
  separator = '__'
): NamespaceResult {
  const ns = namespace.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const prefix = `${ns}${separator}`;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value;
    } else {
      result[key] = value;
    }
  }
  return { original: env, namespaced: result, count: Object.keys(result).length };
}

export function namespaceEnvFile(
  filePath: string,
  namespace: string,
  separator = '__'
): NamespaceResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(content);
  const result = namespaceEnvKeys(env, namespace, separator);
  fs.writeFileSync(filePath, serializeEnvFile(result.namespaced), 'utf8');
  return result;
}

export function formatNamespaceResult(result: NamespaceResult, ns: string): string {
  const lines = [`Namespace: ${ns}`, `Keys processed: ${result.count}`, ''];
  for (const key of Object.keys(result.namespaced)) {
    lines.push(`  ${key}`);
  }
  return lines.join('\n');
}
