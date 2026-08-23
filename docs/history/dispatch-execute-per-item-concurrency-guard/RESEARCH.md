# Research — dispatch.mjs execute has no per-item concurrency guard (tsk-64hk)

## Round 1 (2026-08-19)

**Asked:**
1. Does the repo already have a reusable atomic/mutex file-lock primitive
   (beyond `events.mjs`'s own internal lock) that a new dispatch-level
   guard could reuse instead of inventing a new one?
2. `executeExecutorCli`'s CLI has no `--id`/`--work` flag — is its existing
   `cwd` option (default `process.cwd()`) a reliable, already-available
   proxy key for "which item is this dispatch for", without a new flag?

**Checked (repo, direct reads with citations):**

- `src/runner/main-checkout-lock.mjs` — a real, already-proven, zero-dep
  atomic lock primitive (own header: "a FOURTH, wholly independent instance
  of the wx-atomic-create + stale-pid-reclaim lock lineage already proven
  three times in this repo" — siblings: `acquireRunnerLock`
  (`src/runner/loop.mjs`), `acquireSessionsLock` (`src/runner/session.mjs`),
  `acquireEventsLock` (`src/state/events.mjs`)). Key exports:
  - `writeAtomicCreate` (line 195) — `fs.linkSync`-based atomic create
    (the exact technique tsk-76l's own description cites as "already
    proven twice" for events.mjs/session.mjs).
  - `acquireMainCheckoutLock(dir, {identity, ttlMs, now, releaseOnExit,
    lockFile = LOCK_FILE, allowSelfRecognition})` (line 367) — **`lockFile`
    is already a caller-overridable parameter**, not hardcoded to the
    single main-checkout use case. `dir` is the directory the lock file is
    written into directly (`path.join(dir, lockFile)`, line 369) — callers
    pass `.fgos/` as `dir` (confirmed by `releaseMainCheckoutLock`'s own
    doc comment, line 432: "Removes `.fgos/main-checkout.lock` under
    `dir`").
  - `mergeSlotLockFile(targetRef)` (line 69) — **existing precedent for
    keying a lock filename by an arbitrary string identifier**: `merge-
    slot--${encodeURIComponent(targetRef)}.lock`, built specifically so
    two unrelated targets never collide on one lock file (own doc comment,
    lines 51-68, on why `encodeURIComponent` over a naive char
    substitution). This is the exact shape a new `dispatchLockFile(key)`
    helper should mirror for a per-item/per-cwd dispatch lock.
  - Full API already includes `release()` (returned by acquire, closure
    over `releaseMainCheckoutLockIfOwn` so a stale-TTL reclaim by someone
    else is never clobbered), `releaseOnExit: true` (registers
    process-exit/SIGINT/SIGTERM handlers so a crashed dispatch process
    self-releases instead of stranding the lock for the full TTL),
    PID-liveness (`isPidAlive`, line 149) + TTL freshness, self-recognition
    (same identity re-acquiring is a refresh, never a conflict), and a
    distinct `AMBIGUOUS` outcome (corrupt/unparseable lock content fails
    closed rather than being silently treated as free — own header, D5).

  **Conclusion:** no new lock mechanism is needed. `acquireMainCheckoutLock`
  is already general enough to acquire a lock at `.fgos/dispatch--
  <encoded-key>.lock` (mirroring `mergeSlotLockFile`'s own naming
  convention) — reusing it is more DRY, and more battle-tested (three
  prior real incidents already found and fixed this exact create-vs-write
  TOCTOU class in the mirrored lineage — events.mjs, session.mjs, and
  tsk-76l's still-open loop.mjs instance), than porting beehive's
  `store-lock-named-mutex` primitive from scratch as originally proposed
  in this item's own submit text.

- `src/runner/dispatch/cli.mjs:522-559` (`runDispatchCli`'s `execute`
  branch) — confirms `executeExecutorCli(executorId, {...})` is called with
  no `cwd` override at all; the function's own default
  (`cwd = process.cwd()`, `src/runner/dispatch/cli.mjs:221`) is what's
  actually used every time `execute` runs from the CLI. `execute`'s own
  CLI usage string (confirmed via `node src/runner/dispatch.mjs` with no
  subcommand) carries no `--id`/`--work` flag at all — only `--prompt`/
  `--model`/`--tier`/`--carries`/`--has-live-task-access`/`--for`.

- `.fgos/config.json`'s `runner.capabilities` block — `execute` and
  `advise` capability entries both carry the description "...planned
  --for execute -> agy, never built: no caller invokes this purpose yet"
  (verbatim). `fgos-coding-implement` is the only capability with a live
  `prefer` wired to a real out-of-process executor (`agy`) that this
  item's own `fgos-coding-implement`'s Flow step 2 actually dispatches
  through `execute` for real, live use.

- `.agents/skills/fgos-coding-implement/SKILL.md` Flow step 2 (already
  read in full for tsk-1z1's own driving pass) — the out-of-process branch
  is invoked from INSIDE the claimed item's own worktree (the whole "you
  are the driver session... at Flow step 2..." framing, and this item's
  own live incident: `execute` was run with cwd already resolved to
  `/home/vantt/projects/forgentX/.claude/worktrees/tsk-1z1-PKc24w`,
  confirmed by `pwd` immediately before the dispatch).

**Found:** `cwd` is a reliable, already-available, zero-signature-change
proxy key for "which item" TODAY, because:
1. The only real, live caller of `execute` (`fgos-coding-implement`'s Flow
   step 2) always runs it from inside that item's own dedicated worktree —
   worktree paths are unique per item by construction (`fgos pick`
   allocates a fresh `.claude/worktrees/<id>-<suffix>/` directory), so two
   different items can never collide on the same cwd.
2. The two capabilities (`execute`/`advise`) that COULD one day dispatch
   ad hoc, item-less calls through this same CLI are both explicitly
   "never built: no caller invokes this purpose yet" per their own
   config description — so there is no live counter-example today of two
   unrelated dispatches sharing one cwd that a cwd-keyed lock would
   over-serialize. Even if that changed later, over-serializing two
   unrelated dispatches that happen to share a cwd is a conservative-safe
   degradation (lost throughput, never a correctness bug) — the opposite
   failure direction from this item's own real incident (under-locking).

**Still open:** None — both questions resolved with direct evidence, no
guess. The concrete design this clears the way for: acquire
`acquireMainCheckoutLock(fgosDir, {identity: <pid or a per-call token>,
ttlMs: <cover the executor's own timeoutMs>, releaseOnExit: true, lockFile:
dispatchLockFile(cwd)})` immediately before `executeExecutorCli` calls its
adapter, release it in a `finally` right after the adapter call resolves
(success or failure) — refusing (typed `DispatchError`, not silently
serializing) when the lock comes back `HELD` by a different identity,
since a second concurrent dispatch for the same cwd should never be
silently queued (that would just delay the exact race, not remove it) —
it should be told plainly that a dispatch for this item is already in
flight.

**Verify (real, runnable, sketch — final command depends on the actual
diff, written at `fgos-coding-planning` time):** a test that calls
`executeExecutorCli` twice concurrently (`Promise.all`) with the same
`cwd` against a fast/fake executor and asserts exactly one of the two
calls ran the adapter while the other received a typed refusal — mirrors
the shape `main-checkout-lock.mjs`'s own test suite already uses for
`acquireMainCheckoutLock`'s HELD case.
