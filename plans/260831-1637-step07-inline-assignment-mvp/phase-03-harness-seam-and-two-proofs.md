# Phase 03 — Harness Seam, CLI Door, And The Two Proofs (ADR-007, V-012)

Context: with Phase 02 the inline class exists. This phase adds the single
domain seam, the CLI door, and runs both consumers live so the foundation
claim is recorded from persisted evidence, not narrative.

## Requirements

- R1 Seam. `domains/coding/harness/enrich-and-validate-contract.mjs` exporting
  pure `enrichAndValidateContract(contract, { domain, work })`. For a Work at a
  declared stage it: requires `contract.supports` to be an operation id in
  `operationsForStage(domain, work.stage)` (reject otherwise); adds
  `contextRefs` (CONTEXT.md, plan.md via `resolveContentRoot`); adds an
  allowed-scope constraint (repository read scope); sets the coding read-only
  evidence rule (`reported` requires `agent-report.md` artifact); writes
  role->tier hints into `policy` (same shape as `op.policy` merge today). It
  never sets executor ids. Foundation calls it from `buildAssignment` between
  the generic validator and the normalizer when `domain` is present.
- R2 Non-driving rule. `chooseStageOperation` / `findLatestAssignmentRunResult`
  ignore Assignments with `provenance.kind === 'inline'` when looking for a
  stage verdict; add an explicit filter with a test.
- R3 CLI door. `src/runner/dispatch/cli.mjs` `execute` gains `--contract <file>`
  (JSON). Mutually exclusive with `--for`/stage flags. Prints assignment id,
  run id, RunResult path. No new verb. User-visible: add a `## [Unreleased]`
  line to `CHANGELOG.md`; no new config default or env var is introduced (if
  one becomes necessary, register it with `fgos setup`/`doctor` per AGENTS.md).
- R4 Proof 1 (standalone). Contract: role `reviewer`, objective = one bounded
  design question about a doc in this repo, `mutation: read-only`,
  `evidence.required: reported`, `timeoutMs`, `maxRuns: 1`, caller writer id.
  Executor via policy hint `preferExecutor: claude-reviewer` (configured in
  `.fgos/config.json`, read-only-scoped `claude -p` spawn) with a sonnet-class
  model; `decide --for` purposes do not include reviewer roles, so the proof
  must go through `execute --contract`, never `decide --for`. Record under
  `docs/architect/agent-coordination/verification/step-07-mvp/proof-1-standalone-inline-read-only.md`:
  command transcript, `assignment.json`, `runs/01/{run,dispatch-plan,result}.json`,
  and the assertion that no field references a coding stage/TaskSpec.
- R5 Proof 2 (coding consult). Throwaway Work at `planning` with a real
  CONTEXT.md/plan.md. Contract: role `advisor`, `supports: shape-plan`,
  objective "are plan.md's steps consistent with the locked decisions in
  CONTEXT.md", read-only, `reported`. Record under
  `verification/step-07-mvp/proof-2-coding-consult-supporting-planning-work.md`:
  harness-added refs/constraints visible in `assignment.json`, RunResult, and
  proof that `fgos list` shows the Work's stage/status unchanged and the
  driver's next operation choice ignored the inline result.
- R6 Traceability: extend the track's existing
  `verification/step-07-mvp/index.md` (the master's status board) with an
  "ADR Traceability" section: one row per ADR-006/007 clause -> test or proof
  path. Proof records for R4/R5 live under `verification/step-07-mvp/proofs/<cell-id>/`
  with the markdown summaries named in R4/R5 beside them.

## Files

Create: `domains/coding/harness/enrich-and-validate-contract.mjs` + test;
verification records above.
Modify: `src/runner/dispatch/assignment.mjs` (seam call), `operation-choice.mjs`
(R2 filter), `src/runner/dispatch/cli.mjs` (R3), `bin/fgos.mjs` only if the
dispatch subcommand wiring requires the new flag to be declared there.

## Tests

- Seam unit: rejects missing/illegal `supports`; adds refs; never sets
  executor; identical output for identical input (purity).
- R2: an inline Assignment with a READY-looking claim on a planning Work does
  not advance the edge; a declared `validate-plan` READY still does.
- CLI: `--contract` with a mutating contract exits non-zero before launch;
  `--contract` + `--for` rejected.
- Live: Proof 1 and Proof 2 executed out-of-process (no fake executor), same
  standard as Step 06 Cells 6.3/final.

## Risks / Rollback

- Proof 2 needs a real executor run; budget it (one run each, sonnet tier).
- If Proof 1 and Proof 2 require different build/dispatch/result code paths to
  pass, stop: the foundation boundary is not found — record it in the
  checkpoint rather than patching around it.
- Rollback: seam and flag are additive; revert PR.
