import { Command } from 'commander';
import { readFileSync } from 'fs';
import { parseEnvFile } from '../env/parser';
import { pinEnvKeys, writePinFile, readPinFile, formatPinResult, pinFilePath } from '../env/pin';

export function registerPinCmd(program: Command): void {
  program
    .command('pin <envFile>')
    .description('Pin specific env keys to their current values')
    .option('-k, --keys <keys>', 'comma-separated list of keys to pin')
    .option('-t, --target <target>', 'target name for pin file', 'default')
    .option('--list', 'list currently pinned keys')
    .option('--unpin <keys>', 'comma-separated list of keys to unpin')
    .action((envFile: string, opts) => {
      const filePath = pinFilePath(opts.target);

      if (opts.list) {
        const pins = readPinFile(filePath);
        if (Object.keys(pins).length === 0) {
          console.log('No pinned keys.');
        } else {
          for (const [k, v] of Object.entries(pins)) {
            console.log(`${k}=${v}`);
          }
        }
        return;
      }

      const raw = readFileSync(envFile, 'utf8');
      const env = parseEnvFile(raw);

      if (opts.unpin) {
        const keys = opts.unpin.split(',').map((k: string) => k.trim());
        const existing = readPinFile(filePath);
        for (const k of keys) delete existing[k];
        writePinFile(filePath, existing);
        console.log(`Unpinned: ${keys.join(', ')}`);
        return;
      }

      const keys = opts.keys
        ? opts.keys.split(',').map((k: string) => k.trim())
        : Object.keys(env);

      const existing = readPinFile(filePath);
      const result = pinEnvKeys(env, keys, existing);
      writePinFile(filePath, result.pinned);
      console.log(formatPinResult(result));
    });
}
