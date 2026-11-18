# Phase 13b: prompt templates and execution contract

Wave 5. Depends on: 6c, 13. Effort 1.5d. Library only (engine module `contract`). Split from the old phase 13.

## Context

`src/runner/dispatch/operation-prompt-templates.mjs` (562, `discoverProjectPromptTemplates`, `TemplateResolutionError`),
`execution-contract.mjs` (424), `effective-execution-contract.mjs` (535). 1 521 lines. Doctor row
`operation-prompt-templates-valid` judges with them (phase 17).

## Requirements

- `packages/execution/engine/src/contract/` ports template discovery and contract assembly from config (6c) and the
  assignment (13).
- Effective execution contract bytes: the canonical-JSON exception in component-boundary
  (`effective-execution-contract.mjs` keeps its own serialiser with the release-manifest pair) is preserved or retired
  by phase 00's decision, stated in the report; the door row "canonical JSON bytes" debt entry for the Node file goes
  in phase 21, which deletes it.
- Golden vectors under `packages/execution/contracts/execution-contract/` (contract bytes and digest, template resolution and its
  errors) recorded by `test/golden-recorders/execution-contract.recorder.mjs`.

## Steps

Commit the recorder; record vectors; red `engine/tests/contract.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test contract`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: contract digest bytes change, so replay of an in-flight assignment refuses. Landing precondition nothing in
flight; vectors pin bytes. Rollback: revert.
