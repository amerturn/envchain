import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface SquashResult {
  original: Record<string, string>;
  squashed: Record<string, string>;
  removed: string[];
  kept: string[];
}

/**
 * Squash multiple env maps into one, with later maps taking precedence.
 * Duplicate keys across layers are collapsed — only the winning value survives.
 */
export function squashEnvMaps(
  layers: Record<string, string>[]
): SquashResult {
  const original: Record<string, string> = {};
  const squashed: Record<string, string> = {};
  const seenKeys = new Set<string>();

  for (const layer of layers) {
    for (const [k, v] of Object.entries(layer)) {
      original[k] = v;
      seenKeys.add(k);
    }
  }

  // Later layers win — apply in order
  for (const layer of layers) {
    for (const [k, v] of Object.entries(layer)) {
      squashed[k] = v;
    }
  }

  const kept = Object.keys(squashed);
  const removed = Object.keys(original).filter(
    (k) => !(k in squashed)
  );

  return { original, squashed, removed, kept };
}

export function squashEnvFiles(filePaths: string[]): SquashResult {
  const layers = filePaths.map((fp) =>
    parseEnvFile(fs.readFileSync(fp, 'utf8'))
  );
  return squashEnvMaps(layers);
}

export function formatSquashResult(result: SquashResult): string {
  const lines: string[] = [];
  lines.push(`Squashed ${result.kept.length} key(s) from ${Object.keys(result.original).length} total.`);
  if (result.removed.length > 0) {
    lines.push(`Removed (unreachable): ${result.removed.join(', ')}`);
  }
  lines.push('');
  lines.push(serializeEnvFile(result.squashed));
  return lines.join('\n');
}
