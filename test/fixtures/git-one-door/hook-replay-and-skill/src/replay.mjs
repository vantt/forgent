import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Not `git`, but it changes what Git accepts: the hook runs outside `git hook run`.
export function replayPreCommit(root) {
  return spawnSync(path.join(root, '.githooks', 'pre-commit'), [], { cwd: root });
}
