// state-root.mjs -- the one state root of this process
// (packages/holder-lock/contracts/state-root.vectors.v1.json).
//
// The Rust host resolves the root once and exports FGOS_STATE_ROOT before it
// execs the Node payload; dispatch pins the same variable into every child.
// Without a pin (a payload not started by the host, such as a test process)
// the in-process door answers with the host's own Rust formula. Node never
// computes the root from HOME/XDG itself: one formula, in Rust.

import path from 'node:path';
import { doorStateRoot } from './driver.mjs';

export const STATE_ROOT_ENV = 'FGOS_STATE_ROOT';
export const LOCKS_DIR = 'locks';

function pinnedRoot(env) {
  const raw = env[STATE_ROOT_ENV];
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  return { stateRoot: raw, lockRoot: path.join(raw, LOCKS_DIR), source: 'pinned' };
}

/**
 * resolveStateRoot({ env }) -> { stateRoot, lockRoot, source }
 *
 * A non-blank FGOS_STATE_ROOT in `env` wins verbatim (source `pinned`), read
 * fresh on every call so a pin set after import is honoured. Otherwise the
 * door's answer over `env`. Throws `lock-driver-unavailable` when the door
 * cannot be reached; the root is never guessed.
 */
export function resolveStateRoot({ env = process.env } = {}) {
  return pinnedRoot(env) ?? doorStateRoot(env);
}

/** `<stateRoot>/locks` for the current process. */
export function resolveLockRoot(opts = {}) {
  return resolveStateRoot(opts).lockRoot;
}
