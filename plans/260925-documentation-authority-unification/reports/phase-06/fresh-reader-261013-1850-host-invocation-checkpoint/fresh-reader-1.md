# Fresh reader 1: docs/platform/host-invocation-routing

P = docs/platform/host-invocation-routing

Note: the docs have no explicit risk-rating rubric and no area "definition of done" section; Q4/Q5 answers are inferred from status labels and proof records, and say so.

## Scenario A: change provider contract version compatibility

### Files read (ordered)
1. (ls of directory)
2. README.md  <- first cited document for Q1
3. contracts/README.md
4. contracts/legacy-payload.md
5. contracts/operation-provider.md
6. decisions/README.md
7. verification/README.md
8. architecture/README.md
9. contracts/component-protocol.md (via grep + sed)
10. contracts/operation-catalog.md
11. verification/implementation-alignment.md, spec.md, release-boundaries.md (later)

| Q | Answer | Citation |
|---|--------|----------|
| 1 Read first | Start at the area portal's Read First table, then contracts/README.md; the versioning rule itself sits in component-protocol.md and operation-catalog.md (version matching). | docs/platform/host-invocation-routing/README.md#2-read-first ; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning |
| 2 Kind of work | A change to a normative host-invocation contract (provider/request-outcome versioning), not packaging. The portal says contracts are target boundaries and not implemented without proof; the portal's scope list covers provider selection and the external provider protocol. | docs/platform/host-invocation-routing/contracts/README.md#2-rule ; docs/platform/host-invocation-routing/README.md#1-purpose-and-audience |
| 3 Contract touched | OperationCatalog (version matching), OperationProvider/ProviderDescriptor (contract versions), request/outcome contracts, and the component protocol (versioned independently from `fgos.v1`). | docs/platform/host-invocation-routing/contracts/README.md#1-contracts ; docs/platform/host-invocation-routing/contracts/component-protocol.md#1-contract |
| 4 Risk | Not found as an explicit rating. Evidence of elevated risk: the docs say exact version-pair matching is implemented, but range intersection and registered transforms are only selected design, not implemented, so a change straddles implemented and unimplemented behavior. | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning |
| 5 Proof of done | No area-level done definition found. Per-claim proof lives in the implementation-alignment table (each claim needs a status and evidence), and R2 external-process conformance proof covers the protocol. Contracts "are not implemented without proof". | docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table ; docs/platform/host-invocation-routing/contracts/README.md#2-rule |
| 6 Learning left behind | A settled decision belongs in decisions/ as an ADR-style record (none promoted yet); current-behavior facts go to spec.md; proof snapshots go to verification/. | docs/platform/host-invocation-routing/decisions/README.md#2-decision-placement-rule |

## Scenario B: change how the Rust host finds the Node payload

### Files read (ordered)
1. (ls of directory)
2. README.md  <- first cited document for Q1 (its Read First row and Related list lead to the legacy transition docs)
3. contracts/README.md
4. contracts/legacy-payload.md  <- the owning contract
5. contracts/operation-provider.md, decisions/README.md, verification/README.md, architecture/README.md
6. architecture/legacy-cli-transition.md, verification/implementation-alignment.md, spec.md, verification/compatibility-harness.md, architecture/release-boundaries.md

| Q | Answer | Citation |
|---|--------|----------|
| 1 Read first | Portal's "Understand Node compatibility during transition" row, then the legacy-payload contract, which holds the resolution rule. | docs/platform/host-invocation-routing/README.md#2-read-first ; docs/platform/host-invocation-routing/contracts/legacy-payload.md#2-resolution-rule |
| 2 Kind of work | Change to a legacy-current plus implemented-preview contract (the `legacy-cli` lane / transitional compatibility). Installing and activating the runtime and release manifest belong to Packaging-Distribution, so the manifest side may be a cross-area change. | docs/platform/host-invocation-routing/README.md#4-ownership-boundary ; docs/platform/host-invocation-routing/contracts/README.md#1-contracts |
| 3 Contract touched | legacy-payload.md (resolution is `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)`, never PATH, cwd, hardcoded path, or alternate bin), the release manifest contract in packaging-distribution, and CommandRouteDescriptor for `legacy-cli` selectors. | docs/platform/host-invocation-routing/contracts/legacy-payload.md#2-resolution-rule ; docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-preserved-rules |
| 4 Risk | Not found as an explicit rating. Indicators: 70 of 75 selectors still use this lane, `bin/fgos.mjs` must not be moved or renamed, and the compatibility harness requires byte-identical Node vs Rust behavior. | docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table ; docs/platform/host-invocation-routing/verification/compatibility-harness.md#1-required-proof |
| 5 Proof of done | Compatibility harness parity (identical argv/stdin/cwd/env, stdout/stderr bytes, exit status) plus the R1 proof record. The legacy-payload alignment table lists the manifest-locates-payload claim as implemented preview with R1 proof as evidence. | docs/platform/host-invocation-routing/verification/compatibility-harness.md#2-coverage ; docs/platform/host-invocation-routing/contracts/legacy-payload.md#4-implementation-alignment |
| 6 Learning left behind | Update the alignment rows; a durable policy change goes to decisions/ (none exist yet); current-behavior facts go to spec.md. Fallback-window facts (30 days, earliest removal 2026-10-18) are recorded in spec unknowns and compatibility harness. | docs/platform/host-invocation-routing/decisions/README.md#2-decision-placement-rule ; docs/platform/host-invocation-routing/spec.md#6-unknowns |

## Scenario C: migrate one complete Node operation to a native provider

### Files read (ordered)
1. (ls of directory)
2. README.md  <- first cited document for Q1
3. contracts/README.md, contracts/legacy-payload.md, contracts/operation-provider.md, decisions/README.md, verification/README.md, architecture/README.md
4. contracts/operation-catalog.md, contracts/command-route-descriptor.md
5. architecture/node-to-rust-migration.md  <- owns the migration rules
6. contracts/component-protocol.md (restored ten-step procedure), verification/implementation-alignment.md, roadmap.md headings

| Q | Answer | Citation |
|---|--------|----------|
| 1 Read first | Portal Read First row "Understand migration sequence", then node-to-rust-migration.md for rules and the roadmap's native-read-route phase. | docs/platform/host-invocation-routing/README.md#2-read-first ; docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#2-migration-rules |
| 2 Kind of work | Per-operation Node-to-Rust migration under the selected "Rust host first, Node as legacy lane" direction: a complete operation/use-case boundary, read-only before writers (writer migration is planned only). | docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#1-selected-direction |
| 3 Contract touched | OperationCatalog (new OperationId), OperationProvider, request/outcome contracts, and CommandRouteDescriptor (flip selector from `legacy-cli` to `native`, exactly one active route). Component boundary check also applies (step 1 of the procedure; the alignment table notes "no component-boundary change" per slice). | docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#1-contract ; docs/platform/host-invocation-routing/contracts/operation-catalog.md#1-contract |
| 4 Risk | Not found as an explicit rating. Readers can infer: read-only is lower risk (`gate-bypass` exit condition: no writes, no Node spawn); writers need atomicity/replay/mutual-exclusion gates (planned, not implemented); never dual-run a write; a native provider must return `parked`, never block on a human. | docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#2-migration-rules ; docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#4-implementation-alignment |
| 5 Proof of done | Run both providers against shared fixtures, shadow only side-effect-free reads, switch after parity proof, observe the rollback window; drift tests on command-routes.json and the compatibility harness. This ten-step procedure is manual guidance, not registered automation (stated in the doc). | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure ; docs/platform/host-invocation-routing/verification/compatibility-harness.md#2-coverage |
| 6 Learning left behind | Add/refresh the implementation-alignment row (e.g. the `gate-bypass` row is the worked example and Observe is listed as fully migrated), update the route count in spec unknowns, and record Node removal only after zero routes remain plus proof. Settled policy goes to decisions/. | docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table ; docs/platform/host-invocation-routing/spec.md#6-unknowns |

## Candidate vs implemented distinctions noticed
- Candidate/planned: range intersection and registered transforms for contract versioning; writer migration; chat host; production WASM; stable/default graduation.
- Implemented preview: R1 Rust host, R2 external process fixture provider, R3 `GET /v1/runtime`.
- Navigation friction: many "Restored ..." sections are appended verbatim and sit inside unrelated files (the migration ten-step procedure lives in contracts/component-protocol.md, not in node-to-rust-migration.md, which only points to it).
