# Research: session-identity-pid-walk-flaky-test (tsk-5n6)

## Round 1 — 2026-08-23

**Asked:** What does `test/util/session-identity.test.mjs`'s "3-hop walk
reaches the real ancestor across a spawned process chain" test currently
assert/time, what concrete change removes the real-scheduling dependency,
and does tsk-2y1 already establish a reusable pattern for this class of
fix.

**Checked (repo, cited):**

- `test/util/session-identity.test.mjs:217-269` — the test spawns a live
  3-level chain of real `node` subprocesses (`top -> mid -> leaf`), waits
  up to 8s over IPC for the leaf's pid to arrive, then calls
  `resolveWriterIdentity(undefined, { env: {}, pid: leafPid })` and
  asserts the result equals `{ id: process.pid, source: PID }` (i.e. the
  walk reaches the real test-process ancestor 3 hops up). The test's own
  comment (`test/util/session-identity.test.mjs:204-207`) states this is
  deliberately a *"Real-process test ... not just a faked ppid lookup"* —
  a second test earlier in the same file (around line 188-194) already
  covers the faked/mocked-`execFile` ancestor-chain case, so this test
  exists specifically to also exercise the real OS process tree.

- `src/util/session-identity.mjs:93-109` (`ppidOf`) — each hop of the walk
  shells out to `ps -o ppid= -p <pid>` via the injectable `execFile`, with
  a hardcoded `PPID_TIMEOUT_MS = 200` (line 99) applied as the `timeout`
  option on every call. The doc comment at lines 93-98 explains why: this
  call runs *inside the held cross-process `events.lock`* via
  `resolveWriterIdentity`, so a hung `ps` must not be able to block that
  lock indefinitely — 200ms is a deliberate production safety bound, not
  an arbitrary test constant.

- `src/util/session-identity.mjs:134-150` (`resolveWriterIdentity`) — on
  hop 0, if `ppidOf` returns `null` (any `ps` failure, including a
  200ms-timeout), the walk returns `{ id: pid, source: UNRESOLVED }`
  (line 144) instead of walking further. This exactly matches both
  observed failures quoted in the item description: expected
  `{ id: T.pid, source: 'pid' }`, got `{ id: leafPid, source:
  'unresolved' }` — i.e. the very first `ps -o ppid= -p <leafPid>` call
  exceeded 200ms and was aborted, under a concurrent heavy-load full-suite
  run where many test processes are shelling out to `ps` at once.

- tsk-2y1 (`fgos list --id tsk-2y1 --json`) — a sibling flake in
  `test/runner/dispatch.test.mjs`, currently at `stage: executing`,
  `status: doing`, not yet merged to main (its `docsRef`,
  `docs/history/dispatch-idle-timeout-flaky-test/`, does not exist in the
  main checkout — it lives only in tsk-2y1's own unmerged worktree). Its
  own root cause is a different mechanism: a fixed `idleTimeoutMs` budget
  racing a real subprocess's tick interval, not a subprocess-spawn
  `timeout` option. No locked, mergeable convention exists yet to mirror.

**Found:**

- Root cause is the 200ms `PPID_TIMEOUT_MS` bound on the real `ps` call in
  `ppidOf` (`src/util/session-identity.mjs:99,103`), not the test's own
  8s IPC wait or its 10s test-level timeout — both observed failures are a
  hop-0 `ps` timeout, not a slow process spawn.
- `PPID_TIMEOUT_MS` is a *production* constant shared by the real
  cross-process-lock code path (per the comment at
  `src/util/session-identity.mjs:96-98`) — widening it globally would
  weaken that documented lock-safety guarantee, which the test itself
  does not need (the test never holds `events.lock`).
- `resolveWriterIdentity`/`ppidOf` do not expose the 200ms bound as a
  caller-overridable parameter today — only the `execFile` function
  itself is injectable (`src/util/session-identity.mjs:134`,
  `101`).
- "Mock/stub process scheduling instead of asserting against real spawned
  PIDs" (the item's second proposed direction) would collapse this test
  into the same shape as the file's existing fake-`execFile` test
  (line ~188-194), defeating this test's own stated purpose of proving
  the walk against a **real** OS process tree — not a viable direction
  for *this* test without deleting its reason for existing.

**Still open (implementation-level, for `planning`):** the concrete
mechanism to widen the margin without touching the shared production
`PPID_TIMEOUT_MS` — e.g. a test-local `execFile` wrapper that shells out
to the real `ps` binary with a larger timeout than 200ms, so the test
keeps exercising real `ps`/real PIDs but is no longer bound by the
lock-safety-driven 200ms production constant. This is an implementation
choice, not a fact gap — `planning`'s job, not `discovery`'s.
