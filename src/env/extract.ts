import { parseEnvFile, serializeEnvFile } from './parser';

export interface ExtractResult {
  extracted: Record<string, string>;
  remaining: Record<string, string>;
  keys: string[];
}

export function extractEnvKeys(
  env: Record<string, string>,
  keys: string[]
): ExtractResult {
  const extracted: Record<string, string> = {};
  const remaining: Record<string, string> = { ...env };

  for (const key of keys) {
    if (key in remaining) {
      extracted[key] = remaining[key];
      delete remaining[key];
    }
  }

  return { extracted, remaining, keys: Object.keys(extracted) };
}

export function extractEnvFile(
  source: string,
  keys: string[]
): { extractedContent: string; remainingContent: string; keys: string[] } {
  const env = parseEnvFile(source);
  const result = extractEnvKeys(env, keys);
  return {
    extractedContent: serializeEnvFile(result.extracted),
    remainingContent: serializeEnvFile(result.remaining),
    keys: result.keys,
  };
}

export function formatExtractResult(result: ExtractResult): string {
  const lines: string[] = [];
  if (result.keys.length === 0) {
    lines.push('No matching keys found.');
  } else {
    lines.push(`Extracted ${result.keys.length} key(s):`);
    for (const key of result.keys) {
      lines.push(`  + ${key}`);
    }
    lines.push(`Remaining: ${Object.keys(result.remaining).length} key(s)`);
  }
  return lines.join('\n');
}
