import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, KEY_LEN);
}

export function encryptEnv(plaintext: string, passphrase: string): string {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(passphrase, salt);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decryptEnv(ciphertext: string, passphrase: string): string {
  const buf = Buffer.from(ciphertext, 'base64');
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 28);
  const tag = buf.subarray(28, 44);
  const encrypted = buf.subarray(44);
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function writeVaultFile(filePath: string, plaintext: string, passphrase: string): void {
  const encrypted = encryptEnv(plaintext, passphrase);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, encrypted, 'utf8');
}

export function readVaultFile(filePath: string, passphrase: string): string {
  const ciphertext = fs.readFileSync(filePath, 'utf8').trim();
  return decryptEnv(ciphertext, passphrase);
}
