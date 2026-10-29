---
title: "Pattern catalog config fixes, third round"
description: "The items the first two rounds left open from the HARDEN review: M3 and L3 to L6 of plans/reports/review-261028-2257-harden-review-pattern-catalog-config.md"
status: pending
---

# Pattern catalog config fixes, third round

Owner decision 2026-10-29: «làm M3 và L3 đến L6 luôn». The review is `/home/vantt/projects/forgent/plans/reports/review-261028-2257-harden-review-pattern-catalog-config.md` (read by that absolute path; sections M3, L3, L4, L5, L6). Frame: 6 dispatches (2 read-only, 2 writing, 2 spare), rigor standard. Base: origin/main `a5358f127`.

## Outcome

A JS-only validation error names the file and line of the field that caused it (project or global), in the loader and in doctor; one source for the reserved names and the loop parameter lists; the pin's layer comes from the same config read as the effective value; doctor does not report the legacy-JSON format twice; the lint never silently skips the unknown-pattern check.

## Decisions (the conductor's; each has a reversal condition)

- M3: the single `readConfig` call of the loader also requests `origins` for `runner.patterns` and `runner.loops`. The shape validators throw with the failing dotted path; the loader looks that path up in `origins` and names `file:line` of the field (or of its nearest ancestor with an origin). Doctor does the same for its loop-shape validation. Reversal: if the door cannot return an origin for a merged-away path, fall back to naming the layers that define the nearest ancestor, never the project file by default.
- L3: one frozen reserved-name set exported from `src/runner/execution/patterns/retired-keys.mjs`, used by `config.mjs`, `catalog-entries.mjs`, `shipped-catalog.mjs`, `capability-plan-lint.mjs`, `registrations.mjs`. `validateRunnerLoopsShape` takes the rigor order from `RIGOR_VALUES`, the bounded parameters and per-loop keys from the loop param tables (`paramTableOf`), passed in so no domain module imports infra; check `docs/architecture-manifest.json` and `test/architecture.test.mjs` for the allowed direction first. Reversal: if no legal direction exists, pass the tables in from the caller.
- L4: delete the second door read in `catalogLayersOf`; the layers are computed from the origins of the loader's one read (carried on the loaded config) so the pin's `layer` and the effective value cannot disagree; the returned map has one key space (pattern name to layer) and the sub-path rule no longer keeps `shipped` over a later `global`.
- L5: the doctor row `runner-patterns-config` stops failing on the legacy-JSON format finding itself (the Config row `config-format-legacy-json` owns it with the migrate command). It keeps the per-key hand-edit advice when retired runner keys are present in a JSON file, because the Config row cannot see them. Reversal: if the retired-key advice is judged duplicate too, drop the JSON branch as the review proposed.
- L6: delete the `try/catch` and the `knownPatterns.size > 0` guard in `capability-plan-lint.mjs`; a catalog that cannot be read is an error, not a silent skip. The no-config caller behaviour stays as it is today (pure lint tests without a config).

## Out of scope

Q1, the two Low residuals of the re-check (project-file location label, one backup per refused setup), any change to `packages/config`, any docs/ change.

## Slices (writing, sequential)

1. **Origins and names**: M3, L3, L4. Files: `src/runner/dispatch/config.mjs`, `src/runner/dispatch/shipped-catalog.mjs`, `src/runner/execution/patterns/{retired-keys,catalog-entries,catalog}.mjs`, `src/runner/execution/run.mjs`, `src/report/capability-plan-lint.mjs` (the reserved-name use only), `src/setup/registrations.mjs` (the reserved-name use and the loop-shape file attribution), `docs/architecture-manifest.json` and `test/architecture.test.mjs` only if the import direction needs it, their tests.
2. **Doctor and lint**: L5, L6. Files: `src/setup/registrations.mjs`, `src/report/capability-plan-lint.mjs`, their tests, `CHANGELOG.md` (one line for the user-visible diagnostics).

## Acceptance

`npm test` green apart from failures that reproduce on a clean origin/main (three mailbox tests in `test/setup/agent-hooks.test.mjs`); `cargo test --workspace` unchanged unless Rust changes; census clean; one test per behaviour named above (a global-file JS-only error names the global file; a project-file one names the project file with line; a reserved name has one source; the pin's layer matches the effective value; doctor legacy-JSON is reported once; the lint with an unreadable catalog errors); every deleted test has a named owner of its behaviour.

## Rollback

Revert the two slice commits.
