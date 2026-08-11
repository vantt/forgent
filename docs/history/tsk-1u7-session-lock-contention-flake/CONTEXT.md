# tsk-1u7 — session.test.mjs concurrent-createSession flake

## Feature boundary

`test/runner/session.test.mjs:207` ("concurrent createSession from real
separate OS processes never loses a registry entry") failed once during
full-suite close-out (`fgos approve tsk-3ik-4 --acknowledge-iron-law`,
2026-08-03), passed cleanly on repeated isolated reruns (15/15). This item
covers: determining the real cause of the flake, and deciding what — if
anything — changes in `session.mjs` or the test itself. It does not cover
implementing that change; that is `fgos-coding-planning`/`fgos-executing`'s job.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | **SUPERSEDED by D3** — was: "confirm the lock design prevents lost-update by construction, and diagnose whether `sessions.lock`'s coarse scope... plus its 10s timeout is the real flake trigger". Wrong: see D3. |
| D2 | **SUPERSEDED by D4** — was: "exclude/tag the test out of the default `npm test` run, mirroring `tsk-3ld`'s precedent". Wrong: `tsk-3ld` never excluded a test; see D4. |
| D3 | D1 reversed (new evidence, surfaced at `fgos-coding-validating`). `session.mjs`'s `tryAcquireOnce` (`session.mjs:137-145`) still carries the exact pre-fix vulnerable pattern `events.mjs` had: `fs.openSync(lockPath, 'wx')` then a separate `fs.writeSync` — a TOCTOU window where the lock file exists but is empty, so a competing process reading it mid-write sees unparseable (NaN) content, misreads it as a dead/garbage holder, and unlinks a lock a live process still holds. This is the SAME bug `tsk-3ld` already found and fixed in `events.mjs` (commit `962eb6b`, `fs.linkSync`-based atomic create — `events.mjs:214-225`), reproduced there at ~30% failure rate at 20 concurrent processes (`docs/history/events-lock-concurrency-race/plan.md`). `session.test.mjs`'s own test only spawns 5 processes — below that reproduction threshold — which exactly matches the "isolated pass, full-suite flake" signature this item started from. Real, confirmed-by-precedent bug — not test oversensitivity, not lock-contention-timeout. |
| D4 | D2 reversed. No longer exclude the test. Instead: port `events.mjs`'s `tryAcquireEventsLockOnce`'s `linkSync`-based atomic-create fix to `session.mjs`'s `tryAcquireOnce` (write pid to a per-attempt temp file, `fs.linkSync` onto `lockPath`, instead of `openSync('wx')` + `writeSync`). Mirror `tsk-3ld`'s actual remedy shape: keep the test in the default suite; consider raising its process count as permanent regression coverage at the scale that actually catches this (`tsk-3ld` bumped `N_PROC` 6→20 for the same reason). |

## Pinned terms

- **"lost-update race"** — two processes both read `sessions.json`, both
  push an entry, one write clobbers the other; an entry silently vanishes
  from the registry. Distinct from a **lock-timeout failure**, where a
  process throws `SessionError` after failing to acquire `sessions.lock`
  within the deadline — a loud, non-silent failure mode.
- **"flake trigger" (this item's scope)** — the mechanism that makes the
  test intermittently fail under full-suite load but not in isolation.
  **Revised (D3)**: IS a real lost-update-shaped race — see D3. The
  original clarify pass checked the stale-pid-reclaim re-verify (sound) but
  missed the earlier create-vs-write window in `tryAcquireOnce`'s fast
  path (`session.mjs:139-141`) — the exact spot `events.mjs`'s own fix
  targets.

## Scout evidence

- `test/runner/session.test.mjs:207-240` — spawns 5 real child OS
  processes (`child_process.spawn`, not threads) via `Promise.all`, each
  calling `createSession` against the same `sessions.json`/`sessions.lock`
  in a fresh temp repo. Asserts all 5 session ids land in the registry.
- `src/runner/session.mjs:289-392` (`createSession`) — acquires
  `acquireSessionsLock` (line 305) and holds it across its ENTIRE body,
  released only in a `finally` (line 390): the nesting guard, the
  `git worktree add --detach` call (line 327, a real git operation), the
  `.fgos` symlink setup, and the final `writeRegistry` call are all inside
  the critical section. The registry read (`readRegistry`, line 307) and
  write (`writeRegistry`, line 387) are never exposed to a second writer.
- `src/runner/session.mjs:137-219` (`tryAcquireOnce` /
  `acquireSessionsLock`) — wx-atomic lock-file create; on `EEXIST`, checks
  PID liveness (`isPidAlive`) before ever touching another holder's lock;
  a stale (dead-PID) lock is re-read immediately before unlink to close
  the TOCTOU window the function's own comment calls out. This matches the
  design `loop.mjs`'s `acquireRunnerLock` already uses elsewhere in this
  repo. **Revised (D3)**: this bullet only checked the stale-reclaim
  branch's own TOCTOU guard (sound). It missed a DIFFERENT, earlier window:
  the fast-path create at `session.mjs:139-141` does `fs.openSync(lockPath,
  'wx')` then a separate `fs.writeSync` — the file exists-but-empty gap a
  concurrent reader can catch mid-write. See D3/D4.
- `src/state/events.mjs:205-243` (`tryAcquireEventsLockOnce`) and
  `docs/history/events-lock-concurrency-race/plan.md` — `tsk-3ld`'s actual
  outcome (read fresh at `fgos-coding-validating`, not assumed): a **real** race
  in this exact create-vs-write shape, reproduced at ~30% failure rate at
  20 concurrent processes, fixed by writing the pid to a per-attempt temp
  file then `fs.linkSync`-ing it onto `lockPath` (atomic — `link()` only
  ever exposes the destination fully-written or not-yet-existing).
  `events.mjs:29-33`'s own comment names `session.mjs`'s
  `acquireSessionsLock` as one of two untouched siblings sharing the
  pre-fix pattern — confirmed still true by direct read of
  `session.mjs:137-145`.
- `acquireSessionsLock`'s default `timeoutMs` is 10000 (line 191, `retryMs`
  20ms busy-wait via `sleepSync`). Because the lock scope includes the slow
  `git worktree add`, 5 concurrent callers serialize entirely through one
  lock for the full worktree-creation duration each, not just the JSON
  read-modify-write — under full-suite CPU/disk contention (2427 tests)
  this queueing could plausibly exceed 10s, producing a `SessionError`
  (line 210-216) that surfaces as a rejected child process (exit 1) in the
  test's `Promise.all`. This is a different failure shape than "lost
  registry entry": a loud timeout/exception, not silent data loss.
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — documents the same "isolated pass, full-suite flake" signature for a
  sibling item (`tsk-3ld`, `test/state/events.test.mjs`'s own concurrent
  OS-process test), and the diagnostic steps (isolate-rerun, check backlog
  for a tracked flaky item) this item's own description already followed.
- Capability gate (`CLAUDE.md`): `fgos tool query --capability
  impact-analysis --status present` returned GitNexus registered and
  `present` → `impact-analysis: full`. Not exercised further in this
  clarify pass (no code edited here); noted for planning/executing's own
  gate checks downstream.

## Canonical references

- `test/runner/session.test.mjs:207-240`
- `src/runner/session.mjs:131-392` (`tryAcquireOnce`, `acquireSessionsLock`,
  `readRegistry`, `writeRegistry`, `createSession`)
- `tsk-3ld` / `docs/history/events-lock-concurrency-race/` — sibling item,
  real precedent for both the bug shape (D3) and the fix technique (D4)
- `src/state/events.mjs:205-243` (`tryAcquireEventsLockOnce`) — the fix to
  port
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`

## Deferred to planning

- The exact diff shape for porting `events.mjs`'s `linkSync` technique into
  `session.mjs`'s `tryAcquireOnce` (temp-file naming, cleanup on the
  link-failure path) — implementation detail, left to `fgos-coding-planning`.
- Whether `session.test.mjs`'s concurrent-createSession test should have
  its process count raised (mirroring `tsk-3ld`'s `N_PROC` 6→20 bump) as
  permanent regression coverage, and by how much — sizing left to
  `fgos-coding-planning` against this item's `light` tier.
- Whether `loop.mjs`'s `acquireRunnerLock` (the third sibling
  `events.mjs:29-33` names as sharing the original pattern) also needs
  this fix is explicitly OUT OF SCOPE for this item — `tsk-1u7`'s
  boundary is `session.mjs` only; a separate item should cover
  `loop.mjs` if warranted.
