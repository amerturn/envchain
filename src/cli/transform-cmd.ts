import { Argv } from 'yargs';
import { readFileSync, writeFileSync } from 'fs';
import { parseEnvFile, serializeEnvFile } from '../env/parser';
import { transformEnvValues, formatTransformResult, TransformOp } from '../env/transform';

export function registerTransformCmd(yargs: Argv) {
  return yargs.command(
    'transform <file>',
    'Transform env values for specified keys',
    (y) =>
      y
        .positional('file', { type: 'string', demandOption: true })
        .option('keys', { type: 'array', string: true, demandOption: true, alias: 'k' })
        .option('uppercase', { type: 'boolean', default: false })
        .option('lowercase', { type: 'boolean', default: false })
        .option('prefix', { type: 'string' })
        .option('suffix', { type: 'string' })
        .option('replace', { type: 'string', description: 'from:to' })
        .option('write', { type: 'boolean', default: false, alias: 'w' }),
    (argv) => {
      const raw = readFileSync(argv.file as string, 'utf8');
      const env = parseEnvFile(raw);
      const ops: TransformOp[] = [];

      if (argv.uppercase) ops.push({ op: 'uppercase' });
      if (argv.lowercase) ops.push({ op: 'lowercase' });
      if (argv.prefix) ops.push({ op: 'prefix', value: argv.prefix as string });
      if (argv.suffix) ops.push({ op: 'suffix', value: argv.suffix as string });
      if (argv.replace) {
        const [from, to] = (argv.replace as string).split(':');
        if (from !== undefined && to !== undefined) ops.push({ op: 'replace', from, to });
      }

      const keys = argv.keys as string[];
      const result = transformEnvValues(env, keys, ops);
      console.log(formatTransformResult(result));

      if (argv.write) {
        writeFileSync(argv.file as string, serializeEnvFile(result.transformed));
        console.log(`Written to ${argv.file}`);
      }
    }
  );
}
