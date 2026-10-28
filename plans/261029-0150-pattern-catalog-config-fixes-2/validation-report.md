---
title: "Validation report of the second round plan"
description: "Read-only validate-plan pass; the amendments below are adopted in plan.md"
---

# Validation: second config-fix round

Validated plan: `plans/261029-0150-pattern-catalog-config-fixes-2/plan.md`.
Worktree: `/home/vantt/projects/forgent-worktrees/cook-config-fixes-2`.
Tip: `81ac7a30dc11e41a289bd8ad73f094b862feda25`.
Review: `/home/vantt/projects/forgent/plans/reports/review-261029-0136-harden-recheck-pattern-catalog-config-fixes.md`.

Both slices need plan corrections before execution as written. The direction is sound; the missing production caller, Config read contract, and test fixture instructions are material, not cosmetic.

## Slice 1 — Retired-key family: NOT READY

### 1. Missing caller and deletion bookkeeping

`src/runner/execution/patterns/catalog.mjs:80-81` computes a patterns map but wraps it again as `effective: { patterns: effectivePatterns }`. It must change with `checkCatalog`, yet is absent from the slice file list. Production `checkCatalog` has exactly two call sites: this one and `src/setup/registrations.mjs:602`. Doctor already passes the effective map. Both currently pass the shipped catalog object, so the plan must explicitly choose the shipped argument contract too; removing all shipped-input sniffing requires passing `shipped.patterns` at both boundaries. The tests call `checkCatalog` in two files, listed below, using a mixture of maps and envelopes.

Deleting `src/runner/dispatch/retired-config-keys.mjs` also requires deleting its row at `docs/architecture-manifest.json:368` and its obsolete retired-literal permission at `test/architecture.test.mjs:1567`. The manifest's disk/file bijection test fails if the row remains. Updating this JSON manifest is required bookkeeping even though narrative docs changes are out of scope.

Exact addition to the slice text:

> Add `src/runner/execution/patterns/catalog.mjs`, `docs/architecture-manifest.json`, and `test/architecture.test.mjs`. Make `checkCatalog` accept explicit shipped and effective patterns maps; migrate both production call sites and every test caller together. Delete the wrapper module, its manifest row, and its obsolete literal permission in the same slice. Do not preserve an envelope-or-map overload.

### 2. N1 cannot be implemented by changing readMachineConfig to checkConfig alone

The facade is a thin pass-through (`src/config/facade.mjs:checkConfig`). The native check requires `projectRoot`: `packages/git/node-addon/src/config.rs:Request::project` and `unix::check_entry:344-350`. Unlike `readMachineConfig`, `checkConfig({globalDir})` is refused with `config-request-invalid` / `projectRoot`.

Exact correction:

> Pass an existing absolute project root into `inspectGlobalRunnerConfig` from the setup handler (`bin/fgos.mjs:4023`, where `repoRoot` is available), and call `checkConfig({projectRoot, globalDir})`. Filter findings by the global source label before matching retired paths. Update every test invocation. Expand the permitted bin change beyond “global guidance formatter only” to include this call site.

There is a second limitation: findings are diagnostics, not a complete source-path census. `packages/config/rust/src/doctor.rs:Judged::rows` produces schema, undescribed-path, comment, and redundancy findings. A schema-valid, fully documented gated pattern can have no finding at its path. For legacy JSON the function returns before the comment/undescribed-path passes. Thus a check-only implementation cannot promise a notice for **every** retired global key, especially schema-valid gated entries. Tuning child paths can be recovered from unknown-key findings in YAML; this is not a universal inventory guarantee.

Exact correction to the N1 decision:

> Use global per-source check findings for refused tuning keys. On a successful machine snapshot, request `origins: ['runner.patterns']` and match global-origin paths too, so a diagnostic-free gated entry is detected. Do not return early merely because the snapshot succeeds. Add a fully documented gated-entry fixture. Explicitly resolve the remaining case of a valid gated entry coexisting with another key that refuses the snapshot; do not claim complete coverage from findings alone.

The final combined case is a real readiness dependency under the current “every retired global key” outcome. The existing Config door provides no complete per-source path inventory on refusal. If that absolute guarantee remains required, the plan must name an authorized inspection route or a Config dependency before dispatch. Adding a new raw-fs config reader or changing `packages/config` silently would contradict the stated frame. A narrower guarantee must be stated explicitly, not obtained accidentally from fixtures that happen to lack comments. This report does not authorize either scope expansion.

### 3. N2 positions do not provide values

`packages/config/rust/src/doctor.rs:Finding` and `packages/git/node-addon/src/config.rs:354` expose row, severity, file, line, column, path, fix, and detail, never values. Snapshot origins likewise contain path/layer/file/position metadata (`config.rs:263`), not source values. A successful snapshot has a separate effective `value`; a refused snapshot has no partial value. A line and column are not a parsed old value.

The plan's template option is executable and avoids a Config expansion, but must be selected now for refused snapshots rather than leaving the worker to infer a raw-read mechanism.

Exact replacement text:

> For refused snapshots, print an explicitly incomplete migration template and the sentence “Copy the existing values to their replacement keys before removing the old keys.” Do not present an unset-only patch as ready to apply. Include a set operation for each replacement with clearly non-executable placeholders until completed; defaultRule alone needs only an unset. Move maxRounds and checkersByRigor individually, unsetting only those child paths so reviewed catalog overrides survive. Preserve the entire gated entry when renaming it. Where a replacement already exists, require reconciliation before applying the template. Print the template warning in both the JSON notice/message and the human CLI formatter.

For a successful machine snapshot, only values actually available with global provenance may be used; an effective merged entry is not automatically a byte-for-byte source entry. Do not promise an exact source-preserving patch from positions alone. Existing project conversion already demonstrates child-only tuning moves at `runner-config-conversion.mjs:148-172`; reuse that behavior rather than deleting the whole reviewed entry.

The human CLI does not print `notice.message`: it reconstructs the notice at `bin/fgos.mjs:4751-4765`. Updating only `formatGlobalRetiredNotice` would hide the template warning in normal CLI output.

### 4. Consolidation needs a complete error and caller contract

Current caller census:

- `detectRetiredPatternKeys`: `config.mjs` at 219 (door paths), 244 (named input assertion), 1341 (shape validation); `catalog-entries.mjs:384`; the wrapper at 20; global inspection at 264/271/275/279; recursive calls in the detector itself.
- `retiredKeysIn`: only `runner-config-conversion.mjs:62` (legacy advice) and 109 (conversion); `RETIRED_CONFIG_KEYS` re-export: only doctor at `registrations.mjs:90`, used by both its findings and refusal branches (526 and 552).
- `assertNoRetiredKeys`: only `loadRunnerConfig:300`; `checkDoorRefusalsForRetiredKeys`: only `loadRunnerConfigForDir:265`.
- `inspectGlobalRunnerConfig`: only `bin/fgos.mjs:4023` in production, plus setup conversion tests at 233/390/470.
- `formatLegacyJsonAdvice`: converter at 121 and doctor at 521/548/574/577/583. Keep its parsed-document call shape or migrate all of those uses; it reads a file when parsed input is absent.

The current `classification`, `name`, `code`, and `baseMessage` fields have consumers. They are not all dead merely because the desired new result is `{key,replacement,instruction}`. Migrate those consumers before removing fields. The wrapper really does discard `baseMessage`, making the existing legacy formatter fallback permanent.

Exact addition:

> Define one table-driven dotted-path matcher (exact key or key plus dot descendant) and normalize object inputs only at explicit patterns-map boundaries using own properties. Adapt all result consumers to `{key,replacement,instruction}` and derive the error code/source label at their boundary. Remove the named-file prepass in `loadRunnerConfig`, keeping retired checking in `validateRunnerPatternsShape`, which also has direct callers. Aggregate and deduplicate all retired findings before throwing one RunnerConfigError with code config-key-retired, preserving each source location and key. Apply the same aggregation to Config-door findings/refusals.

This selects which duplicate pass to remove. Deleting the validator pass instead would lose its direct validation contract. Current assertions and door handling both throw inside the first finding loop, so changing only the detector does **not** solve the first-finding-only complaint. N5 must explicitly own aggregation.

Keep non-reviewed tuning classified as unknown/schema-invalid, not retired. Keep own-property/prototype safety and source-layer attribution while removing mixed classification and shape sniffing.

### 5. Tests slice 1 must touch

- `test/runner/dispatch-config-patterns.test.mjs`: update mixed-shape expectations at 330-333 and 356-363; migrate its checkCatalog call near 600; retain direct-validator and named-file wiring coverage; cover both tuning findings in one error, named patterns `loop`/`loops`, descendant dotted paths, and non-reviewed tuning exclusions at their owning boundary.
- `test/runner/execution/patterns/catalog.test.mjs`: migrate checkCatalog argument shapes; replace tests at 264 and 279 that explicitly require mixed config-error with per-child config-key-retired assertions. Preserve their source attribution and custom-pattern-name coverage. Keep inherited-property safeguards around 1106-1140.
- `test/setup/runner-config-conversion.test.mjs`: four global retired-key cases, explicit projectRoot/globalDir wiring, warning/template content in human CLI and JSON, preservation of mixed reviewed catalog fields, gated-entry value preservation/reconciliation, and fully documented gated detection. Extend existing setup CLI test near 416 instead of adding another copy of every helper case.
- `test/setup/registrations.test.mjs`: doctor shared matcher wiring, child-path retired matching, and named-pattern consistency; retain legacy JSON and schema-marker behavior.
- `test/architecture.test.mjs`: remove the deleted wrapper's literal permission; run the existing manifest bijection/import checks. No extra duplicate architectural proof is needed.

Add `CHANGELOG.md` to this slice too: the user-visible diagnostic/migration behavior changes here, rather than waiting for slice 2. Existing setup conversion proofs for backup/idempotence/comment preservation remain owned by that file; do not delete them as part of detector consolidation.

## Slice 2 — Floor and seams: NOT READY AS WRITTEN; small corrections suffice

### 1. Production floor wiring is allowed and already has its import

`run.mjs:27` already imports `shippedCatalog` from `dispatch/shipped-catalog.mjs`. The correct hook insertion is `run.mjs:1572` at the existing runLoop call. `loops/index.mjs:85` forwards the same hooks object directly to runReviewed, so no extra resolution or import is needed there.

The manifest declares run as use-case, shipped catalog as infra, and loops/seat resolver as domain. Its order is entry → use-case → infra → domain → kernel. This is a permitted downward dependency. Moving shippedCatalog imports into either loop module would violate the domain/infra boundary and the loop architecture guard. No layer reclassification or new module is required.

Exact amendment:

> Read the shipped checker table at the existing use-case boundary and pass it through hooks once to runLoop. Domain modules consume only that data. Update hook documentation if needed; index.mjs needs no behavioral change because it already forwards hooks.

Import `RIGOR_RANK` from existing `src/runner/rigor.mjs`; it is already exported there. Preserve ordering configured[rigor] → shipped[rigor] → (only below standard) configured.standard → shipped.standard. Missing high/critical rows throw only when absent from both sources. A shipped high row must continue to beat a configured standard row.

### 2. Removing wrappers does not make direct loop tests pass through run.mjs

`reviewed.test.mjs:18-19` injects the hook in a wrapper; `loops/index.test.mjs:54` and `run-case-admission.test.mjs:322` pass it directly. The last is a direct runReviewed test despite the enclosing file name. None reaches the proposed production hook assignment. Deleting those inputs while keeping `{}` configurations leaves missing checker tables and breaks the tests.

Exact replacement for “drop test wrappers”:

> Delete implicit test wrappers and the invented module-wide low row. Make each direct loop/resolver fixture explicitly supply a valid configured checker table or the documented shipped-floor hook. Explicit hook inputs in domain-unit tests are valid production-contract inputs after production wiring is fixed. Replace the runReviewed wrapper, but retain the history wrapper or inline its legitimate fifth seats argument; it is not the test-only params/cfg fallback. Add one integration wiring proof through runUnit with an injected config lacking checker rows, asserting execution launches the required critical seats without any test-supplied floor hook.

The new runUnit proof is currently unowned: the catalog critical-floor test near `patterns/catalog.test.mjs:1841` proves admission resolution only; loop tests prove execution only after injection. Extend an existing runUnit test file rather than copying the row-precedence matrix into integration tests. `test/runner/execution/run-case-admission.test.mjs` already owns runUnit admission/execution integration and is a suitable owner for that one wiring proof.

In `seat-resolver.test.mjs`, keep explicit synthetic low-row precedence cases at 186-221: they intentionally prove supported explicit rows. Remove the fake *global fixture* row at 14, not every explicit low-row case. Rename/restrict the overbroad “a rigor with no row of its own…” test at 223 and extend its missing-row proof to high and critical with a standard row present. A config with **no** rows is insufficient to detect the unsafe fallback.

### 3. N8 needs complete seam retirement

Production resolveStart callers are only case-start.mjs:222 (preflight) and :297 (prepare). The only external caller is the test at workflow-runner.test.mjs:1697. Case verbs do not consume prepareWorkflowRun's runnerConfig field.

Exact addition:

> Make resolveStart private again, remove params.runnerConfig and only prepareWorkflowRun's outward runnerConfig field. Preserve resolveStart's internal returned runnerConfig, which its two production callers need. Remove resolveStart from the test import at line 38, delete the injection/identity blocks at 1697-1705, and retain/rename the fresh prepareWorkflowRun single-read block at 1707-1711.

The internal reuse stays; do not remove the internal field while removing the outward test seam.

### 4. Tests slice 2 must touch

- `test/runner/execution/seat-resolver.test.mjs`: remove implicit fixture/wrappers, use explicit valid inputs, own the rigor row selection matrix and missing high/critical errors.
- `test/runner/execution/loops/reviewed.test.mjs`: replace implicit runReviewed hook wrapper with explicit fixture inputs; preserve reviewedHistoryOutcome's resolved-seats contract and all loop/resume behavior.
- `test/runner/execution/loops/index.test.mjs`: use explicit valid direct-loop inputs; do not expect run.mjs wiring to execute in this test.
- `test/runner/execution/run-case-admission.test.mjs`: repair the direct reviewed fixture and own the single real production floor-wiring proof described above.
- `test/workflow/workflow-runner.test.mjs`: retire the injected reuse proof, keeping the real single-read proof.

Run existing `test/architecture.test.mjs` and `test/runner/execution/loops/architecture-guard.test.mjs`; neither needs new cases for an already allowed import direction. Correct the Unreleased floor sentence in CHANGELOG.md to describe both admission and execution after the production wiring is actually proved.

## Slice order and acceptance

Keep the proposed sequence: retired-key family, then floor/seams. No intrinsic runtime dependency forces that order, but it is coherent and keeps the two concerns reviewable. Slice 2 can be prepared while N1's inspection contract is resolved; do not let that unresolved question block independent floor work. Both slices must migrate all consumers and retire obsolete assertions within their own commit. Shared CHANGELOG edits are safe sequentially. The plan must include the required architecture-manifest edit despite the broad “no docs/ change” wording.

Replace “cargo test --workspace unchanged” with a concrete required final verification: run it and report the result. Define “census clean” by the existing repository census/check command and update owned derived entries as required by the actual diff. Do not present the previous review's 283 passing tests as proof of these future changes. Only call a failure pre-existing after demonstrating it at the stated comparison commit in a separate clean environment; do not mutate this read-only worktree to do so.

## Evidence and limits

Performed read-only source/caller searches, architecture-manifest/guard inspection, and relevant git history searches. Historical evidence confirms detector consolidation at cd41723a1/e29e82dd0, the shape heuristic at 33e8310ee, floor injection at 512e63f4a, the workflow seam at d28e347c7, and unconditional standard fallback at 7bb8f3efa. These are still the mechanisms at the audited tip.

Ran an in-memory Node probe importing the current pure detector/catalog/seat resolver, without writing fixtures. Observed:

- Mixed reviewed tuning returns one config-error/mixed finding rather than two child findings.
- `runner.patterns.reviewed` yields no retired finding; gated `.loop` descendant yields the canonical gated finding.
- An enveloped map containing a pattern named loop is read as a synthetic pattern named patterns and fails validation.
- Critical rigor with only configured standard and no shipped table silently resolves reviewer, reproducing the unsafe fallback.
- Manifest ranks permit run(use-case) → shipped-catalog(infra); loop modules are domain.

No npm/cargo suites were run: this was plan validation under a strict read-only workspace contract, and those suites materialize fixtures/build artifacts. The listed future test changes are implementation requirements, not claims that those tests have passed. Initial and final git status were clean; no workspace files were changed. Only the required assignment result/report files were written outside the workspace.

Status: DONE_WITH_CONCERNS

Summary: Both slices need amendments before dispatch. Slice 1 is missing a production caller and architecture bookkeeping and assumes a Config inspection contract that does not provide a complete retired-key inventory or refused-source values. Slice 2's production wiring is layer-correct, but wrapper removal must be paired with explicit valid direct-loop fixtures and one runUnit execution proof; privatize resolveStart while preserving its internal config reuse. Keep the slice order and resolve the N1 coverage dependency explicitly.
