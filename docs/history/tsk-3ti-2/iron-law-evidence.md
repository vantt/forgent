# Iron Law evidence: tsk-3ti-2

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real committed diff (`changedFiles`, `src/runner/merge.mjs`):

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
npm test
```

## Failing-before / passing-after transcript

**Before**:
Spreading `...registryData` after `activeWorkflow` properties in `domainObj` allowed `registryData` top-level keys to silently overwrite workflow-derived fields (`stages`, `stepMap`, `transitions`, `skillMap`, `taskSpecMap`).

**After**:
Flipped the spread order in `src/state/workflow-stage-graphs.mjs` so `registryData` spreads before `activeWorkflow` fields:
```javascript
      const domainObj = {
        ...registryData,
        ...(activeWorkflow ? {
          stages: activeWorkflow.stages,
          stepMap: activeWorkflow.stepMap,
          transitions: activeWorkflow.transitions,
          skillMap: activeWorkflow.skillMap,
          taskSpecMap: activeWorkflow.taskSpecMap,
        } : {}),
        workflows: Object.freeze(workflows),
        defaultWorkflow,
        workflowFor: Object.freeze(workflowFor),
      };
```

Verified with node test suite:
```
$ node --test test/state/workflow-stage-graphs.test.mjs
✔ workflow-derived fields take precedence over registryData top-level keys in domain objects (activeWorkflow overrides registryData) (0.162999ms)
ℹ tests 48
ℹ pass 48
ℹ fail 0
```
