import { runBorrowed } from './holder-lock/index.mjs';

export function stageUnderLock(handle, cwd) {
  const spec = { command: 'git', args: ['add', '--', '.'], cwd };
  return runBorrowed(handle, spec);
}
