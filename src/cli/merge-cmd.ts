import { Command } from 'commander';
import { loadConfig } from '../config/loader';
import { requireTarget } from '../targets/loader';
import { flattenTargetEnv } from '../targets/target';
import { mergeEnvMaps, formatMergeResult, MergeStrategy } from '../env/merge';
import { serializeEnvFile } from '../env/parser';
import fs from 'fs';

export function registerMergeCmd(program: Command): void {
  program
    .command('merge <base> <override>')
    .description('Merge two target envs and print or write result')
    .option('-s, --strategy <strategy>', 'Merge strategy: override|preserve|error', 'override')
    .option('-o, --output <file>', 'Write result to file instead of stdout')
    .option('--no-interpolate', 'Skip variable interpolation')
    .action(async (baseTarget: string, overrideTarget: string, opts) => {
      const config = await loadConfig();
      const baseT = requireTarget(config, baseTarget);
      const overrideT = requireTarget(config, overrideTarget);
      const baseEnv = flattenTargetEnv(baseT, config);
      const overrideEnv = flattenTargetEnv(overrideT, config);

      const result = mergeEnvMaps(baseEnv, overrideEnv, {
        strategy: opts.strategy as MergeStrategy,
        interpolate: opts.interpolate !== false,
      });

      const serialized = serializeEnvFile(result.env);
      if (opts.output) {
        fs.writeFileSync(opts.output, serialized, 'utf8');
        console.log(formatMergeResult(result));
        console.log(`Written to ${opts.output}`);
      } else {
        console.log(serialized);
        console.error(formatMergeResult(result));
      }
    });
}
