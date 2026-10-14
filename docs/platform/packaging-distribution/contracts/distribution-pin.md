# Contract: Distribution Pin

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe the tracked project runtime pin for packaging-distribution
Design status: Candidate
Contract design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/contracts/activation-binding.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
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
| `projectRuntime.releaseVersion` | string | Optional | Release tag the pin was installed or upgraded from (for example `v0.2.0-rc.1`), written only when `fgctl init` or `fgctl upgrade` downloads the release (a local or URL source leaves it null). A tag without the leading `v` is read as `v<tag>`. When present and the pinned digest is not staged on a machine, plain `fgctl init` downloads this tag (checksum-verified) and refuses if the fetched digest is not `artifactDigest`. Absent or null: a digest-only pin, which needs an explicit source on a machine that has not staged it. |
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


## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

#### 8. Pin

The pin records desired selection policy. It does not prove what is active. In
V1 the pin is tracked project state at:

```txt
.fgos/distribution.json
```

This is intentionally outside ignored machine-local runtime areas so a clone or
teammate receives the same branch/project runtime policy.

Possible shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```

Supported policies can start small:

- `exact-digest`;
- `exact-version`;
- later `channel`.

For safety, the workspace activation binding should snapshot the pin used
during activation.

If the pin exists but its requested release is not present in the release store
root, the workspace is `pinned-not-staged`. `fgctl init` must acquire the
pinned release instead of selecting latest.
