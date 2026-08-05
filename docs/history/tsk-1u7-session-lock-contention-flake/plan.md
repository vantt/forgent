# tsk-1u7 — plan

## Mode gate

Flags checked against the item: auth (no), authorization (no), data model
(no), audit/security (no), external systems (no), public contracts (no —
`sessions.json`/`sessions.lock` are internal runner state, not a public
contract), cross-platform (no), existing covered behavior (**yes** —
touches `test/runner/session.test.mjs`, part of the existing suite),
weak proof around the area (**yes** — the area is intermittently flaky by
definition, so any change here is proven only probabilistically, not
deterministically). 2 flags.

Chosen mode: **small**. A couple of files, no gray areas left — D1/D2
already closed every product decision in `CONTEXT.md`; what remains is
mechanical.

`fgos graph --json`: tsk-1u7 is its own size-1 connected component (no
other item depends on it or blocks it) — no critical-path/topUnblock
ordering question applies to a single-item, single-file change.

Impact-analysis capability: GitNexus registered and `present` →
`impact-analysis: full`. Not exercised further — this item touches only
`test/runner/session.test.mjs` (test-only, no production call sites to
trace blast radius for).

## Approach

Per D1, the investigation conclusion is already reached and documented in
`CONTEXT.md`: `sessions.lock`'s design (wx-atomic create, PID-liveness
stale-check with re-verify before reclaim, `session.mjs:131-392`)
structurally prevents a lost-update race on `sessions.json`. No code fix
to `session.mjs` is being made by this item — there is no confirmed bug to
fix, only a documented, plausible-but-unconfirmed lock-contention-timeout
hypothesis (`CONTEXT.md`'s "Deferred to planning" section).

Sizing the evidence bar for that hypothesis against this item's `light`
tier (the specific question `CONTEXT.md` deferred here): a deliberate
CPU-throttled repro to force-reproduce the timeout would cost real
investigation time for a `light`-tier item whose only mandated deliverable
is D2 (get the flake out of default CI signal). The lock-contention
hypothesis is already recorded with its supporting evidence in
`CONTEXT.md` — sufficient for a future higher-tier item to pick up if the
flake recurs after D2 or new evidence emerges. This item does not chase a
synthetic repro.

**What this item actually builds**: apply D2 — exclude
`test/runner/session.test.mjs`'s "concurrent createSession from real
separate OS processes never loses a registry entry" test from the default
`npm test` full-suite run, using Node's built-in `--test-skip-pattern` or
an inline `{ skip: '...' }` test option (whichever keeps the test runnable
on demand, never deleted), with a comment linking `tsk-1u7` and this
plan's own reasoning — the same shape `tsk-3ld` used for
`test/state/events.test.mjs`.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `test/runner/session.test.mjs`'s skip annotation | low — mechanical, isolated to one test file | `node --test test/runner/session.test.mjs` still runs the test directly (skip must be default-suite-only, not permanent); `npm test` (default glob) no longer includes it in its pass/fail signal |
| No regression to the other 5 tests in the same file | low | full file run, all other tests still assert as before |

No medium/high-risk entries — nothing here touches production code paths.

## Files touched

- `test/runner/session.test.mjs` — add a default-suite skip/exclude
  annotation to the one flaky test, with a comment citing `tsk-1u7`.

## Shape (small)

One direct task, no split:

1. Read the exact test block (`session.test.mjs:207-240`) and Node's
   `node:test` skip mechanics (`{ skip: <reason> }` on the `test()` call,
   or an env-gated conditional skip) — pick whichever lets the test still
   run explicitly (`node --test test/runner/session.test.mjs` with an
   override, e.g. `RUN_FLAKY=1`) while `npm test`'s default glob excludes
   it.
2. Apply the skip with a comment: cites `tsk-1u7`, states the reason
   (full-suite load-contention flake, not a confirmed data-loss bug — see
   `docs/history/tsk-1u7-session-lock-contention-flake/CONTEXT.md`), and
   states how to force-run it (`RUN_FLAKY=1 node --test
   test/runner/session.test.mjs` or equivalent).
3. Run the item's verify command in full to confirm both halves hold:
   `node --test test/runner/session.test.mjs && for i in 1 2 3; do npm
   test; done`.

No split — this is one honest piece of work.

## Proof surface

Verify (already locked at `discover`, unchanged here):
```
node --test test/runner/session.test.mjs && for i in 1 2 3; do npm test; done
```
Proves: (a) the test file itself still runs and its concurrent-createSession
case still passes when invoked directly/forced, and (b) the default
`npm test` full-suite glob passes cleanly 3 times in a row post-exclusion —
direct evidence D2 landed and the flake no longer contributes to default
CI noise.

## Assumptions

- Node's `node:test` runner in this repo's version supports a per-test
  `skip` option or an equivalent conditional-skip pattern compatible with
  the glob `test/**/*.test.mjs` used by `npm test` (`package.json:23`).
  Not material to `CONTEXT.md`'s decisions — an implementation detail of
  D2's mechanism, left to whoever executes this plan to confirm against
  the actual Node version in use.
