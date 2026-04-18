import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { encryptEnv, decryptEnv, writeVaultFile, readVaultFile } from './vault';

const PASSPHRASE = 'super-secret-passphrase';
const PLAINTEXT = 'API_KEY=abc123\nDB_URL=postgres://localhost/mydb\n';

function tmpFile(name: string): string {
  return path.join(os.tmpdir(), `envchain-vault-test-${name}`);
}

describe('encryptEnv / decryptEnv', () => {
  it('round-trips plaintext', () => {
    const cipher = encryptEnv(PLAINTEXT, PASSPHRASE);
    expect(decryptEnv(cipher, PASSPHRASE)).toBe(PLAINTEXT);
  });

  it('produces different ciphertext on each call (random IV+salt)', () => {
    const a = encryptEnv(PLAINTEXT, PASSPHRASE);
    const b = encryptEnv(PLAINTEXT, PASSPHRASE);
    expect(a).not.toBe(b);
  });

  it('throws on wrong passphrase', () => {
    const cipher = encryptEnv(PLAINTEXT, PASSPHRASE);
    expect(() => decryptEnv(cipher, 'wrong-pass')).toThrow();
  });

  it('throws on tampered ciphertext', () => {
    const cipher = encryptEnv(PLAINTEXT, PASSPHRASE);
    const buf = Buffer.from(cipher, 'base64');
    buf[buf.length - 1] ^= 0xff;
    expect(() => decryptEnv(buf.toString('base64'), PASSPHRASE)).toThrow();
  });
});

describe('writeVaultFile / readVaultFile', () => {
  it('writes and reads back the original content', () => {
    const file = tmpFile('rw.vault');
    writeVaultFile(file, PLAINTEXT, PASSPHRASE);
    expect(readVaultFile(file, PASSPHRASE)).toBe(PLAINTEXT);
    fs.unlinkSync(file);
  });

  it('creates parent directories if needed', () => {
    const file = tmpFile(path.join('nested', 'dir', 'secrets.vault'));
    writeVaultFile(file, PLAINTEXT, PASSPHRASE);
    expect(fs.existsSync(file)).toBe(true);
    fs.rmSync(path.dirname(path.dirname(file)), { recursive: true });
  });
});
