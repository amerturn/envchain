import { Command } from 'commander';
import { swapEnvFile, swapEnvKeys, formatSwapResult } from '../env/swap';
import { parseEnvFile } from '../env/parser';
import fs from 'fs';

export function registerSwapCmd(program: Command): void {
  program
    .command('swap <file>')
    .description('Swap the values of two env keys in a file')
    .option(
      '-p, --pair <a:b>',
      'key pair to swap (can be repeated)',
      (val: string, acc: string[]) => { acc.push(val); return acc; },
      [] as string[]
    )
    .option('--dry-run', 'preview changes without writing', false)
    .option('--json', 'output result as JSON', false)
    .action((file: string, opts: { pair: string[]; dryRun: boolean; json: boolean }) => {
      if (opts.pair.length === 0) {
        console.error('Error: at least one --pair <a:b> is required');
        process.exit(1);
      }

      const pairs = opts.pair.map((p) => {
        const parts = p.split(':');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
          console.error(`Error: invalid pair format "${p}", expected a:b`);
          process.exit(1);
        }
        return [parts[0], parts[1]] as [string, string];
      });

      if (opts.dryRun) {
        const raw = fs.readFileSync(file, 'utf8');
        const env = parseEnvFile(raw);
        const result = swapEnvKeys(env, pairs);
        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log('[dry-run]');
          console.log(formatSwapResult(result));
        }
        return;
      }

      const result = swapEnvFile(file, pairs);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatSwapResult(result));
      }
    });
}
