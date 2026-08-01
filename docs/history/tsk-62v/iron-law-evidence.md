# tsk-62v — Iron Law evidence

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2/D3: this
item's diff touches `src/runner/dispatch.mjs` and `src/runner/loop.mjs`
(both self-modifying-capable modules per `src/evolve/iron-law.mjs`'s
`MODULE_RULES`), so `classifyIronLaw` returns `required: true` and this
evidence file is persisted before return.

## classifyIronLaw result

Computed against the real committed diff (`changedFiles`, `merge.mjs`,
diffing `main...fgw/tsk-62v`):

```json
{
  "required": true,
  "matchedFlags": ["schema", "audit"],
  "matchedModules": ["src/runner/dispatch.mjs", "src/runner/loop.mjs"]
}
```

`matchedFlags: ["schema", "audit"]` comes from the item's own `description`
text (it literally proposes a schema addition and an audit trail), matched
against `HEAVY_KEYWORDS`. `matchedModules` are the two runner files this
item's diff actually touches.

## Test command

```
node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs test/e2e/runner-loop.test.mjs
```

(the exact new/changed test files this item adds or modifies — `npm test`'s
whole-suite run is also green, see below, but this is the same command run
before and after the implementation.)

## Before (red) — implementation reverted via a scoped `git stash`, test files left in place

`src/runner/dispatch.mjs`, `src/runner/loop.mjs`, and
`src/state/tool-registry.mjs` were stashed (`git stash push -- <those three
files>`), leaving the new/modified test files in the working tree pointed at
the pre-implementation code. Real command output:

`test/runner/dispatch.test.mjs` failed to even load — the test file imports
`CAPACITY_KINDS` from `dispatch.mjs`, which did not exist yet:

```
file:///.../test/runner/dispatch.test.mjs:19
  CAPACITY_KINDS,
  ^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not
provide an export named 'CAPACITY_KINDS'
✖ test/runner/dispatch.test.mjs (65.585749ms)
```

`test/runner/loop.test.mjs` — the two tests this item's diff touches both
failed, real assertion output:

```
✖ runOnce full circle: todo -> doing -> worker commit -> goal-check pass -> awaiting-approval, branch kept, worktree gone, runner is the only .fgos writer (141.080613ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual:   ['work.add:add', 'work.move:doing', 'work.outcome:predicted', 'work.move:awaiting-approval', 'work.outcome:actual']
    expected: ['work.add:add', 'work.move:doing', 'work.outcome:predicted', 'capacity.dispatch:add', 'work.move:awaiting-approval', 'work.outcome:actual']

✖ runOnce logs the "<capacityId> — <provider> — <model>" announce line and appends a matching capacity.dispatch audit event (115.976569ms)
  AssertionError [ERR_ASSERTION]: expected an announce line in: ["fgos-runner: claimed \"item-announce\" (todo -> doing)","fgos-runner: worker for \"item-announce\" exited 0 (tier standard -> sonnet)","fgos-runner: \"item-announce\" proposed on branch fgw/item-announce (1 commit(s))","fgos-runner: verify tail:\n"]
```

`test/e2e/runner-loop.test.mjs` — both pinned event-sequence assertions this
item's diff touches failed, real assertion output:

```
✖ e2e full journey: item1 (no deps) -> awaiting-approval with a worker commit on fgw/, item2 (dep on item1) stays closed while item1 is only proposed, second --once dispatches nothing (439.585297ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual:   [..., 'work.outcome:item1:predicted', 'work.move:item1:awaiting-approval', ...]
    expected: [..., 'work.outcome:item1:predicted', 'capacity.dispatch:item1:add', 'work.move:item1:awaiting-approval', ...]

✖ e2e verify-red: a worker that commits the wrong thing fails goal-check on every attempt -> retried per the matrix, then parked blocked, never proposed (457.574168ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual:   ['work.add:item-red', 'work.move:doing', 'work.outcome:predicted', 'work.move:blocked', 'work.outcome:actual', 'work.friction:item-red']
    expected: ['work.add:item-red', 'work.move:doing', 'work.outcome:predicted', 'capacity.dispatch:item-red', 'capacity.dispatch:item-red', 'work.move:blocked', 'work.outcome:actual', 'work.friction:item-red']
```

```
ℹ tests 65
ℹ pass 60
ℹ fail 5
```

(`dispatch.test.mjs` failing to load as a whole module means `node --test`
could not enumerate its individual cases in this run — the 60 passes are
`loop.test.mjs`'s and the e2e file's other, unrelated tests that never
touched the missing code.)

## After (green) — implementation restored via `git stash apply` (same stash, dropped only after confirming green)

```
node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs test/e2e/runner-loop.test.mjs
ℹ tests 143
ℹ pass 143
ℹ fail 0
```

Full `npm test` (state + cli + runner + e2e suite) also green: 1996/2001
passed, 5 skipped, 0 fail (unaffected — same 5 pre-existing skips as the
pre-implementation baseline run).

## detect_changes() scope check (AGENTS.md gate)

Run against the committed diff (`base_ref: main`): `risk_level: high`,
13 affected processes — every one traces to a symbol this item's plan
named (`resolveExecutorConfig`/`resolveExecutorCommand`,
`dispatchClaimedItem`, `validateRunnerConfigShape`/`validateExecutorShape`).
No unrelated symbol or process appears in the result — the diff stayed
inside the scope `plan.md` described.
