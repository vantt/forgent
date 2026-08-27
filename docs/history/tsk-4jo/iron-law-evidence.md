# Iron Law evidence: tsk-4jo (Route fanout-batch dispatch decisions through compileDispatchPlan)

## Classification

Run against the real committed diff on `fgw/tsk-4jo` (commit `1e878dda`,
after `git add`/`git commit`, per the false-negative lesson in
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`):

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
console.log(JSON.stringify(classifyIronLaw({ filesChanged: changedFiles('.', { id: 'tsk-4jo' }), description: 'Route fanout-batch dispatch decisions through compileDispatchPlan' })));
"
```

Result: `{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch/cli.mjs"]}`

`src/runner/dispatch/cli.mjs` is on `src/evolve/iron-law.mjs`'s
`MODULE_RULES` self-modifying-capable list — required.

(Context: the out-of-process worker that originally produced this diff
self-reported `{"required":false}`, which was wrong or run against
different state — this repo's own hard rule is "never assert an item is
done on say-so"; this classification and the evidence below were
independently re-derived by the driving session against the diff actually
sitting on this branch, not taken from the worker's own report.)

## Failing-test-first proof

Test file covering this change: `test/runner/dispatch.test.mjs`.

**Step 1 — get to red honestly.** Reverted only the implementation file to
its pre-change version, keeping the new test exactly as it ships:

```
git checkout cb7966ed -- src/runner/dispatch/cli.mjs
```

(`cb7966ed` is this branch's commit immediately before the implementation
commit `1e878dda` — a docs-only commit, so this checkout reverts
`cli.mjs` to its pre-implementation state while leaving the new test in
`test/runner/dispatch.test.mjs`, already part of `1e878dda`, untouched.)

Ran the new test against that reverted code:

```
node --test --test-name-pattern="fanoutBatchExecutorCli returns candidate as unavailable when executor is governance-blocked" test/runner/dispatch.test.mjs
```

Real failure (pasted verbatim, not paraphrased):

```
✖ fanoutBatchExecutorCli returns candidate as unavailable when executor is governance-blocked (176.52498ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  1 !== 0

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4jo-HIaSCx/test/runner/dispatch.test.mjs:4922:10)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:385:3) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 1,
    expected: 0,
    operator: 'strictEqual',
    diff: 'simple'
  }
```

This confirms the pre-change code genuinely lets a governance-blocked
candidate through as `fired` (the inline mechanism block never checked
governance at all — RESEARCH.md round 1 finding 3) — `result.fired.length`
was `1` instead of the expected `0`.

**Step 2 — get back to green.** Restored the implementation file to the
committed version:

```
git checkout HEAD -- src/runner/dispatch/cli.mjs
```

`git diff --stat HEAD -- src/runner/dispatch/cli.mjs test/runner/dispatch.test.mjs`
came back empty — working tree matches the committed diff exactly, no
stray changes left behind by the stash-and-restore.

Reran the identical test command:

```
✔ fanoutBatchExecutorCli returns candidate as unavailable when executor is governance-blocked (32.80917ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

**Step 3 — full-suite confirmation.** `node --test test/runner/dispatch.test.mjs`
(the item's own `verify` command) after restore:

```
ℹ tests 328
ℹ pass 328
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

328/328, matching the pre-implementation baseline count run earlier this
same session (also 328, before this item's new test existed at 327 base +
1 new = 328) — no regression.

## Blast-radius cross-check (degraded posture, per plan.md)

`fgos tool query --capability impact-analysis --status present` reports
GitNexus registered and `present` for this repo, but `list_repos` reports
its index 2140 commits behind HEAD — degraded, not full (recorded in
plan.md's Approach section). Ran `detect_changes` anyway for whatever
signal it could add (`scope: compare`, `base_ref: main`,
`worktree: <this worktree>`):

```json
{"summary":{"changed_count":0,"affected_count":0,"changed_files":4,"risk_level":"low"},"changed_symbols":[],"affected_processes":[]}
```

`changed_symbols`/`affected_processes` came back empty despite
`changed_files: 4` — consistent with the index staleness already declared
(it does not have `fanoutBatchExecutorCli`'s current body indexed at all),
so this result is not treated as real independent confirmation, only
recorded for the record per the recipe's step 5. The real blast-radius
evidence for this change is the direct grep cross-check already in
RESEARCH.md round 1 finding 2/5 (only caller is `fgos-fanout`'s
`wave-dispatch-mechanics.md` Step 3) and the full existing test suite
staying green above.
