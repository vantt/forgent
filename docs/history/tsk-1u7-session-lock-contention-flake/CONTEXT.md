# tsk-1u7 — session.test.mjs concurrent-createSession flake

## Feature boundary

`test/runner/session.test.mjs:207` ("concurrent createSession from real
separate OS processes never loses a registry entry") failed once during
full-suite close-out (`fgos approve tsk-3ik-4 --acknowledge-iron-law`,
2026-08-03), passed cleanly on repeated isolated reruns (15/15). This item
covers: determining the real cause of the flake, and deciding what — if
anything — changes in `session.mjs` or the test itself. It does not cover
implementing that change; that is `fgos-planning`/`fgos-executing`'s job.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Investigation target reframed from "find a lost-update race in `sessions.json`'s read-modify-write" to "confirm the lock design prevents lost-update by construction, and diagnose whether `sessions.lock`'s coarse scope (it spans the slow `git worktree add --detach` call, not just the JSON read/write) plus its 10s `acquireSessionsLock` timeout is the real flake trigger under full-suite load". |
| D2 | Interim: exclude/tag `test/runner/session.test.mjs`'s concurrent-createSession test out of the default `npm test` full-suite run, mirroring the precedent `tsk-3ld` set for `test/state/events.test.mjs`. Never delete the test. Record the reason in the test file (comment or skip annotation) and link `tsk-1u7`, so a future reader does not mistake it for abandoned coverage. |

## Pinned terms

- **"lost-update race"** — two processes both read `sessions.json`, both
  push an entry, one write clobbers the other; an entry silently vanishes
  from the registry. Distinct from a **lock-timeout failure**, where a
  process throws `SessionError` after failing to acquire `sessions.lock`
  within the deadline — a loud, non-silent failure mode.
- **"flake trigger" (this item's scope)** — the mechanism that makes the
  test intermittently fail under full-suite load but not in isolation.
  Confirmed NOT a data-loss bug per the scout below; the working hypothesis
  is lock-contention timeout, still unconfirmed by a reproducing load test.

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
  repo. No structural gap found that would let two processes both win the
  lock or write concurrently.
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
- `tsk-3ld` — sibling flaky-test item for `test/state/events.test.mjs`,
  the precedent D2 follows
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`

## Deferred to planning

- Whether the eventual fix (if the lock-scope/timeout hypothesis holds) is:
  narrowing the lock's critical section (do `git worktree add` outside the
  lock, re-validate before the final registry write), raising
  `timeoutMs`, or accepting the current serialized behavior as correct and
  only fixing the test's load-sensitivity. This is an implementation
  choice, not a product decision — left to `fgos-planning`.
- What evidence bar confirms the lock-contention-timeout hypothesis (e.g.
  a deliberately CPU-throttled repro) versus leaving it as a documented,
  plausible-but-unconfirmed explanation. Left to planning/validating to
  size against this item's `light` tier.
- The exact mechanism for excluding the test from the default suite (skip
  annotation vs. separate `npm test` include-list) — implementation detail
  for whoever executes D2.
