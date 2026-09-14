# Contract: Activation Binding

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe workspace activation records for project-local fgOS runtime selection
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code scan of packages/distribution/rust/src/init.rs and src/setup/bin-discovery.mjs
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
```

## 1. Purpose

`activation.json` is the workspace-local ready pointer for the active fgOS runtime.

Path:

```txt
.fgos/installation/activation.json
```

## 2. Current Implemented Shape

Rust currently defines `WorkspaceActivationBinding` with camelCase fields:

```txt
schemaVersion
repositoryId
workspaceId
workStateId
activationId
status
artifactDigest
releasePath
previousArtifactDigest?
shimVersion
resolvedDependencies
pinSnapshot
activatedAt
activatedBy
```

`activatedBy` currently includes:

```txt
tool
version
```

## 3. Status Rule

The stable shims expect `status` to be `ready`. If activation is missing, not ready, missing `releasePath`, or points to a missing executable, the shim should fail and ask for `fgctl init` or `fgctl repair`.

## 4. Selection Rule

Workspace activation is local to the workspace. It should not become a repository-wide global pointer.

Multiple worktrees may share release store content while using different activation records.

## 5. Resolver Rule

Resolution code should only accept activation if it can safely resolve the release manifest and executable entry under the active release path.

Node-side tier-zero resolution is currently implemented in `src/setup/bin-discovery.mjs`.

## 6. Evidence

| Claim | Evidence |
| --- | --- |
| Activation struct exists | `packages/distribution/rust/src/init.rs` |
| Stable shim reads activation | `packages/distribution/rust/src/init.rs` |
| Shell/runtime resolver checks activation | `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh` |
| Init/upgrade tests exercise activation | `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` |

## 7. Open Follow-Up

This contract should become a versioned JSON schema before third-party tools are expected to write activation records.
