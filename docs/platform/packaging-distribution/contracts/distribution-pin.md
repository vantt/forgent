# Contract: Distribution Pin

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe the tracked project runtime pin for packaging-distribution
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/contracts/activation-binding.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
```

## 1. Purpose

The distribution pin is the project/team policy for which runtime a workspace should use. It is committed and tracked in git.

Path:

```txt
.fgos/distribution.json
```

## 2. Frozen Schema V1 Shape

The schema is frozen at `schemaVersion: 1`. Rust serde definitions live in `packages/distribution/rust/src/init.rs` (`TrackedDistributionPin`, aliased as `DistributionPin`).

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
    "releaseVersion": "0.1.0",
    "channel": "stable",
    "allowPrerelease": false
  }
}
```

## 3. Field Specifications & Optionality

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer | Yes | Fixed at `1` for V1. |
| `projectRuntime` | object | Yes | Project runtime policy container. |
| `projectRuntime.policy` | string | Yes | Policy mode (`"exact-digest"`, `"channel"`, etc.). |
| `projectRuntime.artifactDigest` | string | Yes | Target canonical release digest. |
| `projectRuntime.releaseVersion` | string | Optional | Semantic version of pinned release. |
| `projectRuntime.channel` | string | Optional | Distribution channel (e.g. `"stable"`, `"beta"`, `"nightly"`). |
| `projectRuntime.allowPrerelease` | boolean | Optional | Whether prerelease builds may satisfy the pin (default `false`). |

## 4. Policy Boundary

The pin is policy. The activation binding is readiness.

| Record | Meaning | Lifecycle |
| --- | --- | --- |
| `.fgos/distribution.json` | What runtime the project wants. | Tracked in git, shared across contributors. |
| `.fgos/installation/activation.json` | What runtime this workspace has prepared and selected. | Gitignored, private to this workspace. |

## 5. Expected Behavior

If the pin names a release that is not staged locally, `fgctl init` or `fgctl upgrade` must acquire and stage it before publishing activation. A local command must not silently select a different runtime just because another one happens to be staged.

## 6. Evidence

| Claim | Evidence |
| --- | --- |
| Pin struct frozen and documented | `packages/distribution/rust/src/init.rs` (`TrackedDistributionPin`, `DistributionPin`) |
| Activation stores `pinSnapshot` | `packages/distribution/rust/src/init.rs` (`publish_and_tail`) |
| Architecture distinguishes pin from activation | `docs/architect/packaging-distribution/runtime-identity-and-activation.md` |
| Pin reconciliation & mismatch tests | `test/rust-host/fgctl-init.test.mjs` (Item 2, Item 5) |
| Schema golden tests (full, minimal, forward-compat) | `packages/distribution/rust/tests/schema_golden.rs`, `packages/distribution/rust/tests/goldens/distribution-pin-*.json` |
