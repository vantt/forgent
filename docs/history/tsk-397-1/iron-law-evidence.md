# Iron Law evidence: tsk-397-1

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real committed diff (`changedFiles`, `src/runner/merge.mjs`) after commit `64955ee8`:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/state/workflow-stage-graphs.mjs"
  ]
}
```

## Verify command

```bash
npm test -- roleGraph handoff && grep -rL "human-advisor" src/ | wc -l
```

## Failing-before / passing-after transcript

**Before** (prior to renaming `human-advisor` -> `advisor` in `src/state/workflow-stage-graphs.mjs`):

```
$ grep -rL "human-advisor" src/ | wc -l
107
```
(107 files out of 108 total in `src/`, because `src/state/workflow-stage-graphs.mjs` contained 5 occurrences of `human-advisor`).

**After** (after updating `src/state/workflow-stage-graphs.mjs`, task-specs, tests, and skills):

```
$ node --test test/cli/fgos-handoff.test.mjs test/state/handoff.test.mjs test/skills/fgos-mirror.test.mjs
✔ regression: a handoff succeeds on an item with no explicit stage field (D8 lazy-default)
✔ async call: review changes holder, appends a full handoff event
✔ sync call: consult does NOT change holder, appends a call-summary event
...
ℹ tests 45
ℹ pass 45
ℹ fail 0

$ grep -rL "human-advisor" src/ | wc -l
108
```

All 108 files in `src/` now have zero occurrences of `human-advisor`, and all handoff & roleGraph unit/CLI/mirror tests pass cleanly.
