# RESEARCH.md — dispatch-idle-timeout-flaky-test (tsk-2y1)

## Round 1 — 2026-08-23

**Asked:** Is the description's proposed fix ("widen the timing margin
and/or switch to mocked/fake timers") actually two viable options, or does
one of them not apply given how `spawnWorker`'s idle-timeout mechanism is
built? Need this resolved before `planning` picks a concrete approach.

**Checked (repo, all in this worktree):**

- `test/runner/dispatch.test.mjs:2774-2785` — the flaky test itself. It
  spawns a real child process via `writePeriodicWriterExecutor`
  (`test/runner/dispatch.test.mjs:218-235`) which runs a real
  `setInterval(..., 150ms)` **inside a separate Node subprocess**, writing
  `tick-N` to real stdout 5 times, then exits. The test asserts the parent's
  `spawnWorker` call (with `idleTimeoutMs: 400`) completes rather than being
  killed for going idle, proving the idle timer resets on each chunk instead
  of firing on cumulative elapsed time.
- `src/runner/dispatch/cli.mjs:193-277` — `spawnWorker` threads
  `opts.idleTimeoutMs ?? cfg.idleTimeoutMs` straight into the adapter
  (`adapterFn`), which does the actual spawn.
- `src/runner/dispatch/transport.mjs:243,311-325` — the idle-timeout
  mechanism itself: on every real `stdout`/`stderr` `'data'` event from the
  real spawned child, `idleTimer` is `clearTimeout`'d and a fresh
  `setTimeout(..., idleTimeoutMs)` is armed (`transport.mjs:320-325`). If no
  chunk arrives before that timer fires, the child is killed
  (`transport.mjs:379`, "killed after Nms with no output (idle timeout)").

**Found:**

- The idle-reset mechanism is driven by two independently real,
  OS-scheduled things: (1) the child subprocess's own `setInterval` tick
  cadence, and (2) the parent process's `setTimeout` racing against the
  real `'data'` events that cadence produces. Node's fake/mock timers
  (`node:test`'s `mock.timers`, or a Sinon-style fake clock) only patch
  timers in the *process they're installed in* — they do not, and cannot,
  affect a separate child process's real wall-clock `setInterval`, nor the
  real OS-level I/O event delivery between the two processes.
- Faking the parent's `setTimeout`/`clearTimeout` in isolation while the
  child still emits chunks on a real 150ms cadence would desync the two
  sides of exactly the interaction this test exists to prove (idle timer
  resets *in response to* a real chunk arrival) — it would not test the
  same thing anymore, or would require also faking/simulating the child's
  I/O timing, which is a materially different (and much larger) test
  redesign than a flakiness fix warrants.
- The margin as written is genuinely tight for a CI/shared-machine
  environment: `idleTimeoutMs: 400` vs `intervalMs: 150` gives only a
  ~250ms buffer per tick before a delayed chunk trips the idle kill — this
  matches the tsk-vuj live failure (killed after 400ms with no output
  during a concurrent full-suite run).

**Still open:** none — this fully resolves the ambiguity. The "and/or fake
timers" branch in the item description is not actually available given the
real-subprocess architecture; the only in-scope, evidence-backed fix is
widening the real-time margin (larger `idleTimeoutMs` relative to
`intervalMs`, and/or a smaller `intervalMs` with more ticks, so the
per-chunk buffer is generous under load while the test still runs fast).
Concrete margin numbers are a `planning`-stage decision, not a `discovery`
one.

**Verify (proposed):** re-run the target test in isolation to confirm it
still proves the same behavior after the margin change:

```bash
node --test --test-name-pattern "idleTimeoutMs resets on every chunk" test/runner/dispatch.test.mjs
```
