import type { Command } from 'commander';
import * as fs from 'fs';
import { lowercaseEnvKeys, lowercaseEnvFile, formatLowercaseResult } from '../env/lowercase';
import { parseEnvFile } from '../env/parser';

export function registerLowercaseCmd(program: Command): void {
  program
    .command('lowercase <file>')
    .description('Lowercase all environment variable keys in a .env file')
    .option('--dry-run', 'Preview changes without writing to disk')
    .option('--quiet', 'Suppress output')
    .action((file: string, opts: { dryRun?: boolean; quiet?: boolean }) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      if (opts.dryRun) {
        const content = fs.readFileSync(file, 'utf-8');
        const env = parseEnvFile(content);
        const result = lowercaseEnvKeys(env);
        if (!opts.quiet) {
          console.log(formatLowercaseResult(result));
        }
        return;
      }

      const result = lowercaseEnvFile(file);
      if (!opts.quiet) {
        console.log(formatLowercaseResult(result));
      }
    });
}
