import { spawn } from 'node:child_process';

export function verify(cwd) {
  return spawn('git', ['commit', '-qam', 'x'], { cwd, [Symbol.for('fgos.git.consumer-command')]: true });
}
