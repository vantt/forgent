# Host Invocation checkpoint fresh-reader key

Author session: codex-session:1@2026-10-11
Pack commit: 76353c58eb885becc550d734fde5d7c2709cce33

Commit this key before either independent reader starts. Readers receive only the three scenario prompts, the six DoD questions and the area-only reading restriction; do not show them this key or the full review brief. The author has seen the targets and cannot be a fresh reader.

Use the scoring rule of reports/phase-05/pilot-b-fresh-reader-key.md: a supported existing path#anchor, no legacy path as authority, at least 5/6 correct per scenario, zero fabricated anchors, at most eight files before the first correct owner. Two owner-started fresh sessions; record the key commit, files read and each answer. A candidate design is not an implemented runtime promise. Equivalent supported anchors are acceptable. All answers must come from docs/platform/host-invocation-routing/.

Six questions: first reading; kind of work; touched contract; risk; proof; learning left behind.

## Scenario A: change provider contract version compatibility

| Q | Required distinction | Acceptable owner |
|---|---|---|
| 1 | Area portal, then contract versioning and provider protocol | README.md; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning |
| 2 | Contract compatibility change, not merely moving an implementation helper | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning |
| 3 | Independent request/outcome versions and an exact pair; range intersection/transforms are selected design, not implemented here | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning |
| 4 | Do not invent or best-effort coerce a version; refusal/selected pair must remain explicit | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te |
| 5 | Actual pair-routing/refusal and adapter conformance proof; no inferred all-suite green or measured placeholder budget | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning; docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table |
| 6 | Update the affected contract and compatibility requirements, preserving the distinction between implemented matching and selected future negotiation | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning; docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table |

## Scenario B: change how the Rust host finds the Node payload

| Q | Required distinction | Acceptable owner |
|---|---|---|
| 1 | Portal/spec, then release boundary and transition architecture | README.md; spec.md; docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea |
| 2 | Release-owned adapter/compatibility boundary change, not a new outer CLI | architecture/legacy-cli-transition.md; docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea |
| 3 | Manifest components.legacyNode.root/entry ownership; separate compatibility channels keep the private entry/header and runner mapping | intent-preservation-ledger.md; docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea |
| 4 | No PATH/cwd/unconfined payload search; the dated npm-bin-removal clause is expressly obsolete, not the current contract | intent-preservation-ledger.md; docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea |
| 5 | Real adapter argv/stdio/path-confinement and compatibility behavior, not a claimed install or activation run | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case; docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table |
| 6 | Record the changed release/compatibility decision and update the owner contract; retain the dated snapshot rather than treating its removed-bin promise as current | docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea; architecture/legacy-cli-transition.md |

## Scenario C: migrate one complete Node operation to a native provider

| Q | Required distinction | Acceptable owner |
|---|---|---|
| 1 | Portal, migration architecture and repeat procedure | README.md; architecture/node-to-rust-migration.md; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure |
| 2 | Complete use-case migration under the permanent host boundary, not a repository-wide rewrite | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure |
| 3 | Node and Rust adapters preserve the same complete semantic operation; Router snapshot/linking is separate from a migration checklist | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case; docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula |
| 4 | Preserve refusal, effects and rollback; constructor duplicate checks are implemented but the full selected Linker procedure is not asserted as runtime automation | docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets |
| 5 | Shared semantic fixtures and real refusal/conformance/rollback evidence; the repeat procedure is manual selected guidance and benchmark budgets remain unproven | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness; docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table |
| 6 | Update migration/proof records and the relevant contract, retain the remaining legacy route honestly and record the reviewed outcome | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets |

UNPROVEN: no reader has run and no score is claimed. The key is a scoring constraint, not an approval or evidence that every current paragraph is true.
