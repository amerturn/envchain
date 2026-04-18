import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile, serializeEnvFile } from '../env/parser';
import { renameEnvKeys, formatRenameResult, RenameEntry } from '../env/rename';

export function registerRenameCmd(program: Command): void {
  program
    .command('rename <file> [pairs...]')
    .description('Rename environment variable keys in a .env file')
    .option('-o, --output <file>', 'Write result to file instead of stdout')
    .option('--dry-run', 'Preview changes without writing')
    .action((file: string, pairs: string[], opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      if (pairs.length === 0 || pairs.length % 2 !== 0) {
        console.error('Pairs must be provided as: FROM TO [FROM TO ...]');
        process.exit(1);
      }

      const renames: RenameEntry[] = [];
      for (let i = 0; i < pairs.length; i += 2) {
        renames.push({ from: pairs[i], to: pairs[i + 1] });
      }

      const raw = fs.readFileSync(file, 'utf8');
      const env = parseEnvFile(raw);
      const result = renameEnvKeys(env, renames);

      console.log(formatRenameResult(result));

      if (result.conflicts.length > 0) {
        process.exit(1);
      }

      if (!opts.dryRun) {
        const serialized = serializeEnvFile(result.output);
        const dest = opts.output || file;
        fs.writeFileSync(dest, serialized, 'utf8');
        console.log(`Written to ${dest}`);
      }
    });
}
