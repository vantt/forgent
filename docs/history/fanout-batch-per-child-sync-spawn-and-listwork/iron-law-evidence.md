# Iron Law evidence — tsk-2ewi

## Classification

`required: true`, matched module `src/runner/dispatch/cli.mjs` (Iron
Law's `MODULE_RULES` self-modifying-capable-module list). No risk
keywords matched (`matchedFlags: []`) — the module match alone triggers
this. Run against the real committed diff (parent `913fdb44` →
`4a0644e1`, on branch `fgw/tsk-2ewi`):

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work[process.argv[1]];
const filesChanged = changedFiles('.', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "tsk-2ewi"
```
→ `{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch/cli.mjs"]}`

## Why the classic failing-test-first recipe produced no red state (and that is the real, honest result)

`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s
recipe is: stash/revert only the implementation file(s), run the test
command that will run after, and expect real failures against the
pre-fix code. Followed exactly here — and it produced **no failures**, on
purpose, not as a shortcut. Same shape as the precedent this item's own
sibling `tsk-4sr` already documented for the same file
(`docs/history/tsk-4sr/iron-law-evidence.md`) — collapsing a redundant
call to reuse an already-computed identical value.

The diff (`git show 4a0644e1 -- src/runner/dispatch/cli.mjs`) replaces
`listWork(fgosDir).work[candidateId]` with `slotsView.work[candidateId]`,
where `slotsView = listWork(fgosDir)` was already read once, earlier in
the SAME synchronous call, before `batchToRun` was sliced and before any
child's own `pick`/`return` could mutate state. Traced in
`docs/history/fanout-batch-per-child-sync-spawn-and-listwork/plan.md`'s
own Approach section: candidate `N`'s own record can only differ between
the two reads if candidate `N`'s OWN prior `pick`/`return` already
mutated ITS OWN entry — impossible, since that mutation happens strictly
AFTER this same lookup in the same closure. A sibling candidate's
`pick`/`return` only ever mutates that sibling's own record, never
candidate `N`'s. So for this specific per-candidate field access, the two
reads are provably identical every time — no existing (or honestly
addable) black-box test can observe a difference, because there isn't
one.

**Real command output, before (pre-fix code, implementation file reverted
only, test file kept exactly as shipped):**

```
$ git checkout 913fdb44bbb19b42037a0558322e07ae9f3b8ed0 -- src/runner/dispatch/cli.mjs
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/dispatch.test.mjs
...
✔ fanoutBatchExecutorCli returns slotsFull when worker slots ceiling is full (148.685219ms)
✔ fanoutBatchExecutorCli trims candidates to free slots when ceiling is configured (103.329282ms)
✔ fanoutBatchExecutorCli: real end-to-end out-of-process fire -- pick/execute/return actually complete via subprocess calls to the real bin/fgos.mjs (2300.362824ms)
✔ fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows (5460.449277ms)
ℹ tests 312
ℹ suites 0
ℹ pass 312
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 50260.39977
```

**Real command output, after (fix restored):**

```
$ git checkout HEAD -- src/runner/dispatch/cli.mjs
$ node --test test/runner/dispatch.test.mjs
✔ fanoutBatchExecutorCli returns slotsFull when worker slots ceiling is full (17.498757ms)
✔ fanoutBatchExecutorCli trims candidates to free slots when ceiling is configured (17.889967ms)
✔ fanoutBatchExecutorCli: real end-to-end out-of-process fire -- pick/execute/return actually complete via subprocess calls to the real bin/fgos.mjs (314.502351ms)
✔ fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows (2961.323352ms)
ℹ tests 312
ℹ suites 0
ℹ pass 312
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14106.97022
```

Both runs: 312/312 pass. The only observed difference is wall-clock
duration (50.3s before vs. 14.1s after) — consistent with the fix's own
purpose (fewer full-state `listWork` reads per batch), not a correctness
signal the test suite asserts on directly.

## Test command

```
node --test test/runner/dispatch.test.mjs
```

## Full suite regression check

```
node --test 'test/**/*.test.mjs'
```
run once against the restored fix as part of `fgos return`'s own
verify step (see `fgos show tsk-2ewi` for the recorded result).
