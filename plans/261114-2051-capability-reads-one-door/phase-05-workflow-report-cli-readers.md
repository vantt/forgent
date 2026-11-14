---
phase: 05
title: "Workflow proposal, plan-lint report, CLI plan-lint"
status: pending
effort: 1.5h
depends_on: [01]
parallel_with: [02, 03, 04]
---

# Phase 05 — Workflow, report and CLI readers

## Context

Port exists (phase 01). Read `plan.md` census rows 28-31. `verifyCommandOf` (`src/runner/execution/loops/verify.mjs:17`)
keeps its name and signature in phase 02, so this phase may call it while 02 runs.
`bin/fgos.mjs` static imports are pinned by `test/architecture.test.mjs:1743-1839` (`ARM_STATIC_IMPORTS`, a list
that only shrinks): bin must load the port with `await import()` inside the `plan-lint` case (`runVerb` is async,
`bin/fgos.mjs:878`), never a new static import.
Impact analysis (as phase 01) on `proposeCase` (or the function holding `propose.mjs:449`),
`lintPhaseUnits`, `lintPlanCapabilityAnnotations`, `isCapabilityDeclared` (plan-lint's local one).

## Requirements

1. `src/workflow/propose.mjs:449`: `!verifyCommandOf({ capability: 'code:implement' }, runnerConfig)` (import from
   `../runner/execution/loops/verify.mjs`). The proposal now asks the same reader the gate it predicts uses
   (`src/workflow/case-gate.mjs:66`). Intended edge change, recorded in the report: a whitespace-only
   `verify` was "declared" for the proposal but refused by the gate; now both refuse it with `gate-command-missing`.
   No shipped or repo config declares `verify`, so the equivalence run is unaffected.
2. `src/report/capability-plan-lint.mjs`:
   - local `isCapabilityDeclared(cap, catalog)` (135-143): the list/Set branch stays (it checks a caller's name
     list, not the config); the object branch becomes `isCapabilityDeclared(config, cap) || registeredCapabilityOf(config, cap) !== undefined`
     from the port (exact, `<prefix>:*`, alias — same rule). Rename the local function if the name clashes.
   - 478: drop the three-way `catalog` expression; with a config object, ask the port (`catalogOf` precedence
     `capabilities` then `runner.capabilities` equals today's for every caller: bin passes the flat runner
     section, tests pass `{ runner: { capabilities } }`); with no config, skip the check as today. The branch
     that treated a config with neither key as a raw catalog has no caller (bin always passes the merged
     runner section, which carries the standard's `capabilities`); delete it and say so in the report.
   - 631: `options.registeredCapabilities ?? (options.config ? capabilityNamesOf(options.config) : [])`.
3. `bin/fgos.mjs` `plan-lint` (2358-2359, 2399): inside the case,
   `const { capabilityNamesOf, capabilityDescriptionOf } = await import('../src/runner/execution/capability-config.mjs');`
   `registered = capabilityNamesOf(cfg)`; unit `description: capabilityDescriptionOf(cfg, cap)` for a non-null
   `cap` (exact, then `<prefix>:*`, else `null` — today's rule). Delete the `catalog` local.

## Files

- Modify: `src/workflow/propose.mjs`, `src/report/capability-plan-lint.mjs`, `bin/fgos.mjs`
- Create/Delete: none

## Tests

No new behaviour. Owners: `test/workflow/propose.test.mjs` (`gate-command-missing`),
`test/report/capability-plan-lint.test.mjs` (declared/unregistered, prefix, alias), `test/cli/plan-lint.test.mjs`
(CLI output incl. `description`), `test/architecture.test.mjs` (bin static imports). Retired: none.

## Gates

```
node scripts/run-tests.mjs test/workflow/propose.test.mjs test/workflow/propose-validate.test.mjs \
  test/workflow/propose-classify.test.mjs test/workflow/propose-frame.test.mjs \
  test/report/capability-plan-lint.test.mjs test/cli/plan-lint.test.mjs test/cli/verb-exit.test.mjs \
  test/architecture.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
npm run fgos:dev -- plan-lint plans/261114-2051-capability-reads-one-door --json   # same units/descriptions as base
```
Plus `rg -l "workflow/propose.mjs|capability-plan-lint.mjs|bin/fgos.mjs" test`.
Rust: not touched.

## Net size

src: −~10. Tests: 0.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A static import added to bin fails the shell-entry test | M x L | `await import()` inside the case |
| `bin/fgos.mjs` collides with F0 verb moves | M x M | three line-local edits; rebase first; plan.md Collision risk |
| plan-lint description lookup changes | L x M | `test/cli/plan-lint.test.mjs`; CLI JSON compared with base |

## Rollback

Revert the phase commit.

## Success criteria

`rg "\.capabilities\b" src/workflow src/report bin` finds no runner-config read; gates green; plan-lint JSON
identical to base for this plan directory.
