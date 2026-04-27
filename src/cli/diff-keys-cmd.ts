import { Command } from 'commander';
import { diffEnvKeyFiles, formatDiffKeysResult } from '../env/diff-keys';
import { applyDiffKeysRules, formatDiffKeysWarnings } from '../env/diff-keys.rules';

export function registerDiffKeysCmd(program: Command): void {
  program
    .command('diff-keys <base> <target>')
    .description('Compare keys between two .env files')
    .option('--warn-added', 'Warn on keys added in target', false)
    .option('--no-warn-removed', 'Suppress warnings for removed keys')
    .option('--json', 'Output result as JSON', false)
    .action((base: string, target: string, opts) => {
      const result = diffEnvKeyFiles(base, target);

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(formatDiffKeysResult(result));

      const warnings = applyDiffKeysRules(result, {
        warnOnRemoved: opts.warnRemoved !== false,
        warnOnAdded: opts.warnAdded,
      });

      if (warnings.length > 0) {
        console.warn('\n' + formatDiffKeysWarnings(warnings));
        process.exitCode = 1;
      }
    });
}
