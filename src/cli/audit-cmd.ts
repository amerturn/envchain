import * as path from 'path';
import { resolveTargetChain, flattenTargetEnv } from '../targets/target';
import { requireTarget } from '../targets/loader';
import { resolveEnv } from '../env/resolver';
import { loadConfigFromCwd } from '../config/loader';
import { auditTarget, formatAuditEntry } from '../env/audit';

export interface AuditCmdOptions {
  target: string;
  snapshotDir?: string;
  cwd?: string;
}

export async function runAuditCmd(options: AuditCmdOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const config = loadConfigFromCwd(cwd);
  const snapshotDir = options.snapshotDir ?? path.join(cwd, '.envchain', 'snapshots');

  const targetDef = requireTarget(options.target, cwd);
  const chain = resolveTargetChain(options.target, (name) => requireTarget(name, cwd));
  const flatEnv = flattenTargetEnv(chain);
  const resolved = resolveEnv(flatEnv, process.env as Record<string, string>);

  const entry = auditTarget(options.target, snapshotDir, resolved);

  if (!entry) {
    console.log(`No snapshot found for target "${options.target}". Run 'envchain snapshot ${options.target}' first.`);
    return;
  }

  const hasChanges =
    entry.added.length > 0 || entry.removed.length > 0 || entry.changed.length > 0;

  console.log(formatAuditEntry(entry));

  if (!hasChanges) {
    console.log('\nNo changes detected since last snapshot.');
  } else {
    console.log(`\nDrift detected: ${entry.added.length} added, ${entry.removed.length} removed, ${entry.changed.length} changed.`);
    process.exitCode = 1;
  }
}
