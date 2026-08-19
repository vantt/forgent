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
import fs from 'node:fs';
import path from 'node:path';

export const LOCK_FILE = 'main-checkout.lock';

/**
 * Maps a target ref (e.g. `fgw/tsk-51m`, `main`) to a collision-free,
 * filesystem-safe lock filename for the target-ref merge queue (tsk-xyr,
 * §E of the Merge Conductor design). Pure: no fs access, no side effects.
 *
 * Uses `encodeURIComponent` over the WHOLE ref, not a hand-picked
 * character substitution (e.g. `/` -> `-`) — the naive substitution is
 * NOT injective: `fgw/tsk-51m` and a (hypothetical but not disallowed by
 * git-check-ref-format) `fgw-tsk-51m` would both collapse onto
 * `merge-slot--fgw-tsk-51m.lock`, silently serializing two unrelated
 * targets onto one lock file, or letting one target's slot stand in for
 * another's — exactly the data-loss class this queue exists to close.
 * `encodeURIComponent` is a byte-for-byte reversible encoding (every
 * character outside `A-Za-z0-9-_.!~*'()` becomes a distinct `%XX`
 * escape), so distinct input refs always produce distinct output
 * filenames, and its output charset is itself filesystem-safe (no `/`,
 * no null bytes, no path traversal).
 */
export function mergeSlotLockFile(targetRef) {
  return `merge-slot--${encodeURIComponent(targetRef)}.lock`;
}

/**
 * Maps a working directory path (cwd) to a collision-free, filesystem-safe
 * lock filename for per-item dispatch concurrency protection (tsk-64hk). Pure.
 */
export function dispatchLockFile(cwd) {
  return `dispatch--${encodeURIComponent(cwd)}.lock`;
}

/** Formats a millisecond duration (lockAgeMs/remainingTtlMs) as a short
 * human-readable string ("2m15s", "45s") for CLI messages. Non-numeric or
 * negative input (no known duration) formats as "unknown" rather than
 * fabricating a number. */
export function formatLockDurationMs(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms) || ms < 0) return 'unknown';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
}

// DEFAULT_TTL_MS (tsk-3w8 follow-up): Phase 2 (the git hook, wired) and the
// claim flow (claim-port.mjs's claimWork) now BOTH acquire this same lock,
// and needed one shared staleness window instead of each picking its own —
// the hook's own local copy of this value used to be the only one, and
// claim-port.mjs's call passed no ttlMs at all. Without a ttlMs, a
// string-identity lock (the hook writes one per commit, and never releases
// it — TTL-based auto-expiry is the design, not a bug) reads as AMBIGUOUS
// forever (D5 fail-closed), permanently deadlocking every take/pick after
// the very first commit once the hook is active. Historical STR65 incidents
// (docs/history/str65-worktree-isolation-enforcement/reports/
// validation-phase1.md) showed real inter-commit gaps of ~2-3.5 minutes.
// Lowered from 5 to 3 minutes (accepted trade-off, 2026-07-29): margin is
// now thinner than that observed 3.5-minute worst case, so a genuinely slow
// commit can self-expire and race a second writer — accepted for faster
// self-healing of an abandoned lock. Use FGOS_MAIN_CHECKOUT_LOCK_TTL_MS to
// widen the window for a specific session/CI run instead of raising this
// default back up.
export const DEFAULT_TTL_MS = 3 * 60 * 1000;

// HOOK_TTL_MS (tsk-1d9): `.githooks/pre-commit`'s own default hold time,
// separate from DEFAULT_TTL_MS above. The hook never releases on exit by
// design (self-recognition, D6 above) -- TTL is its only clearing
// mechanism -- but DEFAULT_TTL_MS's 3-minute window was sized for a
// DIFFERENT consumer's needs (mergeRunnerItem's long verify hold,
// merge.mjs:660, measured up to ~185s in practice) and, reused unchanged
// for the hook, leaves the main checkout locked to every OTHER session's
// pick/take/approve for up to 3 minutes after every single commit --
// measured at ~2/3 of active-work time given typical commit cadence
// (plans/reports/project-instability-scan-260809-1608-ship-faster-
// stability-report.md finding 1). This constant narrows the hook's OWN
// default (still overridable via FGOS_MAIN_CHECKOUT_LOCK_TTL_MS, per
// resolveTtlMs() in the hook itself) without touching DEFAULT_TTL_MS or
// either of its other two callers (claim-port.mjs, merge.mjs), which keep
// needing the longer window. Accepted, named tradeoff (docs/history/
// tsk-1d9-pre-commit-hook-ttl-split/CONTEXT.md D4/D5): a same-session
// pause longer than this between two commits narrows the self-recognition
// protection window to that same duration, down from 3 minutes --
// thinner, not eliminated.
export const HOOK_TTL_MS = 20 * 1000;

// HOLDER_PID_ENV_VAR (tsk-70l): the env var merge.mjs's root->main path
// (mergeRunnerItem's non-targetSlot branch) sets, scoped to the one
// `execFileSync` call that spawns the `git commit` triggering
// `.githooks/pre-commit` -- carrying that process's own pid, the same
// numeric identity it acquired this lock under (D6 self-recognition
// above needs a caller's OWN identity to literally equal the record's
// identity to recognize a refresh; a child process can never share its
// parent's pid, so it cannot self-recognize on its own). The hook reads
// this var when present and uses its value AS ITS OWN identity for this
// one acquire call, letting the existing self-recognition equality
// check above match it against the record the parent wrote -- with zero
// change to that check's own logic. Absent (a bare `git commit`
// unrelated to any `fgos approve`), the hook falls back to its own
// `resolveWriterIdentity()` exactly as before this item.
export const HOLDER_PID_ENV_VAR = 'FGOS_MAIN_LOCK_HOLDER_PID';

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

/** Publishes `content` under `lockPath` as a brand-new file, atomically and
 * exclusively (tsk-2tm): a reader must never observe an empty/partial file
 * between creation and content becoming visible. `open(wx)` followed by a
 * separate `write()` leaves exactly that window. Writes to a uniquely-named
 * temp file first (already holding the full content), then `link(2)`s it
 * onto `lockPath` — `link` is atomic and, like `open(wx)`, fails EEXIST if
 * the target already exists, so two racing callers still produce exactly
 * one ACQUIRED (never both). Throws EEXIST (mirroring `open(lockPath,
 * 'wx')`'s own contract) when `lockPath` already exists. */
function writeAtomicCreate(lockPath, content) {
  const tmpPath = `${lockPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tmpPath, content);
  try {
    fs.linkSync(tmpPath, lockPath);
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}

/** Publishes `content` under `lockPath`, atomically replacing whatever is
 * there (tsk-2tm): no exclusivity needed (only a recognized owner refreshing
 * its own lock reaches this), but a reader must still never observe a
 * truncated intermediate state. Writes to a uniquely-named temp file, then
 * `rename(2)`s it onto `lockPath` — an atomic replace on POSIX, so a
 * concurrent reader sees either the old or the fully-written new content,
 * never a partial one. */
function writeAtomicReplace(lockPath, content) {
  const tmpPath = `${lockPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, lockPath);
}

/**
 * One attempt at the wx-atomic-create lock, mirroring the three sibling
 * locks' single-attempt primitive for the create/EEXIST/liveness/reclaim
 * shape — diverging only where `parseLockContent` returns null (AMBIGUOUS),
 * where the recorded identity matches the caller's own (self-recognition,
 * always ACQUIRED unless `allowSelfRecognition` is false), and where a
 * string-identity holder is judged by `ttlMs` freshness alone (never a
 * liveness probe).
 */
function tryAcquireOnce(lockPath, identity, now, ttlMs, allowSelfRecognition = true) {
  try {
    writeAtomicCreate(lockPath, JSON.stringify({ pid: identity, ts: now }));
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
  // its own session, never a competing holder. tsk-1wr: an env-derived
  // session id is inherited byte-identically by every forked child, so for
  // a lock keyed on that identity two genuinely separate OS processes can
  // read as "the same writer" here. `allowSelfRecognition: false` is for
  // call sites (the merge target-ref slot) where a real cross-process
  // exclusion guarantee matters more than same-session reentrancy — that
  // lock is always released in the same call that acquired it, so it has
  // no legitimate re-entry to protect.
  if (allowSelfRecognition && record.pid === identity) {
    writeAtomicReplace(lockPath, JSON.stringify({ pid: identity, ts: now }));
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
      // Record parsed fine, so age is real even though held-ness itself is
      // undecidable (D5 fail-closed) — surface what's actually known,
      // never a fabricated remaining-TTL with no ttlMs to compute it from.
      return { status: AMBIGUOUS, lockAgeMs: now - record.ts };
    }
    held = now - record.ts <= ttlMs;
  }

  if (held) {
    const lockAgeMs = now - record.ts;
    return {
      status: HELD,
      holderPid: record.pid,
      lockAgeMs,
      remainingTtlMs: typeof ttlMs === 'number' ? Math.max(0, ttlMs - lockAgeMs) : null,
    };
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
 * Returns `{ status, holderPid?, lockAgeMs?, remainingTtlMs?, lockPath,
 * release? }` where `status` is one of ACQUIRED / HELD / AMBIGUOUS. `HELD`
 * always carries `lockAgeMs` (time since the recorded holder last touched
 * the lock); `remainingTtlMs` is `null` when no `ttlMs` was supplied (no
 * staleness window to compute it from — never fabricated). An `AMBIGUOUS`
 * from a parsed-but-undecidable string-identity record (no `ttlMs`
 * supplied) also carries `lockAgeMs`; an `AMBIGUOUS` from genuinely
 * unparseable content carries neither (no record to read a timestamp from).
 * Never throws for a stale/corrupt/missing lock — only for unexpected fs
 * errors.
 *
 * `ttlMs` is optional and caller-supplied only (no production default picked
 * here, per this cell's scope) — when present, a live-pid holder whose
 * last-touched timestamp exceeds `ttlMs` is treated as stale, same as a dead
 * pid. For a different string-identity holder, `ttlMs` is the ONLY
 * staleness signal (no liveness probe exists) — omitting it is AMBIGUOUS,
 * not stale.
 *
 * `releaseOnExit` (tsk-45z point 2, opt-in, default false): when true,
 * registers `exit`/`SIGINT`/`SIGTERM` listeners that release the lock the
 * moment THIS process ends, instead of leaving it for `ttlMs` to expire.
 * This must stay OPT-IN, never the unconditional default: `.githooks/
 * pre-commit` acquires/refreshes this lock on every commit and, BY DESIGN,
 * never releases it itself — the lock is meant to linger past that short
 * hook process's own `process.exit(0)`, with TTL as the only intended
 * clearing mechanism (a session may commit several times in a row; an
 * unconditional release-on-exit there would clear the lock between two
 * commits of the SAME session, reopening the exact STR65 race this lock
 * exists to prevent — the one thing this item's own scope explicitly rules
 * out). Only a caller whose own job is genuinely OVER once its process
 * exits — `claimWork`, `mergeRunnerItem` — should pass `releaseOnExit:
 * true`. `once` + explicit removal on `release()` keeps this from
 * accumulating listeners across repeated acquire/release cycles in the
 * same process.
 */
export function acquireMainCheckoutLock(dir, { identity = process.pid, ttlMs, now = Date.now(), releaseOnExit = false, lockFile = LOCK_FILE, allowSelfRecognition = true } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const lockPath = path.join(dir, lockFile);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = tryAcquireOnce(lockPath, identity, now, ttlMs, allowSelfRecognition);
    if (res.status === ACQUIRED) {
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        if (releaseOnExit) {
          process.removeListener('exit', onExit);
          process.removeListener('SIGINT', onSignal);
          process.removeListener('SIGTERM', onSignal);
        }
        // tsk-22c: this closure is called after an arbitrarily long
        // wrapped operation (mergeRunnerItem's verify, claimWork's state
        // mutation) — by then this call can no longer assume it is still
        // the recorded holder (TTL may have lapsed and a different session
        // legitimately reclaimed). An unconditional unlink here would
        // delete that live reclaimer's lock. releaseMainCheckoutLockIfOwn
        // only unlinks when `identity` still matches what's on disk.
        releaseMainCheckoutLockIfOwn(dir, identity, { lockFile });
      };
      let onExit;
      let onSignal;
      if (releaseOnExit) {
        onExit = () => release();
        onSignal = () => {
          release();
          process.exit(1);
        };
        process.once('exit', onExit);
        process.once('SIGINT', onSignal);
        process.once('SIGTERM', onSignal);
      }
      return {
        status: ACQUIRED,
        lockPath,
        release,
      };
    }
    if (res.status === HELD) {
      return {
        status: HELD,
        holderPid: res.holderPid,
        lockAgeMs: res.lockAgeMs,
        remainingTtlMs: res.remainingTtlMs,
        lockPath,
      };
    }
    if (res.status === AMBIGUOUS) {
      return { status: AMBIGUOUS, lockAgeMs: res.lockAgeMs, lockPath };
    }
    // status === 'retry': a stale lock was cleaned (by us or a racing
    // reclaimer); loop reattempts the bare create on the next iteration.
  }
  // Bound matches the mirrored lineage (loop.mjs): a reclaim-then-retry can
  // race at most once before either succeeding or meeting a fresh holder
  // that a subsequent caller must re-evaluate. No record was actually read
  // here (both attempts raced a fresh holder), so no age/TTL to report.
  return { status: HELD, holderPid: null, lockAgeMs: null, remainingTtlMs: null, lockPath };
}

/** Removes `.fgos/main-checkout.lock` under `dir` if present. Idempotent — a
 * caller releasing a lock already reclaimed/removed by someone else is not
 * an error. */
export function releaseMainCheckoutLock(dir, { lockFile = LOCK_FILE } = {}) {
  const lockPath = path.join(dir, lockFile);
  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

/**
 * Releases `.fgos/main-checkout.lock` ONLY when its recorded holder
 * identity strictly equals (===) `identity` (tsk-45z D2, mirroring
 * `tryAcquireOnce`'s own self-recognition/D6 equality check). Unlike
 * `releaseMainCheckoutLock` above -- an unconditional unlink meant for a
 * caller that just acquired the lock itself and knows it is the sole
 * holder -- this is for a caller (e.g. `fgos return`) that never acquired
 * the lock in this same call and cannot assume the lock it sees is still
 * its own: this session's earlier commits may have refreshed the lock
 * under its own identity, but that identity's TTL could have lapsed and a
 * different session could hold it live by the time this runs. Blindly
 * unlinking in that case would delete a genuinely live different session's
 * lock -- reopening the exact STR65 concurrent-writer race this lock
 * exists to prevent.
 *
 * Returns `{ status }`:
 *   - 'released'   -- the lock was held under `identity`; now removed.
 *   - 'no-lock'    -- no lock file was present (nothing to release).
 *   - 'not-owner'  -- a lock is present but recorded under a DIFFERENT
 *     identity (or changed underneath this call, see below) -- left
 *     untouched.
 *   - 'ambiguous'  -- the lock file content is unparseable -- left
 *     untouched, same fail-closed stance `acquireMainCheckoutLock` and
 *     `forceReclaimAmbiguousLock` already take for this shape.
 *
 * Re-reads the lock file immediately before unlinking (same TOCTOU
 * discipline `tryAcquireOnce`'s own stale-branch already uses, lines
 * ~173-192 above): a competitor could reclaim or refresh the lock between
 * the first read and this call's unlink, and changed content must never be
 * touched on a stale judgment.
 */
export function releaseMainCheckoutLockIfOwn(dir, identity, { lockFile = LOCK_FILE } = {}) {
  const lockPath = path.join(dir, lockFile);

  const readRecord = () => {
    let raw;
    try {
      raw = fs.readFileSync(lockPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return undefined;
      throw err;
    }
    return parseLockContent(raw);
  };

  const record = readRecord();
  if (record === undefined) return { status: 'no-lock' };
  if (record === null) return { status: 'ambiguous' };
  if (record.pid !== identity) return { status: 'not-owner', holderPid: record.pid };

  const recheck = readRecord();
  if (recheck === undefined) return { status: 'no-lock' };
  if (recheck === null || recheck.pid !== identity) return { status: 'not-owner' };

  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return { status: 'released' };
}

/**
 * Renews `.fgos/main-checkout.lock`'s timestamp ONLY when its recorded
 * holder identity strictly equals (===) `identity` (tsk-4l8: heartbeat for
 * a caller holding this lock across a long operation whose duration can
 * exceed `ttlMs` — e.g. `mergeRunnerItem`'s verify hold, `merge.mjs`).
 * Mirrors `releaseMainCheckoutLockIfOwn`'s own ownership/TOCTOU discipline
 * exactly, writing a fresh timestamp instead of unlinking: this is the same
 * refresh `tryAcquireOnce`'s self-recognition (D6) branch already performs
 * when the SAME identity re-acquires, exposed here as its own narrow
 * primitive so a long-running holder can call it repeatedly without paying
 * the full acquire path's create-if-missing race handling or its
 * exit/SIGINT listener registration.
 *
 * Never creates a lock that doesn't exist, and never touches one recorded
 * under a different identity — a caller renewing a lock it does not
 * actually hold would be indistinguishable from a bug stealing someone
 * else's lock.
 *
 * Returns `{ status }`:
 *   - 'renewed'    -- the lock was held under `identity`; timestamp refreshed.
 *   - 'no-lock'    -- no lock file was present (nothing to renew).
 *   - 'not-owner'  -- a lock is present but recorded under a DIFFERENT
 *     identity (or changed underneath this call, see below) -- left
 *     untouched.
 *   - 'ambiguous'  -- the lock file content is unparseable -- left
 *     untouched, same fail-closed stance every other primitive in this
 *     file already takes for this shape.
 *
 * Re-reads the lock file immediately before writing (same TOCTOU
 * discipline `releaseMainCheckoutLockIfOwn` already uses): a competitor
 * could reclaim the lock between the first read and this call's write, and
 * changed content must never be overwritten on a stale judgment.
 */
export function renewMainCheckoutLockIfOwn(dir, identity, { now = Date.now(), lockFile = LOCK_FILE } = {}) {
  const lockPath = path.join(dir, lockFile);

  const readRecord = () => {
    let raw;
    try {
      raw = fs.readFileSync(lockPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return undefined;
      throw err;
    }
    return parseLockContent(raw);
  };

  const record = readRecord();
  if (record === undefined) return { status: 'no-lock' };
  if (record === null) return { status: 'ambiguous' };
  if (record.pid !== identity) return { status: 'not-owner', holderPid: record.pid };

  const recheck = readRecord();
  if (recheck === undefined) return { status: 'no-lock' };
  if (recheck === null) return { status: 'ambiguous' };
  if (recheck.pid !== identity) return { status: 'not-owner', holderPid: recheck.pid };

  writeAtomicReplace(lockPath, JSON.stringify({ pid: identity, ts: now }));
  return { status: 'renewed' };
}

/**
 * Read-only inspection of `.fgos/main-checkout.lock` (tsk-5z2, D1) --
 * unlike `acquireMainCheckoutLock`, this NEVER creates, refreshes, or
 * deletes the lock file; it only reports what's there right now. Exists
 * for the `fgos lock-status` verb, so a caller can check before a failed
 * `take`/`pick`/`merge`/`unlock` without side effects.
 *
 * Returns `{ outcome, holderPid?, lockAgeMs?, remainingTtlMs? }` where
 * `outcome` is one of:
 *   - 'free'      -- no lock file present
 *   - 'live'      -- held by a holder that would currently be judged HELD
 *     by `acquireMainCheckoutLock` (live pid within ttlMs, or a
 *     string identity within ttlMs)
 *   - 'stale'     -- a parseable record exists but its holder is
 *     reclaimable (dead pid, or ttlMs-expired) -- `acquireMainCheckoutLock`
 *     would succeed against it
 *   - 'ambiguous' -- unparseable content, or a string-identity record with
 *     no `ttlMs` supplied (D5 fail-closed, same as the acquire path)
 * `lockAgeMs`/`remainingTtlMs` follow the same never-fabricate rule as
 * `acquireMainCheckoutLock`'s own HELD/AMBIGUOUS shape.
 */
export function inspectMainCheckoutLock(dir, { ttlMs, now = Date.now(), lockFile = LOCK_FILE } = {}) {
  const lockPath = path.join(dir, lockFile);

  let raw;
  try {
    raw = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { outcome: 'free' };
    throw err;
  }

  const record = parseLockContent(raw);
  if (record === null) {
    return { outcome: 'ambiguous' };
  }

  const lockAgeMs = now - record.ts;
  let live;
  if (typeof record.pid === 'number') {
    const pidLive = isPidAlive(record.pid);
    const withinTtl = typeof ttlMs !== 'number' || lockAgeMs <= ttlMs;
    live = pidLive && withinTtl;
  } else {
    if (typeof ttlMs !== 'number') {
      return { outcome: 'ambiguous', lockAgeMs };
    }
    live = lockAgeMs <= ttlMs;
  }

  return {
    outcome: live ? 'live' : 'stale',
    holderPid: record.pid,
    lockAgeMs,
    remainingTtlMs: typeof ttlMs === 'number' ? Math.max(0, ttlMs - lockAgeMs) : null,
  };
}

/**
 * Clears an AMBIGUOUS `.fgos/main-checkout.lock` (unparseable content) --
 * the one status `acquireMainCheckoutLock` deliberately never unlinks
 * itself (D5 fail-closed). Unlike a stale numeric-pid lock, an ambiguous
 * one has no liveness signal to probe, so this never runs on a caller's
 * own judgment alone -- only on content still unparseable at the moment of
 * a second read, mirroring `tryAcquireOnce`'s own re-read-before-unlink
 * discipline for the stale-pid branch (this file, lines 173-192): the
 * first read may be racing a legitimate holder who is mid-write of a
 * fresh, valid record.
 *
 * Never touches a lock that parses (that is HELD or ACQUIRED territory,
 * already handled by acquireMainCheckoutLock -- this function's only job
 * is the gap that primitive leaves open).
 *
 * Returns `{ status }` where status is one of:
 *   - 'already-clear'    -- no lock file present
 *   - 'no-longer-ambiguous' -- content now parses; a live holder wrote a
 *     valid record between the caller's own read and this call; untouched
 *   - 'reclaimed'         -- content still unparseable on the second read;
 *     removed
 */
export function forceReclaimAmbiguousLock(dir, { lockFile = LOCK_FILE } = {}) {
  const lockPath = path.join(dir, lockFile);

  let raw;
  try {
    raw = fs.readFileSync(lockPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { status: 'already-clear' };
    throw err;
  }

  if (parseLockContent(raw) !== null) {
    return { status: 'no-longer-ambiguous' };
  }

  try {
    fs.unlinkSync(lockPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return { status: 'reclaimed' };
}
