# Read-only validation of Part A phases 03–05

Reviewed worktree: `/home/vantt/projects/forgent-worktrees/cook-part-a`.
HEAD: `43eedd9dd45e1146248909ae7fcc1d112928de4d` (`Merge origin/main into cook/pattern-catalog-part-a`).

Result: the plan needs updates before phase 03 execution. Branch A is already live. The Branch A-only note at the top of phase 03 does not remove the contradictory executable instructions below it. Findings below identify changes to the plan; no product or plan file was edited.

Evidence method: read the supplied plan, phases and scout report; inspect current facade, runner loaders/validators, loops, doctor callers, bundled data and owning proofs; check named paths and relevant git history. No fetch, lifecycle command, build, test run or workspace write was performed. Test failures described below are static predictions from the current assertions and call graph, not reported test results. Git status was empty before and after inspection. The supplied previous-round feedback names reviewer/red-team findings but provides no finding text; this report does not claim to have independently matched unspecified findings.

## 1. High — remove the Branch B execution path throughout the plan

**Stale instruction:** `phase-03-config-declaration.md:9–38,45,68,77–83,103` still presents Branch B as today's HEAD, permits branch selection, names `sanitizeGlobalLayer`, `loadRunnerConfigFromDir`, `ensureRunnerConfigForDir`, copied defaults and write-on-read, and explicitly instructs building `fillShippedLayer`. `plan.md:47–49,97,106,111,115` and scout facts 2 still describe the old reader or residual `DEFAULT_RUNNER_CONFIG`.

**What the code says now:** `src/runner/dispatch/config.mjs:29,199–216` imports and calls `readConfig`, then validates the merged runner. `src/config/facade.mjs:1–7,49–78` owns snapshot/standard access. The removed loader/default symbols are absent; `src/config/global-config.mjs` is absent. Commit `2d587bb9b` explicitly deletes the copied default runner; `38361f01d` removes the old global-config path. Config reads do not write. This also agrees with the already recorded U1 decision.

**What to change:** make the phase unconditionally Branch A. Delete the Branch B table column, fill helper, legacy loader/default edits, merge-equality proof and associated risks. Replace the gate with a check of the current checkout's facade wiring and a separate check of whether catalog keys are declared. Do not fetch or select an alternative implementation as a phase prerequisite. Refresh scout fact 2, the main CFG section and U1's now-obsolete claim that tests still use `DEFAULT_RUNNER_CONFIG`. Preserve the separate CFG/SEAT coordination requirement.

## 2. High — use the existing bundled-standard door instead of parsing release YAML again

**Stale instruction:** phase 03 Files / 3b requires `shipped-catalog.mjs` to find `core/config-standard/runner.yaml` like `TIER_LADDER_URL`, parse it with `parseYaml`, and cache it. Its CFG point 8 treats a facade standard reader as a future possibility.

**What the code says now:** `src/config/facade.mjs:67–68` exports `readStandardValue(path)`, which returns `{ present, value }` from the bundled standard without reading project/global files. Runner config already uses it at `src/runner/dispatch/config.mjs:175`; `test/runner/dispatch-config-patterns.test.mjs:14–16` already derives its standard fixture through it. The Config spec section 4 says the release bundle owns standard data and Node does not implement the config layer.

**What to change:** retain `shippedCatalog()` as the infra adapter required by phases 05/06, but implement its body through `readStandardValue('runner')` (or the two narrower paths), returning the agreed `{ patterns, loops }`. Remove direct YAML resolution/parsing and the speculative facade fallback. Keep phase 05 pure by passing the returned data into it. Update the standard-data proof to exercise this real adapter.

## 3. High — make retired-key refusal work at both live runner input doors

**Stale instruction:** phase 03's Branch A table only maps `ConfigDoorError.refusals[].path/file` inside `loadRunnerConfigForDir`, while the proposed helper accepts a raw runner object. The old raw-object call sites are the deleted Branch B loaders. This leaves the surviving named-file door without an explicit retirement integration.

**What the code says now:** `loadRunnerConfigForDir` catches a Config refusal at `config.mjs:203–206` and rethrows its code unchanged. Separately, `loadRunnerConfig(configPath)` at `:223–241` parses a standalone runner object and calls `validateRunnerConfigShape` without Config schema validation or standard layering. Existing pattern tests use this second door. Config validates the merged value; `packages/config/rust/src/validate.rs:91–113` derives paths from JSON Schema instance paths, adding a child for `required` but not for `additionalProperties`. A generic additional-properties violation can therefore name the containing object rather than the retired child. Its value is intentionally omitted from errors.

**What to change:** explicitly specify the table's use for standalone runner files and its separate use for native refusal classification. Define and prove schema/refusal shapes that identify each retired key without relying on discarded values or assuming an additional-properties error includes the child name. Include project/global and named-file cases, correct file attribution, old-only versus mixed old/new reviewed entries, and preservation of unrelated Config error codes. Do not revive raw project/global file readers to recover values.

## 4. High — include the live doctor caller in the phase-03 contract migration

**Stale instruction:** phase 03 step 4 says `src/setup/registrations.mjs` imports only checker names and the marker. The main plan's file ownership says phase 03 touches registrations tests only, while phase 03 moves the cumulative checker rule out of `patterns.reviewed`.

**What the code says now:** `src/setup/registrations.mjs:85` actually imports `validateRunnerPatternsShape`. `checkRunnerPatternsConfig` at `:476–484` invokes it on only `effectiveSection(cwd, 'runner').patterns`. The schema does not encode the cumulative relation. The doctor test at `test/setup/registrations.test.mjs:797–848` checks that relation and still writes the old reviewed/defaultRule shape.

**What to change:** put registrations in phase 03's write scope and move the existing doctor call to the same owner validation of both patterns and loops when the rule moves. Update this owning doctor fixture/assertion in 3c. Keep phase 09's later resolver wiring distinct; do not leave the cumulative check absent between phases or duplicate its cases.

## 5. Medium — remove deleted test targets and replace obsolete assertion locations

**Stale instruction:** phase 03 lists `test/setup/tier-ladder-comment.test.mjs`, `EXPECTED_RUNNER_DEFAULT` in registrations tests, and old marker/default source locations. Scout facts cite `patterns/solo.mjs` and `patterns/architecture-guard.test.mjs`.

**What the code says now:** the tier-ladder-comment test no longer exists (history includes `8b8e5f23b`). `EXPECTED_RUNNER_DEFAULT` is absent from current registrations tests. Loops and their tests have already moved in commit `2973f9177`; current paths include `src/runner/execution/loops/solo.mjs` and `test/runner/execution/loops/architecture-guard.test.mjs`. `validateRunnerPatternsShape` is at `config.mjs:1254`, the marker constant at `:247`, the owner-wide validation at `:1485` / call at `:1621`. Reviewed tuning reads are now `loops/reviewed.mjs:136,167`; run's seat calls are `run.mjs:713,736`.

**What to change:** remove deleted test targets and default-constant expectations; use current standard-derived tests and the live doctor test. Update scout paths and phase 03/04 line references. Treat `retired-config-keys.mjs`, `shipped-catalog.mjs`, `catalog.mjs` and `catalog.test.mjs` as intentional new files, not missing-file errors. The other explicit existing file paths in phases 04/05 are present.

## 6. High — phase 03a's declared Node gate cannot pass before its later slices

**Stale instruction:** phase 03 splits data/Rust proofs (3a), loader (3b), fixtures (3c), but requires `test/runner/dispatch-config-patterns.test.mjs` to pass immediately after 3a.

**What the code says now:** that test derives `BASE` and standard patterns from the real standard (`:14–20`), then asserts `patterns.defaultRule`, old reviewed tuning and the old whitelist (`:30–41`). The current validator only permits `defaultRule`, `reviewed`, `seatBinding` and requires marker 1 (`config.mjs:1254–1276`). A standard with eight catalog names and marker 2 breaks these checks before 3b/3c. The native schema currently also says marker `const: 1` (`core/config-schema/runner.schema.yaml:227–234`).

**What to change:** either make data, compatible validator and owning assertion migration one coherent slice, or keep 3a's acceptance Rust-only and explicitly defer this Node gate to the slice that updates its code and assertions. Require the schema to accept markers 1 and 2 while the standard supplies 2, alongside the JS readable set. Do not claim the current 3a Node command passes, and do not weaken or skip its assertions to manufacture a passing slice.

## 7. Medium — specify the complete Rust fixture/proof impact instead of a conditional two-file list

**Stale instruction:** phase 03a names only authoring-source and repo-differences as conditional writes, while the later U1 answer mentions registry-defaults and golden-migrate counts. This leaves the dispatched write scope inconsistent.

**What the code says now:** `packages/config/rust/tests/authoring_equivalence.rs:191–220` pins the source SHA256 and exact differences/standard-only paths. `golden_migrate.rs:171–178` fixes kept/redundant counts and retired/doc-converted lists. `registry_defaults.rs:56–106` compares a restricted set of thirteen sections; its fixture explicitly says runner belongs to authoring equivalence, so a runner-only edit does not automatically require changing registry-defaults. `packages/config/contracts/migration.v1.json` is the existing retired-path registry. Phase 03's existing schema and standard still hold the old shape. A saved `reports/phase-03a-take2-uncommitted.patch` exists but is not the live implementation.

**What to change:** reconcile the write scope with actual affected proofs: include authoring-source, its recorded source hash/differences/standard-only expectations and golden-migrate expectations when changed. Inspect registry-defaults rather than requiring a gratuitous edit. Give the migration registry's retirement additions an explicit owning slice consistent with U6/phase 09. Revalidate the saved patch against this HEAD rather than treating it as landed evidence. Preserve the tests' semantics and calculate expectations from actual results during implementation.

## 8. High — preserve loop tuning until the new resolution is wired

**Stale instruction:** phase 04 requirement 8 removes the `cfg.loops.reviewed.maxRounds` fallback and uses only `params.maxRounds ?? DEFAULT_MAX_ROUNDS`, stating config defaults are resolved upstream. But phase 05 explicitly has no production callers; phase 06 first wires `resolveCollaboration`.

**What the code says now:** `loops/index.mjs:36–47` still obtains params from `resolvePattern` and passes them to loops. `patterns/presets.mjs` does not read runner loop config. Phase 04 only changes the two run-door seat calls to use this same old resolver. A configured `runner.loops.reviewed.maxRounds: 1` with plain `reviewed` therefore becomes 2 after dropping the fallback, for execution and launch bounds, until phase 06.

**What to change:** retain the existing config fallback (relocated by phase 03) through phases 04/05; remove it atomically with upstream default resolution in phase 06. Alternatively combine those dependent changes into one passing slice. Update the phase-04/06 ownership and reuse the existing max-round behavior proofs. Param tables and the new checker/seat API can still land in phase 04.

## 9. Medium — reconcile phase-05 layer promises with Config's effective-value contract

**Stale instruction:** phase 05 says `checkCatalog({ shipped, effective, layers? })` checks “a layer's override” and reports its source. Phase 03 supplies `layers` only as one label per name and does not define how to reduce Config's field-level origins for a deep-merged entry.

**What the code says now:** `readConfig` documents field-path origins at `src/config/facade.mjs:49–56`; the current loader requests only model-policy and rigorToTier origins. `packages/config/rust/src/snapshot.rs:445–460` exposes merged-value provenance. A shipped entry can inherit loop/promise from standard, an invariant from global and defaults from project. One name-level label cannot identify which layer supplied an offending invariant, and merged inputs cannot reveal an overridden lower-layer invalid value.

**What to change:** define the intended scope precisely: validate effective entries against shipped floors, and attribute errors using the offending field's available origin. Explicitly define the name-level `pin.pattern.layer` rule (for example highest contributing entry layer) separately. If every raw layer must be independently checked, document the missing input/door before implementation rather than inventing a JS layer reader. Extend the planned provenance proof with a single entry contributed by both global and project. Phase 05 must keep receiving data; no Config import in the pure catalog module.

## 10. Medium — the phase-05 catalog does not inherit the moved loop-directory guard

**Stale instruction:** phase 05's architecture context and scout fact 4 cite the old patterns architecture guard as evidence that the new pure catalog cannot import dispatch.

**What the code says now:** `test/runner/execution/loops/architecture-guard.test.mjs:7,22–25` enumerates only `src/runner/execution/loops`. The proposed catalog stays under `execution/patterns`, which that proof no longer scans. `test/architecture.test.mjs` is separately listed and the manifest remains relevant, but the cited loop guard does not prove the new module's purity.

**What to change:** cite the live guard and explicitly identify/extend the owning architecture proof for `patterns/catalog*.mjs`, including the optional split module, without duplicating cases. Ensure the phase-05 write list contains any existing guard actually changed. Keep the Config adapter in dispatch/infra and pass its data across the boundary.

## What remains valid

The live Config facade cutover has not itself implemented the catalog: shipped runner data still has `defaultRule`, old reviewed tuning and marker 1; `runner.loops` is not yet declared. Phase 03's data migration is still real work. Phase 04's checker-plan, prefix lookup, reserved-id and provenance work is still needed: `checkerSeatsOf` and the unconditional coding red-team branch remain. Phase 05's proposed new catalog files are absent as expected. Legacy `patterns.reviewed` reads in `legacy-seat-read.mjs:40` decode records and must remain distinct from live config reads. `snapshotRunnerConfig` still hashes patterns but not loops (`run.mjs:149–165`), so the planned hash addition remains necessary. The serial file ownership of `seat-resolver.mjs` and `run.mjs` is sensible once the slice boundaries above are corrected.

No workspace edit was made. The requested fixes are expressed only as actionable plan findings, as required by the read-only assignment.
