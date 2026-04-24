import { Command } from 'commander';
import * as fs from 'fs';
import { namespaceEnvFile, unnamespaceEnvKeys, formatNamespaceResult } from '../env/namespace';
import { parseEnvFile } from '../env/parser';
import { applyNamespaceRules, formatNamespaceWarnings } from '../env/namespace.rules';

export function registerNamespaceCmd(program: Command): void {
  const cmd = program
    .command('namespace <namespace> <file>')
    .description('Apply or remove a namespace prefix from env keys')
    .option('-s, --separator <sep>', 'Key separator', '__')
    .option('--remove', 'Strip namespace prefix instead of applying it')
    .option('--dry-run', 'Preview changes without writing to file')
    .option('--warn', 'Run namespace rules and print warnings')
    .action((namespace: string, file: string, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf8');
      const env = parseEnvFile(content);

      if (opts.warn) {
        const warnings = applyNamespaceRules(env, namespace, opts.separator);
        console.log(formatNamespaceWarnings(warnings));
        if (warnings.length > 0) process.exit(1);
        return;
      }

      if (opts.remove) {
        const result = unnamespaceEnvKeys(env, namespace, opts.separator);
        if (opts.dryRun) {
          console.log(formatNamespaceResult(result, namespace));
        } else {
          const { serializeEnvFile } = require('../env/parser');
          fs.writeFileSync(file, serializeEnvFile(result.namespaced), 'utf8');
          console.log(formatNamespaceResult(result, namespace));
        }
        return;
      }

      if (opts.dryRun) {
        const { namespaceEnvKeys } = require('../env/namespace');
        const result = namespaceEnvKeys(env, namespace, opts.separator);
        console.log(formatNamespaceResult(result, namespace));
        return;
      }

      const result = namespaceEnvFile(file, namespace, opts.separator);
      console.log(formatNamespaceResult(result, namespace));
    });

  return cmd as unknown as void;
}
