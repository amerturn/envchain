export interface ImportRule {
  name: string;
  check: (key: string, value: string) => string | null;
}

export const importRules: ImportRule[] = [
  {
    name: 'no-empty-value',
    check: (_key, value) =>
      value.trim() === '' ? 'Value is empty; consider omitting or providing a default.' : null,
  },
  {
    name: 'no-whitespace-key',
    check: (key) =>
      /\s/.test(key) ? `Key "${key}" contains whitespace, which may cause issues.` : null,
  },
  {
    name: 'no-lowercase-key',
    check: (key) =>
      key !== key.toUpperCase()
        ? `Key "${key}" is not uppercase; convention prefers uppercase env keys.`
        : null,
  },
];

export interface ImportRuleResult {
  key: string;
  warnings: string[];
}

export function applyImportRules(
  env: Record<string, string>,
  rules: ImportRule[] = importRules
): ImportRuleResult[] {
  return Object.entries(env).map(([key, value]) => ({
    key,
    warnings: rules.map((r) => r.check(key, value)).filter((w): w is string => w !== null),
  })).filter((r) => r.warnings.length > 0);
}

export function formatImportWarnings(results: ImportRuleResult[]): string {
  if (!results.length) return '';
  return results
    .map((r) => r.warnings.map((w) => `  [${r.key}] ${w}`).join('\n'))
    .join('\n');
}
