import { Command } from 'commander';
import { registerLintCmd } from './lint-cmd';
import * as loader from '../config/loader';
import * as targetLoader from '../targets/loader';
import * as target from '../targets/target';
import * as resolver from '../env/resolver';
import * as lint from '../env/lint';

const mockConfig = { targets: { dev: {} } };

beforeEach(() => {
  jest.spyOn(loader, 'loadConfigFromCwd').mockReturnValue(mockConfig as any);
  jest.spyOn(targetLoader, 'requireTarget').mockReturnValue({} as any);
  jest.spyOn(target, 'flattenTargetEnv').mockReturnValue([]);
  jest.spyOn(resolver, 'resolveEnv').mockReturnValue({ API_URL: 'https://example.com' });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
});

afterEach(() => jest.restoreAllMocks());

async function runCmd(args: string[]) {
  const program = new Command();
  program.exitOverride();
  registerLintCmd(program);
  await program.parseAsync(['node', 'envchain', ...args]);
}

test('lint runs for specified target and logs result', async () => {
  jest.spyOn(lint, 'lintEnv').mockReturnValue({ target: 'dev', issues: [], ok: true });
  jest.spyOn(lint, 'formatLintResult').mockReturnValue('✔ dev: no issues found');
  await runCmd(['lint', 'dev']);
  expect(console.log).toHaveBeenCalledWith('✔ dev: no issues found');
});

test('lint exits 1 when errors found', async () => {
  jest.spyOn(lint, 'lintEnv').mockReturnValue({
    target: 'dev',
    issues: [{ key: 'SECRET', severity: 'error', message: 'short' }],
    ok: false,
  });
  jest.spyOn(lint, 'formatLintResult').mockReturnValue('✖ dev: 1 issue(s)');
  await expect(runCmd(['lint', 'dev'])).rejects.toThrow('exit');
});
