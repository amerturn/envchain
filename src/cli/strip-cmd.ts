import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { stripEnvFile, formatStripResult } from '../env/strip';

export function registerStripCmd(program: Command): void {
  program
    .command('strip <envfile>')
    .description('Remove specified keys from an env file')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to remove')
    .option('-p, --pattern <regex>', 'Regex pattern matching keys to remove')
    .option('-o, --output <file>', 'Write result to file instead of stdout')
    .option('--in-place', 'Overwrite the input file')
    .action((envfile: string, opts) => {
      const content = readFileSync(envfile, 'utf8');

      const keys = opts.keys
        ? (opts.keys as string).split(',').map((k: string) => k.trim())
        : undefined;

      const pattern = opts.pattern ? new RegExp(opts.pattern) : undefined;

      if (!keys && !pattern) {
        console.error('Error: provide --keys or --pattern');
        process.exit(1);
      }

      const result = stripEnvFile(content, { keys, pattern });

      const { serializeEnvFile } = require('../env/parser');
      const serialized = serializeEnvFile(result.stripped);

      if (opts.inPlace) {
        writeFileSync(envfile, serialized, 'utf8');
        console.log(formatStripResult(result));
      } else if (opts.output) {
        writeFileSync(opts.output, serialized, 'utf8');
        console.log(formatStripResult(result));
      } else {
        console.log(formatStripResult(result));
      }
    });
}
