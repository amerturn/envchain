import type { EnvVar } from './resolver';

/**
 * Parses a .env style string into an array of EnvVar entries.
 * Supports comments, quoted values, and blank lines.
 */
export function parseEnvFile(content: string, source?: string): EnvVar[] {
  const vars: EnvVar[] = [];
  const lines = content.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();

    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (!key) continue;

    // Strip inline comments (outside quotes)
    value = stripInlineComment(value);

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars.push({ key, value, source });
  }

  return vars;
}

function stripInlineComment(value: string): string {
  if (value.startsWith('"') || value.startsWith("'")) return value;
  const commentIndex = value.indexOf(' #');
  return commentIndex !== -1 ? value.slice(0, commentIndex).trim() : value;
}

/**
 * Serializes env vars back to .env file format.
 */
export function serializeEnvFile(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => {
      const needsQuotes = /[\s#"']/.test(value);
      return needsQuotes ? `${key}="${value}"` : `${key}=${value}`;
    })
    .join('\n') + '\n';
}
