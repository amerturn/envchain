import { Command } from 'commander';
import { expandEnvFile, expandEnvVars, formatExpandResult } from '../env/expand';
import { parseEnvFile, serializeEnvFile } from '../env/parser';
import { readFileSync, writeFileSync } from 'fs';

export function registerExpandCmd(program: Command): void {
  program
    .command('expand <file>')
    .description('Expand variable references in an env file')
    .option('-w, --write', 'Write expanded values back to the file', false)
    .option('-q, --quiet', 'Suppress output', false)
    .action((file: string, opts: { write: boolean; quiet: boolean }) => {
      let result;
      try {
        result = expandEnvFile(file);
      } catch (err: any) {
        console.error(`Error reading file: ${err.message}`);
        process.exit(1);
      }

      if (!opts.quiet) {
        console.log(formatExpandResult(result));
      }

      if (opts.write && result.count > 0) {
        const serialized = serializeEnvFile(result.expanded);
        writeFileSync(file, serialized, 'utf8');
        if (!opts.quiet) {
          console.log(`\nWrote expanded env to ${file}`);
        }
      }
    });
}
