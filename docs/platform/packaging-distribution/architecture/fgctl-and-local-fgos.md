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
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
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


## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

#### 12. Command Authority Matrix

| Command | May Change Runtime Identity | May Change Workspace Config/State | May Materialize Projections | Notes |
|---|---:|---:|---:|---|
| `fgctl init` | Yes | Indirectly, by invoking active local `fgos init` after publishing ready binding | Indirectly after activation | One-command onboarding orchestrator; installs stable local shims if missing. Candidate preflight before publish must not write host-visible projections. |
| `fgctl repair` | Yes | Indirectly, through the same active init/fix/check tail | Indirectly after activation | Reacquires/repairs runtime payload, publishes ready binding, then repairs projections/config through local fgos. |
| `fgctl upgrade` | Yes | Indirectly, through the same active init/fix/check tail; no automatic state migration in V1 | Indirectly after activation | Must verify state-schema compatibility before publishing ready binding. |
| local `fgos init` | No | Yes | Yes | Adopts workspace under active runtime identity. |
| local `fgos doctor` | No | No | No | Read-only report. |
| local `fgos doctor --fix` | No | Yes, only registered safe fixes | Yes, only safe projection repair | Must not patch release payload files. |
| local workflow verbs | No | Yes | No, unless explicitly part of operation | Must lease active runtime identity. |

#### 13. `fgctl` Form And V1 Acquisition Sources

V1 `fgctl` is a Rust bootstrap binary. It may be built from the same source
tree as the future Rust host, but its authority is different: machine/project
runtime control, not project workflow semantics.

V1 acquisition sources:

- local release tree path, for development/proof;
- local tarball/archive plus release tree manifest;
- GitHub release asset plus authenticated or pinned expected release tree
  manifest digest.

The first walking skeleton should not wait for the Rust host to replace local
`fgos`. V1 can ship:

```txt
fgctl = Rust bootstrap/control binary
release bin/fgos = existing Node host or thin Node entry
release bin/fgos-runner = existing Node runner
release libexec/legacy-node = compatibility payload if needed
```

Later, Rust host replaces release `bin/fgos` inside the same release tree
contract. Packaging does not need to change for that swap.

`doctor --fix` during `fgctl init` runs after the ready binding is published,
through the active local `fgos`. Candidate preflight before publish is
read-only or staging-only and must not write host-visible projections. General
repair remains explicit.
