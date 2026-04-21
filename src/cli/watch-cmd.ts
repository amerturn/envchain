import * as path from 'path';
import { Command } from 'commander';
import { watchEnvFile, formatWatchEvent } from '../env/watch';

export function registerWatchCmd(program: Command): void {
  program
    .command('watch <file>')
    .description('Watch an env file and print changes as they occur')
    .option('-i, --interval <ms>', 'polling interval in milliseconds', '500')
    .option('--no-color', 'disable colored output')
    .action((file: string, opts: { interval: string; color: boolean }) => {
      const filePath = path.resolve(file);
      const intervalMs = parseInt(opts.interval, 10);

      if (isNaN(intervalMs) || intervalMs < 50) {
        console.error('Error: --interval must be a number >= 50');
        process.exit(1);
      }

      console.log(`Watching ${filePath} (interval: ${intervalMs}ms) ...`);

      const stop = watchEnvFile(
        filePath,
        (event) => {
          const msg = formatWatchEvent(event);
          if (opts.color) {
            const colored = msg
              .replace(/^(.*\+ added.*)$/m, '\x1b[32m$1\x1b[0m')
              .replace(/^(.*- removed.*)$/m, '\x1b[31m$1\x1b[0m')
              .replace(/^(.*~ changed.*)$/m, '\x1b[33m$1\x1b[0m');
            console.log(colored);
          } else {
            console.log(msg);
          }
        },
        intervalMs
      );

      const cleanup = () => {
        stop();
        console.log('\nStopped watching.');
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    });
}
