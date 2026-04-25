import { Command } from 'commander';
import * as fs from 'fs';
import { dedupeEnvFile, formatDedupeResult } from '../env/dedupe';
import { serializeEnvFile } from '../env/parser';

export function registerDedupeCmd(program: Command): void {
  program
    .command('dedupe <file>')
    .description('Remove duplicate keys from an env file, keeping the last occurrence')
    .option('-w, --write', 'Write deduped output back to the file in place')
    .option('-q, --quiet', 'Suppress summary output')
    .action((file: string, opts: { write?: boolean; quiet?: boolean }) => {
      if (!fs.existsSync(file)) {
        console.error(`Error: file not found: ${file}`);
        process.exit(1);
      }

      let result;
      try {
        result = dedupeEnvFile(file);
      } catch (err) {
        console.error(`Error: failed to parse env file: ${(err as Error).message}`);
        process.exit(1);
      }

      if (!opts.quiet) {
        console.log(formatDedupeResult(result));
      }

      if (result.duplicates.length === 0) {
        return;
      }

      if (opts.write) {
        const serialized = serializeEnvFile(result.deduped);
        try {
          fs.writeFileSync(file, serialized, 'utf8');
        } catch (err) {
          console.error(`Error: failed to write file: ${(err as Error).message}`);
          process.exit(1);
        }
        if (!opts.quiet) {
          console.log(`Written deduped env to ${file}`);
        }
      } else {
        console.log('\n# Deduped output:');
        console.log(serializeEnvFile(result.deduped));
      }
    });
}
