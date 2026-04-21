import { WatchEvent } from './watch';

export interface WatchRule {
  id: string;
  description: string;
  check: (event: WatchEvent) => string | null;
}

export const builtinWatchRules: WatchRule[] = [
  {
    id: 'no-secret-removed',
    description: 'Warn when a key that looks like a secret is removed',
    check(event) {
      const secretPattern = /SECRET|TOKEN|KEY|PASSWORD|PASS|CREDENTIAL/i;
      const suspects = event.removed.filter((k) => secretPattern.test(k));
      if (suspects.length) {
        return `Sensitive key(s) removed: ${suspects.join(', ')}`;
      }
      return null;
    },
  },
  {
    id: 'no-bulk-change',
    description: 'Warn when more than 5 keys change at once',
    check(event) {
      const total =
        event.added.length + event.removed.length + event.changed.length;
      if (total > 5) {
        return `Large batch change detected: ${total} keys affected`;
      }
      return null;
    },
  },
  {
    id: 'no-empty-value-added',
    description: 'Warn when a key is added but appears in the changed list with no value context',
    check(event) {
      // Placeholder: real impl would inspect values via closure
      return null;
    },
  },
];

export function applyWatchRules(
  event: WatchEvent,
  rules: WatchRule[] = builtinWatchRules
): string[] {
  return rules
    .map((rule) => rule.check(event))
    .filter((msg): msg is string => msg !== null);
}

export function formatWatchWarnings(warnings: string[]): string {
  if (!warnings.length) return '';
  return warnings.map((w) => `  [WARN] ${w}`).join('\n');
}
