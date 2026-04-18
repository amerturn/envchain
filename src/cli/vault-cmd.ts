import * as path from 'path';
import * as readline from 'readline';
import { writeVaultFile, readVaultFile } from '../env/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';

function promptPassphrase(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function vaultEncryptCmd(envFilePath: string, vaultFilePath?: string): Promise<void> {
  const outPath = vaultFilePath ?? envFilePath + '.vault';
  const passphrase = await promptPassphrase('Passphrase: ');
  const fs = await import('fs');
  const plaintext = fs.readFileSync(envFilePath, 'utf8');
  writeVaultFile(outPath, plaintext, passphrase);
  console.error(`Encrypted → ${outPath}`);
}

export async function vaultDecryptCmd(vaultFilePath: string, outFilePath?: string): Promise<void> {
  const passphrase = await promptPassphrase('Passphrase: ');
  const plaintext = readVaultFile(vaultFilePath, passphrase);
  if (outFilePath) {
    const fs = await import('fs');
    fs.writeFileSync(outFilePath, plaintext, 'utf8');
    console.error(`Decrypted → ${outFilePath}`);
  } else {
    process.stdout.write(plaintext);
  }
}

export async function vaultViewCmd(vaultFilePath: string): Promise<void> {
  const passphrase = await promptPassphrase('Passphrase: ');
  const plaintext = readVaultFile(vaultFilePath, passphrase);
  const vars = parseEnvFile(plaintext);
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    masked[k] = v.length > 4 ? v.slice(0, 2) + '*'.repeat(v.length - 4) + v.slice(-2) : '****';
  }
  process.stdout.write(serializeEnvFile(masked));
}
