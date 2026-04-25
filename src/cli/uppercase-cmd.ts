import { Command } from "commander";
import { readFileSync, writeFileSync } from "fs";
import { parseEnvFile } from "../env/parser";
import { uppercaseEnvKeys, uppercaseEnvFile, formatUppercaseResult } from "../env/uppercase";

/**
 * Registers the `uppercase` command onto the given Commander program.
 *
 * Usage:
 *   envchain uppercase <file>          # print result to stdout
 *   envchain uppercase <file> --write  # overwrite file in place
 *   envchain uppercase <file> --dry-run # show what would change
 */
export function registerUppercaseCmd(program: Command): void {
  program
    .command("uppercase <file>")
    .description("Convert all env variable keys to UPPER_CASE")
    .option("-w, --write", "write the result back to the file in place")
    .option("-d, --dry-run", "show changes without writing")
    .option("--silent", "suppress summary output (useful for scripting)")
    .action((file: string, opts: { write?: boolean; dryRun?: boolean; silent?: boolean }) => {
      let raw: string;
      try {
        raw = readFileSync(file, "utf8");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`uppercase: cannot read file '${file}': ${msg}`);
        process.exit(1);
      }

      const original = parseEnvFile(raw);
      const result = uppercaseEnvKeys(original);

      if (opts.dryRun) {
        // In dry-run mode just print the formatted report and exit
        if (!opts.silent) {
          console.log(formatUppercaseResult(result));
        }
        return;
      }

      const serialized = uppercaseEnvFile(raw);

      if (opts.write) {
        try {
          writeFileSync(file, serialized, "utf8");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`uppercase: cannot write file '${file}': ${msg}`);
          process.exit(1);
        }
        if (!opts.silent) {
          console.log(formatUppercaseResult(result));
        }
      } else {
        // Default: print transformed content to stdout
        process.stdout.write(serialized);
        if (!opts.silent) {
          // Summary goes to stderr so it doesn't pollute piped output
          process.stderr.write(formatUppercaseResult(result) + "\n");
        }
      }
    });
}
