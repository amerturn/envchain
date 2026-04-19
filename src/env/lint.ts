import { isSensitiveKey } from './redact';

export interface LintIssue {
  key: string;
  severity: 'error' | 'warn';
  message: string;
}

export interface LintResult {
  target: string;
  issues: LintIssue[];
  ok: boolean;
}

export function lintEnv(target: string, env: Record<string, string>): LintResult {
  const issues: LintIssue[] = [];

  for (const [key, value] of Object.entries(env)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      issues.push({ key, severity: 'warn', message: `Key "${key}" should be UPPER_SNAKE_CASE` });
    }
    if (value.trim() === '') {
      issues.push({ key, severity: 'warn', message: `Key "${key}" has an empty value` });
    }
    if (isSensitiveKey(key) && value.length < 8) {
      issues.push({ key, severity: 'error', message: `Sensitive key "${key}" has a suspiciously short value` });
    }
    if (value.includes('\n')) {
      issues.push({ key, severity: 'warn', message: `Key "${key}" contains newline characters` });
    }
  }

  return { target, issues, ok: issues.every(i => i.severity !== 'error') };
}

export function formatLintResult(result: LintResult): string {
  if (result.issues.length === 0) {
    return `✔ ${result.target}: no issues found`;
  }
  const lines = [`${result.ok ? '⚠' : '✖'} ${result.target}: ${result.issues.length} issue(s)`];
  for (const issue of result.issues) {
    const icon = issue.severity === 'error' ? '  [error]' : '  [warn] ';
    lines.push(`${icon} ${issue.key}: ${issue.message}`);
  }
  return lines.join('\n');
}

/**
 * Merges lint results from multiple targets into a summary result.
 * The combined result is ok only if all individual results are ok.
 */
export function mergeLintResults(results: LintResult[]): LintResult {
  const issues = results.flatMap(r => r.issues);
  const targets = results.map(r => r.target).join(', ');
  return {
    target: targets,
    issues,
    ok: results.every(r => r.ok),
  };
}
