# tsk-1dsz — RESEARCH.md

## Round 1 — 2026-08-13 (discovery stage, via fgos-researching)

**Asked:** (A) Is there a real code path in `src/` that could, under some
race/timing condition, cause fgos to write `events.jsonl`/`state.json` at
the fixture ROOT (unprefixed, outside `.fgos/`) instead of inside
`.fgos/`, during `test/e2e/coexistence-canary.test.mjs`'s test (ii)
footprint round? (B) Does tsk-4fx's root-cause mechanism (lock-timeout
under many concurrent racing processes) plausibly apply to this flake
(a single `runner --once` subprocess, silent `assert.deepEqual`
mismatch, no thrown error)?

**Checked:**
- `test/e2e/coexistence-canary.test.mjs:282-348` — test (ii) footprint
  case. `snapshotTree(fx, ['.fgos', '.git'])` skips recursing into those
  two dirs entirely (`snapshotTree`'s exclude check at the directory-entry
  level, lines 128-144), so their contents never enter either snapshot —
  a diff entry with an unprefixed `events.jsonl`/`state.json` rel path can
  only come from a file living directly at the fixture root, not from
  `.fgos/events.jsonl` or `.fgos/state.json`.
- `src/state/store.mjs:88-90` — `paths(dir)` always does
  `path.join(dir, 'events.jsonl')` / `path.join(dir, 'state.json')`. Every
  call site passes an already-`.fgos`-suffixed `dir`.
- `src/runner/paths.mjs:87-98` — `fgosDirFromRoot(root)` is the single
  place `.fgos` gets joined onto a resolved root; `resolveFgosDir` always
  routes through it. `resolveRepoRoot(cwd, {strict})`: `strict: true`
  (bin/fgos.mjs's CLI contract) returns `cwd` as-is (still gets `.fgos`
  joined by the caller); non-strict mode (fgos-runner) shells out to
  `git rev-parse --show-toplevel` — for the fixture `fx` (a real git repo
  per `makeFixture()`), this resolves to `fx` itself.
- `src/runner/dispatch.mjs:1122-1170` (`spawnWorker`) — the executor
  subprocess (the test's own fake executor,
  `test/e2e/coexistence-canary.test.mjs:291-309`) is spawned with an
  explicit `cwd` parameter threaded from the caller; nothing here defaults
  to `process.cwd()` silently.
- **No code path found** in the store/runner path-resolution chain that
  skips the `.fgos` join or falls back to writing at the bare repo root.
  This is evidence AGAINST a storeRoot-resolution bug as the mechanism —
  not proof it cannot happen under some interleaving this pass didn't
  reproduce (single occurrence, immediately clean on rerun, and the item's
  own text already flags reproduction-under-load as unattempted).
- `docs/history/tsk-4fx-concurrency-test-lock-timeout-flake/plan.md` +
  `RESEARCH.md` — tsk-4fx's confirmed mechanism: `acquireEventsLock`'s 2s
  per-attempt deadline (`src/state/events.mjs:361`) exceeded because MANY
  sibling child processes (`raceAcrossProcesses`, up to `nProcesses`
  concurrent) retry the same lock simultaneously in
  `test/state/store.test.mjs` / `porting-store.test.mjs`. It throws a real
  `lock-timeout` ERROR (exit 7) — a loud failure mode.
- The coexistence-canary footprint test spawns exactly ONE `runner --once`
  subprocess (`spawnSync(process.execPath, [RUNNER, '--once'], {cwd: fx})`,
  line 333) against an isolated tmp fixture no other process touches — no
  multi-process fleet, no shared-lock contention shape. Its failure is a
  silent `assert.deepEqual` mismatch on a byte snapshot, not a thrown
  error.

**Found:**
- (B) is answered with real evidence: tsk-4fx's mechanism requires many
  concurrent racing processes contending for the same lock; this test has
  no such shape (single subprocess, isolated fixture). **Not the same
  mechanism** — a different family, if it recurs at all.
- (A) is NOT resolved: static reading of the path-resolution chain found
  no bug that would explain an unprefixed `events.jsonl`/`state.json`
  write. The item's own description already names the real next step
  (reproduce under load) as unattempted and out of scope for whoever
  first observed it; a single research pass over the code cannot settle
  whether a genuine race exists without actually reproducing it, which is
  an experiment (repeated runs under load), not a code-reading question.

**Still open:** whether to invest further session time attempting
reproduction under load (no guarantee of success — this is a one-off,
immediately-clean-on-rerun flake) versus documenting it as a known,
unconfirmed, low-frequency flake and closing unless it recurs. That
trade-off is a scope call, not something this research pass can resolve
on its own.
