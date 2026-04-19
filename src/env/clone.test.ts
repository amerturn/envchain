import { cloneEnv, formatCloneResult } from "./clone";

describe("cloneEnv", () => {
  const source = { A: "1", B: "2", C: "3" };
  const target = { B: "existing", D: "4" };

  it("copies keys not present in target", () => {
    const { merged, result } = cloneEnv(source, target);
    expect(merged.A).toBe("1");
    expect(merged.C).toBe("3");
    expect(result.added).toContain("A");
    expect(result.added).toContain("C");
  });

  it("skips existing keys without overwrite", () => {
    const { merged, result } = cloneEnv(source, target);
    expect(merged.B).toBe("existing");
    expect(result.skipped).toContain("B");
  });

  it("overwrites when option is set", () => {
    const { merged, result } = cloneEnv(source, target, { overwrite: true });
    expect(merged.B).toBe("2");
    expect(result.added).toContain("B");
    expect(result.skipped).toHaveLength(0);
  });

  it("respects keys filter", () => {
    const { merged, result } = cloneEnv(source, target, { keys: ["A"] });
    expect(merged.A).toBe("1");
    expect(result.added).toEqual(["A"]);
    expect("C" in merged).toBe(false);
  });

  it("preserves existing target keys not in source", () => {
    const { merged } = cloneEnv(source, target);
    expect(merged.D).toBe("4");
  });
});

describe("formatCloneResult", () => {
  it("formats result with added and skipped", () => {
    const result = { source: "staging", target: "prod", added: ["A"], skipped: ["B"] };
    const out = formatCloneResult(result);
    expect(out).toContain("staging → prod");
    expect(out).toContain("Added   : 1");
    expect(out).toContain("Skipped : 1");
  });
});
