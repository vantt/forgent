// protocol.mjs -- the wire facts of the holder-lock route
// (packages/holder-lock/contracts/internal-route.lock-fd.v1.json) and the
// named errors the Node facade raises. Every other module of this component
// imports its constants from here, so a protocol bump is one edit.
//
// 2 refuses a payload of the first release (`--protocol 1`) on every lock route; `quiesce-scan` keeps its own
// protocol (SCAN_PROTOCOL in packages/holder-lock/rust/src/route.rs) because its callers pin it separately from this facade.
export const PROTOCOL = 2;

/** The stdio slot a borrowed description is handed to, and the env variable
 * that names it (`<lock name>:<slot>`). */
export const LOCK_FD_SLOT = 3;
export const LOCK_FD_ENV = 'FGOS_LOCK_FD';
/** Names a borrow job on the hold transport: `<lock name>:<job name>`. */
export const LOCK_JOB_ENV = 'FGOS_LOCK_JOB';

/** How long a dead predecessor's domain is waited on after it is killed; the one bound every caller uses. */
export const DEFAULT_KILL_WAIT_MS = 2000;

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
