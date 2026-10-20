import { execFileSync as run } from 'node:child_process';

const GIT = process.platform === 'win32' ? 'git.exe' : 'git';

function inCheckout(cwd, ...rest) {
  return run(GIT, ['-C', cwd, 'commit', ...rest]);
}

export function amend(cwd) {
  return inCheckout(cwd, '--amend', '--no-edit');
}
