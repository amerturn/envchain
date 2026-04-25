import { Command } from 'commander';
import fs from 'fs';
import { unionEnvFiles, formatUnionResult } from '../env/union';
import { serializeEnvFile } from '../env/parser';

export function registerUnionCmd(program: Command): void {
  program
    .command('union <base> <extra>')
    .description('Produce the union of two .env files; keys in <base> take precedence by default')
    .option('-o, --output <path>', 'Write merged result to file instead of stdout')
    .option('--prefer-extra', 'When a key exists in both files, use the value from <extra>', false)
    .option('--summary', 'Print a summary of changes instead of the merged env', false)
    .action((basePath: string, extraPath: string, opts) => {
      if (!fs.existsSync(basePath)) {
        console.error(`Error: base file not found: ${basePath}`);
        process.exit(1);
      }
      if (!fs.existsSync(extraPath)) {
        console.error(`Error: extra file not found: ${extraPath}`);
        process.exit(1);
      }

      const result = unionEnvFiles(basePath, extraPath, opts.preferExtra);

      if (opts.summary) {
        console.log(formatUnionResult(result));
        return;
      }

      const serialized = serializeEnvFile(result.merged);

      if (opts.output) {
        fs.writeFileSync(opts.output, serialized, 'utf8');
        console.log(formatUnionResult(result));
        console.log(`Written to ${opts.output}`);
      } else {
        process.stdout.write(serialized);
      }
    });
}
