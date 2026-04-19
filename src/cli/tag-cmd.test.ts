import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { readTagFile, tagFilePath } from "../env/tag";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-tag-cmd-"));
}

function writeEnv(dir: string, content: string) {
  const fp = path.join(dir, ".env");
  fs.writeFileSync(fp, content, "utf-8");
  return fp;
}

async function run(args: string[]) {
  const yargs = (await import("yargs")).default([]);
  const { registerTagCmd } = await import("./tag-cmd");
  let out = "";
  const orig = console.log;
  console.log = (s: string) => { out += s + "\n"; };
  try {
    await registerTagCmd(yargs).parseAsync(args);
  } catch {}
  console.log = orig;
  return out;
}

describe("tag-cmd", () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  it("writes tags for found keys", async () => {
    const fp = writeEnv(dir, "FOO=bar\nBAR=baz\n");
    await run(["tag", fp, "FOO", "--tags", "secret"]);
    const tags = readTagFile(tagFilePath(dir));
    expect(tags["FOO"]).toContain("secret");
  });

  it("accumulates tags on repeated calls", async () => {
    const fp = writeEnv(dir, "FOO=bar\n");
    await run(["tag", fp, "FOO", "--tags", "secret"]);
    await run(["tag", fp, "FOO", "--tags", "pii"]);
    const tags = readTagFile(tagFilePath(dir));
    expect(tags["FOO"]).toEqual(["secret", "pii"]);
  });
});
