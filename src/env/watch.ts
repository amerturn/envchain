import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile } from './parser';
import { diffEnv, formatDiff } from './diff';

export interface WatchEvent {
  file: string;
  timestamp: Date;
  added: string[];
  removed: string[];
  changed: string[];
}

export function watchEnvFile(
  filePath: string,
  onChange: (event: WatchEvent) => void,
  intervalMs = 500
): () => void {
  let previous = safeRead(filePath);
  let running = true;

  const interval = setInterval(() => {
    if (!running) return;
    const current = safeRead(filePath);
    const diff = diffEnv(previous, current);
    if (diff.added.length || diff.removed.length || diff.changed.length) {
      onChange({
        file: path.resolve(filePath),
        timestamp: new Date(),
        added: diff.added.map((e) => e.key),
        removed: diff.removed.map((e) => e.key),
        changed: diff.changed.map((e) => e.key),
      });
      previous = current;
    }
  }, intervalMs);

  return () => {
    running = false;
    clearInterval(interval);
  };
}

function safeRead(filePath: string): Record<string, string> {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return parseEnvFile(raw);
  } catch {
    return {};
  }
}

export function formatWatchEvent(event: WatchEvent): string {
  const lines: string[] = [
    `[${event.timestamp.toISOString()}] ${event.file}`,
  ];
  if (event.added.length) lines.push(`  + added:   ${event.added.join(', ')}`);
  if (event.removed.length) lines.push(`  - removed: ${event.removed.join(', ')}`);
  if (event.changed.length) lines.push(`  ~ changed: ${event.changed.join(', ')}`);
  return lines.join('\n');
}
