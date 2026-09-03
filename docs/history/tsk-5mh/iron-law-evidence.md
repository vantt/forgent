# Iron Law evidence — tsk-5mh

`classifyIronLaw` result on this item's own branch-committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{"required":true,"matchedFlags":["migration"],"matchedModules":[]}
```

## Why `matchedFlags` names "migration" — and why it is still not a real self-modifying-capability risk

Unlike tsk-43q's false positive (a mere topic-mention in unrelated
description text), tsk-5mh's own description IS genuinely about running a
migration — the keyword match is topically accurate. What still makes
this NOT an Iron Law risk is `matchedModules: []`: `classifyIronLaw`
(`src/evolve/iron-law.mjs:84-93`) gates on two independent axes —
`matchedFlags` (description text) is a coarse *topic* signal, while
`matchedModules` (`filesChanged` against `MODULE_RULES`) is the actual
self-modifying-capability signal the gate exists to protect. This item's
real branch diff touches exactly:

- `docs/history/compound-learn-artifact-registry/RESEARCH.md` (discovery log)
- `docs/history/compound-learn-artifact-registry/plan.md` (this item's own plan)
- `scripts/knowledge-migration.mjs` (the `fgosRoot`/`--dir` decoupling fix)
- `docs/history/tsk-5mh/iron-law-evidence.md` (this file)

None of these match any `MODULE_RULES` entry (`src/runner/**`,
`src/report/entropy.mjs`, `src/evolve/**`, `bin/fgos.mjs`,
`src/state/store.mjs`, `src/state/status-fsm.mjs`,
`src/intake/risk-keywords.mjs`, `src/intake/classify.mjs`,
`src/state/workflow-stage-graphs.mjs`). `scripts/knowledge-migration.mjs`
is a standalone operator script, not a `src/evolve/`, `src/runner/`, or
engine-gate file — it cannot self-modify the classification/workflow
machinery Iron Law protects. The item's real, high-blast-radius
deliverable (332 real docs moved) already landed as a direct,
per-target-commit operator action on `main` itself (per this branch's own
plan.md "Amendment" section) — not through this branch's diff at all, so
it carries no Iron Law weight here regardless.

## Real evidence in place of failing-test-first proof

```bash
node --test test/scripts/knowledge-migration.test.mjs
# -> 22/22 pass -- proves the fgosRoot decoupling fix (this branch's only
#    real code change) correctly, against a synthetic fixture store,
#    independent of any live registry.
```

The real corpus migration itself (332/332 docs, `docs/knowledge/`
layout, `conservationErrors: []`) was independently verified live,
multiple times, across this item's own execution and tsk-43q's own
(dependent) validation — see `docs/history/compound-learn-artifact-
registry/plan.md`'s Amendment section and `docs/history/docs-index-
registry-driven-enumeration/plan.md` for the cross-referenced evidence.
