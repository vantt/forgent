# Verification: Compatibility Harness

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the planned Node/Rust compatibility harness requirements
Design status: Draft
Implementation status: Planned
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

`planned`. This file preserves the proof contract; it does not claim the harness exists.

## 4. Related Files

| Relationship | File |
| --- | --- |
| descriptor contract | [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |

