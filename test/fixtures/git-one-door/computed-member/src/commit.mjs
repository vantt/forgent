import * as cp from 'node:child_process';

export function commit(kind) {
  return cp['exec' + kind]('git', ['commit', '-m', 'x']);
}
