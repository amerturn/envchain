import { Argv } from "yargs";
import * as path from "path";
import { parseEnvFile } from "../env/parser";
import {
  tagEnvKeys,
  readTagFile,
  writeTagFile,
  tagFilePath,
  formatTagResult,
} from "../env/tag";

export function registerTagCmd(yargs: Argv): Argv {
  return yargs.command(
    "tag <envfile> <keys..>",
    "Tag env keys with labels",
    (y) =>
      y
        .positional("envfile", { type: "string", demandOption: true })
        .positional("keys", { type: "string", array: true, demandOption: true })
        .option("tags", {
          alias: "t",
          type: "array",
          string: true,
          demandOption: true,
          describe: "Tags to apply",
        })
        .option("tag-file", {
          type: "string",
          describe: "Path to tag file (default: .envchain-tags.json next to envfile)",
        }),
    (argv) => {
      const envFile = argv.envfile as string;
      const keys = argv.keys as string[];
      const tags = argv.tags as string[];
      const dir = path.dirname(path.resolve(envFile));
      const fp = (argv["tag-file"] as string | undefined) ?? tagFilePath(dir);

      const env = parseEnvFile(require("fs").readFileSync(envFile, "utf-8"));
      const existing = readTagFile(fp);
      const result = tagEnvKeys(env, keys, tags, existing);

      const updated = { ...existing };
      for (const { key, tags: t } of result.tagged) {
        updated[key] = t;
      }
      writeTagFile(updated, fp);

      console.log(formatTagResult(result));
      if (result.skipped.length) process.exit(1);
    }
  );
}
