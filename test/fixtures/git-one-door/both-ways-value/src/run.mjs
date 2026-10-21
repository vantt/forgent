import { spawnSync } from 'node:child_process';

// Called by name with a harmless program, and handed on as a value that is called with git.
function exec(bin) {
  return spawnSync(bin, ['commit']);
}
function runWith(fn) {
  return fn('git');
}
export function main() {
  exec('ls');
  return runWith(exec);
}
