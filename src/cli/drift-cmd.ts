import { Command } from 'commander';
import { loadConfigFromCwd } from '../config/loader';
import { requireTarget } from '../targets/loader';
import { resolveTargetChain, flattenTargetEnv } from '../targets/target';
import { resolveEnv } from '../env/resolver';
import { detectDrift, formatDriftReport } from '../env/drift';
import { snapshotPath } from '../env/snapshot';
import * as path from 'path';

export function registerDriftCmd(program: Command): void {
  program
    .command('drift <target> <snapshotId>')
    .description('Compare current env for a target against a saved snapshot')
    .option('--cwd <dir>', 'working directory', process.cwd())
    .option('--json', 'output as JSON')
    .action(async (target: string, snapshotId: string, opts: { cwd: string; json?: boolean }) => {
      try {
        const config = await loadConfigFromCwd(opts.cwd);
        const targetDef = requireTarget(config, target);
        const chain = resolveTargetChain(config.targets, target);
        const layered = flattenTargetEnv(chain);
        const currentEnv = resolveEnv(layered);
        const snapDir = snapshotPath(opts.cwd);
        const report = await detectDrift(target, currentEnv, snapDir, snapshotId);

        if (opts.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(formatDriftReport(report));
        }

        if (report.drifted) process.exit(1);
      } catch (err: any) {
        console.error('drift error:', err.message);
        process.exit(2);
      }
    });
}
