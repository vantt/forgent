---
phase: 04
title: "Setup/doctor readers; delete the old seat-resolver lookups"
status: pending
effort: 2h
depends_on: [01]
parallel_with: [02, 03, 05]
---

# Phase 04 — Setup and doctor readers

## Context

Port exists (phase 01). Read `plan.md` census rows 2, 3, 22-27. Doctor rows are reporters: each message
must stay byte-identical for the same config (checked by the equivalence run in phase 08 and by the row
tests). AGENTS.md install/setup/doctor gate: no new row, no new key, no new fix in this phase.
Impact analysis (as phase 01) on `checkRunnerPatternsConfig`, `evaluateWorkflowCapabilities`,
`checkCapabilityServesValid`, the two confinement row functions, `bindCapabilityPostures`,
`capabilityEntriesOf`, `hasUsablePrefer`.

## Requirements

1. `src/setup/registrations.mjs:695-705` (inside `checkRunnerPatternsConfig`, row `runner-patterns-config`):
   iterate `capabilityNamesOf(runner)`; per name `ownMinCheckersOf(runner, name)`,
   same `Array.isArray` and `includes('red-team')` test, same info text.
2. `registrations.mjs:1915-1941` `evaluateWorkflowCapabilities` (row `workflow-capabilities-configured`):
   `const runner = effectiveSection(cwd, 'runner')`; missing = `!isCapabilityDeclared(runner, capability)`;
   no pool = `!hasPreferPool(runner, capability)`. Drop the `capabilityEntriesOf`/`hasUsablePrefer` import (line 92).
3. `registrations.mjs:1957-1979` `checkCapabilityServesValid` (row `capability-serves-valid`): names from
   `capabilityNamesOf`, value from `capabilityServesOf`.
4. `registrations.mjs:2980-3013` (row `confinement-policies-declared`) and `3508-3528` (row
   `confinement-strict-readiness`), each branch kept exactly:
   - presence: `const section = catalogOf(runner)`; row 25 keeps `!section || typeof section !== 'object'` ->
     "nothing to check" (so `{}` still proceeds to the `confinementPolicies` shape check); row 26 keeps
     `... || capabilityNamesOf(runner).length === 0` -> "no capabilities declared".
   - per name from `capabilityNamesOf(runner)`: `!hasCapabilityEntry(runner, name)` -> row 25 `continue`, row 26
     "is malformed" (today's `!cap || typeof cap !== 'object'`; arrays count as entries in both); confinement from
     `capabilityConfinementOf(runner, name)`.
   - messages byte-identical; compare with `doctor-base.json` from phase 01.
5. `src/setup/seat-binding-checks.mjs:36-47` `bindCapabilityPostures`: names from `capabilityNamesOf(runnerConfig)`;
   skip a name unless `hasOwnPreferPool(runnerConfig, name)` (exact entry, as today's
   `hasUsablePrefer(entry)` on the exact entry); candidates from `[preferOf(runnerConfig, name)].flat()` as today.
   Drop the `hasUsablePrefer` import (line 5). Its section read becomes flat-only (today `?? runnerConfig.runner.capabilities`,
   line 37): its only caller `checkSeatBindingDryBind` passes the flat section from `loadRunnerConfig` (lines 98-113).
6. `src/runner/execution/seat-resolver.mjs`: delete `capabilityEntriesOf` and `hasUsablePrefer` (no importer
   left after 2 and 5; verify with `rg "capabilityEntriesOf|hasUsablePrefer" src bin scripts test`).

7. `src/setup/registrations.mjs:1866-1868`: the comment above the workflow-capabilities check still says bind()
   resolves "exact name, then the bare verb"; the bare-verb fallback was removed in 3133ed474. Rewrite it to
   "exact name, then its `<prefix>:*` entry" (what `isCapabilityDeclared`/`hasPreferPool` do). Comment only.

## Files

- Modify: `src/setup/registrations.mjs`, `src/setup/seat-binding-checks.mjs`, `src/runner/execution/seat-resolver.mjs`
  (deletions only)
- Create/Delete: none

## Tests

No new behaviour. If `confinement-doctor-checks.test.mjs` lacks a case for a `{}` section, a string entry or a
`null` entry in rows 25-26, add it there (the rows' owning file) before moving the code (green at base and after). Owners: `test/setup/checks-doctor-config.test.mjs`, `test/setup/checks.test.mjs`,
`test/setup/confinement-doctor-checks.test.mjs`, `test/setup/yaml-parse-failures.test.mjs`,
`test/setup/registrations.test.mjs`, `test/setup/seat-binding-dry-bind.test.mjs` (posture section),
`test/setup/capability-catalog-doctrine.test.mjs`. Retired: none (no test imports the two deleted
seat-resolver exports; verify with rg).

## Gates

```
node scripts/run-tests.mjs test/setup/checks-doctor-config.test.mjs test/setup/checks.test.mjs \
  test/setup/confinement-doctor-checks.test.mjs test/setup/yaml-parse-failures.test.mjs \
  test/setup/registrations.test.mjs test/setup/seat-binding-dry-bind.test.mjs \
  test/setup/capability-catalog-doctrine.test.mjs test/seat-binding/route-doctor-check.test.mjs \
  test/runner/execution/seat-resolver.test.mjs test/runner/execution/capability-config.test.mjs test/architecture.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
npm run fgos:dev -- doctor --json   # rows named above: messages equal .fgos/runtime/tmp/capability-equivalence/doctor-base.json (phase 01)
```
Plus `rg -l "setup/registrations.mjs|seat-binding-checks.mjs|seat-resolver.mjs" test`.
Rust: not touched.

## Net size

src: −~25 (two seat-resolver exports, inline section/field reads). Tests: 0.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A doctor message changes wording or count | M x M | row tests incl. a `{}` section, a string entry and a `null` entry case if absent today (extend `confinement-doctor-checks.test.mjs`, the rows' owning file); doctor JSON diff against base |
| `registrations.mjs` collides with F0's doctor rows | M x M | edits are line-local inside existing functions; rebase before start; see plan.md Collision risk |
| Exact vs prefix rule mixed up in the posture check | M x H | requirement 5 states exact-entry; `seat-binding-dry-bind.test.mjs` |

## Rollback

Revert the phase merge (plan.md Rollback).

## Success criteria

`rg "\.capabilities\b" src/setup` finds only terminal-control `.capabilities(` calls and destructuring of the
terminal-control report; `rg "capabilityEntriesOf|hasUsablePrefer" src` finds only `src/runner/execution/capability-config.mjs` (its private helpers); gates green.
