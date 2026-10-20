import { runWithArgv } from './runner.mjs';

export function checkpoint(cwd) {
  return runWithArgv(cwd, () => ['commit', '-q', '-m', 'checkpoint']);
}
