import { TransformOp } from './transform';

export interface TransformRule {
  match: RegExp;
  ops: TransformOp[];
  description: string;
}

export const builtinRules: TransformRule[] = [
  {
    match: /^.*_URL$/,
    ops: [{ op: 'lowercase' }],
    description: 'URL values should be lowercase',
  },
  {
    match: /^.*_(KEY|SECRET|TOKEN|PASSWORD)$/,
    ops: [{ op: 'replace', from: ' ', to: '' }],
    description: 'Secret values should not contain spaces',
  },
];

export function applyTransformRules(
  env: Record<string, string>,
  rules: TransformRule[]
): { key: string; rule: string; ops: TransformOp[] }[] {
  const suggestions: { key: string; rule: string; ops: TransformOp[] }[] = [];
  for (const key of Object.keys(env)) {
    for (const rule of rules) {
      if (rule.match.test(key)) {
        suggestions.push({ key, rule: rule.description, ops: rule.ops });
      }
    }
  }
  return suggestions;
}

export function formatTransformSuggestions(
  suggestions: ReturnType<typeof applyTransformRules>
): string {
  if (suggestions.length === 0) return 'No transform suggestions.';
  return suggestions
    .map(s => `  ${s.key}: ${s.rule}`)
    .join('\n');
}
