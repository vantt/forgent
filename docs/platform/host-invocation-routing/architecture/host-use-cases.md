# Architecture: Host Use Cases

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define CLI, remote, chat, and future hosts as peer invocation surfaces
Design status: Draft
Implementation status: Accepted-not-implemented
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/architecture/invocation-kernel.md
- docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md
```

## 1. Claim

`cli-host-use-case`, `remote-host-use-case`, and `chat-host-use-case` are peers. None wraps, shells out to, or calls through another after migration.

## 2. Host Responsibilities

| Host use case | Owns | Never does | Status |
| --- | --- | --- | --- |
| CLI | CLI grammar, selector lookup, terminal stdio, `fgos.v1` and exit-code presentation. | Own operation implementation or plugin ABI. | `legacy-current` for Node payload; target peer model `accepted-not-implemented`. |
| Remote | Remote caller context, REST/MCP projection, deadlines, disconnect, streaming, response projection. | Invoke CLI, parse argv, or treat `fgos.v1` as internal API. | `planned` for R3. |
| Chat | Chat caller/session context, intent mapping, clarification, progress, interruption, response projection. | Invoke CLI/remote host or parse their public protocols. | `planned`. |

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Remote peer is project-local gateway in R3. | `planned` | Source: [old architecture §10](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries) | Prove one native gateway route in [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md). |
| Future shared multi-project gateway is separate. | `planned` | [Packaging future constraints](../../packaging-distribution/architecture/future-constraints.md) | Keep separate from R3 project-local gateway. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| kernel | [invocation-kernel.md](invocation-kernel.md) |
| R3 proof | [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) |
| packaging future constraint | [../../packaging-distribution/architecture/future-constraints.md](../../packaging-distribution/architecture/future-constraints.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |

