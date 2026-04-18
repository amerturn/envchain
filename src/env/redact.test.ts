import { describe, it, expect } from "vitest";
import {
  isSensitiveKey,
  redactValue,
  redactEnv,
  formatRedacted,
} from "./redact";

describe("isSensitiveKey", () => {
  it("detects secret keys", () => {
    expect(isSensitiveKey("MY_SECRET")).toBe(true);
    expect(isSensitiveKey("DB_PASSWORD")).toBe(true);
    expect(isSensitiveKey("API_KEY")).toBe(true);
    expect(isSensitiveKey("AUTH_TOKEN")).toBe(true);
    expect(isSensitiveKey("PRIVATE_KEY")).toBe(true);
  });

  it("allows non-sensitive keys", () => {
    expect(isSensitiveKey("NODE_ENV")).toBe(false);
    expect(isSensitiveKey("PORT")).toBe(false);
    expect(isSensitiveKey("APP_NAME")).toBe(false);
  });
});

describe("redactValue", () => {
  it("masks non-empty values", () => {
    expect(redactValue("supersecret")).toBe("***");
    expect(redactValue("abc", "[hidden]")).toBe("[hidden]");
  });

  it("preserves empty string", () => {
    expect(redactValue("")).toBe("");
  });
});

describe("redactEnv", () => {
  const env = {
    NODE_ENV: "production",
    DB_PASSWORD: "s3cr3t",
    API_KEY: "key-123",
    PORT: "3000",
  };

  it("redacts sensitive keys", () => {
    const result = redactEnv(env);
    expect(result.NODE_ENV).toBe("production");
    expect(result.PORT).toBe("3000");
    expect(result.DB_PASSWORD).toBe("***");
    expect(result.API_KEY).toBe("***");
  });

  it("redacts explicitly provided keys", () => {
    const result = redactEnv(env, { keys: ["PORT"] });
    expect(result.PORT).toBe("***");
  });

  it("supports custom mask", () => {
    const result = redactEnv(env, { mask: "[redacted]" });
    expect(result.DB_PASSWORD).toBe("[redacted]");
  });
});

describe("formatRedacted", () => {
  it("marks redacted lines", () => {
    const env = { FOO: "bar", DB_PASSWORD: "secret" };
    const redacted = redactEnv(env);
    const output = formatRedacted(env, redacted);
    expect(output).toContain("FOO=bar");
    expect(output).toContain("DB_PASSWORD=*** [redacted]");
  });
});
