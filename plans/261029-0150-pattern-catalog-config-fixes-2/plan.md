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
