# Fresh reader 2 (host-invocation-routing)

Base path prefix for citations: docs/platform/host-invocation-routing/

General note: the area has no explicit risk-rating rubric; "risk" is answered only from status labels and release gates. Many contract/architecture files carry large "Restored ..." verbatim sections; their "Checked status" lines say what is implemented vs selected design.

## Scenario A: change provider contract version compatibility

### Files read (ordered)
1. README.md (first citeable document for Q1)
2. contracts/README.md
3. contracts/operation-provider.md
4. contracts/external-provider-manifest.md
5. contracts/operation-catalog.md
6. contracts/component-protocol.md
7. spec.md (grep/section headings)
8. verification/implementation-alignment.md
9. architecture/release-boundaries.md
10. decisions/README.md

| Q | Answer | Citation |
|---|---|---|
| 1 Read first | Portal read-first table, then the contracts index; the version rule lives in component-protocol.md and operation-catalog.md. | docs/platform/host-invocation-routing/README.md#2-read-first ; docs/platform/host-invocation-routing/contracts/README.md#1-contracts |
| 2 Kind of work | A contract change in the contract area, touching `ContractRef`/version matching and the external handshake protocol range. It is a change to a normative boundary, not a pure implementation fix. | docs/platform/host-invocation-routing/contracts/README.md#2-rule |
| 3 Contract touched | Operation catalog (version matching), component protocol (versioned independently of `fgos.v1`; handshake confirms protocol range and operation/contract pairs), and the restored contract-versioning text (exact version pair chosen from host/provider range intersection, no best-effort coercion). | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning ; docs/platform/host-invocation-routing/contracts/component-protocol.md#1-contract |
| 4 Risk | Not found as an explicit rating. Evidence of elevated risk: only exact version-pair matching is implemented; range intersection and registered up/downgrade transforms are selected design, not implemented. Incompatible-contract is a closed fail-closed failure family, so a mistake changes failure behavior. | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning ; docs/platform/host-invocation-routing/contracts/operation-request-outcome.md#1-contract |
| 5 Proof | Implementation-alignment rows give the model: Rust tests such as `cargo test -p fgos-host-runtime -p fgos --quiet`, and R2 conformance proof (incompatible-contract claims refused). A new row/proof for range intersection is not yet defined (design, not implemented) -- no specific acceptance test is named. | docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table ; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning |
| 6 Learning left behind | Settled decision goes to decisions/ as an explicit record when it locks provider protocol compatibility; current behavior facts go to spec.md; proof snapshot to verification/; update the contract's own Implementation Alignment table. | docs/platform/host-invocation-routing/decisions/README.md#2-decision-placement-rule ; docs/platform/host-invocation-routing/contracts/README.md#2-rule |

## Scenario B: change how the Rust host finds the Node payload

### Files read (ordered)
1. README.md
2. contracts/README.md
3. contracts/legacy-payload.md (first doc cited for Q1/Q3)
4. architecture/legacy-cli-transition.md
5. spec.md (section 5)
6. architecture/release-boundaries.md
7. verification/implementation-alignment.md
8. decisions/README.md

| Q | Answer | Citation |
|---|---|---|
| 1 Read first | Portal row "Understand Node compatibility during transition", then the legacy-payload contract, which holds the resolution rule. | docs/platform/host-invocation-routing/README.md#2-read-first ; docs/platform/host-invocation-routing/contracts/legacy-payload.md#2-resolution-rule |
| 2 Kind of work | Change to a `legacy-current` contract with an implemented-preview manifest binding; it also crosses into Packaging-Distribution (release manifest owns `components.legacyNode.root/entry`; installation/activation is not this area). | docs/platform/host-invocation-routing/contracts/README.md#1-contracts ; docs/platform/host-invocation-routing/README.md#1-purpose-and-audience |
| 3 Contract touched | Legacy payload contract: host resolves `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)`, never via PATH, cwd, hardcoded path, or alternate bin; `bin/fgos.mjs` stays unmoved. Also the release manifest contract in packaging-distribution (outside this area; not read). | docs/platform/host-invocation-routing/contracts/legacy-payload.md#2-resolution-rule ; docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-preserved-rules |
| 4 Risk | Not found as an explicit rating. Elevated signals: this is the path all 70 `legacy-cli` selectors use, the legacy lane bypasses `InvocationService`, and R1 preview is the installed default Rust host with a 30-day fallback window. | docs/platform/host-invocation-routing/architecture/release-boundaries.md#2-open-release-decisions ; docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table |
| 5 Proof | Alignment rows: R1 proof (`cargo test -p fgos-host-runtime -p fgos --quiet`, `node --test test/rust-host/command-routes.test.mjs`), apps/fgos cli tests, and packaging install-and-release proof; legacy-payload's own alignment table says manifest-owned resolution stays until zero legacy routes and removal gates pass. | docs/platform/host-invocation-routing/contracts/legacy-payload.md#4-implementation-alignment ; docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table |
| 6 Learning left behind | Update the legacy-payload alignment table, spec.md for current behavior, a decision record in decisions/ if it changes durable legacy compatibility policy; keep the packaging-side manifest doc in step. | docs/platform/host-invocation-routing/decisions/README.md#2-decision-placement-rule ; docs/platform/host-invocation-routing/contracts/legacy-payload.md#4-implementation-alignment |

## Scenario C: migrate one complete Node operation to a native provider

### Files read (ordered)
1. README.md
2. contracts/README.md
3. architecture/README.md
4. architecture/node-to-rust-migration.md (first doc cited for Q1)
5. contracts/component-protocol.md (restored per-component procedure)
6. architecture/legacy-cli-transition.md
7. spec.md (section 5)
8. verification/implementation-alignment.md
9. architecture/release-boundaries.md
10. decisions/README.md

| Q | Answer | Citation |
|---|---|---|
| 1 Read first | Portal row "Understand migration sequence", then the migration architecture doc's Migration Rules. | docs/platform/host-invocation-routing/README.md#2-read-first ; docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#2-migration-rules |
| 2 Kind of work | Per-operation migration slice (a `planned` migration sequence; Rust-host-first is selected and implemented preview). Read-only operations come before writers; writer migration gates are only `planned`. | docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#2-migration-rules ; docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#4-implementation-alignment |
| 3 Contract touched | `OperationCatalog` entry (authored by the owning component), `OperationProvider`, request/outcome, and the per-selector `CommandRouteDescriptor` flip from `legacy-cli` to `native`; no `legacy.<verb>` ids; no double `fgos.v1` wrapping. Component-boundary check: ten-step procedure step 1. | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure ; docs/platform/host-invocation-routing/spec.md#5-legacy-compatibility-rule ; docs/platform/host-invocation-routing/contracts/operation-catalog.md#1-contract |
| 4 Risk | Not found as an explicit rating. Doc signals: reads low-risk first, writers need atomicity/replay/mutual-exclusion gates (planned, not implemented), never dual-run a write, keep Node implementation through an observation window, delete later. | docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#2-migration-rules ; docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets |
| 5 Proof | Shared semantic fixtures run against both providers, shadow only side-effect-free reads, switch after parity proof; plus the command-routes drift test and cargo tests; precedent: `gate-bypass` (implemented local proof) and Observe (implemented complete, native with no Node fallback). | docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure ; docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table ; docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#4-implementation-alignment |
| 6 Learning left behind | Add/adjust the alignment row, update route counts/spec status, add a decision record if durable policy changes (e.g. legacy compatibility after a gate closes), and remove Node implementation in a later cleanup change. Route counts (75 selectors, 70 legacy, five native) are a dated snapshot needing a recount. | docs/platform/host-invocation-routing/decisions/README.md#2-decision-placement-rule ; docs/platform/host-invocation-routing/spec.md#6-unknowns |
