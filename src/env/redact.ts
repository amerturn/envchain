const SENSITIVE_PATTERNS = [
  /secret/i,
  /password/i,
  /passwd/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(key));
}

export function redactValue(value: string, mask = "***"): string {
  if (value.length === 0) return value;
  return mask;
}

export function redactEnv(
  env: Record<string, string>,
  options: { mask?: string; keys?: string[] } = {}
): Record<string, string> {
  const { mask = "***", keys = [] } = options;
  const sensitiveKeys = new Set(keys.map((k) => k.toUpperCase()));

  return Object.fromEntries(
    Object.entries(env).map(([k, v]) => {
      const upper = k.toUpperCase();
      const redact = sensitiveKeys.has(upper) || isSensitiveKey(k);
      return [k, redact ? redactValue(v, mask) : v];
    })
  );
}

export function formatRedacted(
  env: Record<string, string>,
  redacted: Record<string, string>
): string {
  return Object.entries(redacted)
    .map(([k, v]) => {
      const original = env[k];
      const masked = v !== original;
      return `${k}=${v}${masked ? " [redacted]" : ""}`;
    })
    .join("\n");
}
