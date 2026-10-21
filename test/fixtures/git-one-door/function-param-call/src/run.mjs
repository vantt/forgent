import { spawnSync } from 'node:child_process';

// The parameter holds a function: what it returns, where the caller passes it.
export function start(options) {
  const cfg = options.prepare({ command: 'true' });
  return spawnSync(cfg.command, ['commit']);
}
function toVcs() {
  return { command: 'git' };
}
export function main() {
  return start({ prepare: toVcs });
}
