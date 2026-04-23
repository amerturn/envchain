import type { Argv } from 'yargs';
import { flattenEnvFile, formatFlattenResult } from '../env/flatten';
import { serializeEnvFile } from '../env/parser';
import { writeFileSync } from 'fs';

interface FlattenArgs {
  file: string;
  prefix?: string;
  separator: string;
  uppercase: boolean;
  write: boolean;
}

export function registerFlattenCmd(yargs: Argv): Argv {
  return yargs.command(
    'flatten <file>',
    'Flatten env keys by applying a prefix or normalizing casing',
    (y) =>
      y
        .positional('file', {
          type: 'string',
          description: 'Path to the .env file',
          demandOption: true,
        })
        .option('prefix', {
          type: 'string',
          description: 'Prefix to apply to all keys missing it',
        })
        .option('separator', {
          type: 'string',
          default: '_',
          description: 'Separator between prefix and key',
        })
        .option('uppercase', {
          type: 'boolean',
          default: false,
          description: 'Convert all keys to uppercase',
        })
        .option('write', {
          type: 'boolean',
          alias: 'w',
          default: false,
          description: 'Write changes back to the file',
        }),
    (argv) => {
      const args = argv as unknown as FlattenArgs;
      const result = flattenEnvFile(args.file, {
        prefix: args.prefix,
        separator: args.separator,
        uppercase: args.uppercase,
      });

      console.log(formatFlattenResult(result));

      if (args.write && result.changed.length > 0) {
        const serialized = serializeEnvFile(result.flattened);
        writeFileSync(args.file, serialized, 'utf-8');
        console.log(`Written to ${args.file}`);
      }
    }
  );
}
