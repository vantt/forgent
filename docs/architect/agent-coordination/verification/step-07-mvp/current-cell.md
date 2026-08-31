# Current Cell: P03.1

Status: closed
Owner: Coordinator (independent verification complete, cell closed)
Last updated: 2026-09-01
Next action: prepare P03.2 (Phase 03, R3: CLI `--contract` door)

## Goal

Land ADR-007 R1 (the domain harness seam) and R2 (the non-driving rule).
Phase 03's first cell, per plan.md's own suggested split
(`P03.1 (R1 + R2), P03.2 (R3), P03.3 (R4+R5+R6 live proofs)`).

With Phase 02 done, the inline Assignment class exists and mission-lite
already builds one (`createMissionAssignment`, no `work` attached). This
cell adds the ONE thing a Work-attached inline contract needs before Phase
03's live proofs can run: a domain seam that enriches/rejects an inline
contract against a Work's declared Stage, and a guarantee that the result
of running it can never be mistaken for a Stage verdict.

## Requirements

- **R1 — Seam.** New file `domains/coding/harness/enrich-and-validate-contract.mjs`
  exporting a pure `enrichAndValidateContract(contract, { domain, work })`.
  Per ADR-007 §1, when called for a Work at a declared Stage it:
  - requires `contract.supports` to be an operation id in
    `operationsForStage(domain, work.stage)` (reject otherwise, fail-closed
    — this is the ADR-007 §3 "inline may not replace or extend the declared
    path" guarantee, mechanically enforced here);
  - adds `contextRefs` (CONTEXT.md, plan.md — same `resolveContentRoot`
    resolution `buildDeclaredAssignment`'s own `work.docsRef` branch already
    uses, `src/runner/paths.mjs`);
  - adds an allowed-scope constraint (repository read scope — this is a
    read-only-only slice, ADR-006 §6 still applies to inline);
  - sets the coding read-only evidence rule: `reported` evidence requires an
    `agent-report.md` artifact (mirror how `buildDeclaredAssignment`'s
    `derivedExpectedOutputs` already documents the expected evidence
    artifact for `validate-plan`/`review-item`, so a worker gets the same
    kind of concrete instruction, not a bare policy statement);
  - writes role→tier hints into `policy` (same merge shape
    `buildDeclaredAssignment`'s `mergedPolicy` already uses:
    `{...opPolicy, ...callerPolicy}`, `_fromYaml` marker when the tier came
    from YAML and the caller didn't override it).
  - It never sets an executor id, never dispatches, never touches Work
    lifecycle — `compileDispatchPlan` stays the sole execution chooser
    (ADR-007 §1, this is a hard boundary, not a style preference).
  - Foundation (`buildAssignment` / `buildInlineAssignment`,
    `src/runner/dispatch/assignment.mjs`) calls it between the generic
    validator (`execution-contract.mjs`'s `validateExecutionContract`,
    unchanged) and the normalizer (`stampInlineAssignment`,
    `assignment-normalizer.mjs`, unchanged) — **only when a `domain` is
    resolvable for the call** (i.e. a `work` was attached with a domain, or
    an explicit domain option was passed). A standalone inline call with no
    Work/domain skips the seam entirely and passes on generic validation
    alone (ADR-007 §2 — this is the actual evidence the foundation boundary
    doesn't depend on any domain; do not weaken it by making the seam call
    unconditional "for consistency").
  - `execution-contract.mjs`'s `ACCEPTED_CONTRACT_FIELDS` whitelist
    currently has no `supports` field — read it
    (`src/runner/dispatch/execution-contract.mjs`) before touching it. It
    must accept an *optional* `supports` field at the generic-validator
    layer (format check only, e.g. non-empty string when present) without
    itself knowing what a legal operation id is — that semantic check is
    the seam's job alone, keeping the generic validator domain-ignorant
    per ADR-007 §2.
- **R2 — Non-driving rule.** `findLatestAssignmentRunResult`
  (`src/runner/dispatch/operation-choice.mjs:100`) already reads each
  candidate's parsed `assignment.json` (`asgn`) and filters on
  `asgn.workId`, `asgn.stage`, `asgn.resultKind` in sequence — add
  `asgn.provenance?.kind === 'inline'` to that same filter chain (skip, do
  not `continue`-then-fall-through into evidence it shouldn't reach) so an
  inline Assignment's RunResult is never returned as `lastRunResult` to
  `chooseStageOperation`. Read the function's own doc comment above it
  first (ADR-006 R5 history) and its "Follow-Ups" entry in `index.md`
  (already flagged as this codebase's highest tamper-detection-sensitivity
  function) before editing — this is a filter addition alongside existing
  ones, not a restructure.
  - `chooseStageOperation` itself (`operation-choice.mjs:638`) only ever
    consumes the already-filtered `lastRunResult` parameter and never reads
    `assignment.json`/`provenance` directly (confirmed by grep before
    writing this contract) — the fix belongs solely in
    `findLatestAssignmentRunResult`; do not add a second, redundant filter
    inside `chooseStageOperation` "for defense in depth" without first
    confirming empirically it can actually receive an inline result some
    other way a grep might have missed.

## Files

- Create: `domains/coding/harness/enrich-and-validate-contract.mjs` + its
  test file.
- Modify: `src/runner/dispatch/assignment.mjs` (seam call site in
  `buildInlineAssignment`), `src/runner/dispatch/execution-contract.mjs`
  (`supports` field accepted), `src/runner/dispatch/operation-choice.mjs`
  (R2 filter + test).

## Non-Goals (Out Of Scope For This Cell)

Phase 03 R3 (CLI `--contract` door), R4/R5 (the two live proofs), R6
(ADR traceability table). Do not change `execution-contract.mjs`'s
`mutation`/`FORBIDDEN_SESSION_FIELDS` gates (untouched, still read-only-only
this slice). Do not change `mission-lite.mjs`'s `createMissionAssignment`
call shape (it never attaches a `work`, so the seam is a no-op for it —
confirm this with a test, don't just assume it).

## Watch-Fors (From Reading The Code Before Dispatch, Not Guessing)

- `buildInlineAssignment`'s current signature
  (`{ provenance, work, workId, createdBy, options }`) has no `domain`
  parameter today. Deciding how a caller supplies `domain` for the seam to
  fire (from `work.domain`, an explicit `options.domain`, or both) is an
  implementation decision within this cell's scope — make it, document the
  choice and why in `P03.1.md`'s Gaps section, same as every prior cell's
  judgment calls.
- The enriched contract's `contextRefs`/`constraints` need to reach the
  frozen Assignment the same way the raw contract's fields already do
  (`buildInlineAssignment`'s `frozenContext Refs`/`frozenConstraints`
  locals) — but `policy` is NOT one of `execution-contract.mjs`'s
  `ACCEPTED_CONTRACT_FIELDS` and per ADR-006 §4 never will be (that field
  set is the wire contract an agent proposes; `policy` is host-side
  guidance the harness adds afterward, same layering as
  `buildDeclaredAssignment`'s own `mergedPolicy`, which lives on the
  Assignment, not inside `matchedOp`'s caller-facing shape). Do not
  re-validate the seam's output against `ACCEPTED_CONTRACT_FIELDS` — that
  whitelist governs the agent-proposed contract only, not the
  harness-enriched one.
- `INLINE_ASSIGNMENT_PARAM_WHITELIST` in `assignment.mjs` currently rejects
  any top-level `buildAssignment()` param outside
  `{provenance, work, workId, createdBy, options}` for inline calls — if a
  new top-level `domain` param is added, this whitelist must grow with it
  or every inline caller (including `mission-lite.mjs`, currently
  passing none) breaks confusingly on an unrelated change. Grep all real
  callers of `buildAssignment`/`buildInlineAssignment` before finalizing
  the signature.

## Tests First (Per current-cell.md's Own Convention)

- Seam unit tests (new file): rejects a contract with no/illegal
  `supports` for the Work's stage; adds `contextRefs`/constraint/evidence
  guidance; never sets an executor id; identical output for identical
  input (purity — same assertion style as any other pure module in this
  repo, e.g. `assignment-normalizer.mjs`'s own tests).
- R2 test: an inline Assignment with a READY-looking claim on a planning
  Work does not get returned by `findLatestAssignmentRunResult` / does not
  advance the edge via `chooseStageOperation`; a declared `validate-plan`
  READY still does (regression, must still pass unmodified).
- Confirm via a real (not just read-code) test that
  `createMissionAssignment`'s existing calls (no `work` attached) are
  completely unaffected by this cell — the whole `test/runner/mission-lite.test.mjs`
  suite must stay green with zero modification.

## Trace Update

Doer writes Requirements (R1+R2 rows), Proof Matrix, Commands, Gaps in
`docs/architect/agent-coordination/verification/step-07-mvp/P03.1.md`
(new file). Doer does not write Review/Red-Team sections. No cell/finding
IDs in code comments, test names, or commit messages — ADR-006/ADR-007
section references are fine (durable), transient coordination labels are
not.

## Closure

Cell closed. Full history (Doer → Coordinator Verification → Review [3
findings, 1 HIGH + 1 MEDIUM + 1 LOW, all fixed] → Fixer → Coordinator
Verification → Red-Team [2 HIGH + 1 LOW, all fixed and independently
verified by revert-and-reproduce] → Fixer → Coordinator Verification) is
in `P03.1.md`. R1+R2 done; Phase 03 continues with R3 (CLI `--contract`
door, P03.2). See `index.md` for the updated Phase/Requirement Matrix.
