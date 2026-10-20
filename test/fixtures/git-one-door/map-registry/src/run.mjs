import { spawnSync } from 'node:child_process';

// A module-private registry: any value stored in it may come back from `get`.
const DRIVERS = new Map();
DRIVERS.set('vcs', { prepare() { return { command: 'git' }; } });

export function run(type) {
  const driver = DRIVERS.get(type);
  return spawnSync(driver.prepare().command, ['commit']);
}
