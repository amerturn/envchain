import { Command } from 'commander';
import * as fs from 'fs';
import { squashEnvFiles, formatSquashResult } from '../env/squash';
import { serializeEnvFile } from '../env/parser';

export function registerSquashCmd(program: Command): void {
  program
    .command('squash <files...>')
    .description(
      'Squash multiple .env files into one, with later files taking precedence over earlier ones'
    )
    .option('-o, --output <path>', 'Write result to file instead of stdout')
    .option('--summary', 'Print a summary instead of the raw env output')
    .action(
      (files: string[], opts: { output?: string; summary?: boolean }) => {
        for (const fp of files) {
          if (!fs.existsSync(fp)) {
            console.error(`File not found: ${fp}`);
            process.exit(1);
          }
        }

        const result = squashEnvFiles(files);

        if (opts.summary) {
          console.log(formatSquashResult(result));
          return;
        }

        const output = serializeEnvFile(result.squashed);

        if (opts.output) {
          fs.writeFileSync(opts.output, output);
          console.log(`Squashed ${files.length} file(s) → ${opts.output}`);
        } else {
          process.stdout.write(output);
        }
      }
    );
}
