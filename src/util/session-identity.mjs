// session-identity.mjs -- resolveWriterIdentity(): identifies "the writer"
// for the STR65 main-checkout lock (D6, str65-worktree-isolation-enforcement)
// and names how far that identity can be trusted (D9/D15/D16, str46-io-contract).
//
// Layered signal:
//   (a) a recognized agent-session env var (FGOS_SESSION_ID, falling back to
//       the legacy CLAUDE_CODE_SESSION_ID) -> a string session identity.
//       The registry at <fgosDir>/sessions.json is then consulted ONLY to
//       CONFIRM that string: the same id is worth more when fgOS itself
//       issued it than when anyone exported it, so a match reports source
//       REGISTRY and a miss reports ENV. The VALUE is identical either way.
//   (b) otherwise (a bare human terminal, no agent session env present) ->
//       a numeric identity from a persistent ancestor process's pid, found
//       by walking up the process tree via `ps -o ppid=` a SMALL, FIXED
//       number of hops (3) from the caller's own pid.
//
// The registry never SUPPLIES an identity, and no process is matched to a
// row by directory or by row pid. Such a rule would resolve two agent
// processes holding different FGOS_SESSION_ID values inside one session
// worktree to the same id; main-checkout-lock.mjs's self-recognition branch
// would then admit both as the same writer -- reopening the exact collision
// STR65 built that lock to close.
//
// Why only 3 hops, not an open-ended climb to the outermost ancestor: this
// is a deliberate, documented narrowing from an earlier draft that walked
// all the way up. Climbing further is far more likely to land on a process
// that is genuinely SHARED across multiple distinct terminal sessions (a
// tmux server, sshd, or the terminal emulator itself) rather than a process
// unique to one session -- collapsing separate concurrent writers onto the
// same identity, defeating the point of D6. Stopping a few hops past the
// hook's own immediate parent (git) lands closer to the invoking shell
// without eliminating collision risk entirely: two BARE HUMAN TERMINALS
// that happen to share a parent this shallow (e.g. two panes forked directly
// from the same shell) can still resolve to the same ancestor pid and
// collide. This is accepted, not a bug -- D6 scopes the human-terminal
// fallback as best-effort only. All 3 documented STR65 incidents were agent
// sessions, which carry a unique env session id and never reach this
// fallback path at all.
//
// Zero-dep aside from `ps` itself (Node builtins only + one shellout). The
// registry is read with this module's OWN node:fs rather than through
// session.mjs on purpose: no sessions.lock is taken, and every read failure
// means "not confirmed" instead of throwing -- the opposite of session.mjs's
// deliberately fail-closed reader, and the only semantics compatible with
// D9's "never block a caller".

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const REGISTRY = 'registry';
export const ENV = 'env';
export const PID = 'pid';
export const UNRESOLVED = 'unresolved';

const MAX_HOPS = 3;
const SESSIONS_FILE = 'sessions.json';

// Same charset session.mjs validates minted session ids against, plus a
// length ceiling. A value outside it is DISCARDED and the next source is
// tried -- never thrown, never allowed to block a verb (D18).
const SESSION_ID_RE = /^[A-Za-z0-9._-]+$/;
const MAX_ID_LENGTH = 200;

function envSessionId(env) {
  for (const key of ['FGOS_SESSION_ID', 'CLAUDE_CODE_SESSION_ID']) {
    const value = env[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > MAX_ID_LENGTH || !SESSION_ID_RE.test(trimmed)) continue;
    return trimmed;
  }
  return null;
}

/** True only when `sessionId` equals the sessionId of some row in
 * <fgosDir>/sessions.json. A missing fgosDir, a missing or unreadable file,
 * unparsable or half-written JSON (writeRegistry is a non-atomic
 * writeFileSync, so a torn read is reachable), a non-array, or rows of the
 * wrong shape all mean the same thing: not confirmed. */
function registryConfirms(fgosDir, sessionId) {
  if (typeof fgosDir !== 'string' || !fgosDir) return false;
  let rows;
  try {
    rows = JSON.parse(fs.readFileSync(path.join(fgosDir, SESSIONS_FILE), 'utf8'));
  } catch {
    return false;
  }
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => row !== null && typeof row === 'object' && row.sessionId === sessionId);
}

/** Returns the parent pid of `pid` via `ps -o ppid= -p <pid>`, or null if
 * `ps` is unavailable, exits non-zero, prints something unparsable, or
 * exceeds PPID_TIMEOUT_MS (tsk-13m: this call runs inside the held
 * cross-process events.lock via resolveWriterIdentity, so a hung `ps`
 * must not be able to block that lock indefinitely -- the timeout throws,
 * caught below identically to every other failure mode). */
const PPID_TIMEOUT_MS = 200;

function ppidOf(pid, execFile) {
  try {
    const out = execFile('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8', timeout: PPID_TIMEOUT_MS });
    const parsed = Number.parseInt(String(out).trim(), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * resolveWriterIdentity(fgosDir, { env, pid, execFile }) -> { id, source }
 *
 * `fgosDir` is the `.fgos` directory whose session registry confirms an
 * env-supplied id; it may be omitted, in which case that confirmation step
 * is simply skipped -- never an error. `env` defaults to process.env, `pid`
 * to process.pid, `execFile` to execFileSync, all overridable for testing
 * (including with fake ancestor chains, no real `ps` involved).
 *
 * Returns { id: <session id string>, source: REGISTRY } when a charset-valid
 * agent-session env var is set and its value matches a row in the registry,
 * and { id: <the same string>, source: ENV } when it does not.
 *
 * Otherwise returns { id: <numeric pid>, source: PID }: the ancestor reached
 * after walking up to MAX_HOPS parent links from `pid`. The walk stops early
 * -- returning the last successfully-resolved pid -- if it hits pid 1 (init)
 * or `ps` fails partway through. If `ps` fails on the very FIRST hop (e.g.
 * no `ps` binary on this platform), no source could confirm anything at all:
 * the id is still the caller's OWN pid, exactly as before, and only `source`
 * becomes UNRESOLVED (D17). That degraded case loses cross-commit
 * persistence (each hook invocation gets its own pid again) but stays safe,
 * and it never throws or hangs.
 */
export function resolveWriterIdentity(fgosDir, { env = process.env, pid = process.pid, execFile = execFileSync } = {}) {
  const sessionId = envSessionId(env);
  if (sessionId) {
    return { id: sessionId, source: registryConfirms(fgosDir, sessionId) ? REGISTRY : ENV };
  }

  let current = pid;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const next = ppidOf(current, execFile);
    if (next === null) {
      return hop === 0 ? { id: pid, source: UNRESOLVED } : { id: current, source: PID };
    }
    current = next;
    if (current === 1) break;
  }
  return { id: current, source: PID };
}
