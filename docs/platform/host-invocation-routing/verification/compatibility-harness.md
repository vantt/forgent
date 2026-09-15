# Verification: Compatibility Harness

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the planned Node/Rust compatibility harness requirements
Design status: Draft
Implementation status: Current harness plus planned R2/R3 extensions
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md
- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md
```

## 1. Required Proof

The harness must invoke Node or candidate Rust binary with identical argv bytes, stdin, cwd, selected environment, timeout, and capture stdout/stderr bytes, exit/signal status, filesystem diff, process evidence, and timing.

## 2. Coverage

Coverage includes every selector, descriptor uniqueness, help/syntax passthrough, exit categories, `version`, `ready`, one validation failure, unknown verb, isolated `init` plus `add`, `--dir`, distinct cwd, stdin consumer where present, and target-specific signal/process-tree behavior.

## 3. Status

Current R1 preview proof covers Node/Rust CLI compatibility for the Rust host
preview installed/default path. R2/R3 still need external process and remote
peer extensions.

Legacy Node fallback remains available only as a deprecated explicit escape
hatch for 30 calendar days after preview release publication. For the
2026-09-15 preview proof/public-posture decision, earliest removal is
2026-10-15 unless the public preview tag is published later. The compatibility
harness must keep distinguishing default Rust-host use from intentional legacy
fallback use until that window closes.

## 4. Related Files

| Relationship | File |
| --- | --- |
| descriptor contract | [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |
