// state-root.mjs -- the one state root of this process
// (packages/holder-lock/contracts/internal-route.state-root.v1.json).
//
// The Rust host resolves the root once and exports FGOS_STATE_ROOT before it
// execs the Node payload; dispatch pins the same variable into every child.
// This module reads that variable and nothing else. Only the compatibility
// channel (`node bin/fgos.mjs`, no host in front) has no pin: then the route
// `fgos internal state-root` is asked once per process and the answer kept.
// Node never computes the root from HOME/XDG itself: one formula, in Rust.

import path from 'node:path';
import { runStateRootRoute } from './driver.mjs';

export const STATE_ROOT_ENV = 'FGOS_STATE_ROOT';
export const LOCKS_DIR = 'locks';

let routeAnswer = null;

function pinnedRoot(env) {
  const raw = env[STATE_ROOT_ENV];
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  return { stateRoot: raw, lockRoot: path.join(raw, LOCKS_DIR), source: 'pinned' };
}

/**
 * resolveStateRoot({ env, fgosDir }) -> { stateRoot, lockRoot, source }
 *
 * A non-blank FGOS_STATE_ROOT in `env` wins verbatim (source `pinned`), read
 * fresh on every call so a pin set after import is honoured. Otherwise the
 * route's answer, asked once per process. Throws `lock-driver-unavailable`
 * when no host binary can answer.
 */
export function resolveStateRoot({ env = process.env, fgosDir } = {}) {
  const pinned = pinnedRoot(env);
  if (pinned) return pinned;
  if (!routeAnswer) routeAnswer = runStateRootRoute({ fgosDir, env });
  return { ...routeAnswer };
}

/** `<stateRoot>/locks` for the current process. */
export function resolveLockRoot(opts = {}) {
  return resolveStateRoot(opts).lockRoot;
}
