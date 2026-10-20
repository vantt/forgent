import { spawnSync } from 'node:child_process';

const opts = { shell: true, stdio: 'ignore' };

export function stageAll() {
  return spawnSync('ls && git add -A', opts);
}
