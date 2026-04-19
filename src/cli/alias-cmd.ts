import { Command } from 'commander';
import * as fs from 'fs';
import { aliasEnvFile, formatAliasResult, AliasMap } from '../env/alias';
import { serializeEnvFile } from '../env/parser';
import { suggestAliases, formatAliasSuggestions } from '../env/alias.rules';
import { parseEnvFile } from '../env/parser';

export function registerAliasCmd(program: Command): void {
  program
    .command('alias <envFile>')
    .description('Rename env keys via aliases')
    .option('-m, --map <pairs...>', 'FROM=TO alias pairs')
    .option('-k, --keep', 'keep original keys', false)
    .option('-w, --write', 'write result back to file', false)
    .option('--suggest', 'suggest common aliases', false)
    .action((envFile: string, opts) => {
      if (opts.suggest) {
        const env = parseEnvFile(fs.readFileSync(envFile, 'utf8'));
        const suggestions = suggestAliases(env);
        console.log(formatAliasSuggestions(suggestions));
        return;
      }

      const aliases: AliasMap = {};
      for (const pair of (opts.map ?? [])) {
        const [from, to] = pair.split('=');
        if (from && to) aliases[from] = to;
      }

      const result = aliasEnvFile(envFile, aliases, opts.keep);
      console.log(formatAliasResult(result));

      if (opts.write) {
        fs.writeFileSync(envFile, serializeEnvFile(result.output));
        console.log(`Written to ${envFile}`);
      } else {
        console.log('\n' + serializeEnvFile(result.output));
      }
    });
}
