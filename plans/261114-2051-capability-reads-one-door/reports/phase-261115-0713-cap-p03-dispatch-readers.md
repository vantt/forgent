# Phase 03 report: dispatch readers

Branch `capability-reads-p03`, based on 74d5f296f. No Rust, no CHANGELOG line.

## Changes

- `src/runner/dispatch/resolve.mjs` `resolveCapabilityDetailsFromHints`: alias, confinement and registered filters now ask
  `registeredCapabilityOf`, `capabilityConfinementOf`, `hasCapabilityEntry`. The reverse `prefer` match keeps its own
  local read of the section (left for the purpose-executor phase, as planned). `resolveExecutorAndOverrides` untouched.
- `src/runner/dispatch/plan.mjs`: `isKnownCapabilityName` deleted; `capability.unknown` is `registeredCapabilityOf(cfg, purpose) === undefined`.
- `src/runner/dispatch/confinement/request.mjs`: capability, stage-skill and fallback confinement through `capabilityConfinementOf`.
- `src/runner/dispatch/config.mjs` load validator asks the port only: taste keys from `bindingTasteOf`, confinement from
  `capabilityConfinementOf`, names from `capabilityNamesOf`, `tools`/`for` membership from `registeredCapabilityOf`.
  Old `preferSitesOf` and the name set are gone; the prefer sites are rebuilt from `bindingTasteOf` in the same order
  with the same site names (`capabilityPreferSites`, a generator). `normalizePreferCandidates` stays.
- `src/runner/work-dispatch.mjs`: stale bare-verb comment rewritten (comment only).
- `docs/architecture-manifest.json`: debt entries removed for `config.mjs`, `confinement/request.mjs`, `plan.mjs`.
- `packages/git/contracts/mutation-census.v1.json`: regenerated with `git-one-door-scan.mjs --write-census` (the pre-commit
  hook refuses the commit without it; line-number shifts only, 0 undeclared sites).

## Debt entries kept (final `allowed`/`debt` for the row)

- `resolve.mjs`: the two `prefer` readers (reverse match, `resolveExecutorAndOverrides`) remain, removed by phase 06.
- `work-dispatch.mjs`: no section read left; the entry stays because an error message string
  (`runner.capabilities["..."].prefer`, line 196) matches the row (strings are matched). Phase 06 touches that file.
- Everything else outside this phase unchanged.

## Gates

- Phase gate list (27 files incl. `test/architecture.test.mjs`): 905 pass, 0 fail.
- Other tests importing the changed files (12 more) plus `test/scripts/doc-health.test.mjs`: 159 pass, 0 fail.
- `check-decision-citation-drift`: no new findings. `git-one-door-scan`: 0 undeclared. Bare `node scripts/doc-health.mjs`
  needs a host binary (unset in the worktree); its test passes.
- Equivalence (`compare-capability-reads.mjs`, base 781537524 vs head after the phase 04 merge, run `phase-03`): 0 failures,
  0 notes. The allowlist now claims, on input `m-entries` only, the non-object-entry delta for `validateShape`,
  `dispatchPlan` and `lint` (head adds `capability.unknown`/unregistered findings for null and string entries; base threw
  on a null entry in the validator, which the config door never lets through), and the plan-lint nested-shape delta on
  `m-nested` only (plan-lint reads the flat section). Digests: `reports/equivalence/phase-03.summary.json`.

## Lessons

- A row's debt entry can outlive the last reader when a string in the file matches the pattern.
- The harness allowlist is per question; a delta that reaches a new question (here `dispatchPlan`) fails until the list names it.

## Authority

None changed. The port stays the one reader; `config.mjs` imports it (leaf, no import-graph change).
