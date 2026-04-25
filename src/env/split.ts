import { parseEnvFile, serializeEnvFile } from './parser';
import * as fs from 'fs';

export interface SplitResult {
  chunks: Record<string, Record<string, string>>;
  totalKeys: number;
  chunkCount: number;
}

/**
 * Split an env map into named chunks by a given strategy.
 * Strategies: 'alpha' (by first letter), 'size' (fixed chunk size), 'prefix' (by key prefix).
 */
export function splitEnvKeys(
  env: Record<string, string>,
  strategy: 'alpha' | 'size' | 'prefix',
  options: { chunkSize?: number; delimiter?: string } = {}
): SplitResult {
  const chunks: Record<string, Record<string, string>> = {};

  for (const [key, value] of Object.entries(env)) {
    let bucket: string;

    if (strategy === 'alpha') {
      bucket = key[0]?.toUpperCase() ?? '_';
    } else if (strategy === 'prefix') {
      const delim = options.delimiter ?? '_';
      const idx = key.indexOf(delim);
      bucket = idx > 0 ? key.slice(0, idx) : '_default';
    } else {
      // size strategy
      const size = options.chunkSize ?? 10;
      const keys = Object.keys(env);
      const pos = keys.indexOf(key);
      const chunkIndex = Math.floor(pos / size);
      bucket = `chunk_${chunkIndex}`;
    }

    if (!chunks[bucket]) chunks[bucket] = {};
    chunks[bucket][key] = value;
  }

  return {
    chunks,
    totalKeys: Object.keys(env).length,
    chunkCount: Object.keys(chunks).length,
  };
}

export function splitEnvFile(
  filePath: string,
  strategy: 'alpha' | 'size' | 'prefix',
  options: { chunkSize?: number; delimiter?: string } = {}
): SplitResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvFile(content);
  return splitEnvKeys(env, strategy, options);
}

export function formatSplitResult(result: SplitResult): string {
  const lines: string[] = [
    `Split ${result.totalKeys} keys into ${result.chunkCount} chunk(s):`,
  ];
  for (const [bucket, keys] of Object.entries(result.chunks)) {
    lines.push(`  [${bucket}] ${Object.keys(keys).length} key(s): ${Object.keys(keys).join(', ')}`);
  }
  return lines.join('\n');
}

export function writeSplitFiles(
  result: SplitResult,
  outputDir: string,
  ext = '.env'
): string[] {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const written: string[] = [];
  for (const [bucket, env] of Object.entries(result.chunks)) {
    const outPath = `${outputDir}/${bucket}${ext}`;
    fs.writeFileSync(outPath, serializeEnvFile(env), 'utf8');
    written.push(outPath);
  }
  return written;
}
