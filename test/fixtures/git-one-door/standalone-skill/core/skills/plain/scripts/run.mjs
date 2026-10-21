import { execFileSync } from 'node:child_process';

export function fetchClone(dir) {
  return execFileSync('git', ['-C', dir, 'fetch']);
}
