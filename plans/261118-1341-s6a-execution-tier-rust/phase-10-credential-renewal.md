# Phase 10: credential renewal

Wave 3. Depends on: 3. Lands after 09. Effort 2d. Library only (engine module `credentials`).

## Context

`src/runner/dispatch/provider-credential-renewal.mjs` (1 488): copy credential files into a private home
(`copyCredentialFiles`), refresh-ahead, staging and write-back (`credentialWriteBackTarget`, `inventoryAccount`),
retained copies and pending-over-limit judgements, interrupted-staging sweep, `readCredentialExpiry`,
`DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS`; its `listLeftovers` is a local function over an account directory
(`:768`), not the checkout door's (V12). Users: the bwrap driver
(phase 08), finalize-home step (phase 14), rows `credential-copies-retained` (15) and the account rows (17),
`scripts/lib/mailbox-live-confined.mjs` (phase 20 seam). Spec: agent-confinement §9.3, component-boundary row
"Dispatch Transport & Confinement" (finalize-home only stages; refresh-ahead applies after the probe proves the account).

## Requirements

- `packages/execution/engine/src/credentials/` ports it; implements the copy trait the skeleton fixed for phase 08.
- Durable writes through `fgos-durable-file`; account lock through phase 09's module.
- Golden vectors under `packages/execution/contracts/credentials/` (expiry parsing, write-back target choice,
  retained-copy judgement) recorded by `test/golden-recorders/credentials.recorder.mjs` (committed); an integration
  test on a temp HOME for copy, stage and write-back.
- Rollback readability (F12): a credential home, staged copy or write-back Rust leaves is read by the previous Node
  release unchanged (same paths, same file names, same bytes); one reverse-read fixture is recorded for phase 22.

## Steps

Commit the recorder; record vectors; red `engine/tests/credentials.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test credentials`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: the only valid refresh token is lost (the row `credential-copies-retained` exists for this). Port the
retain-before-delete order exactly; integration test asserts a pending copy survives an interrupted staging. Rollback:
revert.
