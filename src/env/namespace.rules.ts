export interface NamespaceWarning {
  key: string;
  message: string;
}

/**
 * Validate that namespaced keys conform to conventions and detect conflicts.
 */
export function applyNamespaceRules(
  env: Record<string, string>,
  namespace: string,
  separator = '__'
): NamespaceWarning[] {
  const warnings: NamespaceWarning[] = [];
  const ns = namespace.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const prefix = `${ns}${separator}`;

  const seen = new Set<string>();
  for (const key of Object.keys(env)) {
    // Warn if key already contains the namespace prefix (double-namespacing)
    if (key.startsWith(prefix)) {
      warnings.push({ key, message: `Key already contains namespace prefix "${prefix}"` });
    }
    // Warn on non-standard characters
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      warnings.push({ key, message: `Key "${key}" does not follow UPPER_SNAKE_CASE convention` });
    }
    // Warn on duplicates (case-insensitive)
    const lower = key.toLowerCase();
    if (seen.has(lower)) {
      warnings.push({ key, message: `Duplicate key detected (case-insensitive): "${key}"` });
    }
    seen.add(lower);
  }

  return warnings;
}

export function formatNamespaceWarnings(warnings: NamespaceWarning[]): string {
  if (warnings.length === 0) return 'No namespace warnings.';
  return warnings.map(w => `  [warn] ${w.key}: ${w.message}`).join('\n');
}
