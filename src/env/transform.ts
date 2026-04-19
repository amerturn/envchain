export type TransformOp =
  | { op: 'uppercase' }
  | { op: 'lowercase' }
  | { op: 'prefix'; value: string }
  | { op: 'suffix'; value: string }
  | { op: 'replace'; from: string; to: string };

export interface TransformResult {
  original: Record<string, string>;
  transformed: Record<string, string>;
  changes: { key: string; before: string; after: string }[];
}

export function transformEnvValues(
  env: Record<string, string>,
  keys: string[],
  ops: TransformOp[]
): TransformResult {
  const transformed = { ...env };
  const changes: TransformResult['changes'] = [];

  for (const key of keys) {
    if (!(key in env)) continue;
    let val = env[key];
    const before = val;
    for (const op of ops) {
      if (op.op === 'uppercase') val = val.toUpperCase();
      else if (op.op === 'lowercase') val = val.toLowerCase();
      else if (op.op === 'prefix') val = op.value + val;
      else if (op.op === 'suffix') val = val + op.value;
      else if (op.op === 'replace') val = val.split(op.from).join(op.to);
    }
    if (val !== before) {
      transformed[key] = val;
      changes.push({ key, before, after: val });
    }
  }

  return { original: env, transformed, changes };
}

export function formatTransformResult(result: TransformResult): string {
  if (result.changes.length === 0) return 'No changes made.';
  return result.changes
    .map(c => `  ${c.key}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)}`)
    .join('\n');
}
