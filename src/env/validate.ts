import { z } from "zod";

export type ValidationRule = {
  key: string;
  required?: boolean;
  pattern?: RegExp;
  allowedValues?: string[];
};

export type ValidationResult = {
  key: string;
  valid: boolean;
  error?: string;
};

export type ValidationReport = {
  passed: ValidationResult[];
  failed: ValidationResult[];
};

export function validateEnv(
  env: Record<string, string>,
  rules: ValidationRule[]
): ValidationReport {
  const results: ValidationResult[] = rules.map((rule) => {
    const value = env[rule.key];

    if (rule.required && (value === undefined || value === "")) {
      return { key: rule.key, valid: false, error: "required but missing" };
    }

    if (value !== undefined && rule.pattern && !rule.pattern.test(value)) {
      return { key: rule.key, valid: false, error: `does not match pattern ${rule.pattern}` };
    }

    if (value !== undefined && rule.allowedValues && !rule.allowedValues.includes(value)) {
      return {
        key: rule.key,
        valid: false,
        error: `value "${value}" not in allowed set: ${rule.allowedValues.join(", ")}`,
      };
    }

    return { key: rule.key, valid: true };
  });

  return {
    passed: results.filter((r) => r.valid),
    failed: results.filter((r) => !r.valid),
  };
}

export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  if (report.failed.length === 0) {
    lines.push("✓ All validation rules passed.");
  } else {
    lines.push(`✗ ${report.failed.length} validation error(s):`);
    for (const f of report.failed) {
      lines.push(`  - ${f.key}: ${f.error}`);
    }
  }
  if (report.passed.length > 0) {
    lines.push(`✓ ${report.passed.length} rule(s) passed.`);
  }
  return lines.join("\n");
}
