# plan.md — tsk-2rr: fix false-idle polling race in herdrSpawnInteractiveAdapter

Mode: standard

Flags counted (per `fgos-routing`'s Mode gate): external systems (agy/herdr
are external binaries this adapter shells out to) + existing covered
behavior (touches `herdrSpawnInteractiveAdapter`, already covered by
`test/runner/herdr-spawn-adapter.test.mjs`) + weak proof around the area
(this exact function already had 3 distinct real bugs surface only via
live testing during tsk-10j, per `docs/history/herdr-spawn-agy-interactive-mode/iron-law-evidence.md`)
= 3 flags, no hard-gate flag (no auth/data-loss/audit-security/new
external provider/removed validation) → **standard**.

## Approach

**Chosen path:** in `herdrSpawnInteractiveAdapter`'s `checkIdle`
(`src/runner/dispatch/transport.mjs:659-695`), track whether
`agent_status === 'working'` has been observed at least once via a local
`let sawWorking = false;` flag, set the moment a poll sees `'working'`.
Only treat a subsequent `'idle'`/`'done'` as real completion when
`sawWorking` is already `true`. Before that point, a poll reporting
`'idle'`/`'done'` is treated the same as `'unknown'` — keep polling,
never fire `runExitSequence`.

This directly targets the confirmed root cause
(`docs/history/agy-herdr-false-idle-polling-race/RESEARCH.md` Round 2):
`herdr pane get`'s own `agent_status` classification falsely reports
`'idle'` as early as 3.5s into a pane's life under the adapter's own
500ms polling cadence, well before the agent has done any real work —
confirmed via 5+ live reproductions, both through the real adapter and
through hand-replicated `herdr pane run`/`pane get` sequences at the same
cadence. Coarser, human-cadence observation never hits this; every
tight-poll run does.

**Alternatives rejected:**
- *Slow down the first poll / add an initial delay before the first
  `checkIdle` call.* Rejected: Round 2's own false report landed at
  3500ms, already past any modest fixed delay that would still keep the
  adapter responsive for genuinely fast (`'done'`) single-line answers —
  a longer delay just moves the race window later without closing it,
  and would regress the fast-completion case tsk-10j's own iron-law
  evidence already fixed (bug #2, the `'done'` terminal state for short
  answers).
- *Poll less frequently (e.g. every 2s instead of 500ms).* Rejected: no
  evidence gathered yet on whether a slower cadence avoids the false
  report or just delays hitting it later in the pane's life — would need
  its own live proof round, and the `sawWorking` gate closes the same gap
  without needing to characterize herdr's own heuristic further.
- *Investigate/fix herdr's own `agent_status` classifier.* Out of scope —
  `herdr`/`herdr-plugin` is a separate binary+plugin this repo shells out
  to, not code this repo owns (confirmed via `herdr-plugin/src/*.rs` being
  outside this item's footprint). Worth a separate report to whoever owns
  `herdr-plugin` if this recurs after the adapter-side fix, but not this
  item's fix surface.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `checkIdle`'s new `sawWorking` gate | standard | live dispatch through `agy-herdr` with a multi-step (file-write + git-commit) prompt must produce a REAL file + REAL commit, not just exit 0 — the same repro shape RESEARCH.md Round 2 used, run again post-fix |
| Existing short-answer (`'done'`) terminal-state handling (tsk-10j bug #2) | standard | must not regress — a short single-line prompt must still complete without hanging once it genuinely reaches `'done'` after having been seen `'working'` first |
| Existing mocked tests in `test/runner/herdr-spawn-adapter.test.mjs` | light | `npm test -- test/runner/herdr-spawn-adapter.test.mjs` must stay green; mocked tests may need updating to emit a `'working'` reading before `'idle'`/`'done'` if they currently jump straight to a terminal state |

**Impact-analysis posture:** `degraded`. `fgos tool query --capability
impact-analysis --status present` reports GitNexus registered and
`present`, but this session's own GitNexus index is confirmed stale
(last indexed `7bb3231`, behind current `HEAD` — reported repeatedly by
this session's own tool hooks). Cross-checked manually instead: `rg -n
"herdrSpawnInteractiveAdapter|herdrSpawnAdapter" src test` confirms the
only call site is the `EXECUTOR_ADAPTERS['herdr-spawn']` map entry in
`transport.mjs` itself — no other caller. Blast radius is contained to
that one function; the only executor currently wired with
`interactiveMode` (`agy-herdr`) is dormant (reverted to `agy-cli` this
same session after this exact bug was found — `capabilities.fgos-coding-
implement.prefer` currently points at `agy-cli`, not `agy-herdr`), so this
fix has zero live production exposure until/unless `agy-herdr` is
re-activated.

**Files touched, in order:**
1. `src/runner/dispatch/transport.mjs` — the `sawWorking` gate itself
   (`checkIdle`, lines ~659-695).
2. `test/runner/herdr-spawn-adapter.test.mjs` — extend the mocked
   `interactiveMode` tests to cover the gate (a mock that reports `idle`
   before ever reporting `working` must NOT fire `runExitSequence`), and
   add/adjust a live test asserting real file content (not just `res.status
   === 0`) through a disposable-repo dispatch — the concrete gap RESEARCH.md
   Round 1/2 exposed in the existing live test's own assertions.
3. `docs/history/agy-herdr-false-idle-polling-race/plan.md` (this file).

No `fgos graph --json` ordering constraint applies — `tsk-2rr` is not on
the current `criticalPath` and `topUnblock` is empty; this is a
standalone, dependency-free bug fix.

## Shape

Single honest piece, no split. Concrete cases to prove against, scaled to
`standard`:

- **The confirmed false-positive case**: a pane whose `agent_status` goes
  `unknown` → `idle` (or `unknown` → `done`) WITHOUT ever passing through
  `working` — must NOT be treated as complete. This is the exact real
  failure RESEARCH.md documents.
- **The genuine long-answer case** (pre-existing, must not regress): a
  pane whose `agent_status` goes `unknown` → `working` → `idle` — treated
  as complete once `idle` is seen, same as today.
- **The genuine short-answer case** (tsk-10j bug #2, must not regress): a
  pane whose `agent_status` goes `unknown` → `working` → `done` (never
  `idle`) — treated as complete once `done` is seen after `working`.
- **A pane that never leaves `unknown`/never reaches `working`** before the
  adapter's own outer `timeoutMs` fires — must still hit the existing
  timeout path cleanly (`worker-timeout`), not hang past it silently.

## Outstanding questions

None
