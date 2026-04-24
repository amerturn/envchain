import { Command } from 'commander';
import { readFileSync } from 'fs';
import { parseEnvFile } from '../env/parser';
import { maskEnv, formatMaskResult } from '../env/mask';

export function registerMaskCmd(program: Command): void {
  program
    .command('mask <envfile>')
    .description('Mask sensitive values in an env file for safe display')
    .option('-k, --keys <keys>', 'comma-separated list of keys to mask')
    .option('-c, --char <char>', 'mask character', '*')
    .option('-v, --visible <n>', 'number of trailing characters to keep visible', '0')
    .option('--json', 'output as JSON')
    .action((envfile: string, opts) => {
      let content: string;
      try {
        content = readFileSync(envfile, 'utf8');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          console.error(`Error: file not found "${envfile}"`);
        } else if ((err as NodeJS.ErrnoException).code === 'EACCES') {
          console.error(`Error: permission denied reading "${envfile}"`);
        } else {
          console.error(`Error: cannot read file "${envfile}"`);
        }
        process.exit(1);
      }

      const env = parseEnvFile(content);
      const keys = opts.keys ? opts.keys.split(',').map((k: string) => k.trim()) : undefined;
      const visibleChars = parseInt(opts.visible, 10) || 0;

      const result = maskEnv(env, {
        char: opts.char,
        visibleChars,
        keys,
      });

      if (opts.json) {
        console.log(JSON.stringify(result.masked, null, 2));
      } else {
        console.log(formatMaskResult(result));
      }
    });
}
