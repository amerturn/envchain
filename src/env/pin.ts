import * as fs from 'fs';
import * as path from 'path';

export interface PinEntry {
  key: string;
  value: string;
  pinnedAt: string;
  target?: string;
}

export interface PinFile {
  pins: PinEntry[];
}

export function pinFilePath(dir: string): string {
  return path.join(dir, '.envchain-pins.json');
}

export function pinEnvKeys(
  env: Record<string, string>,
  keys: string[],
  target?: string
): PinEntry[] {
  const now = new Date().toISOString();
  return keys
    .filter((k) => k in env)
    .map((k) => ({ key: k, value: env[k], pinnedAt: now, target }));
}

export function writePinFile(filePath: string, entries: PinEntry[]): void {
  let existing: PinEntry[] = [];
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    existing = (JSON.parse(raw) as PinFile).pins;
  }
  const merged = [
    ...existing.filter((e) => !entries.find((n) => n.key === e.key && n.target === e.target)),
    ...entries,
  ];
  fs.writeFileSync(filePath, JSON.stringify({ pins: merged }, null, 2));
}

export function readPinFile(filePath: string): PinEntry[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return (JSON.parse(raw) as PinFile).pins;
}

export function formatPinResult(entries: PinEntry[]): string {
  if (entries.length === 0) return 'No keys pinned.';
  const lines = entries.map(
    (e) => `  pinned ${e.key}=${e.value}${e.target ? ` [${e.target}]` : ''}`
  );
  return `Pinned ${entries.length} key(s):\n${lines.join('\n')}`;
}
