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
// guarded by the `sessions` kernel lock (`.fgos/locks/sessions.lock`,
// src/holder-lock): the kernel excludes concurrent holders and releases the
// lock the moment its holder dies, so a crashed process never leaves a
// record anybody has to judge. It is a different lock from the runner's.
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
import { currentHead, inspectGit, gitWorktrees, compareCommits, removeWorktree, isCheckoutDirty } from './worktree.mjs';
import { fgosDirFromRoot, resolveMainCheckoutRoot } from './paths.mjs';
import { resolveHolderLiveness, selfRecord } from './dispatch/process-identity.mjs';
import { acquireSync, createLockScope, lockHolders, resolveLock } from '../holder-lock/index.mjs';
import { addWorktreeSync } from './repo-locks.mjs';

const SESSIONS_FILE = 'sessions.json';

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


function fgosDirOf(repoRoot) {
  return fgosDirFromRoot(repoRoot);
}

/**
 * Whether `repoRoot` is a genuine `fgos session`-created worktree, never a
 * plain (or forged) symlink pointing somewhere else: `.fgos` at `repoRoot`
 * must be a symbolic link (`createSession`'s own `fs.symlinkSync` above,
 * D10 -- never a checked-out copy) AND its realpath must equal the real
 * main checkout's own `.fgos` realpath (`resolveMainCheckoutRoot`, which
 * resolves via `--git-common-dir` and so cannot itself be redirected by a
 * worktree-local symlink). A bare `isSymbolicLink()` check alone would be
 * forgeable -- a worktree could carry a `.fgos` symlink pointing anywhere
 * -- so both conditions are required; unlike `isMainWorktree`
 * (worktree.mjs), which only tells the main checkout apart from every
 * linked worktree and does not itself distinguish a legitimate session
 * worktree from an ad-hoc one, this answers the narrower question a caller
 * needs before treating a linked worktree's own `.fgos` as the real shared
 * store rather than a stale, disconnected snapshot.
 *
 * Never throws: any filesystem error (missing `.fgos`, not inside a git
 * checkout at all) means "not a session worktree", the safe answer.
 */
export function isSessionWorktree(repoRoot) {
  const linkPath = path.join(repoRoot, '.fgos');
  let linkStat;
  try {
    linkStat = fs.lstatSync(linkPath);
  } catch {
    return false;
  }
  if (!linkStat.isSymbolicLink()) return false;

  const mainCheckoutRoot = resolveMainCheckoutRoot(repoRoot);
  if (!mainCheckoutRoot) return false;

  let linkRealPath;
  let mainFgosRealPath;
  try {
    linkRealPath = fs.realpathSync.native(linkPath);
    mainFgosRealPath = fs.realpathSync.native(fgosDirOf(mainCheckoutRoot));
  } catch {
    return false;
  }
  return process.platform === 'win32'
    ? linkRealPath.toLowerCase() === mainFgosRealPath.toLowerCase()
    : linkRealPath === mainFgosRealPath;
}

/** Remove the `.fgos` symlink we created inside a session worktree. It is our
 * own artifact — git sees it as one untracked entry, so a PLAIN
 * `git worktree remove` would otherwise always refuse. Unlinking the symlink
 * (never its target — the shared store is untouched) lets the plain remove
 * keep git's genuine dirty-tree refusal as the real safety net. */
function unlinkFgosSymlink(worktreePath) {
  const linkPath = path.join(worktreePath, '.fgos');
  try {
    if (fs.lstatSync(linkPath).isSymbolicLink()) {
      const target = fs.readlinkSync(linkPath);
      fs.unlinkSync(linkPath);
      return target;
    }
  } catch {
    // nothing to clean (already gone / never created) — fine
  }
}

/** After the `.fgos` symlink is unlinked, git still holds this worktree's
 * committed `.fgos` content (events.jsonl et al. — git-tracked in this repo per
 * D10) as DELETED on disk, since createSession removed the checked-out copy at
 * creation time. That deleted-tracked state makes a PLAIN `git worktree remove`
 * refuse ("contains modified or untracked files"), blocking every non-diverged
 * endSession. Restore the tracked content from HEAD so the working tree honestly
 * agrees with the index again — we keep git's real dirty-tree refusal as the
 * safety net rather than bypassing it with --force. A genuine no-op when `.fgos`
 * was never tracked at HEAD (the gitignored-.fgos case): the ls-tree gate skips
 * cleanly, so existing behavior there is unchanged. Scoped strictly to THIS
 * session's own worktree; the shared repoRoot `.fgos/` store is never touched,
 * and only HEAD's committed content (never live events) is materialized, moments
 * before the worktree is deleted wholesale. */

function restoreFgosSymlink(worktreePath, target) {
  if (!target) return;
  try { fs.symlinkSync(target, path.join(worktreePath, '.fgos'), 'dir'); }
  catch { /* Never mask the guarded removal's original refusal or overwrite new bytes. */ }
}

/** Blocking exclusive acquire of the `sessions` kernel lock. Waits until it
 * wins or the timeout elapses. Returns a handle with `release()`; callers
 * MUST release in a finally. A holder that dies releases at once. */
export function acquireSessionsLock(fgosDir, { timeoutMs = 10000 } = {}) {
  const params = { fgosDir };
  const res = acquireSync(createLockScope('sessions'), 'sessions', params, { waitMs: timeoutMs });
  if (res.result === 'acquired') return res.handle;
  const holders = lockHolders('sessions', params);
  const holderPid = holders.kind === 'list' && holders.holders.length > 0 ? holders.holders[0].pid : null;
  const lockPath = resolveLock('sessions', params).v3Path;
  throw new SessionError(
    `timed out acquiring sessions.lock at "${lockPath}" after ${timeoutMs}ms` + (holderPid ? ` (held by pid ${holderPid})` : ''),
    { lockPath, holderPid },
  );
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

function stripExtendedPrefix(p) {
  if (typeof p !== 'string') return p;
  if (p.startsWith('\\\\?\\UNC\\')) {
    return '\\\\' + p.slice(8);
  }
  if (p.startsWith('\\\\?\\')) {
    return p.slice(4);
  }
  return p;
}

function pathsEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (process.platform === 'win32') {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

function pathStartsWith(child, parent) {
  if (typeof child !== 'string' || typeof parent !== 'string') return false;
  if (process.platform === 'win32') {
    return child.toLowerCase().startsWith(parent.toLowerCase());
  }
  return child.startsWith(parent);
}

function realpathOr(p) {
  if (typeof p !== 'string') return p;
  try {
    const resolved = fs.realpathSync.native ? fs.realpathSync.native(p) : fs.realpathSync(p);
    return path.normalize(stripExtendedPrefix(resolved));
  } catch {
    return path.normalize(path.resolve(p));
  }
}

/** Realpath-normalized set of every path git currently registers as a
 * worktree of `repoRoot`. Realpathing defends against a symlinked
 * os.tmpdir() (e.g. macOS /tmp -> /private/tmp) making a raw string compare
 * silently miss a match. */
function listWorktreePaths(repoRoot) {
  let out;
  try {
    out = gitWorktrees(repoRoot);
  } catch (err) {
    throw new SessionError(`listing git worktrees failed: ${err.message}`, {});
  }
  const paths = new Set();
  for (const row of out) paths.add(realpathOr(Buffer.from(row.path).toString('utf8')));
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
  const currentHeadSha = currentHead(repoRoot);
  const cwdReal = realpathOr(process.cwd());

  let lock = acquireSessionsLock(fgosDir);
  try {
    const entries = readRegistry(fgosDir);

    // Nesting guard: realpath BOTH sides, then reject if cwd is a registered
    // worktree root or lives beneath one. Sessions never nest.
    for (const entry of entries) {
      const wtReal = realpathOr(entry.worktreePath);
      if (pathsEqual(cwdReal, wtReal) || pathStartsWith(cwdReal, `${wtReal}${path.sep}`)) {
        throw new SessionError(
          `cannot start a session from inside an existing session worktree (cwd "${cwdReal}" is within session "${entry.sessionId}" at "${wtReal}")`,
          { sessionId: entry.sessionId, worktreePath: entry.worktreePath },
        );
      }
    }

    lock.release();
    lock = null;
    const baseDir = opts.sessionsDir ?? path.join(os.tmpdir(), 'fgos-sessions');
    fs.mkdirSync(baseDir, { recursive: true });
    const worktreePath = fs.mkdtempSync(path.join(baseDir, `${sessionId}-`));

    try {
      // --detach: zero new branches, genuinely detached HEAD (spike-proven).
      addWorktreeSync(createLockScope('session-worktree'), repoRoot, ['--detach', worktreePath, currentHeadSha]);
    } catch (err) {
      try {
        fs.rmdirSync(worktreePath);
      } catch {
        // best-effort cleanup of the empty mkdtemp dir; surface the git error.
      }
      throw new SessionError(`git worktree add --detach failed for session "${sessionId}": ${err.message}`, {
        sessionId,
        worktreePath,
      });
    }

    // When `.fgos/` is git-tracked (this repo's own convention — events.jsonl
    // et al. are committed, D10), `git worktree add --detach` checks a real
    // `.fgos/` copy out into the fresh worktree, so symlinkSync would hit
    // EEXIST. Remove that redundant checked-out copy first — it must never be
    // read (only the symlinked shared store is truth, D10). Scoped strictly to
    // THIS just-created worktree's own path; the real repoRoot .fgos/ (the
    // symlink target) is never touched.
    const worktreeFgos = path.join(worktreePath, '.fgos');
    // D10: never copy .fgos/ — symlink it (absolute target, 'dir' type). fs
    // reads/writes are transparent through it (same inode; spike-confirmed).
    try {
      fs.symlinkSync(fgosDir, worktreeFgos, 'dir');
    } catch (err) {
      try {
        removeWorktree(repoRoot, worktreePath, { force: true });
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
      record: selfRecord(),
      startedAt: new Date().toISOString(),
    };
    lock = acquireSessionsLock(fgosDir);
    const currentEntries = readRegistry(fgosDir);
    currentEntries.push(entry);
    writeRegistry(fgosDir, currentEntries);
    return { ...entry };
  } finally {
    lock?.release();
  }
}

/**
 * End a session: remove its worktree and drop its registry entry, under the
 * sessions.lock. Refuses (no removal, no mutation) when HEAD has diverged
 * from the recorded startCommit and `force` is not set, naming the exact
 * dangling sha(s) via `git rev-list startCommit..HEAD`. A non-diverged
 * removal uses PLAIN `git worktree remove` (git's own dirty-tree refusal is
 * the base safety net). Force retains a clean divergent HEAD through
 * SafeRestore; it never bypasses dirty-checkout refusal.
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
        headNow = currentHead(entry.worktreePath);
      } catch (err) {
        throw new SessionError(
          `cannot read HEAD of session "${sessionId}" worktree at "${entry.worktreePath}": ${err.message}`,
          { sessionId, worktreePath: entry.worktreePath },
        );
      }
      if (headNow !== entry.startCommit) {
        const divergent = compareCommits(entry.worktreePath, entry.startCommit, headNow).commits;
        throw new SessionError(
          `session "${sessionId}" worktree at "${entry.worktreePath}" has diverged from its start commit ${entry.startCommit} — refusing to remove without force. Dangling commit(s): ${divergent.join(', ')}`,
          { sessionId, worktreePath: entry.worktreePath, startCommit: entry.startCommit, divergent },
        );
      }
    }

    const sessionLink = unlinkFgosSymlink(entry.worktreePath);
    let retained;
    try {
      retained = removeWorktree(repoRoot, entry.worktreePath, { force, ...(force ? { retainTo: entry.startCommit } : {}) });
    } catch (err) {
      restoreFgosSymlink(entry.worktreePath, sessionLink);
      throw new SessionError(`git worktree remove failed for session "${sessionId}": ${err.message}`, {
        sessionId,
        worktreePath: entry.worktreePath,
      });
    }

    writeRegistry(
      fgosDir,
      entries.filter((e) => e.sessionId !== sessionId),
    );
    const warnings = retained ? [`Session commit preserved at ${retained.retainedRef}; snapshot ${retained.snapshot}`] : [];
    for (const warning of warnings) console.warn(warning);
    return { ...entry, ...(retained ? { ...retained, warnings } : {}) };
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
 * (its dangling commit is never discarded silently) — PLUS an uncommitted-
 * work protection endSession doesn't need: `entry.pid` is the pid of the
 * one-shot `fgos session start` CLI invocation, which exits the moment it
 * prints its result, so `pidDead` is true for essentially every session
 * within moments of creation regardless of whether the worktree is still
 * being actively edited. A dirty (uncommitted-changes) worktree is therefore
 * left in place exactly like a diverged one, never silently discarded by the
 * `--force` remove below. PID reuse masking a dead session as live is an
 * accepted, documented limitation (matching the fgw/<id> reclaim's own).
 * Returns `{ reclaimed, skipped }` session-id lists.
 */
export function reclaimOrphanedSessions(repoRoot) {
  const fgosDir = fgosDirOf(repoRoot);
  const lock = acquireSessionsLock(fgosDir);
  try {
    const entries = readRegistry(fgosDir);
    const registered = listWorktreePaths(repoRoot);
    const callerRealpath = realpathOr(path.resolve(repoRoot));
    const reclaimed = [];
    const skipped = [];
    const kept = [];

    for (const entry of entries) {
      // Self-mount guard: the caller can never legitimately be reclaiming the
      // exact worktree it is currently running from — the call itself proves
      // that worktree is in use. This must run BEFORE the pidDead/
      // missingFromGit checks below: the worktree's own registered pid (the
      // one-shot `fgos session start` CLI) is expected to already be dead by
      // design right after handoff, and `.fgos` inside every session
      // worktree symlinks back to this SAME shared registry — so without
      // this guard a session calling reclaimOrphanedSessions(process.cwd())
      // from inside its own worktree would read itself as an orphan.
      const entryReal = realpathOr(entry.worktreePath);
      if (pathsEqual(entryReal, callerRealpath)) {
        kept.push(entry);
        continue;
      }

      let missingFromGit = true;
      for (const p of registered) {
        if (pathsEqual(p, entryReal)) {
          missingFromGit = false;
          break;
        }
      }
      const pidDead = resolveHolderLiveness(entry.record ?? { pid: entry.pid }) === 'dead';
      if (!missingFromGit && !pidDead) {
        kept.push(entry); // a live, still-registered session — never touched
        continue;
      }

      // Orphan. If the worktree is still inspectable, honor divergence.
      const onDisk = fs.existsSync(entry.worktreePath);
      if (onDisk && !missingFromGit) {
        let headNow = null;
        try {
          headNow = currentHead(entry.worktreePath);
        } catch {
          headNow = null;
        }
        if (headNow && headNow !== entry.startCommit) {
          skipped.push(entry.sessionId); // diverged — keep, do not discard a dangling commit
          kept.push(entry);
          continue;
        }

        // Fail closed on an unreadable status (never assume clean): mirrors
        // this module's own corrupt-registry-fails-closed stance above.
        // `.fgos` itself is excluded from the check — it is this module's own
        // symlink-or-restored-tracked-content artifact (D10), never real user
        // work, and would otherwise always read as dirty (untracked symlink,
        // or a tracked dir replaced by one) regardless of the actual session.
        let dirty = true;
        try {
          // Explicit untracked mode: a user's status.showUntrackedFiles=no would hide new files.
          dirty = isCheckoutDirty(repoRoot, entry.worktreePath);
        } catch {
          dirty = true;
        }
        if (dirty) {
          skipped.push(entry.sessionId); // uncommitted work — keep, do not discard it
          kept.push(entry);
          continue;
        }
      }

      if (onDisk) {
        const sessionLink = unlinkFgosSymlink(entry.worktreePath);
        try {
          removeWorktree(repoRoot, entry.worktreePath, { force: true });
        } catch {
          restoreFgosSymlink(entry.worktreePath, sessionLink);
          skipped.push(entry.sessionId);
          kept.push(entry);
          continue;
        }
      }
      if (!missingFromGit && !onDisk) {
        skipped.push(entry.sessionId);
        kept.push(entry);
        continue;
      }
      reclaimed.push(entry.sessionId);
    }

    if (reclaimed.length > 0) writeRegistry(fgosDir, kept);
    return { reclaimed, skipped };
  } finally {
    lock.release();
  }
}
