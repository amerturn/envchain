/**
 * Additional composable lint rules for envchain.
 * Each rule receives a key/value pair and returns a LintIssue or null.
 */
import { LintIssue } from './lint';

export type LintRule = (key: string, value: string) => LintIssue | null;

export const noPlaceholderValues: LintRule = (key, value) => {
  const placeholders = ['<your-value>', 'CHANGEME', 'TODO', 'FIXME', 'PLACEHOLDER'];
  if (placeholders.some(p => value.toUpperCase().includes(p))) {
    return { key, severity: 'error', message: `Key "${key}" appears to contain a placeholder value` };
  }
  return null;
};

export const noLocalUrls: LintRule = (key, value) => {
  if (/https?:\/\/(localhost|127\.0\.0\.1)/.test(value)) {
    return { key, severity: 'warn', message: `Key "${key}" points to a local URL — safe for dev, not for prod` };
  }
  return null;
};

export const requireHttps: LintRule = (key, value) => {
  if (key.toUpperCase().includes('URL') && value.startsWith('http://')) {
    return { key, severity: 'warn', message: `Key "${key}" uses http:// — consider https://` };
  }
  return null;
};

export const defaultRules: LintRule[] = [noPlaceholderValues, noLocalUrls, requireHttps];

export function applyRules(
  env: Record<string, string>,
  rules: LintRule[] = defaultRules
): LintIssue[] {
  const issues: LintIssue[] = [];
  for (const [key, value] of Object.entries(env)) {
    for (const rule of rules) {
      const issue = rule(key, value);
      if (issue) issues.push(issue);
    }
  }
  return issues;
}
