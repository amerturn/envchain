import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface TemplateResult {
  output: Record<string, string>;
  missing: string[];
  substituted: string[];
}

/**
 * Replace ${VAR} or $VAR placeholders in env values using a context map.
 * Values that reference missing context keys are left as empty strings.
 */
export function applyTemplate(
  env: Record<string, string>,
  context: Record<string, string>
): TemplateResult {
  const output: Record<string, string> = {};
  const missing: string[] = [];
  const substituted: string[] = [];

  const placeholder = /\$\{([A-Z0-9_]+)\}|\$([A-Z0-9_]+)/g;

  for (const [key, value] of Object.entries(env)) {
    let resolved = value;
    let hadMissing = false;
    let hadSub = false;

    resolved = value.replace(placeholder, (_match, braced, bare) => {
      const ref = braced ?? bare;
      if (ref in context) {
        hadSub = true;
        return context[ref];
      }
      hadMissing = true;
      return '';
    });

    output[key] = resolved;
    if (hadMissing) missing.push(key);
    if (hadSub) substituted.push(key);
  }

  return { output, missing, substituted };
}

export function applyTemplateFile(
  envPath: string,
  context: Record<string, string>
): TemplateResult {
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = parseEnvFile(raw);
  return applyTemplate(env, context);
}

export function formatTemplateResult(result: TemplateResult): string {
  const lines: string[] = [];
  if (result.substituted.length) {
    lines.push(`Substituted (${result.substituted.length}): ${result.substituted.join(', ')}`);
  }
  if (result.missing.length) {
    lines.push(`Missing refs (${result.missing.length}): ${result.missing.join(', ')}`);
  }
  if (!lines.length) lines.push('No placeholders found.');
  return lines.join('\n');
}
