# Phase 10: credential renewal

Wave 3. Depends on: 3. Lands after 09. Effort 2d. Library only (engine module `credentials`).

## Context

`src/runner/dispatch/provider-credential-renewal.mjs` (1 488): copy credential files into a private home
(`copyCredentialFiles`), refresh-ahead, staging and write-back (`credentialWriteBackTarget`, `inventoryAccount`),
retained copies and pending-over-limit judgements, interrupted-staging sweep, `readCredentialExpiry`,
`DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS`; it calls `listLeftovers` of the checkout door. Users: the bwrap driver
(phase 08), finalize-home step (phase 14), rows `credential-copies-retained` (15) and the account rows (17),
`scripts/lib/mailbox-live-confined.mjs` (phase 20 seam). Spec: agent-confinement §9.3, component-boundary row
"Dispatch Transport & Confinement" (finalize-home only stages; refresh-ahead applies after the probe proves the account).

## Requirements

- `packages/execution/engine/src/credentials/` ports it; implements the copy trait the skeleton fixed for phase 08.
- Durable writes through `fgos-durable-file`; account lock through phase 09's module.
- `listLeftovers` through `fgos-checkout` (phase 04's function).
- Golden vectors `packages/execution/contracts/credentials.v1.json` (expiry parsing, write-back target choice,
  retained-copy judgement) recorded from Node; an integration test on a temp HOME for copy, stage and write-back.

## Steps

Record vectors; red `engine/tests/credentials.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test credentials`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: the only valid refresh token is lost (the row `credential-copies-retained` exists for this). Port the
retain-before-delete order exactly; integration test asserts a pending copy survives an interrupted staging. Rollback:
revert.

Dependency note: needs phase 04's `listLeftovers` in `fgos-checkout` (wave 2, landed before wave 3).
