export interface TagRule {
  pattern: RegExp;
  tags: string[];
}

export const DEFAULT_TAG_RULES: TagRule[] = [
  { pattern: /password|passwd|secret|token|apikey|api_key/i, tags: ["secret"] },
  { pattern: /email|phone|ssn|name|address/i, tags: ["pii"] },
  { pattern: /database_url|db_url|dsn|mongo_uri/i, tags: ["infra"] },
];

export function autoTagEnv(
  env: Record<string, string>,
  rules: TagRule[] = DEFAULT_TAG_RULES
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const key of Object.keys(env)) {
    const matched: string[] = [];
    for (const rule of rules) {
      if (rule.pattern.test(key)) {
        for (const tag of rule.tags) {
          if (!matched.includes(tag)) matched.push(tag);
        }
      }
    }
    if (matched.length) result[key] = matched;
  }

  return result;
}

export function formatAutoTagSuggestions(
  suggestions: Record<string, string[]>
): string {
  const lines: string[] = [];
  for (const [key, tags] of Object.entries(suggestions)) {
    lines.push(`  ${key}: ${tags.join(", ")}`);
  }
  return lines.length ? lines.join("\n") : "  (no suggestions)";
}
