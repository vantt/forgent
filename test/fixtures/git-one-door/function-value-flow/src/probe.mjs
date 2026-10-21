import { lockHandle } from './lock.mjs';

export function probeAll(probe) {
  const lock = lockHandle();
  return probe({ run: lock.spawnHolding });
}

export function gitProbe({ run }) {
  return run('git', ['push', 'origin']);
}
