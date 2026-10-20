import { execFileSync } from 'node:child_process';

// The verb is chosen by the caller in another file.
export function runWithArgv(cwd, build) {
  return execFileSync('git', build(), { cwd });
}
