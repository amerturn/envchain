export interface IntersectWarning {
  key: string;
  message: string;
}

/**
 * Applies heuristic rules to the intersection result and returns warnings.
 * For example: warns when the intersected value differs between the two maps.
 */
export function applyIntersectRules(
  envA: Record<string, string>,
  envB: Record<string, string>,
  commonKeys: string[]
): IntersectWarning[] {
  const warnings: IntersectWarning[] = [];

  for (const key of commonKeys) {
    if (envA[key] !== envB[key]) {
      warnings.push({
        key,
        message: `Value differs between sources: "${envA[key]}" vs "${envB[key]}"`,
      });
    }

    if (envA[key] === '' || envB[key] === '') {
      warnings.push({
        key,
        message: `Key "${key}" has an empty value in one or both sources`,
      });
    }
  }

  return warnings;
}

export function formatIntersectWarnings(warnings: IntersectWarning[]): string {
  if (warnings.length === 0) return '';
  const lines = ['Intersection warnings:'];
  for (const w of warnings) {
    lines.push(`  [${w.key}] ${w.message}`);
  }
  return lines.join('\n');
}
