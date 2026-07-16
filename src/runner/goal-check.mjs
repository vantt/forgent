// goal-check.mjs — the goal-check primitive (per D3): run the item's own
// `verify` — the literal command string, via a shell, in the given cwd —
// and judge only by its exit status. The caller's own report (worker
// process, or a human returning an item) is never trusted on its own.
//
// Extracted from loop.mjs (stage-decompose S2-pull, cell action (3)): the
// runner calls this inside a worktree, `bin/fgos.mjs`'s `return` verb calls
// the exact same function directly in the host repo's cwd — one goal-check
// implementation, never two.

import { spawnSync } from 'node:child_process';

export function runGoalCheck(item, cwd, timeoutMs) {
  const result = spawnSync(item.verify, {
    shell: true,
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });
  return {
    passed: result.status === 0,
    status: result.status,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}
