# tsk-4v6 — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules:
["bin/fgos.mjs", "src/runner/loop.mjs",
"src/runner/prompt-templates/worker-prompt-discovery.txt"]`, `matchedFlags:
[]`.

## Test command

Item's own verify: `node --test test/runner/loop.test.mjs && npm test`

## Failing-before (real transcript excerpt, new tests run against the
pre-fix `loop.mjs` — the parent commit's version, temporarily swapped
back into place)

```
✖ tsk-4v6: DISCOVERY DISPATCH sweep advances discovery -> exploring on a clear verdict, carrying the worker's proposed verify onto the item
  AssertionError: the worker's own proposed verify rides onto the item
  actual: 'chưa xác định — bổ sung thủ công', expected: 'npm test -- research'

✖ tsk-4v6: DISCOVERY DISPATCH sweep parks the item on an unclear verdict instead of advancing it, matching the interactive driver path
  AssertionError: stage never advances on an unclear verdict
  actual: 'exploring', expected: 'discovery'

✖ tsk-4v6: DISCOVERY DISPATCH sweep never advances the item when a real commit lands but no verdict fence is reported — the exact bug this item fixes
  AssertionError: a commit with no verdict never advances the item (the old bug: any real commit used to advance it)
  actual: 'exploring', expected: 'discovery'

✖ tsk-4v6: parseVerdictBlock is fail-safe on absent/malformed fences and picks the last well-formed block when more than one is emitted
  TypeError: parseVerdictBlock is not a function

ℹ tests 4
ℹ pass 0
ℹ fail 4
```

All 4 new tests fail against the pre-fix sweep — the middle two are the bug
itself demonstrated directly: an item advances `discovery -> exploring`
regardless of the worker's real verdict, on nothing more than "a commit
landed."

## Passing-after (real transcript excerpt, after the fix)

```
✔ tsk-4v6: DISCOVERY DISPATCH sweep advances discovery -> exploring on a clear verdict, carrying the worker's proposed verify onto the item (99.142702ms)
✔ tsk-4v6: DISCOVERY DISPATCH sweep parks the item on an unclear verdict instead of advancing it, matching the interactive driver path (97.211987ms)
✔ tsk-4v6: DISCOVERY DISPATCH sweep never advances the item when a real commit lands but no verdict fence is reported — the exact bug this item fixes (89.654407ms)
✔ tsk-4v6: parseVerdictBlock is fail-safe on absent/malformed fences and picks the last well-formed block when more than one is emitted (1.07973ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

Full `node --test test/runner/loop.test.mjs`: `tests 58 / pass 58 / fail 0`.

Full `npm test` after: `tests 2755 / pass 2750 / fail 0` (5 skipped,
pre-existing, unrelated).

One pre-existing e2e test encoded the old (buggy) behavior as its own
expectation and needed updating to match the fixed contract:
`test/e2e/runner-loop.test.mjs`'s `e2e stage-discovery` test's fake worker
now emits a `fgos-verdict` fence (it previously committed `RESEARCH.md`
with no verdict at all, silently relying on the old "any commit advances"
bug) — plus a new sibling test proving the unclear-verdict park path
end-to-end through the real `bin/fgos-runner.mjs` binary.

## What changed

- `src/runner/prompt-templates/worker-prompt-discovery.txt`: the discovery
  worker now reports its verdict via a `fgos-verdict` fence instead of
  being told "there is nothing further to... report back."
- `src/runner/loop.mjs`: added `parseVerdictBlock` (fail-safe single-block
  sibling of the existing `parseDiscoveredBlocks`); replaced the DISCOVERY
  DISPATCH sweep's direct `moveStage(..., to: 'exploring', ...)` call with
  `resolveDiscovery(dir, item.id, config, 'runner', callerVerdict)` — the
  same engine function `bin/fgos.mjs`'s `discover` verb and the interactive
  driver's own discovery handling call (`discovery.mjs:27` names this item
  directly as owning this reconciliation). Removed the now-unused
  `moveStage` import.
- `test/runner/loop.test.mjs`: 4 new tests (clear verdict advances +
  carries verify, unclear verdict parks, missing verdict never advances,
  `parseVerdictBlock` fail-safe/last-wins).
- `test/e2e/runner-loop.test.mjs`: updated the existing stage-discovery
  e2e fixture to emit a verdict, added a sibling e2e test for the
  unclear-verdict park path through the real binary.
