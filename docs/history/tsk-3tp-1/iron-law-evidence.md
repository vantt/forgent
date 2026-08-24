# tsk-3tp-1 — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs", "src/runner/merge.mjs"]`, `matchedFlags: []`.

## Test command

Bare `node --test` (this repo's own `npm test` script silently runs only
1 of ~172 test files on this Node version while still exiting 0 — do not
trust it). Full suite, no arguments (Node's own default recursive
auto-discovery from repo root).

## Failing-before (real transcript excerpt, baseline on this branch after merging in tsk-3ve/"Tầng A", before this item's own edit)

```
test at test/cli/fgos-claim.test.mjs:159:1
✖ take with no --id claims the frontier head, defaults role to human, records headAtTake, and writes a predicted outcome (1515.504841ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'd387813f43c692a3d280643e3985daea6bc78acc'
  - '<headBefore>'

test at test/cli/fgos-claim.test.mjs:269:1
✖ pick with no --id claims the frontier head exactly like take does today, role fixed to "session", and stands up a real (non-detached) git branch/worktree for the claim (1477.0213ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + '07a985dbbc4140169ed63f53bab90d8bb98c8e45'
  - '<headBefore>'

✖ recheck-blocked verb: a blocked item whose recorded commit is no longer reachable (force-pushed away) is reported stillBlocked, never resolvable (779.482525ms)
✖ return: a .fgos/* change bundled into the item's own commit (git add -A sweeping in take's own event-log write) is exempt from footprintDiffHits (tsk-x5r self-exempt) (1683.707448ms)
✖ return succeeds when ONLY .fgos/ (the live event log) is dirty — its own take/return writes are excluded from the clean-tree gate (no more manual events.jsonl commit before every return) (1533.566941ms)
✖ return succeeds after a FIRST pick (todo -> doing, no prior blocked branch) once real work is committed on the fresh fgw/<id> worktree — a fresh pick claim records branchHeadAtTake exactly like a blocked reclaim does, so return recognizes the branch's own progress instead of checking the (unchanged) main checkout (1626.221153ms)
✖ e2e S2-pull: submit pass-throughs 2 stages via discover, a human takes the frontier head, a concurrent fgos-runner --once never stomps the human-held claim, then the human commits real progress and returns to proposed (2020.303659ms)

ℹ tests 3892
ℹ pass 3877
ℹ fail 10
ℹ cancelled 0
ℹ skipped 5
```

Root cause of the 7 (2 in `test/cli/fgos-claim.test.mjs` + 1 in
`test/cli/fgos-read.test.mjs` + 3 in `test/cli/fgos-return.test.mjs` + 1
e2e in `test/e2e/runner-loop.test.mjs`): `events-jsonl-truncation-guard.mjs`'s
old `runOpportunisticMainCheckoutChecks` fired an immediate checkpoint
commit whenever no prior checkpoint commit existed yet
(`lastCommitSec === null` → `initialCommitMet = true`), regardless of how
old the dirty shard actually was. Tầng A's per-writer shard files made
this fire around ordinary `take`/`pick` calls in these tests' fresh
fixture repos, landing an out-of-band `chore(.fgos): periodic
events.jsonl checkpoint` commit between the test's own `headBefore`
snapshot and the point `take`/`pick` records `headAtTake` — shifting the
recorded value away from what the test (correctly) expected.

The other 2 baseline failures — `test/runner/claim-port.test.mjs`'s
event-log read-count assertion and a docs heading-drift test on this
item's own `CONTEXT.md` — are a separate, unrelated regression and a
cosmetic doc nit respectively; see "What's still red" below.

## Passing-after (real transcript excerpt, after this item's fix)

```
$ node --test test/cli/fgos-claim.test.mjs test/cli/fgos-read.test.mjs test/cli/fgos-return.test.mjs test/e2e/runner-loop.test.mjs
ℹ tests 233
ℹ pass 233
ℹ fail 0
```

```
$ node --test test/state/events-jsonl-truncation-guard.test.mjs test/setup/checks.test.mjs
ℹ tests 141
ℹ pass 141
ℹ fail 0
```

```
$ node --test test/runner/merge.test.mjs
ℹ tests 97
ℹ pass 97
ℹ fail 0
```

Full suite after the fix:

```
ℹ tests 3894
ℹ pass 3887
ℹ fail 2
ℹ cancelled 0
ℹ skipped 5
```

## What changed

- `src/state/events-jsonl-truncation-guard.mjs`: removed the dedicated
  periodic-commit branch (`PERIODIC_CHECKPOINT_INTERVAL_SEC = 900`,
  `DEFAULT_CHECKPOINT_EVENT_THRESHOLD = 50`, the "no prior commit yet"
  eager trigger, and its own `chore(.fgos): periodic events.jsonl
  checkpoint` commit message). Replaced with a single sparse fallback
  trigger keyed on the oldest dirty file's mtime under
  `.fgos/events.jsonl`/`.fgos/events/`
  (`checkpoint.fallbackIntervalSec`, default 3600s), committing as
  `chore(.fgos): fallback events checkpoint` — a different message on
  purpose, so a grep for the old literal string proves the eager
  mechanism is really gone, not just renamed.
- `src/runner/merge.mjs` (`mergeRunnerItemLocked`): added a sweep step,
  right before the staged merge's own `git commit --no-edit`, that
  `git add`s whatever is dirty/untracked under `.fgos/events.jsonl` and
  `.fgos/events/` into that same commit — the common case (a merge
  happens at all) never needs the fallback commit above.
- `src/setup/registrations.mjs`: `checkpoint`'s registered config default
  changed from `{ eventThreshold }` to `{ fallbackIntervalSec }`,
  matching the new key; `checkpoint.eventThreshold` retired.
- `bin/fgos.mjs`: `FGOS_NOISE_ONLY_PATHS` extended to also exempt the
  truncation guard's own sidecar mark
  (`events-jsonl.truncation-guard.json`) and warnings log
  (`main-checkout-guard-warnings.jsonl`) from `footprintDiffHits`, same
  as `events.jsonl` already was — proven by a new test in
  `test/cli/fgos-return.test.mjs`.
- Test additions: `test/runner/merge.test.mjs` gained a direct proof that
  a dirty shard file lands inside the merge commit itself (using
  `git diff-tree -m`, since a plain `diff-tree`/`diff-tree -r` on a merge
  commit shows nothing without `-m` or `-c`) and that exactly one
  first-parent commit lands on the merge target (no separate checkpoint
  commit riding alongside it); `test/state/events-jsonl-truncation-guard.test.mjs`
  and `test/setup/checks.test.mjs` updated for the new fallback API and
  commit message.
- `docs/history/tsk-3tp-worker-write-events-tang-b/CONTEXT.md`: fixed a
  stale, non-canonical locked-decisions heading (unrelated doc-heading
  drift test).

## What's still red (not this item's scope)

`test/runner/claim-port.test.mjs`'s "claimWork reads the event log fully
4 times per call, not 6 or 7" assertion: was 8 reads at this branch's own
baseline, now 6 after this fix (this item's change coincidentally removed
2 of the extra reads by dropping the eager-commit path claim-port.mjs's
own caller went through) — but still not the expected 4. `claim-port.mjs`
itself required zero changes for this item's own directive (its existing
call to `runOpportunisticMainCheckoutChecks` already only passed
`commitEnv`, already forward-compatible with the new signature), so the
remaining over-read is a separate, pre-existing regression from Tầng A's
multi-file read path, out of this item's declared footprint.
`herdr-plugin/web/src/api/client.test.ts` remains red for its own
unrelated, pre-existing TypeScript-resolution reason.
