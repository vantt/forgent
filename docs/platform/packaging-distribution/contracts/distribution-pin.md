# Contract: Distribution Pin

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe the tracked project runtime pin for packaging-distribution
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code scan of packages/distribution/rust/src/init.rs and architecture discussion
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/contracts/activation-binding.md
```

## 1. Purpose

The distribution pin is the project/team policy for which runtime a workspace should use.

Expected path:

```txt
.fgos/distribution.json
```

## 2. Current Implemented Shape

Rust currently defines `TrackedDistributionPin`:

```txt
schemaVersion
projectRuntime
```

`projectRuntime` currently contains:

```txt
policy
artifactDigest
releaseVersion?
channel?
allowPrerelease
```

## 3. Policy Boundary

The pin is policy. The activation binding is readiness.

| Record | Meaning |
| --- | --- |
| `.fgos/distribution.json` | What runtime the project wants. |
| `.fgos/installation/activation.json` | What runtime this workspace has prepared and selected. |

## 4. Expected Behavior

If the pin names a release that is not staged locally, `fgctl init` or `fgctl upgrade` should acquire/stage it before publishing activation. A local command should not silently select a different runtime just because it is available.

## 5. Evidence

| Claim | Evidence |
| --- | --- |
| Pin struct exists | `packages/distribution/rust/src/init.rs` |
| Activation stores `pinSnapshot` | `packages/distribution/rust/src/init.rs` |
| Architecture distinguishes pin from activation | `docs/architect/packaging-distribution/runtime-identity-and-activation.md` |

## 6. Open Follow-Up

Confirm exact tracked-file lifecycle before promising when `.fgos/distribution.json` is created, updated, or committed.
