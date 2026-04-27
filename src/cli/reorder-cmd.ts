import { Command } from 'commander';
import path from 'path';
import { reorderEnvFile, formatReorderResult } from '../env/reorder';

export function registerReorderCmd(program: Command): void {
  program
    .command('reorder <file>')
    .description('Reorder keys in an .env file according to a specified key order')
    .requiredOption(
      '-k, --keys <keys>',
      'Comma-separated list of keys in desired order'
    )
    .option('--dry-run', 'Preview changes without writing to disk', false)
    .action((file: string, opts: { keys: string; dryRun: boolean }) => {
      const filePath = path.resolve(file);
      const order = opts.keys
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      if (order.length === 0) {
        console.error('Error: --keys must contain at least one key.');
        process.exit(1);
      }

      if (opts.dryRun) {
        // For dry-run, parse and simulate without writing
        const fs = require('fs');
        const { parseEnvFile } = require('../env/parser');
        const { reorderEnvKeys } = require('../env/reorder');
        const raw = fs.readFileSync(filePath, 'utf8');
        const env = parseEnvFile(raw);
        const original = Object.keys(env);
        const reordered = Object.keys(reorderEnvKeys(env, order));
        const changed =
          original.length !== reordered.length ||
          original.some((k: string, i: number) => k !== reordered[i]);
        console.log('[dry-run] ' + formatReorderResult({ original, reordered, changed }));
        return;
      }

      const result = reorderEnvFile(filePath, order);
      console.log(formatReorderResult(result));
    });
}
