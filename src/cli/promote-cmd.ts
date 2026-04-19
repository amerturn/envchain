import { Command } from 'commander';
import { promoteEnv, formatPromoteResult } from '../env/promote';
import * as path from 'path';
import * as fs from 'fs';

export function registerPromoteCmd(program: Command): void {
  program
    .command('promote <from> <to>')
    .description('Promote environment variables from one target snapshot to another')
    .option('--overwrite', 'Overwrite existing keys in destination target', false)
    .option('--snapshots-dir <dir>', 'Directory containing snapshots', '.envchain/snapshots')
    .option('--config-dir <dir>', 'Directory containing target configs', '.')
    .option('--dry-run', 'Preview changes without writing', false)
    .action(async (from: string, to: string, opts) => {
      const snapshotsDir = path.resolve(opts.snapshotsDir);
      const configDir = path.resolve(opts.configDir);

      if (!fs.existsSync(snapshotsDir)) {
        console.error(`Snapshots directory not found: ${snapshotsDir}`);
        process.exit(1);
      }

      try {
        const result = await promoteEnv(from, to, snapshotsDir, configDir, opts.overwrite, opts.dryRun);
        console.log(formatPromoteResult(result));

        if (opts.dryRun) {
          console.log('\n[dry-run] No changes written.');
          return;
        }

        const applied = Object.keys(result.applied).length;
        console.log(`\n✔ ${applied} variable(s) promoted from ${from} to ${to}.`);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.error(`Error: Snapshot file not found for target "${from}". Has it been snapshotted?`);
        } else {
          console.error(`Error: ${err.message}`);
        }
        process.exit(1);
      }
    });
}
