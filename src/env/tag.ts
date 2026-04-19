import * as fs from "fs";
import * as path from "path";

export interface TagEntry {
  key: string;
  tags: string[];
}

export interface TagResult {
  tagged: TagEntry[];
  skipped: string[];
}

export function tagEnvKeys(
  env: Record<string, string>,
  keys: string[],
  tags: string[],
  existingTags: Record<string, string[]> = {}
): TagResult {
  const tagged: TagEntry[] = [];
  const skipped: string[] = [];

  for (const key of keys) {
    if (!(key in env)) {
      skipped.push(key);
      continue;
    }
    const prev = existingTags[key] ?? [];
    const merged = Array.from(new Set([...prev, ...tags]));
    tagged.push({ key, tags: merged });
  }

  return { tagged, skipped };
}

export function writeTagFile(
  tagMap: Record<string, string[]>,
  filePath: string
): void {
  fs.writeFileSync(filePath, JSON.stringify(tagMap, null, 2), "utf-8");
}

export function readTagFile(filePath: string): Record<string, string[]> {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    throw new Error(`Failed to parse tag file at ${filePath}: file may be corrupted`);
  }
}

export function tagFilePath(dir: string): string {
  return path.join(dir, ".envchain-tags.json");
}

export function formatTagResult(result: TagResult): string {
  const lines: string[] = [];
  for (const { key, tags } of result.tagged) {
    lines.push(`  tagged  ${key} [${tags.join(", ")}]`);
  }
  for (const key of result.skipped) {
    lines.push(`  skipped ${key} (not found)`);
  }
  return lines.join("\n");
}
