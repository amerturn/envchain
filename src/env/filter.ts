import { parseEnvFile, serializeEnvFile } from "./parser";

export interface FilterOptions {
  keys?: string[];
  prefix?: string;
  pattern?: RegExp;
  invert?: boolean;
}

export interface FilterResult {
  matched: Record<string, string>;
  excluded: Record<string, string>;
}

export function filterEnv(
  env: Record<string, string>,
  opts: FilterOptions
): FilterResult {
  const matched: Record<string, string> = {};
  const excluded: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    let hit = false;
    if (opts.keys && opts.keys.includes(key)) hit = true;
    if (opts.prefix && key.startsWith(opts.prefix)) hit = true;
    if (opts.pattern && opts.pattern.test(key)) hit = true;
    if (opts.invert) hit = !hit;
    if (hit) matched[key] = value;
    else excluded[key] = value;
  }

  return { matched, excluded };
}

export function filterEnvFile(
  content: string,
  opts: FilterOptions
): FilterResult {
  const env = parseEnvFile(content);
  return filterEnv(env, opts);
}

export function formatFilterResult(result: FilterResult): string {
  const lines: string[] = [];
  const matchedKeys = Object.keys(result.matched);
  const excludedKeys = Object.keys(result.excluded);
  lines.push(`Matched: ${matchedKeys.length} key(s)`);
  if (matchedKeys.length > 0) {
    lines.push(serializeEnvFile(result.matched));
  }
  lines.push(`Excluded: ${excludedKeys.length} key(s)`);
  return lines.join("\n");
}
