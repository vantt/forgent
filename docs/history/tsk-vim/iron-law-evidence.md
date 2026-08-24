# Iron Law evidence — tsk-vim

`classifyIronLaw` result against the real committed diff (`changedFiles('.', item)`
vs `dbda721f`):

```json
{"required":true,"matchedFlags":["migration"],"matchedModules":["bin/fgos.mjs"]}
```

`matchedFlags: ["migration"]` is the same benign false positive already
recorded at the validating-stage gate (`docs/history/tsk-vim-fgos-noise-
truncation-guard/plan.md`'s own "Gate resolution" section): the word
appears only in this item's own `description`, citing tsk-3ve's
already-merged event-log sharding migration as background/root-cause —
this item performs no migration of its own. `matchedModules:
["bin/fgos.mjs"]` is real: this item's one production-code change lands
in that file.

## Verify command

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/cli/fgos-return.test.mjs
```

(`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` matches this repo's own real test
invocation — the `npm test` script always sets it; running the suite
without it lets tsk-3ve's unrelated periodic-checkpoint-commit mechanism,
already tracked separately as tsk-3tp, add noise unrelated to this item.)

## Failing-before transcript (real run, unmodified `bin/fgos.mjs`, before this item's fix)

```
✖ return: a .fgos/* change bundled into the item's own commit (git add -A sweeping in take's own event-log write) is exempt from footprintDiffHits (tsk-x5r self-exempt) (812.557665ms)
  AssertionError [ERR_ASSERTION]: a .fgos/* change bundled into the item's own commit must never be flagged
  + actual - expected

  + [
  +   {
  +     file: '.fgos/events-jsonl.truncation-guard.json'
  +   }
  + ]
  - []

test at test/cli/fgos-return.test.mjs:397:1
✖ return succeeds when ONLY .fgos/ (the live event log) is dirty — its own take/return writes are excluded from the clean-tree gate (no more manual events.jsonl commit before every return) (596.714127ms)
  AssertionError [ERR_ASSERTION]: sanity: .fgos/ must be the ONLY dirty path at this point

  3 !== 1

test at test/cli/fgos-return.test.mjs:762:1
✖ return succeeds after a FIRST pick (todo -> doing, no prior blocked branch) once real work is committed on the fresh fgw/<id> worktree — a fresh pick claim records branchHeadAtTake exactly like a blocked reclaim does, so return recognizes the branch's own progress instead of checking the (unchanged) main checkout (2010.639527ms)
  AssertionError [ERR_ASSERTION]: return never advances or touches the human's own main checkout
  + actual - expected

  + '41a8cb8d5d95e8ec07bee1c40f83407cf229f4f0'
  - '12b778609e5342e8a9eb568ffd47c12d6909400f'

ℹ tests 53
ℹ pass 50
ℹ fail 3
```

(the third failure above traced, during this item's own discovery/
verify work, to a separate already-known mechanism — tsk-3ve's periodic-
checkpoint-commit, tracked at tsk-3tp — surfaced only because the run
above omitted `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1`; it is not caused by
this item's own regex gap, and does not appear in the passing-after
transcript below, which uses this item's own real, synced `verify`
command.)

## Passing-after transcript (real run, with this item's committed fix)

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/cli/fgos-return.test.mjs
...
✔ return: a .fgos/* change bundled into the item's own commit (git add -A sweeping in take's own event-log write) is exempt from footprintDiffHits (tsk-x5r self-exempt) (812.253805ms)
✔ return: a .fgos/events-jsonl.truncation-guard.json change bundled into the item's own commit is exempt from footprintDiffHits (tsk-vim)
✔ return succeeds when ONLY .fgos/ (the live event log) is dirty — its own take/return writes are excluded from the clean-tree gate (no more manual events.jsonl commit before every return)
✔ return succeeds after a FIRST pick (todo -> doing, no prior blocked branch) once real work is committed on the fresh fgw/<id> worktree — a fresh pick claim records branchHeadAtTake exactly like a blocked reclaim does, so return recognizes the branch's own progress instead of checking the (unchanged) main checkout (493.893408ms)
...
ℹ tests 54
ℹ pass 54
ℹ fail 0
```

## Full-suite regression check

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test` (no path filter, this
repo's own bare-`node --test` convention since `npm test` silently runs
only 1 of many files on this Node version): `3897` tests, `3891` pass,
`5` skipped, `1` fail — the one failure is
`herdr-plugin/web/src/api/client.test.ts` (a pre-existing, unrelated
TS-resolution failure present on `main` itself before this item's work,
per this repo's own known-issue list). No other test regressed.
