import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerMergeCmd } from './merge-cmd';
import * as loader from '../config/loader';
import * as targetLoader from '../targets/loader';
import * as target from '../targets/target';
import * as merge from '../env/merge';

vi.mock('../config/loader');
vi.mock('../targets/loader');
vi.mock('../targets/target');
vi.mock('../env/merge');
vi.mock('../env/parser', () => ({ serializeEnvFile: (e: Record<string,string>) => Object.entries(e).map(([k,v]) => `${k}=${v}`).join('\n') }));

const mockConfig = { targets: {} };
const mockTargetA = { name: 'staging' };
const mockTargetB = { name: 'prod' };

beforeEach(() => {
  vi.mocked(loader.loadConfig).mockResolvedValue(mockConfig as any);
  vi.mocked(targetLoader.requireTarget)
    .mockReturnValueOnce(mockTargetA as any)
    .mockReturnValueOnce(mockTargetB as any);
  vi.mocked(target.flattenTargetEnv)
    .mockReturnValueOnce({ A: '1' })
    .mockReturnValueOnce({ B: '2' });
  vi.mocked(merge.mergeEnvMaps).mockReturnValue({ env: { A: '1', B: '2' }, conflicts: [], merged: ['B'] });
  vi.mocked(merge.formatMergeResult).mockReturnValue('Merged keys (1): B');
});

describe('registerMergeCmd', () => {
  it('registers merge command and runs without error', async () => {
    const program = new Command();
    registerMergeCmd(program);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await program.parseAsync(['node', 'envchain', 'merge', 'staging', 'prod']);
    expect(merge.mergeEnvMaps).toHaveBeenCalledWith({ A: '1' }, { B: '2' }, expect.objectContaining({ strategy: 'override' }));
    spy.mockRestore();
  });
});
