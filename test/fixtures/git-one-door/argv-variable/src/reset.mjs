import { spawnSync } from 'node:child_process';

const tool = 'git';

export function hardReset(cwd, target) {
  const argv = ['reset'];
  argv.push('--hard', target);
  return spawnSync(tool, argv, { cwd });
}
