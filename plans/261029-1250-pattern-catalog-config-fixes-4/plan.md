---
title: "Pattern catalog config fixes, fourth round"
description: "Fixes for the HARDEN review of the third round: plans/reports/review-261029-1230-harden-review-config-fixes-round-three.md, plus the round-two Lows F1 to F5 that review reports as still open"
status: pending
---

# Pattern catalog config fixes, fourth round

Same approved item as rounds one to three (owner «làm M3 và L3 đến L6 luôn», 2026-10-29): this round answers the HARDEN review of round three, verdict CHANGES (N1 to N9, the string sniff, the L3 and M3 leftovers) and the round-two Lows F1 to F5 it lists as untouched. The review is `/home/vantt/projects/forgent/plans/reports/review-261029-1230-harden-review-config-fixes-round-three.md`; the round-two Lows are in `review-261029-1022-harden-recheck-config-fixes-round-two.md` (F1 to F5). Read both by those absolute paths (they may not be in the worktree). Frame: 9 dispatches (2 read-only, 3 writing slices, 1 spare writing, 3 spare), rigor standard. Base: origin/main `13d15f306`.

## Outcome

One door for declared-seat validation (no inline copy); each validator error states its text once and names the file and line; one error formatter shared by the loader and doctor; provenance carried through an explicit non-enumerable channel; every list that copies a loop's parameter table is derived from it; `catalogLayersOf` and `resolveCollaboration` take one input shape; a test proves the run-path wiring of the single read; the doctor row gets retired keys as data, not by sniffing text; the round-two Lows are gone.

## Decisions (the conductor's; each has a reversal condition)

- N1 (with M3 a): delete the inline copy of `checkDeclaredSeats` in `validateRunnerPatternsShape` (`config.mjs` about :1579-1652). `checkDeclaredSeats` throws its `SeatResolutionError` carrying the index and the field (an `at` such as `[1].role`) and its code; `config.mjs` catches it once and maps it to `path: <prefix>.<name>.defaults.seats<at>` with the resolver's code kept. A bad seat id then names only the origin file and line. Reversal: none needed; the copy is a duplicate of a door.
- N2: one local helper `fail(relPath, detail)` builds `runner config (<label>.<relPath>) <detail>` and sets `path = <prefix>.<relPath>`; `subpath` is derived, never stored; each throw is one line and its text appears once. Keep every message wording the tests pin.
- N7: one exported `attributeRunnerConfigError(err, origins, projectDir)` in `config.mjs` used by the loader and by doctor (`registrations.mjs`).
- N8: carry origins as a non-enumerable property set with `Object.defineProperty` through one helper in `config.mjs` (`withRunnerOrigins` / `runnerOriginsOf`); `withDefaultExecutor` carries it explicitly instead of relying on spread. Reversal: if a consumer needs the origins through a clone, return `{ config, origins }` from a second loader function instead of a hidden property.
- L3 leftovers: `LOOP_TUNING_KEYS` is used by whoever needs it or is made private (no unused export); `ALLOWED_DEFAULT_KEYS` is derived from the loops' parameter tables; the literals `'runner.patterns.seatBinding.schema'` and `'research-fan-out-gated'` become one exported constant each in `retired-keys.mjs` (`RETIRED_GATED_NAME` already exists for the second) used at every site.
- N9 (Q3): doctor attributes loop-shape errors to file and line; for pattern-catalog errors it names the source layer. The CHANGELOG sentence is narrowed to say exactly that; `checkCatalog` is not widened. Reversal: the owner may ask for file and line in doctor's pattern check; that widens `checkCatalog`'s API with origins and lines.
- N3: `catalogLayersOf(origins, patterns)` only (an array and a patterns map); delete the other shapes and the overload assertion in the snapshot test. `resolveCollaboration` takes `origins` only; `layers` is derived inside from them; `run.mjs` passes only `origins`; `checkCatalog` derives its layer source from origins.
- N4: add one wiring proof through `runUnit`: a global-only custom pattern pins `layer: 'global'` (it fails without the origins wiring); drop the three always-true assertions in the end-to-end solo test and the `catalogLayersOf` lines from the snapshot test; the provenance-not-persisted proof asserts on a real property (a snapshot of a loaded config has no enumerable origins key and `JSON.stringify` of the record has no origin file path).
- N5, N6: retire the project-only JS-validation test duplicated by the cross-file test; move the doctor wiring test to `test/setup/registrations.test.mjs`; move the `resolveLayer` tests to `test/runner/execution/patterns/catalog.test.mjs`; retire the second legacy-JSON-without-retired-keys doctor test (`registrations.test.mjs` about :844); the seat-path test follows N1 (it pins the deleted copy: rewrite it against the resolver path mapping).
- String sniff: `retiredJsonAdvice(targetPath, parsed)` returns the retired-key findings as data (`{key, replacement, instruction}[]`) or null/empty; `formatLegacyJsonAdvice` formats from it; the doctor row uses the data and never searches message text; a read or parse failure of the JSON file surfaces as a named doctor problem (the file and the failure), not as the generic text and not as a silent pass. Reversal: none.
- F1 to F5 (the review's wording): F1 the retired-key table is the single source (derive the object branch from `RETIRED_CONFIG_KEYS`, delete the dead array and full-path branches, `RETIRED_GATED_NAME` imported by its users, one builder for the "was retired" sentence instead of five); F2 the stale coverage note in `runner-config-conversion.mjs` (about :404) is corrected and an empty patch is never printed as a command; F3 delete `shipped?.patterns ?? shipped` in `catalog.mjs` and the unused `options.shippedCheckersByRigor`; F4 `inspectGlobalRunnerConfig` takes the object signature only and its two tests supply an explicit project root and global dir (no read of the repository's real config); F5 delete the duplicate pattern-named-`patterns` test and dedupe retired findings by key, not by whole message.

## Out of scope

Q1 (migrate on a hand-edited JSON file), the project-file location label, one backup per refused setup run, any change to `packages/config`, any docs/ change, widening `checkCatalog` for doctor.

## Slices (writing, sequential)

1. **Validators and attribution**: N1, N2, N7, N8, M3 (a), the L3 leftovers, N9. Files: `src/runner/dispatch/config.mjs`, `src/runner/execution/seat-resolver.mjs` (error carries the at path), `src/runner/execution/patterns/retired-keys.mjs` (constants only), `src/runner/execution/patterns/catalog-entries.mjs`, `src/setup/registrations.mjs` (the shared formatter and the literal constants), `CHANGELOG.md`, their tests (`test/runner/dispatch-config-patterns.test.mjs`, `test/runner/execution/seat-resolver.test.mjs`).
2. **Layers and proofs**: N3, N4, N5, N6. Files: `src/runner/dispatch/shipped-catalog.mjs`, `src/runner/execution/patterns/catalog.mjs`, `src/runner/execution/patterns/catalog-entries.mjs`, `src/runner/execution/run.mjs`, `src/setup/registrations.mjs`, and the tests named above (`dispatch-config-patterns`, `patterns/catalog`, `run`, `registrations`).
3. **Retired keys as data and the round-two Lows**: the string sniff, F1 to F5. Files: `src/runner/execution/patterns/retired-keys.mjs`, `src/runner/execution/patterns/catalog.mjs`, `src/runner/dispatch/config.mjs`, `src/setup/runner-config-conversion.mjs`, `src/setup/registrations.mjs`, `bin/fgos.mjs` (global notice formatter only), their tests.

## Acceptance

`npm test` green apart from the three mailbox tests that fail on clean origin/main; census clean; `cargo test --workspace` not needed unless Rust changes; one test per behaviour named above, each shown to fail with its change removed (a negative control in the producer's summary for N4 and the sniff); every deleted test has a named owner of its behaviour.

## Rollback

Revert the three slice commits.

## Amendments adopted after the decision lock (binding; they replace the matching text above)

Source: the lock report (`unit-run-1793252792869-004fc648`, producer/1).

- F4 has three string-form callers, not two: `test/setup/runner-config-conversion.test.mjs:233,390,608`; migrate all three to an explicit isolated project root and global dir.
- F5 dedupes retired findings per key and file (descendant and position duplicates collapse; a second source file keeps its own diagnostic). Not key-only.
- N1: the resolver is the door. The inline copy refused an empty or non-string tier without a tier list; the resolver validates tier only when a tier list is supplied. The resolver's behaviour stays and the copy's extra refusal goes; the schema already refuses non-string tiers. Keep the resolver's pinned wording (`seat-resolver.test.mjs:80-86`: declared twice, role must be one of, unknown key, tier validation, persona and tier normalization) and the indexed-role assertions at `dispatch-config-patterns.test.mjs:907-935` (`path`, `paths`, `subpath` derived).
- N2: validator labels already contain `runner.patterns` or `runner.loops`; define one relative-path convention so the helper never repeats a segment; keep the pinned texts (`contains unknown key "extraKey"`, `"minCheckers" must be an array of strings`, the retired-key texts at `dispatch-config-patterns.test.mjs:317-449`).
- N3: `resolveCollaboration` takes `origins` only (the run path passes only origins; `layers` derived inside); `checkCatalog` keeps its `layers` input (map or origins array) because its domain tests drive synthetic inputs (`catalog.test.mjs` about :150-200, :864, :888, :906); production callers that pass neither keep their fallback.
- F2: an empty patch is not printed as a command in either render path: the notice (`command`) and the CLI fallback that re-serializes `notice.patch` (`bin/fgos.mjs` about :4753-4758); the conversion tests at :440-456 keep their non-empty behaviour.
- Callers to migrate with the changes: `checkDeclaredSeats` (config, unit admission, `workflow/checked`, catalog parameter validation, `catalog-entries`, the resolver's `declaredSeatsOf`, the resolver tests); `catalogLayersOf` (`run.mjs:777`, `registrations.mjs:546`, `dispatch-config-patterns` tests, `run.test.mjs:165,168`); `resolveCollaboration` production callers (run, `workflow/runner`, `workflow/case-start`, dry-bind, seat-binding-checks): only the run caller passes origins.

## Amendments adopted after the validate-plan pass (binding; they replace the matching text above)

Source: the validator's agent report (`unit-run-1793254316217-2a34e43f`, producer/2). Read the review files by the worktree-relative paths `plans/reports/review-261029-1230-harden-review-config-fixes-round-three.md` and `plans/reports/review-261029-1022-harden-recheck-config-fixes-round-two.md`. Use symbols and test titles, not the old line numbers, when applying changes.

**Slice 1.**
- `SeatResolutionError` gets additive metadata: a relative `at` and an unlabelled `detail`; its constructor arguments, messages and codes stay for every other caller (unit admission, `workflow/checked`, catalog parameter validation, `catalog-entries`, `declaredSeatsOf`). Config maps `at` to the canonical path and uses `detail` without re-embedding the project label. The indexed-seat test rewrite lands in this slice with the deletion of the inline copy.
- `fail(relPath, detail)` must keep multi-path errors: the non-cumulative checker list and the inverted bounds carry two paths on purpose; the helper takes one path or a list; `subpath` is derived from the canonical path or the common parent, including container errors. The cross-file test stays effective.
- N8: setting the origins property non-enumerable and copying it explicitly in `withDefaultExecutor` (both the early return and the executor-overlay branch) land together, before anything else in the slice, because spread drops a non-enumerable symbol (`dispatch/cli.mjs`, `assignment-runner.mjs`, `test/helpers/work-seat-config.mjs` depend on it). The metadata proof asserts the property descriptor is non-enumerable, that spread and `Object.assign` do not carry it, and that `withDefaultExecutor` preserves it with and without an executor.
- Constants boundary: slice 1 migrates the validator, catalog and doctor sites of the marker path and the gated name; slice 3 migrates the conversion sites; the historical decoder vocabulary in `legacy-seat-read.mjs` is kept on purpose.
- Slice 1 runs `test/runner/dispatch-config-patterns.test.mjs`, `test/runner/execution/seat-resolver.test.mjs`, `test/setup/registrations.test.mjs` (regression) and the unit, `workflow/checked` and convention seat-id tests that call `checkDeclaredSeats`.

**Slice 2.**
- `resolveCollaboration` accepts `origins` only for provenance; it passes them to `checkCatalog` and uses the domain `resolveLayer(origins, selectedName)` for the pin; the equality-with-shipped then project fallback stays when origins are absent. The domain never imports or calls `catalogLayersOf`. `checkCatalog` keeps its synthetic `layers` input (a scalar string, a map or an origins array). `run.mjs` passes only origins and drops the unused `catalogLayersOf` import; doctor passes origins directly to `checkCatalog`.
- The new run proof is named "run uses the loaded origins" (a global-only custom pattern pins `layer: 'global'`, fails with the origins wiring removed); it does not claim to measure read count.

**Slice 3.**
- Add `src/runner/execution/patterns/catalog-entries.mjs` to the slice: its retired-key sentence uses the shared leaf formatter beside the two config sites, the JSON advice and doctor; the formatter owns only the retired-key sentence, each caller keeps its location wrapper. The hard-coded retired-key skip in `catalog-entries.mjs` is derived from the detector result already in hand (no key table copy).
- `retiredJsonAdvice` returns findings (empty when none) and throws inspection failures; doctor catches each failure per file, reports the file and the failure as `passed: false`, and continues with the others; already parsed data is reused when passed in; the converter keeps its string `formatLegacyJsonAdvice`.
- F2: remove `coverageNote` and both render uses; gate `command` and patch body on a nonempty patch in `formatGlobalRetiredNotice` and in the CLI fallback of `bin/fgos.mjs`. F3: remove both shipped-map guesses in `resolveCollaboration` (initial normalization and the pin fallback) and the unused `options.shippedCheckersByRigor`. F1: the table walk handles own properties including present null leaves and keeps only dotted-string and explicit patterns-map inputs. F5: dedupe by canonical retired key plus source-file identity.
- Proofs: the doctor row proof covers structured findings, a clean file whose directory contains ` was retired; `, and a malformed or unreadable file named in the failure, with a negative control restoring the text sniff.

**Acceptance (replaces the Rust exemption).** Focused owning tests and `test/architecture.test.mjs` per slice; at final integration `npm test` and `cargo test --workspace` (repository L5); name the baseline failures from a clean origin/main run in the same environment; census command and result; a negative control for the run wiring and for the structured doctor advice; for every retired test the surviving proof or the removed behaviour.
