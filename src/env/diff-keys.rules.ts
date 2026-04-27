import { DiffKeysResult } from './diff-keys';

export interface DiffKeysWarning {
  key: string;
  message: string;
}

export function applyDiffKeysRules(
  result: DiffKeysResult,
  options: { warnOnRemoved?: boolean; warnOnAdded?: boolean } = {}
): DiffKeysWarning[] {
  const warnings: DiffKeysWarning[] = [];
  const { warnOnRemoved = true, warnOnAdded = false } = options;

  if (warnOnRemoved) {
    for (const key of result.removed) {
      warnings.push({ key, message: `Key "${key}" was removed from target` });
    }
  }

  if (warnOnAdded) {
    for (const key of result.added) {
      warnings.push({ key, message: `Key "${key}" is new in target` });
    }
  }

  return warnings;
}

export function formatDiffKeysWarnings(warnings: DiffKeysWarning[]): string {
  if (warnings.length === 0) return 'No warnings.';
  return warnings.map((w) => `[warn] ${w.message}`).join('\n');
}
