// main-checkout-lock.mjs — main-checkout activity lock: detects any process
// actively committing directly against this checkout (human, agent, or CI),
// per D4 (str65-worktree-isolation-enforcement). Guards against the STR65
// clobbering failure mode: two concurrent writers racing this checkout's own
// `.git/index`.
//
// Zero-dep, Node builtins only. This is a FOURTH, wholly independent
// instance of the wx-atomic-create + stale-pid-reclaim lock lineage already
// proven three times in this repo — acquireRunnerLock (src/runner/loop.mjs),
// acquireSessionsLock (src/runner/session.mjs), acquireEventsLock
// (src/state/events.mjs); see the lineage note at src/state/events.mjs:23-36.
// Deliberately NOT imported from any of the three (each stays independently
// testable and zero-dep) and this module touches neither runner.lock,
// sessions.lock, nor events.lock.
//
// THREE divergences from the mirrored lineage, all required by D5/D6
// (docs/history/str65-worktree-isolation-enforcement/CONTEXT.md):
//
//   1. A corrupt/unparseable lock file, or one whose pid field isn't a
//      usable identity (neither a positive integer nor a non-empty string),
//      is its own AMBIGUOUS outcome — distinct from both ACQUIRED and HELD.
//      The lineage instead treats that shape as stale-and-reclaimable; this
//      primitive must not, because a future caller (the Phase 2 git hook)
//      has to fail closed on an unreadable signal rather than silently
//      treat it as free. A MISSING lock file is NOT ambiguous — that's the
//      ordinary free/acquire-succeeds case, same as the lineage.
//   2. An optional `ttlMs` supplements liveness: a lock recorded under a
//      numeric identity is only "fresh" (still held) when its holder pid is
//      alive AND its last-touched timestamp is within `ttlMs` (omitting
//      `ttlMs` falls back to pure PID-liveness, same as the lineage). A
//      lock recorded under a STRING identity has no process to probe, so
//      its held-ness is judged purely by `ttlMs` freshness — and since a
//      string identity's staleness is undecidable without a window,
//      checking a different string-identity lock with no `ttlMs` supplied
//      is AMBIGUOUS (D5: fail closed), never silently free or held.
//   3. SELF-RECOGNITION (D6): when an existing lock's recorded identity
//      strictly equals (===) the caller's OWN supplied identity, the acquire
//      always succeeds as a refresh (fresh timestamp, same identity),
//      regardless of ttlMs or liveness — this is the same writer continuing
//      its own session, never a competing holder. This is what lets the
//      Phase 2 hook distinguish its own next commit from a genuinely
//      different concurrent session (see decision D6 and
//      docs/history/str65-worktree-isolation-enforcement/reports/validation-phase1.md
//      for the pid:1-sentinel design this replaces).
//
// This module does not pick a production ttlMs default (out of scope for
// this cell) and does not wire into any git hook — both are Phase 2.

import fs from 'node:fs';
import path from 'node:path';

export const LOCK_FILE = 'main-checkout.lock';

export const ACQUIRED = 'acquired';
export const HELD = 'held-by-live-other-pid';
export const AMBIGUOUS = 'ambiguous';

/** Signal-0 liveness probe (mirrors loop.mjs/session.mjs/events.mjs's
 * isPidAlive). EPERM means the pid exists under another user — still alive,
 * still a holder. Only ever called for a NUMERIC recorded identity — a
 * string identity has no process to probe. */
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/** A usable identity is either a positive integer (a real pid) or a
 * non-empty string (an opaque session id). Anything else (empty string,
 * boolean, object, negative/non-integer number) is not usable. */
function isUsableIdentity(value) {
  if (typeof value === 'string') return value.length > 0;
  return Number.isInteger(value) && value > 0;
}

/** Parses lock file content written by this module: `{"pid": <identity>,
 * "ts": <int>}`, where `pid` may be a positive integer OR a non-empty
 * string (the on-disk field name stays literally `pid` even though its
 * value may now be an opaque string identity). Returns null when the
 * content isn't a well-formed record — the caller treats null as
 * AMBIGUOUS, never as free or stale. */
function parseLockContent(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const { pid, ts } = parsed;
  if (!isUsableIdentity(pid)) return null;
  if (!Number.isInteger(ts) || ts <= 0) return null;
  return { pid, ts };
}

/**
 * One attempt at the wx-atomic-create lock, mirroring the three sibling
 * locks' single-attempt primitive for the create/EEXIST/liveness/reclaim
 * shape — diverging only where `parseLockContent` returns null (AMBIGUOUS),
 * where the recorded identity matches the caller's own (self-recognition,
 * always ACQUIRED), and where a string-identity holder is judged by
 * `ttlMs` freshness alone (never a liveness probe).
 */
function tryAcquireOnce(lockPath, identity, now, ttlMs) {
  try {
    const fd = fs.openSync(lockPath, 'wx');
    try {
      fs.writeSync(fd, JSON.stringify({ pid: identity, ts: now }));
    } finally {
      fs.closeSync(fd);
    }
    return { status: ACQUIRED };
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  let raw;
  try {
    raw = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { status: 'retry' }; // released in between — retry create
    throw err;
  }

  const record = parseLockContent(raw);
  if (record === null) {
    return { status: AMBIGUOUS };
  }

  // Self-recognition (D6): the caller's own identity always refreshes,
  // regardless of ttlMs or liveness — this is the same writer continuing
  // its own session, never a competing holder.
  if (record.pid === identity) {
    fs.writeFileSync(lockPath, JSON.stringify({ pid: identity, ts: now }));
    return { status: ACQUIRED };
  }

  let held;
  if (typeof record.pid === 'number') {
    // Different numeric identity: unchanged pidLive-AND-ttlMs logic.
    const pidLive = isPidAlive(record.pid);
    const withinTtl = typeof ttlMs !== 'number' || now - record.ts <= ttlMs;
    held = pidLive && withinTtl;
  } else {
    // Different string identity: no process to probe, so held-ness is
    // judged purely by ttlMs freshness. Undecidable without a window —
    // fail closed (D5) rather than guess free or held.
    if (typeof ttlMs !== 'number') {
      return { status: AMBIGUOUS };
    }
    held = now - record.ts <= ttlMs;
  }

  if (held) {
    return { status: HELD, holderPid: record.pid };
  }

  // Stale (dead pid, or ttl-expired). Re-read right before the unlink: the
  // liveness probe above is the slow window — a competitor may have
  // cleaned this lock and a fresh holder created its own here since `raw`
  // was read. Changed content is a live lock we must not touch.
  let current;
  try {
    current = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { status: 'retry' }; // already cleaned
    throw err;
  }
  if (current !== raw) {
    return { status: 'retry' }; // a fresh holder took the path; caller re-evaluates it
  }
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return { status: 'retry' }; // cleaned and yield; next attempt creates
}

/**
 * Acquire `.fgos/main-checkout.lock` under `dir`. Non-blocking: attempts a
 * bare create, then at most one reclaim-and-retry — mirroring
 * acquireRunnerLock's shape (never creates in the same attempt that deleted
 * a stale lock; that TOCTOU is exactly what the sibling locks' comments call
 * out). A commit-time check should get an immediate answer, not block on a
 * timeout, so this never sleeps/retries beyond that single reclaim step.
 *
 * `identity` is either a positive integer (a real process id,
 * liveness-checked via isPidAlive) or a non-empty string (an opaque session
 * identity, e.g. an env-derived session id — never liveness-checked, since
 * there is no process to probe). Defaults to `process.pid`. The on-disk
 * JSON field holding it is still named `pid`.
 *
 * Returns `{ status, holderPid?, lockPath, release? }` where `status` is one
 * of ACQUIRED / HELD / AMBIGUOUS. Never throws for a stale/corrupt/missing
 * lock — only for unexpected fs errors.
 *
 * `ttlMs` is optional and caller-supplied only (no production default picked
 * here, per this cell's scope) — when present, a live-pid holder whose
 * last-touched timestamp exceeds `ttlMs` is treated as stale, same as a dead
 * pid. For a different string-identity holder, `ttlMs` is the ONLY
 * staleness signal (no liveness probe exists) — omitting it is AMBIGUOUS,
 * not stale.
 */
export function acquireMainCheckoutLock(dir, { identity = process.pid, ttlMs, now = Date.now() } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const lockPath = path.join(dir, LOCK_FILE);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = tryAcquireOnce(lockPath, identity, now, ttlMs);
    if (res.status === ACQUIRED) {
      return {
        status: ACQUIRED,
        lockPath,
        release() {
          releaseMainCheckoutLock(dir);
        },
      };
    }
    if (res.status === HELD) {
      return { status: HELD, holderPid: res.holderPid, lockPath };
    }
    if (res.status === AMBIGUOUS) {
      return { status: AMBIGUOUS, lockPath };
    }
    // status === 'retry': a stale lock was cleaned (by us or a racing
    // reclaimer); loop reattempts the bare create on the next iteration.
  }
  // Bound matches the mirrored lineage (loop.mjs): a reclaim-then-retry can
  // race at most once before either succeeding or meeting a fresh holder
  // that a subsequent caller must re-evaluate.
  return { status: HELD, holderPid: null, lockPath };
}

/** Removes `.fgos/main-checkout.lock` under `dir` if present. Idempotent — a
 * caller releasing a lock already reclaimed/removed by someone else is not
 * an error. */
export function releaseMainCheckoutLock(dir) {
  const lockPath = path.join(dir, LOCK_FILE);
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
