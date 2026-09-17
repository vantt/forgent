# Host Invocation

```txt
Document type: Area portal
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs
Design status: Draft
Implementation status: Preview installed/default proof plus partial route migration
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/architect/host-invocation-routing/**
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/vision.md
- docs/platform/host-invocation-routing/intent-preservation-ledger.md
- docs/platform/host-invocation-routing/spec.md
- docs/platform/host-invocation-routing/roadmap.md
- docs/platform/host-invocation-routing/architecture/invocation-kernel.md
- docs/platform/host-invocation-routing/architecture/provider-routing.md
- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md
- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md
- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
- docs/platform/host-invocation-routing/history/source-inventory.md
- docs/platform/host-invocation-routing/verification/source-preservation-audit.md
- docs/platform/host-invocation-routing/decisions/README.md
```

## 1. Purpose And Audience

Host invocation defines how a selected fgOS runtime accepts a request from a host surface, normalizes it into a semantic operation when the route is native, selects a provider, grants capability, invokes the provider, records lifecycle evidence, and projects the result back to the caller.

Use this area when work touches:

- CLI, remote, or chat host entry behavior after a runtime is selected;
- `OperationId`, `HostInvocation`, `OperationRequest`, `ProviderOutcome`, or `InvocationService`;
- provider selection, `OperationCatalog`, `RegistrySnapshot`, or replacement policy;
- external process or WASM provider protocol;
- transitional Node CLI passthrough and `CommandRouteDescriptor`;
- Rust host migration sequence and proof gates.

Do not use this area to decide how a runtime is installed, activated, upgraded, or rolled back. Those concerns belong to [Packaging-Distribution](../packaging-distribution/README.md).

## 2. Read First

| Reader goal | Read |
| --- | --- |
| Understand the full direction | [vision.md](vision.md) |
| Check preserved legacy intent and dispositions | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Understand current, legacy-current, planned, and unknown behavior | [spec.md](spec.md) |
| Plan remaining work after R1 preview installed/default proof | [roadmap.md](roadmap.md) |
| Plan R2 external process provider preview implementation | [r2-external-process-rollout-plan.md](r2-external-process-rollout-plan.md) |
| Plan R3 remote peer implementation | [r3-remote-peer-rollout-plan.md](r3-remote-peer-rollout-plan.md) |
| Understand invocation kernel shape | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Understand CLI, remote, and chat peer hosts | [architecture/host-use-cases.md](architecture/host-use-cases.md) |
| Understand provider selection and authority | [architecture/provider-routing.md](architecture/provider-routing.md) |
| Understand external process/WASM provider direction | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) |
| Understand Node compatibility during transition | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| Understand migration sequence | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) |
| Understand release boundaries and gates | [architecture/release-boundaries.md](architecture/release-boundaries.md) |
| Check implementation status and proof gaps | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| Check source preservation | [history/source-inventory.md](history/source-inventory.md), [verification/source-preservation-audit.md](verification/source-preservation-audit.md), and [history/host-invocation-baseline.md](history/host-invocation-baseline.md) |

## 3. Current Position

| Layer | Status | Meaning |
| --- | --- | --- |
| Existing Node CLI payload | `legacy-current` | `bin/fgos.mjs` and the current Node package still carry existing CLI behavior. The file remains unmoved and is the legacy payload during Rust host migration. |
| Native invocation kernel | `current partial` | `OperationRequest` to `ProviderOutcome`, `InvocationService`, pure router, registry snapshot, and two-stage authority have implementation proof in the Rust host-runtime slice. Future provider mechanisms and replacement policy still need their own proof. |
| R1 Rust CLI host | `implemented preview` | `apps/fgos` exists as a Rust CLI host, embeds the command route matrix, routes `version` natively to `distribution.build.show`, and sends unmigrated selectors through the `legacy-cli` lane. Packaging-Distribution preview proof shows external/default installed `fgos` enters the Rust host; stable/default graduation remains a release-owner decision, and legacy fallback uses the settled 30-day preview window. |
| R2 external process preview | `planned` | Static manifest discovery, framed component protocol, and fail-closed process provider path are planned proof work. |
| R3 production remote peer | `planned` | The project-local gateway should become a peer host for at least one native semantic route, without shelling through CLI or parsing `fgos.v1`. |
| Chat host | `planned` | Chat is a future peer only after a real adapter and admission/interruption/presentation contracts exist. |

## 4. Ownership Boundary

Host invocation owns this question:

```txt
How does an already selected fgOS runtime admit, route, invoke, and present
semantic operations across host surfaces and provider mechanisms?
```

It consumes the runtime selected by [Packaging-Distribution](../packaging-distribution/README.md). It does not own `fgctl`, release acquisition, activation binding publication, upgrade, repair, or rollback.

It consumes Work Lifecycle, Dispatch, Run Result Evaluation, and gateway contracts without taking their state-transition or evidence authority. A provider selection never transfers ownership of a state write.

## 5. Component Boundary Impact

No component-boundary change.

This documentation migration promotes an existing host/surface concern into the platform docs structure. It does not create, rename, split, merge, or reassign a platform component. The existing whole-system boundary entry is [Host And Surface Layer](../component-boundary.md#4-current-high-level-components).

## 6. Status Vocabulary

| Status | Meaning |
| --- | --- |
| `current` | Implemented current behavior that is part of the target shape. |
| `legacy-current` | Implemented current behavior that remains valid only as compatibility or transition. |
| `accepted-not-implemented` | Accepted architecture direction without implementation proof. |
| `planned` | Intended work sequence or proof gate, not current behavior. |
| `superseded` | Historical claim replaced by a newer accepted decision or promoted doc. |
| `unknown` | Needs a fresh implementation scan or human decision before use. |

## 7. Implementation Alignment

Every design claim in this area must have an implementation status or a proof gap. The tracking table lives in [verification/implementation-alignment.md](verification/implementation-alignment.md).

## 8. Migration Notes

The old documents under [../../architect/host-invocation-routing/](../../architect/host-invocation-routing/) remain legacy/current sources until redirected or drained. Do not delete them in this migration pass.

The preservation ledger must be checked after each phase. A detail omitted from prose is only safe when [intent-preservation-ledger.md](intent-preservation-ledger.md) records whether it was promoted, split, kept legacy, redirected, archived, deferred, superseded, rejected, or remains unknown.

## 9. Related Files

| Relationship | File |
| --- | --- |
| full direction | [vision.md](vision.md) |
| preserved intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| current state | [spec.md](spec.md) |
| remaining-work roadmap | [roadmap.md](roadmap.md) |
| kernel architecture | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| provider routing | [architecture/provider-routing.md](architecture/provider-routing.md) |
| external provider protocol | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) |
| legacy CLI transition | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| migration sequence | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) |
| release gates | [architecture/release-boundaries.md](architecture/release-boundaries.md) |
| implementation evidence | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| source preservation audit | [verification/source-preservation-audit.md](verification/source-preservation-audit.md) |
| source inventory | [history/source-inventory.md](history/source-inventory.md) |
| decisions index | [decisions/README.md](decisions/README.md) |
| platform boundary | [../component-boundary.md](../component-boundary.md) |
| packaging dependency | [../packaging-distribution/README.md](../packaging-distribution/README.md) |
