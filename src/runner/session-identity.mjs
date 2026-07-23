// session-identity.mjs -- resolveWriterIdentity(): identifies "the writer" for
// the STR65 main-checkout lock (D6, str65-worktree-isolation-enforcement).
//
// Layered signal, per D6:
//   (a) a recognized agent-session env var (BEE_SESSION_ID, falling back to
//       the legacy CLAUDE_CODE_SESSION_ID -- same precedence as
//       .bee/bin/lib/lock.mjs's envSessionId) -> a string session identity.
//   (b) otherwise (a bare human terminal, no agent session env present) ->
//       a numeric identity from a persistent ancestor process's pid, found
//       by walking up the process tree via `ps -o ppid=` a SMALL, FIXED
//       number of hops (3) from the caller's own pid.
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
// Zero-dep aside from `ps` itself (Node builtins only + one shellout).

import { execFileSync } from 'node:child_process';

export const SESSION = 'session';
export const PID = 'pid';

const MAX_HOPS = 3;

function envSessionId(env) {
  for (const key of ['BEE_SESSION_ID', 'CLAUDE_CODE_SESSION_ID']) {
    const value = env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/** Returns the parent pid of `pid` via `ps -o ppid= -p <pid>`, or null if
 * `ps` is unavailable, exits non-zero, or prints something unparsable. */
function ppidOf(pid, execFile) {
  try {
    const out = execFile('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8' });
    const parsed = Number.parseInt(String(out).trim(), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * resolveWriterIdentity({ env, pid, execFile }) -> { identity, kind }
 *
 * `env` defaults to process.env, `pid` to process.pid, `execFile` to
 * execFileSync -- all overridable for testing (including with fake ancestor
 * chains, no real `ps` involved).
 *
 * Returns { identity: <session id string>, kind: SESSION } when a
 * recognized agent-session env var is set and non-empty (BEE_SESSION_ID
 * takes precedence over CLAUDE_CODE_SESSION_ID when both are set).
 *
 * Otherwise returns { identity: <numeric pid>, kind: PID }: the ancestor
 * reached after walking up to MAX_HOPS parent links from `pid`. The walk
 * stops early -- returning the last successfully-resolved pid -- if it hits
 * pid 1 (init) or `ps` fails partway through. If `ps` fails on the very
 * first hop (e.g. no `ps` binary on this platform), it degrades further to
 * the caller's OWN pid rather than an ancestor, never throwing or hanging;
 * this degraded case loses cross-commit persistence (each hook invocation
 * gets its own pid again) but stays safe.
 */
export function resolveWriterIdentity({ env = process.env, pid = process.pid, execFile = execFileSync } = {}) {
  const sessionId = envSessionId(env);
  if (sessionId) return { identity: sessionId, kind: SESSION };

  let current = pid;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const next = ppidOf(current, execFile);
    if (next === null) {
      return hop === 0 ? { identity: pid, kind: PID } : { identity: current, kind: PID };
    }
    current = next;
    if (current === 1) break;
  }
  return { identity: current, kind: PID };
}
