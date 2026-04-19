import { describe, it, expect } from "vitest";
import { filterEnv, filterEnvFile, formatFilterResult } from "./filter";

const sample: Record<string, string> = {
  APP_NAME: "myapp",
  APP_VERSION: "1.0.0",
  DB_HOST: "localhost",
  DB_PORT: "5432",
  SECRET_KEY: "abc123",
};

describe("filterEnv", () => {
  it("filters by key list", () => {
    const { matched, excluded } = filterEnv(sample, { keys: ["APP_NAME", "DB_HOST"] });
    expect(matched).toEqual({ APP_NAME: "myapp", DB_HOST: "localhost" });
    expect(Object.keys(excluded)).toHaveLength(3);
  });

  it("filters by prefix", () => {
    const { matched } = filterEnv(sample, { prefix: "APP_" });
    expect(Object.keys(matched)).toEqual(["APP_NAME", "APP_VERSION"]);
  });

  it("filters by pattern", () => {
    const { matched } = filterEnv(sample, { pattern: /^DB_/ });
    expect(Object.keys(matched)).toEqual(["DB_HOST", "DB_PORT"]);
  });

  it("inverts the filter", () => {
    const { matched } = filterEnv(sample, { prefix: "APP_", invert: true });
    expect(Object.keys(matched)).not.toContain("APP_NAME");
    expect(Object.keys(matched)).toContain("DB_HOST");
  });

  it("returns empty matched when nothing matches", () => {
    const { matched, excluded } = filterEnv(sample, { keys: ["MISSING"] });
    expect(matched).toEqual({});
    expect(Object.keys(excluded)).toHaveLength(5);
  });
});

describe("filterEnvFile", () => {
  it("parses and filters file content", () => {
    const content = "APP_NAME=myapp\nDB_HOST=localhost\n";
    const { matched } = filterEnvFile(content, { prefix: "APP_" });
    expect(matched).toEqual({ APP_NAME: "myapp" });
  });
});

describe("formatFilterResult", () => {
  it("includes matched and excluded counts", () => {
    const result = filterEnv(sample, { prefix: "APP_" });
    const output = formatFilterResult(result);
    expect(output).toContain("Matched: 2");
    expect(output).toContain("Excluded: 3");
  });
});
