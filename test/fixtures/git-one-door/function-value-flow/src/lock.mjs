import { spawn } from 'node:child_process';

export function lockHandle() {
  return {
    spawnHolding(command, args) {
      return spawn(command, args);
    },
  };
}
