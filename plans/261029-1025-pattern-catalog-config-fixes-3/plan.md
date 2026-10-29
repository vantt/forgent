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

## Amendments adopted after the decision lock (binding; they replace the matching text above)

- L4: field-level origin attribution stays (`checkCatalog` resolves a layer per field: `catalog-entries.mjs` about :420-635; the proof at `test/runner/dispatch-config-patterns.test.mjs:597-640` must stay green). What changes: the origins used by both the pin and `checkCatalog` come from the loader's one read (carried on the loaded config), and `catalogLayersOf` loses its own door read. Both callers (`run.mjs:776`, `registrations.mjs:607`) consume origins from the read they already hold; the pin keeps a pattern-name to layer map with project over global over shipped; field-level lookups use the origins directly rather than the mixed-key map. The named-file loader path (`loadRunnerConfig`, :285) keeps its file labelling without facade origins.
- L3: derive only the rigor order (`RIGOR_VALUES`) and the reserved names. The config-only tuning keys of `reviewed` (`checkersByRigor`, `bounds`) are not loop parameters, so `paramTableOf` cannot replace the tuning allowlist: keep them as one explicit contract table in the loops-shape validator and derive the bounded integer parameters from the parameter metadata where it exists. Do not accept or reject any key that is accepted or rejected today. Import direction: config (infra) may import the domain loop tables; domain modules import the domain `retired-keys.mjs`; no domain module imports infra.
- L5: keep the pinned behaviour of `test/setup/registrations.test.mjs:823-840` (retired JSON tuning fails, names config.json, names `runner.loops.reviewed.maxRounds`, says edit then migrate). Only the row's own report of the bare legacy-JSON format finding goes; the findings branch (:520), the refusal mapping (:550) and the read-error branches (:579-590) are all reviewed, not just the first.
- Signature migrations: `validateRunnerLoopsShape` (aggregate :1834, doctor :601, direct tests `dispatch-config-patterns.test.mjs:71,215-308`) and `validateRunnerPatternsShape` (aggregate :1831): migrate every caller and test in the same slice; keep the cumulative-checker and min/max message wording the tests pin.
- L6: preserve `test/report/capability-plan-lint.test.mjs:647` and :661 outcomes when a catalog is available; add one test for an unreadable catalog erroring.

## Amendments adopted after the validate-plan pass (binding; they replace the matching text above)

Source: `validation-report.md` and the validator's agent report (`unit-run-1793244470431-b33b2788`, producer/2).

**Slice 1.**
- M3 origin lookup, replacing the nearest-ancestor sentence: validators carry a canonical failing config path separately from the display text. An unknown-child error carries the child path. A relational error (bounds min/max, a stronger checker rigor) carries the participating leaf paths. The loader and doctor resolve exact leaf origins first, then any available ancestor, then descendant origins under the failing container; when more than one source participates, they report each source. Indexed origin paths are kept. Never infer the project file and never depend on an origin for a nonempty parent object. Use only the origins of that consumer's own read. Keep the cumulative-checker and min/max wording the tests pin. Seat-validation errors wrapped at `config.mjs:1405-1409` keep the structured path; do not parse message labels.
- Carry origins as internal metadata: the flat return of `loadRunnerConfigForDir` does not change. The metadata is available to the fresh-run resolver outside the serializable runner settings, is not written to `unit.json` and is not in the settings digest, and survives `withDefaultExecutor`'s shallow copy. A config without metadata (injected, named-file) means unattributed provenance, never a reason for a second facade read. Proofs: loader metadata in `test/runner/dispatch-config-patterns.test.mjs`; one wiring assertion in `test/runner/execution/run.test.mjs` that a snapshot of a loaded config persists no provenance and that effective settings and pin provenance come from one read.
- Pin versus field: pass the name-to-layer map only to pin selection and the origins separately through `resolveCollaboration` to `checkCatalog`. `resolveLayer` gets a deterministic priority for a parent field with several contributing descendant layers (project over global over shipped, never array order) and emits `shipped` where it today returns `standard`. Migrate every caller of `resolveLayer` and `catalogLayersOf` and the legacy synthetic layer inputs in domain tests in the same slice. The split-field proof (`dispatch-config-patterns.test.mjs:597-657`) keeps its behavioural assertions (pin=project, offending loop=global) through the separate inputs. `test/runner/execution/patterns/catalog.test.mjs` is a slice file.
- Anchors: `loadRunnerConfigForDir` :243 (read :247, JS validation :260, return :261); `loadRunnerConfig` :270 (validation :285); `validateRunnerPatternsShape` :1301 (reserved declaration :1342); `validateRunnerLoopsShape` :1455; aggregate :1831/:1834; doctor `registrations.mjs` :601/:607; run :776. Reserved-name copies to migrate: `config.mjs`, `catalog-entries.mjs` (declaration and :457-458), `shipped-catalog.mjs:50-51`, `capability-plan-lint.mjs:70-71`, `registrations.mjs:681-683,733`. Preserve the marker handling and the gated-name retirement detection. Use the repository's existing convention for a frozen constant set; do not add an abstraction.
- Test files of the slice: `test/runner/dispatch-config-patterns.test.mjs`, `test/runner/execution/patterns/catalog.test.mjs`, `test/setup/registrations.test.mjs`, `test/runner/execution/run.test.mjs`; other loader consumers' tests are regression checks only.

**Slice 2.**
- L5: ignore the `config-format-legacy-json` finding itself in `runner-patterns-config`; a JSON filename alone triggers neither failure nor advice; edit-then-migrate advice only after a retired runner key is identified in that file (the pinned test keeps the token inside that advice); other invalid-config errors stay visible; apply to findings, refusals and read failures. `formatLegacyJsonAdvice` stays the formatter.
- L6: with a shipped catalog available, callers without a config validate against shipped pattern names; an unavailable catalog throws even for callers omitting config; remove the catch and the size guard; no empty-catalog substitute. Proof of the unreadable catalog uses an isolated module or process setup, no production bypass. Test files: `test/setup/registrations.test.mjs`, `test/report/capability-plan-lint.test.mjs`; `CHANGELOG.md` gets the diagnostics line.
- Acceptance: run `cargo test --workspace` at final integration (no Rust edits expected); the mailbox exceptions count only after reproducing on clean origin/main in the same environment.
