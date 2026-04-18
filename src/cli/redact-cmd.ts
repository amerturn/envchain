import { Command } from "commander";
import { loadConfigFromCwd } from "../config/loader";
import { requireTarget } from "../targets/loader";
import { resolveTargetChain, flattenTargetEnv } from "../targets/target";
import { resolveEnv } from "../env/resolver";
import { redactEnv, formatRedacted } from "../env/redact";

export function registerRedactCmd(program: Command): void {
  program
    .command("redact <target>")
    .description("Print resolved env for a target with sensitive values masked")
    .option("-k, --keys <keys>", "Additional keys to redact (comma-separated)", "")
    .option("-m, --mask <mask>", "Mask string to use", "***")
    .option("--no-labels", "Omit [redacted] labels")
    .action(async (targetName: string, opts) => {
      const config = await loadConfigFromCwd();
      const target = requireTarget(config, targetName);
      const chain = resolveTargetChain(config, target);
      const layered = flattenTargetEnv(chain);
      const resolved = resolveEnv(layered);

      const extraKeys = opts.keys
        ? opts.keys.split(",").map((k: string) => k.trim()).filter(Boolean)
        : [];

      const redacted = redactEnv(resolved, { mask: opts.mask, keys: extraKeys });

      if (opts.labels === false) {
        Object.entries(redacted).forEach(([k, v]) => console.log(`${k}=${v}`));
      } else {
        console.log(formatRedacted(resolved, redacted));
      }
    });
}
