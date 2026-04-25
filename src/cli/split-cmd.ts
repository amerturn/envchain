import type { Command } from 'commander';
import { splitEnvFile, writeSplitFiles, formatSplitResult } from '../env/split';

export function registerSplitCmd(program: Command): void {
  program
    .command('split <file>')
    .description('Split an env file into multiple chunks')
    .option(
      '-s, --strategy <strategy>',
      'Split strategy: alpha | size | prefix',
      'prefix'
    )
    .option('-n, --chunk-size <n>', 'Chunk size (for size strategy)', '10')
    .option('-d, --delimiter <char>', 'Key delimiter (for prefix strategy)', '_')
    .option('-o, --output-dir <dir>', 'Directory to write chunk files', '.')
    .option('--dry-run', 'Preview split without writing files')
    .action(
      (
        file: string,
        opts: {
          strategy: string;
          chunkSize: string;
          delimiter: string;
          outputDir: string;
          dryRun?: boolean;
        }
      ) => {
        const strategy = opts.strategy as 'alpha' | 'size' | 'prefix';
        const validStrategies = ['alpha', 'size', 'prefix'];
        if (!validStrategies.includes(strategy)) {
          console.error(`Invalid strategy "${strategy}". Use: alpha, size, prefix`);
          process.exit(1);
        }

        const result = splitEnvFile(file, strategy, {
          chunkSize: parseInt(opts.chunkSize, 10),
          delimiter: opts.delimiter,
        });

        console.log(formatSplitResult(result));

        if (!opts.dryRun) {
          const written = writeSplitFiles(result, opts.outputDir);
          console.log(`\nWrote ${written.length} file(s) to ${opts.outputDir}`);
        } else {
          console.log('\n(dry-run) No files written.');
        }
      }
    );
}
