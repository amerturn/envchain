import { Command } from 'commander';
import path from 'path';
import { importEnvFile, formatImportResult, ImportStrategy } from '../env/import';

export function registerImportCmd(program: Command): void {
  program
    .command('import <source>')
    .description('Import environment variables from a source .env file into a target')
    .option('-t, --target <path>', 'Target .env file', '.env')
    .option(
      '-s, --strategy <strategy>',
      'Merge strategy: skip | overwrite',
      'skip'
    )
    .option('--dry-run', 'Preview changes without writing')
    .action((source: string, opts: { target: string; strategy: string; dryRun?: boolean }) => {
      const sourcePath = path.resolve(source);
      const targetPath = path.resolve(opts.target);
      const strategy = (opts.strategy as ImportStrategy) ?? 'skip';

      if (opts.dryRun) {
        const { parseEnvFile } = require('../env/parser');
        const { importEnv } = require('../env/import');
        const fs = require('fs');
        const base = fs.existsSync(targetPath)
          ? parseEnvFile(fs.readFileSync(targetPath, 'utf8'))
          : {};
        const incoming = parseEnvFile(fs.readFileSync(sourcePath, 'utf8'));
        const result = importEnv(base, incoming, strategy);
        console.log('[dry-run]');
        console.log(formatImportResult(result));
        return;
      }

      const result = importEnvFile(targetPath, sourcePath, strategy);
      console.log(formatImportResult(result));
    });
}
