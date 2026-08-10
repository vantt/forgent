# tsk-592 — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk, run after the implementation
commit landed):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/dispatch.mjs"]
}
```

## Failing-test-first proof

`test/runner/dispatch.test.mjs` (post-fix, already committed) run against
`src/runner/dispatch.mjs` swapped back to its pre-fix content (`git show
d2818c0~1:src/runner/dispatch.mjs`, temporarily written over the working
tree, then restored from a saved copy — working tree confirmed clean
against `HEAD` afterward):

```
ℹ tests 152
ℹ pass 127
ℹ fail 25
```

Representative failures, spanning both changes this item makes:

```
✖ resolveExecutorCommand throws a RunnerConfigError when a kind:"mcp" capacity is not registered and fgosDir is given (D13) (3.961401ms)
✖ resolveExecutorCommand throws a RunnerConfigError when a kind:"skill" capacity is registered but not present on this machine (D13) (4.262958ms)
✖ resolveExecutorCommand throws when a kind:"http" capacity resolves to a non-Claude command with no allowCrossProvider (D13) (0.160959ms)
✖ resolveExecutorCommand throws a RunnerConfigError when a kind:"binary" capacity is not registered and fgosDir is given (D13) (3.658602ms)
✖ decideDispatchMechanism: no native mechanism always resolves out-of-process, regardless of live access or force flag (rule 1) (0.558476ms)
  + 'cli-spawn'
    actual: 'cli-spawn',
✖ decideDispatchMechanism: native mechanism + live Task access + no force -> in-process (rule 2) (0.170839ms)
  + 'native'
    actual: 'native',
✖ decideCapacityCli resolves "in-process" for a kind:"task" capacity when hasLiveTaskAccess is passed true, alongside its agentType (0.953384ms)
✖ the "decide" CLI entry point (node src/runner/dispatch.mjs decide <capacityId>) prints {mechanism} JSON to stdout for a real invocation against this repo's own .fgos/config.json (38.287792ms)
```

The 25 failures are exactly the new/updated tests: 12 from the gate
predicate widening (3 assertions × 4 kinds: `mcp`/`skill`/`http`/`binary`,
each unregistered / registered-but-absent / non-Claude-cross-provider) and
13 from the mechanism-value rename (every place the old code still
returned `'native'`/`'cli-spawn'` where the new tests expect
`'in-process'`/`'out-of-process'`). The one gate-predicate regression
guard (`kind:"task" still skips both checks`) passed even pre-fix, as
expected — it proves the predicate's *exclusion* of `task`, unchanged by
this item.

Same test file, post-fix (`src/runner/dispatch.mjs` restored to `HEAD`):

```
ℹ tests 152
ℹ pass 152
ℹ fail 0
```

## Full item verify command (already run)

```
node --test test/runner/dispatch.test.mjs test/skills/fgos-mirror.test.mjs
```

Result: 156 tests, 0 fail.

## Note: item's own recorded `verify` field was corrected, twice

The item's `verify` field as inherited from `DISCUSSION.md` §7.3's own
"Verify nháp" (draft) label mixed Vietnamese prose fragments and a
non-shell `=>` operator — `fgos return` executes `item.verify` literally
via `spawn(item.verify, {shell:true})` (`src/runner/goal-check.mjs`), so
the original text would have failed as a shell syntax/command-not-found
error regardless of code correctness. This is a pre-existing shaping
defect inherited from the draft, not something this item's implementation
introduced (see the `fgos decision` log entries on this item for both
corrections and their rationale).

First corrected to `npm test` (matching the draft's own "npm test xanh"
line, now made literal and backed by this item's new pinned tests). Then
narrowed again to `node --test test/runner/dispatch.test.mjs
test/skills/fgos-mirror.test.mjs` once a full `npm test` run showed its
only failure was `test/docs/launcher-vocabulary-guard.test.mjs`, flagging
its own pinned term (the pre-launcher-rename name for the orchestration
role, see decision record 0028) in five paths this item never touches
(`docs/history/backlog-execution-reconciliation/RECONCILIATION.md`,
`docs/history/tsk-33w-.../iron-law-evidence.md`,
`docs/history/tsk-4eu-.../iron-law-evidence.md`,
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`,
`plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md`).
Confirmed pre-existing at this branch's base commit (`69f5fb6`, before any
tsk-592 change, via `git stash` + rerun) — part of the separate, in-flight
vocabulary-migration item `tsk-2cw` (same failure, same attribution,
already recorded independently in `tsk-4eu`'s own
`iron-law-evidence.md`). Scoping to this item's own touched-test files is
honest narrowing to what this branch can actually prove, not a weakened
check on the real fix — user confirmed this scoping choice explicitly.
