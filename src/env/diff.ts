/**
 * Utilities for diffing two env variable sets,
 * useful for showing what changes a target chain applies.
 */

export type EnvDiffEntry = {
  key: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: string;
  newValue?: string;
};

export function diffEnv(
  base: Record<string, string>,
  next: Record<string, string>
): EnvDiffEntry[] {
  const result: EnvDiffEntry[] = [];
  const allKeys = new Set([...Object.keys(base), ...Object.keys(next)]);

  for (const key of allKeys) {
    const inBase = Object.prototype.hasOwnProperty.call(base, key);
    const inNext = Object.prototype.hasOwnProperty.call(next, key);

    if (inBase && !inNext) {
      result.push({ key, type: 'removed', oldValue: base[key] });
    } else if (!inBase && inNext) {
      result.push({ key, type: 'added', newValue: next[key] });
    } else if (base[key] !== next[key]) {
      result.push({ key, type: 'changed', oldValue: base[key], newValue: next[key] });
    }
  }

  return result.sort((a, b) => a.key.localeCompare(b.key));
}

export function formatDiff(entries: EnvDiffEntry[]): string {
  if (entries.length === 0) return '(no changes)';

  return entries
    .map((e) => {
      if (e.type === 'added') return `+ ${e.key}=${e.newValue}`;
      if (e.type === 'removed') return `- ${e.key}=${e.oldValue}`;
      return `~ ${e.key}: ${e.oldValue} → ${e.newValue}`;
    })
    .join('\n');
}
