# Architecture: Legacy CLI Transition

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define the transitional Node CLI lane and semantic Node bridge boundary
Design status: Draft
Implementation status: Implemented preview with legacy-current payload behavior
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md
- docs/platform/host-invocation-routing/contracts/legacy-payload.md
- docs/platform/host-invocation-routing/verification/compatibility-harness.md
```

## 1. Claim

Node transition uses two distinct adapters. `LegacyCliPassthroughProvider` is CLI-only and bypasses the kernel. `LegacySemanticProvider` is a normal semantic provider introduced per operation only when a non-CLI host needs Node behavior before native migration.

## 2. Preserved Rules

- Captured stdout/stderr remain public presentation, not semantic `ProviderOutcome`.
- Legacy CLI output must not be wrapped in a second `fgos.v1` envelope.
- While a selector is `legacy-cli`, Node owns argument parsing and behavior.
- `CommandRouteDescriptor` must name exactly one active route.
- The legacy payload is resolved from the active release manifest, not cwd, PATH, alternate bin entries, or hardcoded paths.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Existing Node CLI remains legacy-current. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) and current tests | Keep valid during transition. |
| `legacy-cli` route bypasses `InvocationService`. | `implemented preview` | [source transition §1](../../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Keep until each selector migrates from `legacy-cli` to `native`. |
| `fgos.v1` belongs to CLI presenter. | `implemented preview` | [source transition §4](../../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome), [../verification/compatibility-harness.md](../verification/compatibility-harness.md), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | R3 proves remote `/runtime` does not parse or emit the CLI `fgos.v1` envelope. Keep compatibility vectors current while legacy selectors remain. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| command route descriptor | [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| legacy payload contract | [../contracts/legacy-payload.md](../contracts/legacy-payload.md) |
| compatibility harness | [../verification/compatibility-harness.md](../verification/compatibility-harness.md) |
| source transition | [../../../architect/host-invocation-routing/legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md) |
