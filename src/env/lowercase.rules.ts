export interface LowercaseWarning {
  key: string;
  message: string;
}

/**
 * Checks for potential conflicts when lowercasing keys.
 * e.g. API_KEY and api_key both present would collide.
 */
export function applyLowercaseRules(
  env: Record<string, string>
): LowercaseWarning[] {
  const warnings: LowercaseWarning[] = [];
  const seen = new Map<string, string>();

  for (const key of Object.keys(env)) {
    const lower = key.toLowerCase();
    if (seen.has(lower)) {
      warnings.push({
        key,
        message: `Key "${key}" would collide with "${seen.get(lower)}" after lowercasing`,
      });
    } else {
      seen.set(lower, key);
    }
  }

  return warnings;
}

export function formatLowercaseWarnings(warnings: LowercaseWarning[]): string {
  if (warnings.length === 0) return '';
  const lines = [`${warnings.length} collision(s) detected:`];
  for (const w of warnings) {
    lines.push(`  [WARN] ${w.message}`);
  }
  return lines.join('\n');
}
