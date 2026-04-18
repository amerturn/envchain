import { Command } from 'commander';
import { loadConfigFromCwd } from '../config/loader';
import { requireTarget } from '../targets/loader';
import { flattenTargetEnv } from '../targets/target';
import { resolveEnv } from '../env/resolver';
import { lintEnv, formatLintResult } from '../env/lint';

export function registerLintCmd(program: Command): void {
  program
    .command('lint [targets...]')
    .description('Lint environment variables for one or more targets')
    .option('--strict', 'Exit with non-zero code on warnings too')
    .action(async (targets: string[], opts: { strict?: boolean }) => {
      const config = loadConfigFromCwd();
      const names: string[] = targets.length > 0 ? targets : Object.keys(config.targets ?? {});

      if (names.length === 0) {
        console.error('No targets found.');
        process.exit(1);
      }

      let hasError = false;
      let hasWarn = false;

      for (const name of names) {
        const target = requireTarget(config, name);
        const layered = flattenTargetEnv(target);
        const env = resolveEnv(layered);
        const result = lintEnv(name, env);
        console.log(formatLintResult(result));
        if (!result.ok) hasError = true;
        if (result.issues.length > 0) hasWarn = true;
      }

      if (hasError || (opts.strict && hasWarn)) {
        process.exit(1);
      }
    });
}
