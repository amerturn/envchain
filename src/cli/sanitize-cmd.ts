import { Command } from 'commander';
import { sanitizeEnvFile, formatSanitizeResult } from '../env/sanitize';

export function registerSanitizeCmd(program: Command): void {
  program
    .command('sanitize <file>')
    .description('Sanitize an env file by trimming values, removing empty keys, and normalizing key names')
    .option('--trim', 'Trim leading/trailing whitespace from values', false)
    .option('--remove-empty', 'Remove keys with empty values', false)
    .option('--normalize-keys', 'Normalize key names to UPPER_SNAKE_CASE', false)
    .option('--dry-run', 'Preview changes without writing to file', false)
    .action((file: string, opts) => {
      const options = {
        trimValues: opts.trim as boolean,
        removeEmpty: opts.removeEmpty as boolean,
        normalizeKeys: opts.normalizeKeys as boolean,
      };

      if (opts.dryRun) {
        const { parseEnvFile } = require('../env/parser');
        const { readFileSync } = require('fs');
        const { sanitizeEnv } = require('../env/sanitize');
        const raw = readFileSync(file, 'utf8');
        const env = parseEnvFile(raw);
        const result = sanitizeEnv(env, options);
        const output = formatSanitizeResult(result);
        console.log('[dry-run]');
        console.log(output || 'No changes needed.');
        return;
      }

      try {
        const result = sanitizeEnvFile(file, options);
        const output = formatSanitizeResult(result);
        console.log(output);
      } catch (err: unknown) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
