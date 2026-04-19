import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runWithEnv } from './run';

vi.mock('../config/loader', () => ({
  loadConfigFromCwd: vi.fn(),
}));

vi.mock('../targets/loader', () => ({
  getTargetNames: vi.fn(),
  requireTarget: vi.fn(),
}));

vi.mock('../targets/target', () => ({
  resolveTargetChain: vi.fn(),
  flattenTargetEnv: vi.fn(),
}));

vi.mock('../env/resolver', () => ({
  resolveEnv: vi.fn(),
}));

vi.mock('child_process', () => ({
  spawnSync: vi.fn(),
}));

import { loadConfigFromCwd } from '../config/loader';
import { getTargetNames, requireTarget } from '../targets/loader';
import { resolveTargetChain, flattenTargetEnv } from '../targets/target';
import { resolveEnv } from '../env/resolver';
import { spawnSync } from 'child_process';

beforeEach(() => vi.clearAllMocks());

describe('runWithEnv', () => {
  it('throws if command is empty', async () => {
    await expect(runWithEnv({ target: 'dev', command: [] })).rejects.toThrow('No command provided');
  });

  it('throws if target not found', async () => {
    vi.mocked(loadConfigFromCwd).mockResolvedValue({} as any);
    vi.mocked(getTargetNames).mockReturnValue(['prod']);
    await expect(runWithEnv({ target: 'dev', command: ['echo', 'hi'] })).rejects.toThrow(
      'Target "dev" not found'
    );
  });

  it('spawns command with resolved env and returns exit code', async () => {
    vi.mocked(loadConfigFromCwd).mockResolvedValue({} as any);
    vi.mocked(getTargetNames).mockReturnValue(['dev']);
    vi.mocked(requireTarget).mockReturnValue({} as any);
    vi.mocked(resolveTargetChain).mockReturnValue([]);
    vi.mocked(flattenTargetEnv).mockReturnValue({ APP_ENV: 'dev' });
    vi.mocked(resolveEnv).mockReturnValue({ APP_ENV: 'dev' });
    vi.mocked(spawnSync).mockReturnValue({ status: 0, error: undefined } as any);

    const code = await runWithEnv({ target: 'dev', command: ['echo', 'hello'] });

    expect(spawnSync).toHaveBeenCalledWith('echo', ['hello'], expect.objectContaining({
      env: expect.objectContaining({ APP_ENV: 'dev' }),
      stdio: 'inherit',
    }));
    expect(code).toBe(0);
  });

  it('returns non-zero exit code when process exits with failure', async () => {
    vi.mocked(loadConfigFromCwd).mockResolvedValue({} as any);
    vi.mocked(getTargetNames).mockReturnValue(['dev']);
    vi.mocked(requireTarget).mockReturnValue({} as any);
    vi.mocked(resolveTargetChain).mockReturnValue([]);
    vi.mocked(flattenTargetEnv).mockReturnValue({});
    vi.mocked(resolveEnv).mockReturnValue({});
    vi.mocked(spawnSync).mockReturnValue({ status: 1, error: undefined } as any);

    const code = await runWithEnv({ target: 'dev', command: ['exit', '1'] });
    expect(code).toBe(1);
  });

  it('throws if spawnSync returns an error', async () => {
    vi.mocked(loadConfigFromCwd).mockResolvedValue({} as any);
    vi.mocked(getTargetNames).mockReturnValue(['dev']);
    vi.mocked(requireTarget).mockReturnValue({} as any);
    vi.mocked(resolveTargetChain).mockReturnValue([]);
    vi.mocked(flattenTargetEnv).mockReturnValue({});
    vi.mocked(resolveEnv).mockReturnValue({});
    vi.mocked(spawnSync).mockReturnValue({ status: null, error: new Error('ENOENT') } as any);

    await expect(runWithEnv({ target: 'dev', command: ['missing-bin'] })).rejects.toThrow('ENOENT');
  });
});
