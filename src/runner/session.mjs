// session.mjs — opt-in per-session git worktree lifecycle for fgos
// multi-session checkout (backlog P35). A Session is one work-item's isolated
// view of the git-tracked source tree, backed by a detached-HEAD worktree,
// while the committed/ignored `.fgos/` event-log store stays ONE shared
// physical location across every session and the main checkout (CONTEXT.md
// D10 — never copied, always symlinked back).
//
// DISTINCT FROM worktree.mjs's fgw/<id>: `createWorktree` there always forks
// a NEW `fgw/<id>` branch (the worker/writer building changes). A session is
// the driver/reader checkout that runs approve/return — it wants the CURRENT
// HEAD with ZERO new branches, so it uses `git worktree add --detach <ref>`.
// Plain `git worktree add <path>` with no ref/`-b` was spike-DISPROVEN
// (`.bee/spikes/fgos-multi-session-checkout/session-worktree-probe-2.sh`): it
// auto-creates a branch named after the path basename. `--detach` is the only
// incantation that yields a branchless, genuinely detached HEAD.
//
// CROSS-PROCESS SAFETY: `.fgos/sessions.json` is read-modify-written by
// concurrent, independent `fgos` CLI processes — the whole point of this
// feature. The in-process write-queue (write-queue.mjs) serializes async
// writes inside ONE Node process only and gives ZERO cross-process
// protection, so it is deliberately NOT used here. Every registry mutation is
// guarded by a dedicated `.fgos/sessions.lock`, an independent lock file
// mirroring loop.mjs's `acquireRunnerLock` TOCTOU-safe algorithm (wx atomic
// create holding this pid; on EEXIST a live holder backs off, a dead/garbage
// pid is a crash leftover that is re-read-right-before-unlink then cleaned,
// never delete-then-create in the same attempt). It never touches
// `.fgos/runner.lock` — that is Epic 3's concern.
//
// DIVERGENCE: a detached-HEAD worktree CAN receive commits from inside it
// (spike-confirmed), and such a commit is genuinely dangling — reachable from
// no branch once the worktree is removed. So endSession refuses to remove a
// session whose HEAD moved off its recorded startCommit unless forced, and
// names the exact dangling sha(s).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const SESSIONS_FILE = 'sessions.json';
const SESSIONS_LOCK = 'sessions.lock';

// Safe filesystem-path charset for a caller-supplied session id: a value
// outside this set is rejected BEFORE it can flow into any path (the mkdtemp
// prefix), closing off path traversal. mkdtemp always appends a random
// suffix, so even a dotted id never forms a bare `.`/`..` path segment.
const SESSION_ID_RE = /^[A-Za-z0-9._-]+$/;

/** Raised for any session lifecycle failure. Mirrors WorktreeError's shape so
 * store.mjs's `categoryOf` contract picks it up via `.category`. */
export class SessionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SessionError';
    this.errorClass = 'session-fail';
    this.category = 'session-fail';
    Object.assign(this, details);
  }
}

function gitAt(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', shell: false });
}

/** Signal-0 liveness probe (mirrors loop.mjs's isPidAlive). EPERM means the
 * pid exists under another user — still alive. */
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/** Synchronous backoff — keeps the whole module synchronous like worktree.mjs
 * and loop.mjs, without a busy spin. */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function fgosDirOf(repoRoot) {
  return path.join(path.resolve(repoRoot), '.fgos');
}

/** Remove the `.fgos` symlink we created inside a session worktree. It is our
 * own artifact — git sees it as one untracked entry, so a PLAIN
 * `git worktree remove` would otherwise always refuse. Unlinking the symlink
 * (never its target — the shared store is untouched) lets the plain remove
 * keep git's genuine dirty-tree refusal as the real safety net. */
function unlinkFgosSymlink(worktreePath) {
  const linkPath = path.join(worktreePath, '.fgos');
  try {
    if (fs.lstatSync(linkPath).isSymbolicLink()) fs.unlinkSync(linkPath);
  } catch {
    // nothing to clean (already gone / never created) — fine
  }
}

/** One attempt at the wx-atomic-create lock, mirroring loop.mjs's
 * `acquireRunnerLock` exactly. Returns whether the lock was taken, and — on a
 * live holder — its pid. NEVER creates the lock in the same attempt that
 * deleted a stale one (that delete-then-create was the TOCTOU loop.mjs's doc
 * comment calls out); a reclaim yields and the next attempt does the bare
 * create. */
function tryAcquireOnce(lockPath, pid) {
  try {
    const fd = fs.openSync(lockPath, 'wx');
    try {
      fs.writeSync(fd, String(pid));
    } finally {
      fs.closeSync(fd);
    }
    return { acquired: true };
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  let raw;
  try {
    raw = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { acquired: false, holderPid: null }; // released in between — retry create
    throw err;
  }
  const holderPid = parseInt(raw.trim(), 10);

  // A positive-integer pid that is alive is a genuine holder — back off,
  // never touch its lock.
  if (Number.isInteger(holderPid) && holderPid > 0 && isPidAlive(holderPid)) {
    return { acquired: false, holderPid };
  }

  // Stale (dead/garbage pid). Re-read right before the unlink: the liveness
  // probe is the slow window; changed content means a fresh holder took the
  // path and must not be touched.
  let current;
  try {
    current = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { acquired: false, holderPid: null }; // already cleaned
    throw err;
  }
  if (current !== raw) {
    const freshPid = parseInt(current.trim(), 10);
    return { acquired: false, holderPid: Number.isInteger(freshPid) && freshPid > 0 ? freshPid : null };
  }
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return { acquired: false, holderPid: null }; // cleaned and yield; next attempt creates
}

/** Blocking exclusive acquire of `.fgos/sessions.lock`. Retries the
 * single-attempt primitive with a synchronous backoff until it wins or the
 * timeout elapses. Returns a handle with `release()`; callers MUST release in
 * a finally. */
export function acquireSessionsLock(fgosDir, { pid = process.pid, timeoutMs = 10000, retryMs = 20 } = {}) {
  fs.mkdirSync(fgosDir, { recursive: true });
  const lockPath = path.join(fgosDir, SESSIONS_LOCK);
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const res = tryAcquireOnce(lockPath, pid);
    if (res.acquired) {
      return {
        lockPath,
        release() {
          try {
            fs.unlinkSync(lockPath);
          } catch (err) {
            if (err.code !== 'ENOENT') throw err;
          }
        },
      };
    }
    if (Date.now() >= deadline) {
      throw new SessionError(
        `timed out acquiring sessions.lock at "${lockPath}" after ${timeoutMs}ms` +
          (res.holderPid ? ` (held by pid ${res.holderPid})` : ''),
        { lockPath, holderPid: res.holderPid ?? null },
      );
    }
    sleepSync(retryMs);
  }
}

/** Read the registry. A missing file is an empty registry (fresh repo). A
 * present-but-unparseable file fails CLOSED — never silently reinitialized
 * over unknown state. */
function readRegistry(fgosDir) {
  const registryPath = path.join(fgosDir, SESSIONS_FILE);
  let raw;
  try {
    raw = fs.readFileSync(registryPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw new SessionError(`reading sessions.json at "${registryPath}" failed: ${err.message}`, { registryPath });
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new SessionError(`sessions.json at "${registryPath}" is corrupt (not valid JSON): ${err.message}`, {
      registryPath,
    });
  }
  if (!Array.isArray(parsed)) {
    throw new SessionError(`sessions.json at "${registryPath}" is corrupt (expected a JSON array)`, { registryPath });
  }
  return parsed;
}

function writeRegistry(fgosDir, entries) {
  const registryPath = path.join(fgosDir, SESSIONS_FILE);
  fs.writeFileSync(registryPath, `${JSON.stringify(entries, null, 2)}\n`);
}

function realpathOr(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/** Realpath-normalized set of every path git currently registers as a
 * worktree of `repoRoot`. Realpathing defends against a symlinked
 * os.tmpdir() (e.g. macOS /tmp -> /private/tmp) making a raw string compare
 * silently miss a match. */
function listWorktreePaths(repoRoot) {
  let out;
  try {
    out = gitAt(repoRoot, ['worktree', 'list', '--porcelain']);
  } catch (err) {
    throw new SessionError(`listing git worktrees failed: ${err.message}`, {});
  }
  const paths = new Set();
  for (const line of out.split('\n')) {
    if (line.startsWith('worktree ')) {
      paths.add(realpathOr(line.slice('worktree '.length).trim()));
    }
  }
  return paths;
}

/**
 * Create a session: a detached-HEAD worktree on the current HEAD plus a
 * `.fgos` symlink back to the main store, registered in `sessions.json` under
 * the sessions.lock. `opts.sessionId` is charset-validated (else a random
 * UUID); `opts.sessionsDir` overrides the worktree base (tests point it at a
 * disposable temp dir). Rejects — with no worktree created and no registry
 * mutation — when invoked from inside an already-registered session worktree.
 * Returns the recorded registry entry.
 */
export function createSession(repoRoot, opts = {}) {
  const { itemId } = opts;
  let sessionId = opts.sessionId;
  if (sessionId === undefined || sessionId === null) {
    sessionId = crypto.randomUUID();
  } else if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
    throw new SessionError(
      `invalid sessionId "${sessionId}" — only [A-Za-z0-9._-] are allowed (rejected before any filesystem use)`,
      { sessionId },
    );
  }

  const fgosDir = fgosDirOf(repoRoot);
  const currentHeadSha = gitAt(repoRoot, ['rev-parse', 'HEAD']).trim();
  const cwdReal = realpathOr(process.cwd());

  const lock = acquireSessionsLock(fgosDir);
  try {
    const entries = readRegistry(fgosDir);

    // Nesting guard: realpath BOTH sides, then reject if cwd is a registered
    // worktree root or lives beneath one. Sessions never nest.
    for (const entry of entries) {
      const wtReal = realpathOr(entry.worktreePath);
      if (cwdReal === wtReal || cwdReal.startsWith(`${wtReal}${path.sep}`)) {
        throw new SessionError(
          `cannot start a session from inside an existing session worktree (cwd "${cwdReal}" is within session "${entry.sessionId}" at "${wtReal}")`,
          { sessionId: entry.sessionId, worktreePath: entry.worktreePath },
        );
      }
    }

    const baseDir = opts.sessionsDir ?? path.join(os.tmpdir(), 'fgos-sessions');
    fs.mkdirSync(baseDir, { recursive: true });
    const worktreePath = fs.mkdtempSync(path.join(baseDir, `${sessionId}-`));

    try {
      // --detach: zero new branches, genuinely detached HEAD (spike-proven).
      gitAt(repoRoot, ['worktree', 'add', '--detach', worktreePath, currentHeadSha]);
    } catch (err) {
      try {
        fs.rmSync(worktreePath, { recursive: true, force: true });
      } catch {
        // best-effort cleanup of the empty mkdtemp dir; surface the git error.
      }
      throw new SessionError(`git worktree add --detach failed for session "${sessionId}": ${err.message}`, {
        sessionId,
        worktreePath,
      });
    }

    // D10: never copy .fgos/ — symlink it (absolute target, 'dir' type). fs
    // reads/writes are transparent through it (same inode; spike-confirmed).
    try {
      fs.symlinkSync(fgosDir, path.join(worktreePath, '.fgos'), 'dir');
    } catch (err) {
      try {
        gitAt(repoRoot, ['worktree', 'remove', '--force', worktreePath]);
      } catch {
        // best-effort rollback of the just-created worktree.
      }
      throw new SessionError(`symlinking .fgos into session "${sessionId}" worktree failed: ${err.message}`, {
        sessionId,
        worktreePath,
      });
    }

    const entry = {
      sessionId,
      worktreePath,
      itemId: itemId ?? null,
      startCommit: currentHeadSha,
      pid: process.pid,
      startedAt: new Date().toISOString(),
    };
    entries.push(entry);
    writeRegistry(fgosDir, entries);
    return { ...entry };
  } finally {
    lock.release();
  }
}

/**
 * End a session: remove its worktree and drop its registry entry, under the
 * sessions.lock. Refuses (no removal, no mutation) when HEAD has diverged
 * from the recorded startCommit and `force` is not set, naming the exact
 * dangling sha(s) via `git rev-list startCommit..HEAD`. A non-diverged
 * removal uses PLAIN `git worktree remove` (git's own dirty-tree refusal is
 * the base safety net); only `force` uses `--force`.
 */
export function endSession(repoRoot, sessionId, { force = false } = {}) {
  const fgosDir = fgosDirOf(repoRoot);
  const lock = acquireSessionsLock(fgosDir);
  try {
    const entries = readRegistry(fgosDir);
    const entry = entries.find((e) => e.sessionId === sessionId);
    if (!entry) {
      throw new SessionError(`unknown or already-ended session "${sessionId}"`, { sessionId });
    }

    if (!force) {
      let headNow;
      try {
        headNow = gitAt(entry.worktreePath, ['rev-parse', 'HEAD']).trim();
      } catch (err) {
        throw new SessionError(
          `cannot read HEAD of session "${sessionId}" worktree at "${entry.worktreePath}": ${err.message}`,
          { sessionId, worktreePath: entry.worktreePath },
        );
      }
      if (headNow !== entry.startCommit) {
        const divergent = gitAt(entry.worktreePath, ['rev-list', `${entry.startCommit}..HEAD`])
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        throw new SessionError(
          `session "${sessionId}" worktree at "${entry.worktreePath}" has diverged from its start commit ${entry.startCommit} — refusing to remove without force. Dangling commit(s): ${divergent.join(', ')}`,
          { sessionId, worktreePath: entry.worktreePath, startCommit: entry.startCommit, divergent },
        );
      }
    }

    unlinkFgosSymlink(entry.worktreePath);
    const args = ['worktree', 'remove', entry.worktreePath];
    if (force) args.push('--force');
    try {
      gitAt(repoRoot, args);
    } catch (err) {
      throw new SessionError(`git worktree remove failed for session "${sessionId}": ${err.message}`, {
        sessionId,
        worktreePath: entry.worktreePath,
      });
    }
    try {
      gitAt(repoRoot, ['worktree', 'prune']);
    } catch {
      // best-effort — a failed prune does not invalidate a successful remove.
    }

    writeRegistry(
      fgosDir,
      entries.filter((e) => e.sessionId !== sessionId),
    );
    return { ...entry };
  } finally {
    lock.release();
  }
}

/** The current session registry (read-only), read under the sessions.lock. */
export function listSessions(repoRoot) {
  const fgosDir = fgosDirOf(repoRoot);
  const lock = acquireSessionsLock(fgosDir);
  try {
    return readRegistry(fgosDir);
  } finally {
    lock.release();
  }
}

/**
 * Reclaim orphaned sessions: an entry whose worktree is gone from
 * `git worktree list` OR whose recorded pid is dead. Applies the SAME
 * divergence protection as endSession — a diverged orphan is left in place
 * (its dangling commit is never discarded silently). PID reuse masking a dead
 * session as live is an accepted, documented limitation (matching the fgw/<id>
 * reclaim's own). Returns `{ reclaimed, skipped }` session-id lists.
 */
export function reclaimOrphanedSessions(repoRoot) {
  const fgosDir = fgosDirOf(repoRoot);
  const lock = acquireSessionsLock(fgosDir);
  try {
    const entries = readRegistry(fgosDir);
    const registered = listWorktreePaths(repoRoot);
    const reclaimed = [];
    const skipped = [];
    const kept = [];

    for (const entry of entries) {
      const missingFromGit = !registered.has(realpathOr(entry.worktreePath));
      const pidDead = !(Number.isInteger(entry.pid) && entry.pid > 0 && isPidAlive(entry.pid));
      if (!missingFromGit && !pidDead) {
        kept.push(entry); // a live, still-registered session — never touched
        continue;
      }

      // Orphan. If the worktree is still inspectable, honor divergence.
      const onDisk = fs.existsSync(entry.worktreePath);
      if (onDisk && !missingFromGit) {
        let headNow = null;
        try {
          headNow = gitAt(entry.worktreePath, ['rev-parse', 'HEAD']).trim();
        } catch {
          headNow = null;
        }
        if (headNow && headNow !== entry.startCommit) {
          skipped.push(entry.sessionId); // diverged — keep, do not discard a dangling commit
          kept.push(entry);
          continue;
        }
      }

      if (onDisk) {
        try {
          gitAt(repoRoot, ['worktree', 'remove', '--force', entry.worktreePath]);
        } catch {
          // fall through to prune git's own bookkeeping
        }
      }
      try {
        gitAt(repoRoot, ['worktree', 'prune']);
      } catch {
        // best-effort
      }
      reclaimed.push(entry.sessionId);
    }

    if (reclaimed.length > 0) writeRegistry(fgosDir, kept);
    return { reclaimed, skipped };
  } finally {
    lock.release();
  }
}
