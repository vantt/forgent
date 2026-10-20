import childProcess from 'node:child_process';

export function pushFrom(dir, prefix) {
  return childProcess.execFileSync('git', ['-C', dir, '-c', 'push.default=current', ...prefix, 'push', '-u', 'origin', 'HEAD']);
}
