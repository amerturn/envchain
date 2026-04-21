import { Command } from 'commander';
import { patchEnvFile, formatPatchResult, PatchOperation } from '../env/patch';

export function registerPatchCmd(program: Command): void {
  program
    .command('patch <file>')
    .description('Apply patch operations (set/unset/rename) to an env file')
    .option(
      '--set <assignments...>',
      'Set key=value pairs (e.g. --set FOO=bar BAZ=qux)'
    )
    .option(
      '--unset <keys...>',
      'Unset keys (e.g. --unset FOO BAR)'
    )
    .option(
      '--rename <pairs...>',
      'Rename keys OLD:NEW (e.g. --rename OLD_KEY:NEW_KEY)'
    )
    .option('--dry-run', 'Preview changes without writing to file')
    .action((file: string, opts) => {
      const ops: PatchOperation[] = [];

      for (const assignment of (opts.set ?? [])) {
        const idx = assignment.indexOf('=');
        if (idx < 1) { console.error(`Invalid set value: ${assignment}`); process.exit(1); }
        ops.push({ op: 'set', key: assignment.slice(0, idx), value: assignment.slice(idx + 1) });
      }

      for (const key of (opts.unset ?? [])) {
        ops.push({ op: 'unset', key });
      }

      for (const pair of (opts.rename ?? [])) {
        const [oldKey, newKey] = pair.split(':');
        if (!oldKey || !newKey) { console.error(`Invalid rename pair: ${pair}`); process.exit(1); }
        ops.push({ op: 'rename', key: oldKey, newKey });
      }

      if (ops.length === 0) {
        console.error('No patch operations specified.');
        process.exit(1);
      }

      if (opts.dryRun) {
        const { parseEnvFile } = require('../env/parser');
        const fs = require('fs');
        const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
        const { patchEnv } = require('../env/patch');
        const result = patchEnv(parseEnvFile(raw), ops);
        console.log('[dry-run]');
        console.log(formatPatchResult(result));
        return;
      }

      const result = patchEnvFile(file, ops);
      console.log(formatPatchResult(result));
    });
}
