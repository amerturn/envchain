import { Command } from "commander";
import path from "path";
import fs from "fs";
import { loadConfigFromCwd } from "../config/loader";
import { requireTarget } from "../targets/loader";
import { flattenTargetEnv } from "../targets/target";
import { validateEnv, formatValidationReport, ValidationRule } from "../env/validate";

export function registerValidateCmd(program: Command): void {
  program
    .command("validate <target>")
    .description("Validate resolved env for a target against rules defined in config")
    .option("--rules <file>", "Path to a JSON rules file")
    .action(async (targetName: string, opts: { rules?: string }) => {
      const config = loadConfigFromCwd();
      const target = requireTarget(config, targetName);
      const env = flattenTargetEnv(target, config);

      let rules: ValidationRule[] = [];

      if (opts.rules) {
        const rulesPath = path.resolve(opts.rules);
        if (!fs.existsSync(rulesPath)) {
          console.error(`Rules file not found: ${rulesPath}`);
          process.exit(1);
        }
        rules = JSON.parse(fs.readFileSync(rulesPath, "utf8")) as ValidationRule[];
      } else if (config.validate?.rules) {
        rules = config.validate.rules as ValidationRule[];
      } else {
        console.warn("No validation rules found. Skipping.");
        return;
      }

      const report = validateEnv(env, rules);
      console.log(formatValidationReport(report));

      if (report.failed.length > 0) {
        process.exit(1);
      }
    });
}
