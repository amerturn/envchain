import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { extractEnvFile, formatExtractResult } from '../env/extract';

export function registerExtractCmd(program: Command): void {
  program
    .command('extract <source>')
    .description('Extract specific keys from an env file into a new file')
    .requiredOption('-k, --keys <keys>', 'Comma-separated list of keys to extract')
    .option('-o, --output <file>', 'Output file for extracted keys')
    .option('--rewrite', 'Rewrite source file with remaining keys', false)
    .option('--dry-run', 'Preview without writing files', false)
    .action((source: string, opts) => {
      const keys = (opts.keys as string).split(',').map((k: string) => k.trim()).filter(Boolean);
      if (keys.length === 0) {
        console.error('No keys specified.');
        process.exit(1);
      }

      let content: string;
      try {
        content = readFileSync(source, 'utf8');
      } catch {
        console.error(`Cannot read file: ${source}`);
        process.exit(1);
      }

      const { extractedContent, remainingContent, keys: extracted } = extractEnvFile(content, keys);
      const result = {
        extracted: Object.fromEntries(extracted.map(k => [k, ''])),
        remaining: {},
        keys: extracted,
      };

      console.log(formatExtractResult({ ...result, extracted: Object.fromEntries(extracted.map(k => [k, ''])), remaining: {} }));

      if (!opts.dryRun) {
        if (opts.output) {
          writeFileSync(opts.output, extractedContent, 'utf8');
          console.log(`Extracted keys written to ${opts.output}`);
        }
        if (opts.rewrite) {
          writeFileSync(source, remainingContent, 'utf8');
          console.log(`Source file rewritten: ${source}`);
        }
      }
    });
}
