# Iron Law evidence: tsk-3ti-7

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real committed diff:

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": [
    "src/runner/dispatch/cli.mjs"
  ]
}
```

## Verify command

```bash
npm test
```

## Failing-before / passing-after transcript (reproduced, not asserted)

The pre-fix version of `src/runner/dispatch/cli.mjs` (commit `753ef399^`) was
temporarily restored and the new regression test (added in the same commit)
re-run against it:

```
$ git show 753ef399^:src/runner/dispatch/cli.mjs > src/runner/dispatch/cli.mjs
$ node --test test/runner/dispatch.test.mjs
✖ resolveAgentTypeForTaskSpec refuses (returns null) across all 4 unvalidated/mismatched fail-close sites
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'agent-alpha'
  - null
```

(The `'agent-alpha'` fall-open value is exactly the fail-open bug this item
fixes: `currentAgentType || (agentDefs[0]?.name ?? null)` returning an
unvalidated agent name instead of refusing.)

File restored to its committed (fixed) state immediately after (`git status`
clean, byte-identical), then the same test re-run:

```
$ node --test test/runner/dispatch.test.mjs
✔ resolveAgentTypeForTaskSpec refuses (returns null) across all 4 unvalidated/mismatched fail-close sites (0.078432ms)
```

Full suite: `npm test` — 3727/3727 passing on the merged branch.
