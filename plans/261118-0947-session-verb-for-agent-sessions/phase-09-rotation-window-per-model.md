# Phase 9: Rotation measures against the model's real window

Backlog `p-cymvjb6nrc` (suspected). Evidence: [debugger report](reports/debugger-261118-2130-miu-early-hard-rotation.md)
§Q1 latent issue. Depends on phase 8 (shares the session-host crate and the rotation config).

## Inputs (read first)
- `packages/session-host/rust/src/rotation/measure.rs` (transcript fallback ~186-188, window source),
  `core/config-standard/sessionRotation.yaml` (`windowSize: 1000000`), schema, the model a head runs with
  (head-start / seat binding) and any context-sidecar writer.

## Steps
0. Prove the window first: the context window of the model the secretary head actually runs (model id as launched,
   including any `[1m]` variant), from the provider's own documentation or a measured run. Write the answer and its
   source into the phase report. If every head model has a 1M window, close the row as not a bug and stop here.
1. Otherwise the measure takes the window per model: from the context sidecar when present, else from a per-model
   window in the release standard (schema updated), else the global `windowSize`. Rust only.
2. One test covers a 200k model whose usage crosses soft where the 1M default would not.

## Verify
- `cargo test -p` the session-host crate; clippy; config schema/standard tests.

## Rollback
`git revert`; the global `windowSize` applies again.
