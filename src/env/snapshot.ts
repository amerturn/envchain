import * as fs from "fs";
import * as path from "path";

export interface EnvSnapshot {
  timestamp: string;
  target: string;
  env: Record<string, string>;
}

export function createSnapshot(
  target: string,
  env: Record<string, string>
): EnvSnapshot {
  return {
    timestamp: new Date().toISOString(),
    target,
    env: { ...env },
  };
}

export function writeSnapshot(filePath: string, snapshot: EnvSnapshot): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
}

export function readSnapshot(filePath: string): EnvSnapshot {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  if (!parsed.timestamp || !parsed.target || !parsed.env) {
    throw new Error(`Invalid snapshot format in: ${filePath}`);
  }
  return parsed as EnvSnapshot;
}

export function snapshotPath(baseDir: string, target: string): string {
  const safe = target.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(baseDir, `.envchain`, `snapshots`, `${safe}.json`);
}
