import { Command } from 'commander';
import { compareEnvFiles, formatCompareResult } from '../env/compare';

export function registerCompareCmd(program: Command): void {
  program
    .command('compare <fileA> <fileB>')
    .description('Compare two .env files and show differences')
    .option('--only-changed', 'show only changed and missing keys')
    .option('--json', 'output as JSON')
    .action((fileA: string, fileB: string, opts: { onlyChanged?: boolean; json?: boolean }) => {
      const result = compareEnvFiles(fileA, fileB);

      if (opts.json) {
        const out = opts.onlyChanged
          ? { onlyInA: result.onlyInA, onlyInB: result.onlyInB, changed: result.changed }
          : result;
        console.log(JSON.stringify(out, null, 2));
        return;
      }

      if (opts.onlyChanged) {
        const filtered = { ...result, unchanged: {} };
        console.log(formatCompareResult(filtered));
      } else {
        console.log(formatCompareResult(result));
      }
    });
}
