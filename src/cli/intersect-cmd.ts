import { Command } from 'commander';
import fs from 'fs';
import { intersectEnvFiles, intersectEnvMaps, formatIntersectResult } from '../env/intersect';
import { parseEnvFile, serializeEnvFile } from '../env/parser';

export function registerIntersectCmd(program: Command): void {
  program
    .command('intersect <fileA> <fileB>')
    .description('Output only the keys present in both env files (values from fileA)')
    .option('-o, --output <file>', 'Write result to file instead of stdout')
    .option('--no-values', 'Print only key names, not values')
    .action((fileA: string, fileB: string, opts: { output?: string; values: boolean }) => {
      const result = intersectEnvFiles(fileA, fileB);

      if (opts.output) {
        const serialized = serializeEnvFile(result.env);
        fs.writeFileSync(opts.output, serialized);
        console.log(
          `Wrote ${result.common} key(s) to ${opts.output}`
        );
        return;
      }

      if (!opts.values) {
        result.keys.forEach((k) => console.log(k));
        return;
      }

      console.log(formatIntersectResult(result));
    });
}
