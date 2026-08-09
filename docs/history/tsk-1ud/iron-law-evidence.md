# Iron Law evidence — tsk-1ud

`classifyIronLaw` (`src/evolve/iron-law.mjs`) against the real committed
diff (`trunk...fgw/tsk-1ud`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/state/store.mjs"]
}
```

## Test command

```bash
node --test --test-name-pattern="addDecision (defaults|keeps)" test/state/store.test.mjs
```

## Failing-before

Ran against the pre-implementation `src/state/store.mjs` (the commit
immediately before this item's own, `git show HEAD~1:src/state/store.mjs`),
with the new tests already added:

```text
✖ addDecision defaults kind to "design" when the caller omits it (3.171719ms)
✔ addDecision keeps an explicit kind (e.g. "engine") unchanged (1.169953ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1

✖ failing tests:

test at test/state/store.test.mjs:99:1
✖ addDecision defaults kind to "design" when the caller omits it (3.171719ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - 'design'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1ud-CAiaCR/test/state/store.test.mjs:105:10)
```

The second test (`keeps an explicit kind unchanged`) already passed on the
old code — expected, since the old `{ ...payload, source: ... }` spread
already passed an explicitly-supplied `kind` through unchanged; only the
*default* behavior was missing.

## Passing-after

Restored the real implementation (`eventPayload = { ...payload, source:
payload.source ?? 'session', kind: payload.kind ?? 'design' }`) and re-ran
the same command:

```text
✔ addDecision defaults kind to "design" when the caller omits it (3.280987ms)
✔ addDecision keeps an explicit kind (e.g. "engine") unchanged (0.56393ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```
