import { Argv } from 'yargs';
import { sortEnvFile, formatSortResult } from '../env/sort';

interface SortArgs {
  input: string;
  output: string;
}

export function registerSortCmd(yargs: Argv): Argv {
  return yargs.command(
    'sort <input>',
    'Sort environment variable keys alphabetically',
    (y) =>
      y
        .positional('input', {
          describe: 'Path to source .env file',
          type: 'string',
          demandOption: true,
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          describe: 'Output file path (defaults to input file)',
          default: '',
        }),
    (argv) => {
      const args = argv as unknown as SortArgs;
      const output = args.output || args.input;
      try {
        const result = sortEnvFile(args.input, output);
        console.log(formatSortResult(result));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`sort failed: ${message}`);
        process.exit(1);
      }
    }
  );
}
