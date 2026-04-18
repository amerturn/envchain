import { renameEnvKeys, formatRenameResult } from './rename';

const base = { APP_HOST: 'localhost', APP_PORT: '3000', DEBUG: 'true' };

describe('renameEnvKeys', () => {
  it('renames existing keys', () => {
    const result = renameEnvKeys(base, [{ from: 'APP_HOST', to: 'HOST' }]);
    expect(result.renamed).toEqual([{ from: 'APP_HOST', to: 'HOST' }]);
    expect(result.output.HOST).toBe('localhost');
    expect(result.output.APP_HOST).toBeUndefined();
    expect(result.missing).toHaveLength(0);
    expect(result.conflicts).toHaveLength(0);
  });

  it('reports missing keys', () => {
    const result = renameEnvKeys(base, [{ from: 'MISSING_KEY', to: 'NEW_KEY' }]);
    expect(result.missing).toContain('MISSING_KEY');
    expect(result.renamed).toHaveLength(0);
  });

  it('reports conflict when target key already exists', () => {
    const result = renameEnvKeys(base, [{ from: 'APP_HOST', to: 'APP_PORT' }]);
    expect(result.conflicts).toContain('APP_PORT');
    expect(result.renamed).toHaveLength(0);
  });

  it('handles multiple renames', () => {
    const result = renameEnvKeys(base, [
      { from: 'APP_HOST', to: 'HOST' },
      { from: 'APP_PORT', to: 'PORT' },
    ]);
    expect(result.renamed).toHaveLength(2);
    expect(result.output).toMatchObject({ HOST: 'localhost', PORT: '3000', DEBUG: 'true' });
  });

  it('does not mutate original env', () => {
    const original = { ...base };
    renameEnvKeys(base, [{ from: 'APP_HOST', to: 'HOST' }]);
    expect(base).toEqual(original);
  });
});

describe('formatRenameResult', () => {
  it('formats renamed entries', () => {
    const result = renameEnvKeys(base, [{ from: 'APP_HOST', to: 'HOST' }]);
    const out = formatRenameResult(result);
    expect(out).toContain('APP_HOST -> HOST');
  });

  it('formats missing keys', () => {
    const result = renameEnvKeys(base, [{ from: 'NOPE', to: 'X' }]);
    const out = formatRenameResult(result);
    expect(out).toContain('Missing keys');
    expect(out).toContain('NOPE');
  });
});
