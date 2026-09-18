# Host Invocation Verification

```txt
Document type: Verification index
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Route readers to host-invocation implementation alignment and proof records
Design status: Draft
Implementation status: Active
Canonical: Yes, after review
Owner: Host invocation
Source type: Created during host-invocation documentation migration
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
- docs/platform/host-invocation-routing/verification/compatibility-harness.md
- docs/platform/host-invocation-routing/verification/source-preservation-audit.md
```

## 1. Evidence Sets

| Evidence | Status | Purpose |
| --- | --- | --- |
| [implementation-alignment.md](implementation-alignment.md) | `current snapshot` | Claim-by-claim implementation status. |
| [compatibility-harness.md](compatibility-harness.md) | `current partial` | Node/Rust CLI compatibility, command descriptor proof, and R2/R3 preview extensions. |
| [source-preservation-audit.md](source-preservation-audit.md) | `current snapshot` | Source-by-source proof that legacy intent was preserved or explicitly classified. |
| [r1-rust-host-proof.md](r1-rust-host-proof.md) | `implemented preview` | R1 preview installed/default Rust host proof, with stable/default graduation still open. |
| [r2-external-process-proof.md](r2-external-process-proof.md) | `implemented preview` | External process provider conformance proof. |
| [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | `implemented preview` | Gateway peer-host semantic route proof. |

## 2. Rule

Verification records whether implementation matches a claim at a point in time. It does not define architecture or change a contract.

## 3. Related Files

| Relationship | File |
| --- | --- |
| alignment | [implementation-alignment.md](implementation-alignment.md) |
| source preservation audit | [source-preservation-audit.md](source-preservation-audit.md) |
| area portal | [../README.md](../README.md) |
| ledger | [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
