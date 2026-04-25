import { Command } from 'commander';
import { omitEnvFile, formatOmitResult } from '../env/omit';

export function registerOmitCmd(program: Command): void {
  program
    .command('omit <file> <keys...>')
    .description('Remove specified keys from an env file')
    .option('-w, --write', 'Write changes back to the file', false)
    .option('-q, --quiet', 'Suppress output', false)
    .action((file: string, keys: string[], opts: { write: boolean; quiet: boolean }) => {
      let result;
      try {
        result = omitEnvFile(file, keys, opts.write);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: ${message}\n`);
        process.exit(1);
      }

      if (!opts.quiet) {
        const formatted = formatOmitResult(result);
        if (formatted) process.stdout.write(formatted + '\n');
      }

      if (result.notFound.length > 0) {
        process.stderr.write(
          `Warning: ${result.notFound.length} key(s) not found: ${result.notFound.join(', ')}\n`
        );
      }
    });
}
