import { execFileSync } from 'node:child_process';

// A read verb: `status` refreshes the index unless optional locks are off.
export function dirty(cwd) {
  return execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' }).trim() !== '';
}
