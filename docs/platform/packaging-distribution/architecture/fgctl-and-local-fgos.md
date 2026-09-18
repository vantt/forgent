# fgctl And Local fgOS

```txt
Document type: Architecture
Audience: Architect, maintainer, implementation agent
Purpose: Define the ownership split between fgctl and the project-local fgos runtime
Design status: Draft
Implementation status: Implemented preview plus projection partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from packaging-distribution architecture discussion and code scan
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
```

## 1. Purpose

This document keeps the bootstrap authority and project workflow authority separate.

## 2. Principle

```txt
fgctl selects and repairs the runtime.
local fgos runs project workflow semantics under the selected runtime.
```

Collapsing those roles makes it hard to reason about upgrades, rollback, state compatibility, and human trust.

## 3. fgctl Owns

| Responsibility | Evidence |
| --- | --- |
| Install/bootstrap command | `install.sh`, `apps/fgctl/src/main.rs` |
| Release staging and verification | `packages/distribution/rust/src/store.rs`, `packages/distribution/rust/src/verify.rs` |
| Workspace initialization | `packages/distribution/rust/src/init.rs`, `test/rust-host/fgctl-init.test.mjs` |
| Workspace activation publish | `packages/distribution/rust/src/init.rs` |
| Upgrade/repair entry point | `test/rust-host/fgctl-upgrade.test.mjs`, `scripts/ci-external-consumer.sh` |

## 4. Local fgos Owns

| Responsibility | Evidence |
| --- | --- |
| Project workflow commands | `bin/fgos.mjs`, `apps/fgos/src/main.rs` |
| Legacy Node compatibility behavior | `libexec/legacy-node` release payload, `bin/fgos.mjs` |
| Doctor/fix checks and legacy setup compatibility under active runtime | `src/setup/**`, `bin/fgos.mjs` |
| Projection materialization after activation | Portable instruction projection is implemented in `src/setup/instruction-projections.mjs`; skill and wider host projection ledger coverage remain partial. |

## 5. Boundary Rules

- `fgctl` may write `.fgos/installation/` runtime selection records and stable shims.
- `fgctl` may stage immutable release payloads in the machine release store.
- `fgctl` should not own project workflow semantics.
- local `fgos` should not silently select another runtime identity.
- local `fgos doctor --fix` repairs readiness under the active runtime; it is not a hidden upgrade command.

## 6. Failure Shape

If activation exists but is not usable, local commands should fail with a repair-oriented message rather than fall through silently to an unrelated global runtime.

If doctor/fix paths find environment drift, they should report or fix the drift without changing runtime identity unless the operation is explicitly a `fgctl` operation.

## 7. Open Scan

Before marking projection ownership fully implemented, scan every projection
writer and verify each runs through active local `fgos`/doctor-fix paths, not
`fgctl`. Current proof covers the portable instruction projection path and
proves `fgctl` writes activation/shims rather than host-visible projections.
