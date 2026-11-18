# Phase 13: assignment model

Wave 4. Depends on: 6, 7, 9. Effort 2.5d. Library only (engine module `assignment`).

## Context

The data side of one Assignment, before the runner: `src/runner/dispatch/` `assignment.mjs` (934),
`assignment-normalizer.mjs` (188), `assignment-layout.mjs` (116, `isWithinDir`), `brief.mjs` (181),
`operation-prompt-templates.mjs` (562, `discoverProjectPromptTemplates`, `TemplateResolutionError`),
`execution-contract.mjs` (424), `effective-execution-contract.mjs` (535), `write-scope.mjs` (190, `canonicalizeWrites`,
`globsMeet`, `writeScopesOverlap`), `run-timeout.mjs`, `tier-cell.mjs` (`parseTierCell`), `executor-governance.mjs`,
`config.mjs` (778: `loadRunnerConfigForDir`, `MODEL_POLICY_TIERS`, shape validators; S5 ported
`validateRunnerConfigShape` to `runner_check.rs`), `runner-config-error.mjs`, `work-item-input.mjs`,
`shipped-catalog.mjs`, `tool-providers.mjs` (S5 `tools.rs` may already own it). Exact list: phase 00 section 1. S5 D7
twins named `retiredBy: S6a` that live in these files are retired by their cutover phase, not here.

## Requirements

- `packages/execution/engine/src/assignment/` ports the effectful parts (template discovery, layout on disk,
  contract assembly from config); the pure parts (write scope, timeout, tier cell, governance) go to
  `fgos-execution` only if phase 00 classed them `addon` (Node consumers need them), else they live here. Write-scope
  canonicalisation reuses `fgos-write-scope` (`packages/git/write-scope`), never a third copy.
- Runner config is read through `fgos-config` and checked by S5's `runner_check`; no second loader.
- Effective execution contract bytes: the canonical-JSON exception in component-boundary (`effective-execution-contract.mjs`
  keeps its own serialiser with the release-manifest pair) is preserved or retired by phase 00's decision, stated in
  the report.
- Golden vectors `packages/execution/contracts/assignment.v1.json` (normalised assignment, brief text, contract bytes
  and digest, template resolution and its errors).

## Steps

Record vectors; red `engine/tests/assignment.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test assignment`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: contract digest bytes change, so replay of an in-flight assignment refuses. Landing precondition nothing in
flight; vectors pin bytes. Rollback: revert.
