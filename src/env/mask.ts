import { isSensitiveKey } from './redact';

export interface MaskOptions {
  char?: string;
  visibleChars?: number;
  keys?: string[];
}

export interface MaskResult {
  original: Record<string, string>;
  masked: Record<string, string>;
  maskedKeys: string[];
}

export function maskValue(value: string, char = '*', visibleChars = 0): string {
  if (value.length === 0) return value;
  if (visibleChars <= 0) return char.repeat(Math.min(value.length, 8));
  const visible = value.slice(-visibleChars);
  return char.repeat(Math.max(4, value.length - visibleChars)) + visible;
}

export function maskEnv(
  env: Record<string, string>,
  options: MaskOptions = {}
): MaskResult {
  const { char = '*', visibleChars = 0, keys } = options;
  const masked: Record<string, string> = {};
  const maskedKeys: string[] = [];

  for (const [k, v] of Object.entries(env)) {
    const shouldMask = keys ? keys.includes(k) : isSensitiveKey(k);
    if (shouldMask) {
      masked[k] = maskValue(v, char, visibleChars);
      maskedKeys.push(k);
    } else {
      masked[k] = v;
    }
  }

  return { original: env, masked, maskedKeys };
}

export function formatMaskResult(result: MaskResult): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(result.masked)) {
    lines.push(`${k}=${v}`);
  }
  const summary = `\n# Masked ${result.maskedKeys.length} key(s): ${result.maskedKeys.join(', ') || 'none'}`;
  return lines.join('\n') + summary;
}
