import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  tagEnvKeys,
  writeTagFile,
  readTagFile,
  tagFilePath,
  formatTagResult,
} from "./tag";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-tag-"));
}

describe("tagEnvKeys", () => {
  it("tags existing keys", () => {
    const env = { FOO: "1", BAR: "2" };
    const result = tagEnvKeys(env, ["FOO"], ["secret"]);
    expect(result.tagged).toEqual([{ key: "FOO", tags: ["secret"] }]);
    expect(result.skipped).toEqual([]);
  });

  it("skips missing keys", () => {
    const env = { FOO: "1" };
    const result = tagEnvKeys(env, ["MISSING"], ["secret"]);
    expect(result.skipped).toContain("MISSING");
  });

  it("merges with existing tags", () => {
    const env = { FOO: "1" };
    const result = tagEnvKeys(env, ["FOO"], ["pii"], { FOO: ["secret"] });
    expect(result.tagged[0].tags).toEqual(["secret", "pii"]);
  });

  it("deduplicates tags", () => {
    const env = { FOO: "1" };
    const result = tagEnvKeys(env, ["FOO"], ["secret"], { FOO: ["secret"] });
    expect(result.tagged[0].tags).toEqual(["secret"]);
  });
});

describe("writeTagFile / readTagFile", () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  it("round-trips tag map", () => {
    const fp = tagFilePath(dir);
    const map = { FOO: ["secret"], BAR: ["pii"] };
    writeTagFile(map, fp);
    expect(readTagFile(fp)).toEqual(map);
  });

  it("returns empty object when file missing", () => {
    expect(readTagFile(tagFilePath(dir))).toEqual({});
  });
});

describe("formatTagResult", () => {
  it("formats tagged and skipped", () => {
    const result = { tagged: [{ key: "FOO", tags: ["secret"] }], skipped: ["BAR"] };
    const out = formatTagResult(result);
    expect(out).toContain("tagged  FOO");
    expect(out).toContain("skipped BAR");
  });
});
