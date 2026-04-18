import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  createSnapshot,
  writeSnapshot,
  readSnapshot,
  snapshotPath,
} from "./snapshot";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-snap-"));
}

describe("createSnapshot", () => {
  it("captures target and env with timestamp", () => {
    const env = { FOO: "bar", BAZ: "qux" };
    const snap = createSnapshot("production", env);
    expect(snap.target).toBe("production");
    expect(snap.env).toEqual(env);
    expect(typeof snap.timestamp).toBe("string");
    expect(new Date(snap.timestamp).getTime()).not.toBeNaN();
  });

  it("does not mutate original env", () => {
    const env = { A: "1" };
    const snap = createSnapshot("dev", env);
    snap.env.A = "mutated";
    expect(env.A).toBe("1");
  });
});

describe("writeSnapshot / readSnapshot", () => {
  it("round-trips a snapshot to disk", () => {
    const dir = tmpDir();
    const snap = createSnapshot("staging", { KEY: "value" });
    const file = path.join(dir, "snap.json");
    writeSnapshot(file, snap);
    const loaded = readSnapshot(file);
    expect(loaded).toEqual(snap);
  });

  it("creates intermediate directories", () => {
    const dir = tmpDir();
    const file = path.join(dir, "nested", "deep", "snap.json");
    writeSnapshot(file, createSnapshot("dev", {}));
    expect(fs.existsSync(file)).toBe(true);
  });

  it("throws when snapshot file missing", () => {
    expect(() => readSnapshot("/nonexistent/snap.json")).toThrow(
      "Snapshot file not found"
    );
  });
});

describe("snapshotPath", () => {
  it("returns a path under .envchain/snapshots", () => {
    const p = snapshotPath("/project", "production");
    expect(p).toBe("/project/.envchain/snapshots/production.json");
  });

  it("sanitizes special characters in target name", () => {
    const p = snapshotPath("/project", "my/target:v2");
    expect(path.basename(p)).toBe("my_target_v2.json");
  });
});
