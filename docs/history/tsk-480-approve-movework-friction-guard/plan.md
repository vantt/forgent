# Plan: tsk-480 — approve's post-success moveWork can throw silently after a permanent state change

Decisions: `docs/history/tsk-480-approve-movework-friction-guard/CONTEXT.md`
(D1-D3). This plan does not reopen any of them.

## Mode

**standard.** Flags counted against the mode-gate checklist:

- **existing covered behavior** (yes) — `case 'approve'` already has
  integration coverage in `test/cli/fgos.test.mjs` (subprocess-driven,
  `run(cwd, [...])`); this change touches a success path of already-tested
  behavior and must not regress it.
- **weak proof around the area** (yes) — item's own `verify` field was
  unset (D3); the failure mode being fixed (a real `EventLogError('lock-
  timeout')` mid-`approve`) has no existing repro or test hook.
- **public contracts** (yes, narrow) — `approve`'s returned envelope on
  the new failure branch is a new shape callers may observe (see Risk
  map below); the happy-path envelope is unchanged.

3 flags, no hard-gate flag (no auth/data-loss/audit-security/external-
provider/removed-validation) → **standard**, not high-risk. A smaller
mode (`small`) would not honestly cover it: 3 call sites need the same
guard applied consistently (D1), a new lock-independent diagnostic path
needs designing (D2), and a new test-only failure seam needs designing
(D3) — three real pieces of shape, not a one-file tweak.

`fgos graph --id tsk-480 --json`: tsk-480 sits in a size-1 connected
component (`deps: []`, nothing depends on it, it depends on nothing) —
no split-ordering question to resolve against other work.

Impact-analysis posture (`fgos tool query --capability impact-analysis
--status present`): gitnexus **present** → **full**. Recorded here per
CLAUDE.md's gate; no code is edited by this skill, so it does not change
this plan's proof points, but `fgos-coding-implement` must run real `impact()`
calls on `moveWork`/`addFriction`/the new fallback helper before editing
them, per the repo's Always-Do rule.

## Approach

### Chosen path

1. Add a reusable guard helper in `bin/fgos.mjs` (or a small function
   local to the file — no new module needed for this alone) that wraps a
   `moveWork(...to:'delivered'...)` call, catches any throw, and on catch:
   a. writes a diagnostic record through a path that does **not** share
      `events.jsonl`'s lock (D2), and
   b. returns a distinct envelope shape the CLI caller can branch on,
      instead of letting the exception propagate uncaught.
2. Apply that guard at all three call sites (D1): `bin/fgos.mjs:2223`
   (leaf-into-root), `:2297` (root-into-main), `:2327` (pull-door/legacy
   verify-only). At the two merge sites, the guard must not skip
   `cleanupMergedBranch` on a caught failure — the merge already landed
   either way, so leaving the branch undeleted on top of an unrecorded
   status would compound the same diagnostic gap the item is fixing.
3. Reuse the existing `.fgos/logs/` sole-writer pattern
   (`src/runner/worker-log.mjs`'s `appendWorkerLog`: git-ignored,
   `fs.appendFileSync`, `mkdirSync` on first write, **never throws** —
   exactly D2's shape) rather than inventing a second lock-free log
   mechanism. `appendWorkerLog` is documented as "the sole writer of
   `.fgos/logs/*`" for worker-dispatch output specifically; `fgos-
   executing` decides whether to call it directly keyed by item id, or
   add a thin same-module sibling function for this non-worker call site
   — a naming/API detail, not a product decision, left to execution.
4. Design a test-only failure seam for D3. No existing precedent for
   fault injection in this codebase (checked: no `FGOS_TEST_*`/
   `__TEST_*`-style hooks anywhere in `src/`, `bin/`, `test/`). `test/cli/
   fgos.test.mjs` drives `approve` as a real subprocess
   (`execFileSync`/`spawnSync` on `bin/fgos.mjs`), so an in-process
   monkeypatch of `moveWork` is not reachable from that suite — the seam
   must cross the subprocess boundary (e.g. an env var read only inside
   the three guarded call sites, inert unless explicitly set). This is a
   proof point, not a locked design (see Risk map).

### Rejected alternatives

- **Retry `moveWork` before falling back**: rejected as the default
  design — `withEventsLock`'s own timeout is already a 2s
  retry-with-backoff loop (`src/state/events.mjs`); stacking a second
  full 2s wait on top makes a CLI command hang for up to 4s on the
  contended case D2 is explicitly about (sustained contention), for a
  fallback that must work regardless of the retry outcome anyway. Not
  ruled out entirely — `fgos-coding-implement` may add one bounded, cheap retry
  if profiling during implementation shows it meaningfully reduces
  fallback-path frequency — but the design does not depend on it.
- **A second locked file for the fallback record**: rejected — reusing
  a second lock only relocates D2's exact problem (sustained contention
  can starve any single lock), it does not solve it. `appendFileSync`
  with no lock, one file per item id, is what `worker-log.mjs` already
  proves works for this exact "must not be load-bearing, must not
  throw" shape.
- **Splitting into 3 child items (one per call site)**: rejected — the
  guard is one function reused at three call sites (D1); splitting would
  create three near-duplicate diffs and three near-duplicate proof
  points instead of one shared implementation with one shared test
  strategy.

## Risk map

| Component | Risk | What proves it (→ fgos-coding-validating) |
|---|---|---|
| Fallback diagnostic write (D2) | Medium — must genuinely not share `events.lock`'s failure mode, or D2 is unmet in practice, not just on paper | Confirm the chosen write path (recommended: `.fgos/logs/`) uses no lock file shared with `events.mjs`'s `withEventsLock`/`acquireEventsLock`, and confirm `appendWorkerLog`'s own "never throws" contract still holds for this new call site |
| Cleanup ordering on caught failure (leaf/root merge paths) | Medium — a caught `moveWork` failure must still run `cleanupMergedBranch`, or the leaf/root branch leaks in addition to the status desync | Confirm both merge call sites (2223, 2297) still call `cleanupMergedBranch` after a caught failure, not only on the happy path |
| Test-only failure seam (D3) | Medium — no existing precedent in this codebase; must be inert by default and not reachable from a real `approve` run outside the test harness | Confirm the seam is off unless explicitly enabled, confirm a real `fgos approve` (no seam flag) is provably unaffected, and confirm the new test actually asserts a diagnostic record appears (not just that `approve` doesn't crash) |
| Returned envelope shape on the new failure branch | Low-medium — this is new caller-visible surface (public-contract flag) | Confirm the new envelope shape is documented at the call site and the existing happy-path envelope shape for all three success calls is byte-identical to before this change |
| Pull-door/legacy path (2327) scope | Low — D1 already settled this is in scope, but it's the only one of the three with no real merge to protect | Confirm the guard there produces the same diagnostic/envelope shape as the merge paths, for consistency, even though the "permanent-mutation-hidden" severity is lower there |

## Files likely touched

- `bin/fgos.mjs` — the three guarded call sites (`case 'approve'`,
  ~2139-2328) and the new guard helper.
- `src/runner/worker-log.mjs` — extended with a sibling export (exact
  name left to execution), or called directly if its existing shape
  already fits without changes.
- `test/cli/fgos.test.mjs` — new test(s) covering the failure-seam path
  for at least one of the three call sites (D3); existing approve tests
  in this file must stay green (regression bar).

## Order

No cross-item ordering constraint (`fgos graph` confirms tsk-480 is an
isolated component). Internal order for `fgos-coding-implement`:

1. Fallback diagnostic write path (D2) — needed by every guarded call
   site, build once.
2. Guard helper + apply at all three call sites (D1), including the
   cleanup-ordering fix at the two merge sites.
3. Test-only failure seam + the regression test proving it (D3) — last,
   since it exercises the guard built in step 2.

## Assumptions (unproven, flagged for fgos-coding-validating)

- No additional retry beyond `withEventsLock`'s own internal timeout
  loop is required to satisfy D2 — the fallback write is designed to
  succeed regardless of retry outcome, so an extra retry is an
  optimization, not a requirement.
- Reusing `.fgos/logs/<id>.log` (keyed by item id, same directory
  `appendWorkerLog` already writes worker dispatch logs to) is an
  acceptable diagnostic location for a human-driven `approve` failure,
  even though today every existing writer of that directory is
  worker-dispatch-triggered, not human-CLI-triggered. `CONTEXT.md` did
  not specify a required location beyond "does not share `events.lock`"
  — this is a `plan.md`-level implementation choice, not a re-opening of
  D2 itself.
