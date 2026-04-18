import { describe, it, expect } from 'vitest';
import { resolveTargetChain, flattenTargetEnv, TargetMap } from './target';

const targets: TargetMap = {
  base: {
    name: 'base',
    stage: 'development',
    env: { APP_NAME: 'envchain', LOG_LEVEL: 'info' },
  },
  staging: {
    name: 'staging',
    stage: 'staging',
    extends: ['base'],
    env: { LOG_LEVEL: 'warn', API_URL: 'https://staging.example.com' },
  },
  production: {
    name: 'production',
    stage: 'production',
    extends: ['staging'],
    env: { LOG_LEVEL: 'error', API_URL: 'https://example.com' },
  },
};

describe('resolveTargetChain', () => {
  it('returns single target with no extends', () => {
    const chain = resolveTargetChain('base', targets);
    expect(chain).toHaveLength(1);
    expect(chain[0].name).toBe('base');
  });

  it('resolves two-level chain', () => {
    const chain = resolveTargetChain('staging', targets);
    expect(chain.map(t => t.name)).toEqual(['base', 'staging']);
  });

  it('resolves three-level chain', () => {
    const chain = resolveTargetChain('production', targets);
    expect(chain.map(t => t.name)).toEqual(['base', 'staging', 'production']);
  });

  it('throws on missing target', () => {
    expect(() => resolveTargetChain('unknown', targets)).toThrow('Target "unknown" not found');
  });

  it('throws on circular dependency', () => {
    const circular: TargetMap = {
      a: { name: 'a', stage: 'dev', extends: ['b'] },
      b: { name: 'b', stage: 'dev', extends: ['a'] },
    };
    expect(() => resolveTargetChain('a', circular)).toThrow('Circular target dependency');
  });
});

describe('flattenTargetEnv', () => {
  it('merges env with later targets overriding earlier', () => {
    const chain = resolveTargetChain('production', targets);
    const env = flattenTargetEnv(chain);
    expect(env.APP_NAME).toBe('envchain');
    expect(env.LOG_LEVEL).toBe('error');
    expect(env.API_URL).toBe('https://example.com');
  });
});
