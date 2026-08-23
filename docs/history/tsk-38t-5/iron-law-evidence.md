# Iron Law evidence: tsk-38t-5

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's diff
returned `required: true` — `matchedModules:
["src/state/workflow-stage-graphs.mjs"]` (on `MODULE_RULES`'
self-modifying-capable list), `matchedFlags: []`.

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/state/workflow-stage-graphs.mjs"]
}
```

## Failing-test-first proof

Test command: `node --test test/state/workflow-stage-graphs.test.mjs`
(part of `npm test`).

**Before the fix** — reverted `src/state/workflow-stage-graphs.mjs` to its
pre-`tsk-38t-5` state (`git checkout HEAD~1 --`) while keeping the new
test assertions, then ran the file. Real transcript (failing assertion):

```
test at test/state/workflow-stage-graphs.test.mjs:97:1
✖ skillForStage(DOMAINS.coding, "retrospective") resolves fgos-coding-compounding — skillForStage is a generic skillMap[key] lookup, not scoped to `stage` names by implementation, only by its usual callers (0.208037ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + null
  - 'fgos-coding-compounding'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/agent-a19834736f9af57d2/test/state/workflow-stage-graphs.test.mjs:103:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: null,
    expected: 'fgos-coding-compounding',
    operator: 'strictEqual',
    diff: 'simple'
```

(The first new assertion, `DOMAINS.coding.skillMap.retrospective is
'fgos-coding-compounding'`, fails identically for the same reason — the key does
not exist pre-fix; this second assertion's transcript is shown because it
was the one captured in full.)

**After the fix** — restored `workflow-stage-graphs.mjs` (`git checkout
HEAD --`), same test file, real transcript:

```
ℹ tests 35
ℹ suites 0
ℹ pass 35
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full suite after the fix (`npm test`, the item's own recorded `verify`
run in full, prior to this evidence step): **2487 tests, 2482 pass, 0
fail, 0 cancelled, 5 skip** (baseline before this item: 2484/2479/0/5 —
exactly the 3 new tests added, zero regressions).

## Why the proof was captured after implementation, not via a literal red-green session

Same reasoning as `docs/history/tsk-38t-2/iron-law-evidence.md`'s own
"Why the proof was captured after implementation" section: implementation
and tests were written together by an unattended subagent, and the
revert-and-rerun above reconstructs equivalent, honest failing-test-first
proof — the new tests fail for the real reason (the `retrospective` key
and the `skillMap.retrospective`-reading behavior genuinely do not exist
pre-fix) and pass for the real reason once the fix lands.
