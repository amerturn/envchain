export interface AliasSuggestion {
  key: string;
  suggestedAlias: string;
  reason: string;
}

const COMMON_ALIASES: Record<string, string> = {
  DATABASE_URL: 'DB_URL',
  POSTGRES_URL: 'DB_URL',
  REDIS_URL: 'CACHE_URL',
  SECRET_KEY: 'APP_SECRET',
  API_KEY: 'SERVICE_API_KEY',
};

export function suggestAliases(
  env: Record<string, string>
): AliasSuggestion[] {
  const suggestions: AliasSuggestion[] = [];
  for (const key of Object.keys(env)) {
    if (COMMON_ALIASES[key]) {
      suggestions.push({
        key,
        suggestedAlias: COMMON_ALIASES[key],
        reason: 'conventional alias',
      });
    }
    if (key.startsWith('REACT_APP_')) {
      suggestions.push({
        key,
        suggestedAlias: key.replace('REACT_APP_', 'VITE_'),
        reason: 'Vite migration alias',
      });
    }
  }
  return suggestions;
}

export function formatAliasSuggestions(suggestions: AliasSuggestion[]): string {
  if (!suggestions.length) return '  no alias suggestions';
  return suggestions
    .map(s => `  ${s.key} → ${s.suggestedAlias} (${s.reason})`)
    .join('\n');
}
