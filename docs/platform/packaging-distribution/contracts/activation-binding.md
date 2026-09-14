# Contract: Activation Binding

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe workspace activation records for project-local fgOS runtime selection
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs, src/setup/bin-discovery.mjs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
```

## 1. Purpose

`activation.json` is the workspace-local ready pointer for the active fgOS runtime.

Path:

```txt
.fgos/installation/activation.json
```

## 2. Frozen Schema V1 Shape

The schema is frozen at `schemaVersion: 1`. Rust serde definition lives in `packages/distribution/rust/src/init.rs` (`WorkspaceActivationBinding`, aliased as `ActivationBinding`).

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_8d3322d88fba3bd8",
  "workspaceId": "8d3322d88fba3bd8",
  "workStateId": "8d3322d88fba3bd8",
  "activationId": "act_000001a08fe31d00",
  "status": "ready",
  "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
  "releasePath": "/home/user/.local/state/fgos/releases/sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
  "previousArtifactDigest": null,
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {
    "schemaVersion": 1,
    "projectRuntime": {
      "policy": "exact-digest",
      "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
      "releaseVersion": "0.1.0",
      "channel": null,
      "allowPrerelease": false
    }
  },
  "activatedAt": "2026-09-14T00:00:00.000Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "0.1.0"
  }
}
```

## 3. Field Specifications & Optionality

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer | Yes | Fixed at `1` for V1. |
| `repositoryId` | string | Yes | Canonical repository identifier (`repo_<workspaceId>`). |
| `workspaceId` | string | Yes | 16-hex hash of canonical workspace root. |
| `workStateId` | string | Yes | Work-state namespace identifier (equals `workspaceId` in V1). |
| `activationId` | string | Yes | Unique activation identifier (`act_<hex-timestamp>`). |
| `status` | string | Yes | Activation status: `"ready"` or `"quarantined"`. |
| `artifactDigest` | string | Yes | Canonical digest of the active release. |
| `releasePath` | string | Yes | Absolute filesystem path to active release in machine store. |
| `previousArtifactDigest` | string | Optional | Digest of previously active release (enables 1-step rollback/repair). |
| `shimVersion` | string | Yes | Version of stable shims (`"1"` in V1). |
| `resolvedDependencies` | object | Yes | Resolved host runtime toolpaths (e.g. `{"node": "..."}`). |
| `pinSnapshot` | object | Yes | Snapshot of `.fgos/distribution.json` at activation time. |
| `activatedAt` | string | Yes | ISO 8601 UTC timestamp of activation. |
| `activatedBy` | object | Yes | Identity of tool performing activation (`tool`, `version`). |

## 4. Status Rule

The stable shims expect `status` to be `ready`. If activation is missing, not ready (e.g. `quarantined`), missing `releasePath`, or points to a missing executable, the shim fails with exit code 3 and directs the user to run `fgctl init` or `fgctl repair`.

## 5. Selection Rule

Workspace activation is strictly local to the workspace. It is not a repository-wide global pointer. Multiple worktrees may share release store content while using different activation records.

## 6. Resolver Rule

Resolution code accepts activation only if it can safely resolve the release manifest and executable entry under the active release path. Node-side tier-zero resolution is implemented in `src/setup/bin-discovery.mjs`.

## 7. Evidence

| Claim | Evidence |
| --- | --- |
| Activation struct frozen and documented | `packages/distribution/rust/src/init.rs` (`WorkspaceActivationBinding`, `ActivationBinding`) |
| Stable shim reads activation | `packages/distribution/rust/src/init.rs` (`SHIM_FGOS_BODY`, `SHIM_FGOS_RUNNER_BODY`) |
| Shell/runtime resolver checks activation | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh` |
| Init, repair, and upgrade tests exercise activation | `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` |
| Schema golden tests (full, minimal, forward-compat) | `packages/distribution/rust/tests/schema_golden.rs`, `packages/distribution/rust/tests/goldens/activation-binding-*.json` |

