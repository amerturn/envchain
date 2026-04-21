import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { watchEnvFile, formatWatchEvent, WatchEvent } from './watch';

function tmpFile(): string {
  return path.join(os.tmpdir(), `watch-test-${Date.now()}-${Math.random()}.env`);
}

describe('watchEnvFile', () => {
  it('detects added keys', async () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'FOO=1\n');
    const events: WatchEvent[] = [];
    const stop = watchEnvFile(file, (e) => events.push(e), 50);
    await new Promise((r) => setTimeout(r, 80));
    fs.writeFileSync(file, 'FOO=1\nBAR=2\n');
    await new Promise((r) => setTimeout(r, 120));
    stop();
    fs.unlinkSync(file);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].added).toContain('BAR');
  });

  it('detects removed keys', async () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'FOO=1\nBAR=2\n');
    const events: WatchEvent[] = [];
    const stop = watchEnvFile(file, (e) => events.push(e), 50);
    await new Promise((r) => setTimeout(r, 80));
    fs.writeFileSync(file, 'FOO=1\n');
    await new Promise((r) => setTimeout(r, 120));
    stop();
    fs.unlinkSync(file);
    expect(events[0].removed).toContain('BAR');
  });

  it('detects changed keys', async () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'FOO=1\n');
    const events: WatchEvent[] = [];
    const stop = watchEnvFile(file, (e) => events.push(e), 50);
    await new Promise((r) => setTimeout(r, 80));
    fs.writeFileSync(file, 'FOO=2\n');
    await new Promise((r) => setTimeout(r, 120));
    stop();
    fs.unlinkSync(file);
    expect(events[0].changed).toContain('FOO');
  });

  it('stop function halts watching', async () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'FOO=1\n');
    const events: WatchEvent[] = [];
    const stop = watchEnvFile(file, (e) => events.push(e), 50);
    stop();
    fs.writeFileSync(file, 'FOO=2\n');
    await new Promise((r) => setTimeout(r, 150));
    fs.unlinkSync(file);
    expect(events.length).toBe(0);
  });
});

describe('formatWatchEvent', () => {
  it('formats an event with all change types', () => {
    const event: WatchEvent = {
      file: '/app/.env',
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
      added: ['NEW_KEY'],
      removed: ['OLD_KEY'],
      changed: ['UPDATED'],
    };
    const out = formatWatchEvent(event);
    expect(out).toContain('2024-01-01');
    expect(out).toContain('+ added:   NEW_KEY');
    expect(out).toContain('- removed: OLD_KEY');
    expect(out).toContain('~ changed: UPDATED');
  });
});
