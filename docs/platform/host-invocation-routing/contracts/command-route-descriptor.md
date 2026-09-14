# Contract: Command Route Descriptor

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define per-selector native versus legacy CLI routing and repair ownership
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md
- docs/platform/host-invocation-routing/verification/compatibility-harness.md
```

## 1. Contract

Every selector has exactly one generated `CommandRouteDescriptor`.

Minimum fields:

| Field | Rule |
| --- | --- |
| `selector` | Canonical command/subcommand selector. |
| `route_kind` | Exactly one of `legacy-cli` or `native`. |
| `operation_id` | Required only for native semantic routing. |
| `legacy_payload` | Required only for `legacy-cli`; names `legacy-node`. |
| `owner_path` | Canonical implementation boundary to edit. |
| `compatibility_tests` | Named parity/vector suites required for repair. |

## 2. Rules

- A descriptor may not name both routes as active.
- An unlisted selector fails the build.
- Generated metadata is validated for drift and is not a second hand-maintained source of truth.
- `scripts/explain-command-route.mjs <selector>` should read the same artifact used by routing.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Descriptor exists for every selector. | `planned` | [source plan §6](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness) | P1 generated artifact and drift tests. |
| `legacy-cli` preserves provider-owned argv. | `planned` | [source transition §3](../../../architect/host-invocation-routing/legacy-cli-transition.md#3-command-metadata-and-parser-ownership) | P4 `args_os` tests. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |
| compatibility harness | [../verification/compatibility-harness.md](../verification/compatibility-harness.md) |
| legacy payload | [legacy-payload.md](legacy-payload.md) |

