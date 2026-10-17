// protocol.mjs -- the wire facts of the holder-lock route
// (packages/holder-lock/contracts/internal-route.lock-fd.v1.json) and the
// named errors the Node facade raises. Every other module of this component
// imports its constants from here, so a protocol bump is one edit.
//
// `lock.predecessorKillWaitMs` is read through the same project-over-global
// config reader `fgos setup` uses (readSharedConfigOrEmpty + mergeWithGlobalConfig):
// the facade never installs the predecessor rule, it only forwards the bound
// to the route as `--kill-wait-ms`.

import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';

export const PROTOCOL = 1;

/** The stdio slot a borrowed description is handed to, and the env variable
 * that names it (`<lock name>:<slot>`). */
export const LOCK_FD_SLOT = 3;
export const LOCK_FD_ENV = 'FGOS_LOCK_FD';
/** Names a borrow job on the hold transport: `<lock name>:<job name>`. */
export const LOCK_JOB_ENV = 'FGOS_LOCK_JOB';

export const DEFAULT_KILL_WAIT_MS = 2000;
export const MAX_KILL_WAIT_MS = 60_000;
export const KILL_WAIT_CONFIG_KEY = 'lock.predecessorKillWaitMs';

/** Raised for every failure the facade names. `code` is the stable key a
 * caller branches on; `category` follows the CLI-facing vocabulary other
 * precondition errors use (WriterIdentityError). Extra fields describe the
 * failure (`reason`, `detail`, `domain`, `held`, `acquiring`, `pids`...). */
export class HolderLockError extends Error {
  constructor(code, message, details = {}) {
    super(`holder-lock (${code}): ${message}`);
    this.name = 'HolderLockError';
    this.code = code;
    this.category = 'precondition';
    Object.assign(this, details);
  }
}

/** The first line of the route's stdout as an object, or an error naming
 * what came back instead. A line whose `v`/`protocol` is not this
 * protocol is refused: a route of another release answers nothing here. */
export function parseRouteLine(stdout, bin) {
  const line = String(stdout ?? '').split('\n').find((candidate) => candidate.trim() !== '');
  if (line === undefined) {
    throw new HolderLockError('lock-route-bad-output', `${bin} printed no result line`, { stdout: String(stdout ?? '').slice(0, 200) });
  }
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new HolderLockError('lock-route-bad-output', `${bin} printed something that is not JSON: ${line.slice(0, 200)}`);
  }
  if (parsed === null || typeof parsed !== 'object' || parsed.v !== PROTOCOL || parsed.protocol !== PROTOCOL) {
    throw new HolderLockError('lock-route-bad-output', `${bin} answered with protocol ${parsed?.protocol ?? '?'}, expected ${PROTOCOL}: ${line.slice(0, 200)}`);
  }
  return parsed;
}

/**
 * `lock.predecessorKillWaitMs` for the project rooted at `projectRoot`
 * (the directory holding `.fgos/config.json`; omit it for a machine-scope
 * lock, which only sees the global config). Absent -> the default. Present
 * but not a positive integer -> an error: a bound that cannot be forwarded
 * to the route is a misconfiguration, never something to guess around.
 */
export function readPredecessorKillWaitMs({ projectRoot } = {}) {
  let merged;
  try {
    merged = mergeWithGlobalConfig(projectRoot ? readSharedConfigOrEmpty(projectRoot) : {});
  } catch {
    // The optional-setting discipline of readSharedConfigOrEmpty, extended to
    // the global file: a half-typed config is an ordinary state and reads as
    // "nothing configured"; doctor is the one that reports the parse failure.
    merged = {};
  }
  const section = merged.lock;
  if (!section || typeof section !== 'object' || Array.isArray(section)) return DEFAULT_KILL_WAIT_MS;
  const value = section.predecessorKillWaitMs;
  if (value === undefined) return DEFAULT_KILL_WAIT_MS;
  if (!Number.isInteger(value) || value < 1 || value > MAX_KILL_WAIT_MS) {
    throw new HolderLockError('lock-config-invalid', `${KILL_WAIT_CONFIG_KEY} must be an integer from 1 to ${MAX_KILL_WAIT_MS}, got ${JSON.stringify(value)}`, { key: KILL_WAIT_CONFIG_KEY, value });
  }
  return value;
}
