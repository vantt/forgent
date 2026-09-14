# Host Invocation Documentation Standardization Plan

```txt
Document type: Migration plan
Audience: Human reviewer, architect, documentation agent, implementation agent
Purpose: Plan the rewrite of host-invocation docs into the new documentation system without losing settled legacy detail
Design status: Draft
Implementation: Not started
Provenance: Created from documentation-system discussion and scan of existing host-invocation / agent-coordination docs
Writer type: Human + agent coauthor
Canonical for: Planning the host-invocation documentation migration only
Use this when: Rewriting or reviewing host-invocation docs under the new docs/platform structure
Do not use this for: Current runtime behavior, accepted architecture authority, or implementation truth
Last reviewed: 2026-09-14
Related:
- docs/doc-governance.md
- docs/platform/README.md
- docs/platform/component-boundary.md
- docs/architect/host-invocation-routing/host-invocation-provider-routing.md
- docs/architect/agent-coordination/intent-preservation-ledger.md
```

This plan exists because the packaging-distribution rewrite exposed a real
failure mode: a new, clearer document shape can accidentally drop technical or
architectural details that were already settled in older docs.

## Migration Status Note

This document is a legacy migration-plan source during the 2026-09-14 promotion
pass. The promoted platform area is
[docs/platform/host-invocation-routing/](../../platform/host-invocation-routing/README.md).
Use [source-inventory.md](../../platform/host-invocation-routing/history/source-inventory.md)
and [intent-preservation-ledger.md](../../platform/host-invocation-routing/intent-preservation-ledger.md)
to verify what moved where.

For host-invocation, the migration must preserve every settled claim before it
improves structure. New style is valuable only if it keeps old intent,
legacy/current distinctions, implementation status, and future accepted targets
visible.

## 1. Goal

Rewrite host-invocation documentation into the new documentation system while
preserving the full detail of the existing architecture documents.

The result should help a human reviewer and an agent answer:

- what host-invocation owns;
- how it differs from packaging-distribution, agent-coordination, gateway,
  dispatch, and work-state;
- what is current, legacy, accepted-not-implemented, planned, or superseded;
- which old details were promoted where;
- which legacy paths must continue to exist during the Node-to-Rust transition;
- which implementation proofs are needed before a claim is considered shipped.

## 2. Non-Goals

- Do not migrate implementation code.
- Do not decide new runtime architecture.
- Do not collapse host-invocation into packaging-distribution or
  agent-coordination.
- Do not delete old docs during the first rewrite pass.
- Do not convert advisory claims into implemented truth.
- Do not rewrite agent-coordination in the same pass; use it as the reference
  documentation pattern, then plan its own migration separately.

## 3. Hard Migration Rules

| Rule | Meaning |
|---|---|
| Preserve before polish | Every meaningful old claim gets a target, status, or explicit retirement note before prose is simplified. |
| Status is mandatory | Each claim is labeled as `implemented`, `partial`, `accepted-not-implemented`, `planned`, `legacy-current`, `superseded`, or `unknown`. |
| Legacy can remain live | A legacy path can be correct current behavior during transition. Do not hide it merely because the target architecture is cleaner. |
| Accepted-but-unbuilt is not current behavior | Accepted direction must be recorded as such, with implementation status and proof gap. |
| Old docs stay source material | Existing docs remain historical/current sources until redirected or drained. |
| No silent summarization | If a detail is omitted from the new docs, the migration ledger must say whether it was superseded, rejected, merged elsewhere, or intentionally deferred. |
| Component boundary check | Any ownership or layer change updates [component-boundary.md](../../platform/component-boundary.md) or records `No component-boundary change`. |
| Linkable graph | Related files must appear as clickable links in body sections, not only in fenced metadata. |
| H1 invariant | Each document has exactly one H1 title; sections start at H2. |

## 4. Source Inventory

### 4.1. Host-Invocation Sources

| Source | Current role | Must preserve |
|---|---|---|
| [host-invocation-provider-routing.md](host-invocation-provider-routing.md) | Main architecture / kernel contract | Operation Provider Router, peer host use cases, OperationRequest/ProviderOutcome boundary, OperationCatalog, RegistrySnapshot, two-stage authority, failure lifecycle, R1/R2/R3 release boundaries, open questions. |
| [external-provider-protocol.md](external-provider-protocol.md) | External provider / plugin protocol | Component class vs invocation mechanism, built-in/process/WASM distinctions, framed JSON-RPC over stdio, manifest discovery without execution, registry linker, namespace rules. |
| [legacy-cli-transition.md](legacy-cli-transition.md) | Transitional CLI lane | LegacyCliPassthroughProvider vs LegacySemanticProvider, Node payload identity, `CommandRouteDescriptor`, old path callers, parser ownership, `fgos.v1` presentation boundary, release rollback through `fgctl`. |
| [node-to-rust-component-migration.md](node-to-rust-component-migration.md) | Migration direction | Rust host first, Node as legacy payload, near/partly/not-thin candidates, R1/R2/R3 sequence, read-before-writer migration, writer gates, Node removal conditions. |
| [rust-cli-and-proof-components-plan.md](rust-cli-and-proof-components-plan.md) | Execution plan | P0-P9 delivery graph, compatibility harness, command-route descriptor proof, Rust workspace, external process preview, remote peer, performance gates, verification gates. |

### 4.2. Cross-Area Sources

| Source | Why it matters |
|---|---|
| [../../platform/intent-preservation-ledger.md](../../platform/intent-preservation-ledger.md) | Platform-level guardrail for preventing simplified implementation slices from becoming the accidental long-term direction. |
| [../../platform/component-boundary.md](../../platform/component-boundary.md) | Host-invocation is a platform component boundary; ownership changes must be reflected. |
| [../component-boundary/component-boundary-advisory.md](../component-boundary/component-boundary-advisory.md) | Current detailed component-boundary source during migration. |
| [../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) | Packaging owns runtime identity, activation, release store, `fgctl`, rollback. Host-invocation consumes this; it must not redefine it. |
| [../../platform/packaging-distribution/architecture/future-constraints.md](../../platform/packaging-distribution/architecture/future-constraints.md) | Future shared gateway and Project Runtime Adapter constraints affect remote host shape. |
| [../../specs/runner.md](../../specs/runner.md) | Dispatch and runner vocabulary currently overlap with host-invocation concerns. |
| [../../routing-handoff-contract.md](../../routing-handoff-contract.md) | Agent-to-agent handoff and trust boundary may intersect host invocation and dispatch. |

### 4.3. Agent-Coordination Reference Pattern

Host-invocation should copy the documentation discipline from
agent-coordination, not necessarily its exact tree size.

| Reference | Pattern to reuse |
|---|---|
| [../agent-coordination/README.md](../agent-coordination/README.md) | Portal with current accepted baseline, active design frontier, invariants, maintenance rules. |
| [../agent-coordination/intent-preservation-ledger.md](../agent-coordination/intent-preservation-ledger.md) | Explicit preservation ledger for deferred/implemented/superseded/rejected intent. |
| [../agent-coordination/documentation-governance.md](../agent-coordination/documentation-governance.md) | Local doc-governance rules for a complex area. |
| [../agent-coordination/architecture/README.md](../agent-coordination/architecture/README.md) | Accepted architecture index separating accepted docs from proposals. |
| [../agent-coordination/contracts/README.md](../agent-coordination/contracts/README.md) | Contract index that prevents proposals from masquerading as accepted contracts. |
| [../agent-coordination/decisions/README.md](../agent-coordination/decisions/README.md) | Decision navigation and implementation notes. |
| [../agent-coordination/verification/README.md](../agent-coordination/verification/README.md) | Evidence/proof as first-class material, not hidden in prose. |

## 5. Target Structure

Create this target area only after the preservation ledger is drafted.

```txt
docs/platform/host-invocation-routing/
  README.md
  intent-preservation-ledger.md
  spec.md
  vision.md
  architecture/
    invocation-kernel.md
    host-use-cases.md
    provider-routing.md
    external-provider-protocol.md
    legacy-cli-transition.md
    node-to-rust-migration.md
    release-boundaries.md
  contracts/
    operation-catalog.md
    operation-provider.md
    operation-request-outcome.md
    command-route-descriptor.md
    legacy-payload.md
    external-provider-manifest.md
    component-protocol.md
  verification/
    implementation-alignment.md
    r1-rust-host-proof.md
    r2-external-process-proof.md
    r3-remote-peer-proof.md
    compatibility-harness.md
  decisions/
  history/
    host-invocation-baseline.md
```

This is a proposed target shape. It is not accepted merely because this plan
names it. The first migration pass may merge or split files if the ledger proves
a better shape.

## 6. Required Preservation Ledger

Before writing target docs, create
`docs/platform/host-invocation-routing/intent-preservation-ledger.md`.

Minimum ledger columns:

| Field | Meaning |
|---|---|
| `ID` | Stable `HI-I###` identifier. |
| `Claim / intent` | One preserved architectural or migration claim. |
| `Source` | Exact old file and section. |
| `Status` | `implemented`, `partial`, `accepted-not-implemented`, `planned`, `legacy-current`, `superseded`, `unknown`. |
| `Target doc` | New canonical destination. |
| `Must not lose` | Specific detail that must survive simplification. |
| `Proof / gap` | Evidence link or required verification. |

Initial ledger buckets:

| Bucket | Example details to preserve |
|---|---|
| Invocation kernel | `OperationId`, `HostInvocation`, `OperationRequest`, `ContractRef`, `ProviderOutcome`, `ProviderError`, `OperationProvider`, `ProviderDescriptor`, `OperationDescriptor`, `OperationCatalog`, `RegistrySnapshot`, `InvocationService`. |
| Host peer model | CLI, remote, and chat are peers; one does not wrap or shell through another after migration. |
| Transitional CLI lane | `legacy-cli` path bypasses `InvocationService`; native path builds `OperationRequest`. |
| Legacy payload identity | `legacy-node` identity; `bin/fgos.mjs` remains unmoved in source tree; release manifest locates payload. |
| Legacy adapter split | `LegacyCliPassthroughProvider` is CLI-only; `LegacySemanticProvider` is semantic and only introduced per operation when needed. |
| Authority | caller admission before routing, selected-provider grant after routing; provider manifests never grant authority. |
| External provider protocol | static manifest discovery, no code execution during discovery, framed protocol, handshake, cancellation/backpressure, completion-unknown behavior. |
| Provider replacement | configuration can never replace built-in providers; replacement policy must be explicit. |
| Presentation boundary | `fgos.v1`, HTTP, MCP, and chat results are presenter outputs, not provider outcomes. |
| Human input | providers return parked outcome; they never block waiting for a person. |
| R1/R2/R3 | Rust CLI host, external process preview, production remote peer; what each gates and does not gate. |
| Migration order | reads before writers, no write dual-run, Node removal only after zero remaining routes and replay compatibility. |
| Packaging dependency | `fgctl` owns acquire/stage/verify/activate/upgrade/rollback; host-invocation routes inside the active runtime. |

## 7. Target Document Responsibilities

| Target doc | Owns | Must not own |
|---|---|---|
| `README.md` | Area portal, read-first route, current baseline, status summary. | Deep contracts or long rationale. |
| `vision.md` | Durable direction: why host-invocation exists and how it supports peer hosts/provider routing. | Current detailed behavior or proof. |
| `spec.md` | Current behavior and migration state: what works today, what remains legacy, what is partial. | Future architecture not yet accepted. |
| `architecture/invocation-kernel.md` | Router/InvocationService shape, semantic request/outcome boundary, lifecycle. | External provider wire details. |
| `architecture/host-use-cases.md` | CLI/remote/chat peer model and presenter/projector separation. | Provider protocol internals. |
| `architecture/provider-routing.md` | Provider selection, registry snapshot, catalog ownership, authority gates. | Packaging acquisition/activation. |
| `architecture/external-provider-protocol.md` | External process/WASM provider architecture and registry linker. | Built-in provider semantics beyond shared contracts. |
| `architecture/legacy-cli-transition.md` | Transitional legacy CLI lane and Node payload bridge. | Long-term native provider behavior. |
| `architecture/node-to-rust-migration.md` | Migration sequence and coexistence rules. | Low-level proof checklist. |
| `contracts/*` | Normative schemas, obligations, compatibility and error rules. | Broad rationale. |
| `verification/*` | Evidence, test gates, proof gaps, implementation alignment. | New architecture claims. |
| `history/host-invocation-baseline.md` | Old source summary and supersession map. | Current authority. |

## 8. Migration Phases

### 8.1. Phase 0: Freeze The Baseline

1. Read every source in §4.
2. Generate a source inventory with file path, document role, status, and target
   destination.
3. Create the preservation ledger with all obvious `HI-I###` entries.
4. Mark unknown implementation status as `unknown`; do not guess.
5. Record `No component-boundary change` or update the boundary map if the new
   area/component naming changes.

Exit gate:

- No source document is unclassified.
- Every old doc has a migration disposition: promote, split, keep legacy,
  redirect, archive, or still-open.

### 8.2. Phase 1: Create Skeleton Without Rewriting Meaning

1. Create `docs/platform/host-invocation-routing/README.md`.
2. Create `intent-preservation-ledger.md`.
3. Create empty or stub target docs with metadata, H1 title, H2 sections, and
   linkable `Related Files`.
4. Add implementation-alignment tables before prose is filled in.
5. Link the area from [docs/platform/README.md](../../platform/README.md) only
   after the portal can route readers honestly.

Exit gate:

- A human can enter the new area and see what is canonical, legacy-current,
  draft, or not yet migrated.

### 8.3. Phase 2: Promote Current / Legacy-Current State

Write `spec.md` first.

It must explicitly separate:

| Status | Example |
|---|---|
| `current legacy behavior` | Existing Node CLI payload still handles most selectors. |
| `current partial target` | Any Rust host/runtime pieces already implemented. |
| `accepted-not-implemented` | Peer host model, provider router, external provider protocol pieces that are design direction but not shipped. |
| `planned` | R2/R3 or future chat/WASM/gateway work. |
| `superseded` | Any old transition notes no longer valid after packaging-distribution decisions. |

Exit gate:

- The new `spec.md` does not read like everything is already built.
- Legacy behavior is not hidden.

### 8.4. Phase 3: Promote Architecture

Promote architecture in this order:

1. invocation kernel;
2. host use cases;
3. provider routing and authority;
4. legacy CLI transition;
5. external provider protocol;
6. Node-to-Rust migration;
7. release boundaries.

For every promoted section, update the ledger row from `target pending` to
`promoted`, and link the exact target heading.

Exit gate:

- Every important claim from the old architecture docs appears either in a new
  architecture doc, in a contract, in verification, or in history with an
  explicit disposition.

### 8.5. Phase 4: Extract Contracts

Contracts should be written only after the architecture pass identifies what is
normative.

Minimum contracts:

- Operation catalog and operation id naming;
- Operation request/outcome and contract ref;
- Operation provider descriptor and invocation contract;
- Command route descriptor;
- Legacy payload identity and resolution;
- External provider manifest;
- Component protocol framing and lifecycle;
- Provider error families and invocation lifecycle records.

Exit gate:

- Contract docs avoid broad rationale and use normative language.
- Architecture docs link to contracts instead of duplicating schemas.

### 8.6. Phase 5: Verification And Implementation Alignment

Create verification docs before retiring old plans.

Minimum evidence surfaces:

- implementation alignment table;
- R1 Rust host proof gates;
- R2 external process proof gates;
- R3 remote peer proof gates;
- command-route descriptor / compatibility harness proof;
- legacy payload caller inventory;
- Node removal gate.

Exit gate:

- Every accepted target has an implementation status and proof/gap link.
- Every old execution-plan detail either remains in verification or is marked
  historical.

### 8.7. Phase 6: Redirect Or Retain Legacy Docs

After review:

1. Add status notes to old docs.
2. Convert old docs into historical source notes or redirect stubs.
3. Keep detailed old docs live if they still contain canonical detail not yet
   promoted.
4. Do not delete until the ledger says `drained`.

Exit gate:

- A reader opening an old path can tell whether it is current authority,
  migration source, or retired history.

## 9. Agent-Coordination Follow-Up

Agent-coordination is larger and already better organized than
host-invocation. Do not flatten it merely to match host-invocation.

After host-invocation proves the migration method, create a separate
agent-coordination standardization plan that:

- preserves the existing [intent-preservation-ledger.md](../agent-coordination/intent-preservation-ledger.md);
- maps accepted architecture/contracts/ADRs/verification into
  `docs/platform/agent-coordination/`;
- keeps proposals and playbooks explicitly non-canonical;
- preserves implementation records and verification proof trees;
- avoids promoting Step 09 / Step 10 proposals into accepted contracts before
  review;
- maintains the existing distinction between foundation identity, protocol
  model, runtime model, work integration, dispatch, evidence, visibility, and
  recovery proposals.

The important lesson is reusable: each area needs an intent-preservation ledger
before prose cleanup.

## 10. Review Checklist

Before approving the rewritten host-invocation docs, answer:

1. Does every source in §4 have a disposition?
2. Does every `HI-I###` ledger entry point to a target doc or explicit
   deferred/superseded decision?
3. Can a reader distinguish current shipped behavior from accepted target
   architecture?
4. Are legacy paths called legacy while still allowed to remain live?
5. Are accepted-but-unbuilt claims marked with implementation gaps?
6. Are packaging-distribution and host-invocation boundaries clear?
7. Are agent-coordination, dispatch, gateway, and work-state boundaries clear?
8. Are related files linkable?
9. Does every document have exactly one H1 title and H2+ sections?
10. Did the rewrite update or explicitly not change the component-boundary map?

## 11. Open Questions

| Question | Needed before |
|---|---|
| Is `host-invocation` the final area name, or should it be `host-runtime`, `invocation-routing`, or another name? | Creating target directory. |
| Should the preservation ledger live permanently, or drain into history after migration? | Phase 6. |
| Which host-invocation claims are already implemented in current Rust/distribution code? | Phase 2 implementation alignment. |
| Does `rust-cli-and-proof-components-plan.md` stay as a plan, become verification history, or split into multiple verification docs? | Phase 5. |
| Which old docs should remain as compatibility references during the Node transition? | Phase 6. |

## 12. Related Files

| Relationship | File |
|---|---|
| governs documentation system | [../../doc-governance.md](../../doc-governance.md) |
| platform portal | [../../platform/README.md](../../platform/README.md) |
| platform intent ledger | [../../platform/intent-preservation-ledger.md](../../platform/intent-preservation-ledger.md) |
| component-boundary anchor | [../../platform/component-boundary.md](../../platform/component-boundary.md) |
| main old host-invocation architecture | [host-invocation-provider-routing.md](host-invocation-provider-routing.md) |
| external provider source | [external-provider-protocol.md](external-provider-protocol.md) |
| legacy CLI transition source | [legacy-cli-transition.md](legacy-cli-transition.md) |
| node-to-rust migration source | [node-to-rust-component-migration.md](node-to-rust-component-migration.md) |
| implementation plan source | [rust-cli-and-proof-components-plan.md](rust-cli-and-proof-components-plan.md) |
| agent-coordination preservation pattern | [../agent-coordination/intent-preservation-ledger.md](../agent-coordination/intent-preservation-ledger.md) |
