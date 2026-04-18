import { promoteEnv, formatPromoteResult } from './promote';
import { writeSnapshot, createSnapshot } from './snapshot';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'promote-test-'));
}

const mockTarget = { name: 'prod', env: { API_URL: 'https://prod.example.com', DEBUG: 'false' } };

jest.mock('../targets/loader', () => ({
  requireTarget: (_name: string, _dir: string) => mockTarget,
}));

jest.mock('../targets/target', () => ({
  flattenTargetEnv: (t: any) => t.env,
}));

describe('promoteEnv', () => {
  it('applies new keys from snapshot to target', async () => {
    const dir = tmpDir();
    const snap = createSnapshot('staging', { API_URL: 'https://staging.example.com', NEW_KEY: 'hello' });
    await writeSnapshot(dir, 'staging', snap);

    const result = await promoteEnv('staging', 'prod', dir, '/cfg');
    expect(result.applied['NEW_KEY']).toBe('hello');
    expect(result.skipped).toContain('API_URL');
  });

  it('overwrites changed keys when overwrite=true', async () => {
    const dir = tmpDir();
    const snap = createSnapshot('staging', { API_URL: 'https://staging.example.com' });
    await writeSnapshot(dir, 'staging', snap);

    const result = await promoteEnv('staging', 'prod', dir, '/cfg', true);
    expect(result.applied['API_URL']).toBe('https://staging.example.com');
    expect(result.skipped).toHaveLength(0);
  });

  it('throws if no snapshot exists for source target', async () => {
    const dir = tmpDir();
    await expect(promoteEnv('ghost', 'prod', dir, '/cfg')).rejects.toThrow('No snapshot found');
  });
});

describe('formatPromoteResult', () => {
  it('formats result with applied and skipped', () => {
    const out = formatPromoteResult({ from: 'staging', to: 'prod', applied: { FOO: 'bar' }, skipped: ['BAZ'] });
    expect(out).toContain('staging → prod');
    expect(out).toContain('+ FOO=bar');
    expect(out).toContain('~ BAZ');
  });
});
