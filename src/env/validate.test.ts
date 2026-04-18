import { describe, it, expect } from "vitest";
import { validateEnv, formatValidationReport } from "./validate";

const env = {
  NODE_ENV: "production",
  PORT: "8080",
  API_KEY: "secret123",
};

describe("validateEnv", () => {
  it("passes when all required keys are present", () => {
    const report = validateEnv(env, [{ key: "NODE_ENV", required: true }]);
    expect(report.failed).toHaveLength(0);
    expect(report.passed).toHaveLength(1);
  });

  it("fails when a required key is missing", () => {
    const report = validateEnv({}, [{ key: "NODE_ENV", required: true }]);
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0].error).toMatch(/required/);
  });

  it("fails when value does not match pattern", () => {
    const report = validateEnv(env, [{ key: "PORT", pattern: /^\d{4}$/ }]);
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0].error).toMatch(/pattern/);
  });

  it("passes when value matches pattern", () => {
    const report = validateEnv(env, [{ key: "PORT", pattern: /^\d+$/ }]);
    expect(report.failed).toHaveLength(0);
  });

  it("fails when value not in allowedValues", () => {
    const report = validateEnv(env, [
      { key: "NODE_ENV", allowedValues: ["development", "staging"] },
    ]);
    expect(report.failed).toHaveLength(1);
    expect(report.failed[0].error).toMatch(/not in allowed set/);
  });

  it("passes when value is in allowedValues", () => {
    const report = validateEnv(env, [
      { key: "NODE_ENV", allowedValues: ["production", "staging"] },
    ]);
    expect(report.failed).toHaveLength(0);
  });
});

describe("formatValidationReport", () => {
  it("shows success message when no failures", () => {
    const report = validateEnv(env, [{ key: "NODE_ENV", required: true }]);
    const output = formatValidationReport(report);
    expect(output).toContain("All validation rules passed");
  });

  it("shows error count when failures exist", () => {
    const report = validateEnv({}, [{ key: "NODE_ENV", required: true }]);
    const output = formatValidationReport(report);
    expect(output).toContain("1 validation error");
    expect(output).toContain("NODE_ENV");
  });
});
