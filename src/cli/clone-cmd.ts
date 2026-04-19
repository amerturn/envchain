import { Command } from "commander";
import { requireTarget } from "../targets/loader";
import { flattenTargetEnv } from "../targets/target";
import { loadConfigFromCwd } from "../config/loader";
import { cloneEnv, formatCloneResult } from "../env/clone";
import { serializeEnvFile } from "../env/parser";
import * as fs from "fs";
import * as path from "path";

export function registerCloneCmd(program: Command): void {
  program
    .command("clone <source> <target>")
    .description("Clone env vars from one target to another")
    .option("--overwrite", "Overwrite existing keys in target", false)
    .option("--keys <keys>", "Comma-separated list of keys to clone")
    .option("--dry-run", "Preview changes without writing", false)
    .action(async (source: string, target: string, opts) => {
      const config = loadConfigFromCwd();
      const srcTarget = requireTarget(config, source);
      const dstTarget = requireTarget(config, target);

      const sourceEnv = flattenTargetEnv(srcTarget, config);
      const targetEnv = flattenTargetEnv(dstTarget, config);

      const keys = opts.keys ? (opts.keys as string).split(",").map((k: string) => k.trim()) : undefined;

      const { merged, result } = cloneEnv(sourceEnv, targetEnv, {
        overwrite: opts.overwrite,
        keys,
      });

      result.source = source;
      result.target = target;

      console.log(formatCloneResult(result));

      if (!opts.dryRun) {
        const envPath = path.resolve(process.cwd(), dstTarget.envFile ?? `.env.${target}`);
        fs.writeFileSync(envPath, serializeEnvFile(merged), "utf-8");
        console.log(`Written to ${envPath}`);
      }
    });
}
