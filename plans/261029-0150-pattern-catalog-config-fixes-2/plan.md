---
title: "Pattern catalog config fixes, second round"
description: "Fixes for the HARDEN re-check of the first fix round: plans/reports/review-261029-0136-harden-recheck-pattern-catalog-config-fixes.md"
status: pending
---

# Pattern catalog config fixes, second round

Same approved item as the first round (owner «A» on 2026-10-28): the fixes of the HARDEN review of the config mechanism. This round answers the re-check, verdict CHANGES (N1 to N9). Frame: 6 dispatches (2 read-only, 2 writing, 2 spare), rigor standard. Base: main after `a85c7d14f`. The review is `/home/vantt/projects/forgent/plans/reports/review-261029-0136-harden-recheck-pattern-catalog-config-fixes.md` (shared checkout; read it by that absolute path).

## Outcome

One table-driven retired-key function that every caller formats from (doctor included); no shape-sniffing of inputs; `fgos setup` prints a correct global notice for every retired global key without losing the user's values; the checker floor reaches the executing loop from production code, not from a test hook; no test-only seam, no audit label in code.

## Decisions (the conductor's; each has a reversal condition)

- Drop the `mixed` classification entirely (the reviewer's suggestion, N5 and the behaviour-change section). A tuning key under `reviewed` is `config-key-retired` with its replacement on every path, one finding per tuning key, so the first-finding-only complaint goes too. An entry holding catalog fields and tuning is not special. Reversal: if a distinct "cannot combine" message is wanted, it needs the Config door to return values (a CFG item). This reverses the first round's decision that the object-in-hand path keeps both classifications; the evidence is the inconsistency the re-check measured.
- N6: every caller passes the patterns map itself at one typed boundary (`catalog.mjs` already computes it); delete the `'loop' in ... || 'promise' in ...` sniffing in `config.mjs`, `retired-config-keys.mjs` (delete the module if it only wraps) and `catalog-entries.mjs`. Tests: a pattern named `loop` and one named `loops` behave like any other name, in the runner and in doctor.
- N4: `run.mjs` passes `shippedCatalog().loops.reviewed.checkersByRigor` into the hooks of the executing loop once; delete the `params` and `cfg` fallbacks in `reviewed.mjs`; the standard-row fallback applies only to rigors ranked below `standard` (`RIGOR_RANK[rigor] < RIGOR_RANK.standard`); a missing `high` or `critical` row is a configuration error again; drop the test wrappers and the fake `low` row in the test fixture; add a test pinning that a shipped `high` row beats a configured `standard` row; the changelog line is corrected to say what is true.
- N1 and N2: `inspectGlobalRunnerConfig` finds retired global keys through `checkConfig` (per-source child paths, the way the loader already does), then the one function formats the edits; the printed patch carries `set` items with the user's values when the Config door reader returns them, otherwise it is printed as a template with the sentence that the values must be copied first; a test per retired key (`reviewed.maxRounds`, `reviewed.checkersByRigor`, the gated name, `defaultRule`).
- N8: drop `params.runnerConfig` and the extra return field of `prepareWorkflowRun`; keep the last block of the single-read test.
- N7 and N9: state the invariant instead of the audit label; move the orphaned JSDoc back to its function.

## Out of scope

M3, L3 to L6, Q1, the Low residuals about the project-file location label and one backup per refused `fgos setup` run, any change to `packages/config`, any docs/ change.

## Slices (writing, sequential)

1. **Retired-key family**: N1, N2, N3, N5, N6, N7 (both files), N9. Files: `src/runner/execution/patterns/retired-keys.mjs`, `src/runner/execution/patterns/catalog-entries.mjs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/retired-config-keys.mjs` (delete if it only wraps), `src/setup/runner-config-conversion.mjs`, `src/setup/registrations.mjs`, `bin/fgos.mjs` (global guidance formatter only), their tests.
2. **Floor and seams**: N4, N8. Files: `src/runner/execution/run.mjs`, `src/runner/execution/loops/index.mjs`, `src/runner/execution/loops/reviewed.mjs`, `src/runner/execution/seat-resolver.mjs`, `src/workflow/case-start.mjs`, their tests, `CHANGELOG.md`.

## Acceptance

`npm test` green apart from failures that reproduce on a clean origin/main; `cargo test --workspace` unchanged; census clean; one test per behaviour named above; every deleted test has a named owner of its behaviour.

## Rollback

Revert the two slice commits.

## Amendments adopted after the validate-plan pass (binding; they replace the matching text above)

Source: `validation-report.md` in this directory (read the section of your slice whole). Added by the lock pass: the tests that pin the removed mixed behaviour are `dispatch-config-patterns.test.mjs:330-367` and `catalog.test.mjs:262-290`; convert them to per-key retirement findings (the comment at about `dispatch-config-patterns.test.mjs:469` contradicts its assertion; fix it); `workflow-runner.test.mjs:1697-1705` injects the config and asserts identity (delete, keep :1707-1712).

**Slice 1.**
- Add to its files: `src/runner/execution/patterns/catalog.mjs`, `docs/architecture-manifest.json` (row of the deleted wrapper, about :368), `test/architecture.test.mjs` (its literal permission, about :1567), `test/runner/execution/patterns/catalog.test.mjs`, `CHANGELOG.md`. `checkCatalog` accepts explicit shipped and effective patterns maps (no envelope-or-map overload); migrate both production call sites (`catalog.mjs:80-81`, `registrations.mjs:602`) and every test caller together; delete the wrapper module, its manifest row and its literal permission in the same slice.
- One table-driven matcher (exact key or key plus a dot descendant), normalizing object inputs only at explicit patterns-map boundaries and using own properties. Adapt every result consumer to `{key, replacement, instruction}` and derive the error code and source label at the boundary; remove the named-file prepass in `loadRunnerConfig` and keep the check in `validateRunnerPatternsShape` (it has direct callers). Aggregate and deduplicate all retired findings before throwing one `RunnerConfigError` with code `config-key-retired`, each with its source location and key; the same aggregation for Config-door findings, so a user is not told one key per run. Tuning under a non-reviewed pattern stays unknown/schema-invalid, not retired. Keep own-property safety and source-layer attribution.
- N1: `inspectGlobalRunnerConfig` receives an existing absolute project root (from `bin/fgos.mjs` about :4023, where `repoRoot` exists; widen the permitted bin change to that call site and the formatter) and calls `checkConfig({ projectRoot, globalDir })`, filtering findings by the global source label (`checkConfig` refuses `globalDir` without `projectRoot`). On a successful machine snapshot also request `origins: ['runner.patterns']` and match global-origin paths, so a documented gated entry that raises no finding is still detected; do not return early because the snapshot succeeded. State the guarantee honestly: refused tuning keys, `defaultRule` and a gated entry are covered; the one case the Config door cannot inventory (a valid gated entry next to another key that makes the snapshot refuse) is reported after the user fixes the refusal and runs setup again; say so in the notice and do not claim complete coverage. Tests: a global file for each of `reviewed.maxRounds`, `reviewed.checkersByRigor`, the gated name (fully documented fixture) and `defaultRule`; explicit `projectRoot` and `globalDir` wiring.
- N2: for a refused snapshot the config door returns no values, so print an explicitly incomplete migration template with the sentence "Copy the existing values to their replacement keys before removing the old keys.", never an unset-only patch presented as ready; `defaultRule` alone needs only an unset; `maxRounds` and `checkersByRigor` move individually and only those child paths are unset, so reviewed catalog overrides survive; a gated entry is renamed whole; where the replacement already exists, require reconciliation first. The warning appears in both the JSON notice and the human formatter in `bin/fgos.mjs` (the CLI rebuilds the notice at about :4751-4765 and ignores `notice.message`). Values are used only where the door actually returns them for a successful snapshot.
- `formatLegacyJsonAdvice` keeps its parsed-document call shape or all its uses (converter :121, doctor :521,548,574,577,583) migrate together. `CHANGELOG.md` gets the user-visible diagnostic and migration change in this slice.

**Slice 2.**
- The shipped checker table is read at the use-case boundary: `run.mjs` (it already imports `shippedCatalog`) passes `shippedCatalog().loops.reviewed.checkersByRigor` in the hooks of the existing `runLoop` call (about :1572) once; `loops/index.mjs` already forwards hooks, so no change there; domain modules consume only that data (never import the infra module). Import `RIGOR_RANK` from `src/runner/rigor.mjs`. Order: configured[rigor], shipped[rigor], then (only for a rigor ranked below standard) configured.standard, shipped.standard; a missing `high` or `critical` row in both is a configuration error.
- Direct loop and resolver tests supply an explicit valid configured table or the shipped-floor hook (valid production-contract input once production wires it); delete the implicit wrappers and the invented module-wide `low` row at `seat-resolver.test.mjs` about :14, keep the explicit synthetic row-precedence cases at about :186-221; rename and narrow the test at about :223 and extend its missing-row proof to `high` and `critical` with a `standard` row present; pin that a shipped `high` row beats a configured `standard` row. Add ONE wiring proof through `runUnit` in `test/runner/execution/run-case-admission.test.mjs`: an injected config lacking checker rows still launches the critical seats with no test-supplied floor hook. Keep the history wrapper (its fifth seats argument is legitimate). Correct the CHANGELOG line that overclaims.
- N8: make `resolveStart` private again; remove `params.runnerConfig` and only `prepareWorkflowRun`'s outward `runnerConfig` field (the internal field its two callers use stays); remove it from the test import and delete the injection and identity blocks at `workflow-runner.test.mjs` :1697-1705.
