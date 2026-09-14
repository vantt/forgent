# Contract: Release Manifest

```txt
Document type: Contract
Audience: Maintainer, release engineer, implementation agent
Purpose: Describe the fgOS release manifest contract used by packaging-distribution
Design status: Draft
Implementation status: Implemented, contract extraction in progress
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code scan of scripts/build-rust-distribution.mjs and packages/distribution/rust/src/manifest.rs
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- packages/distribution/rust/src/manifest.rs
- scripts/build-rust-distribution.mjs
```

## 1. Purpose

`manifest.json` is the release identity and verification record for a staged fgOS runtime.

## 2. Required Shape

Implementation currently defines `ReleaseManifest` with camelCase fields:

```txt
schemaVersion
artifactDigest
digestKind?
releaseVersion?
sourceRevision?
createdAt?
target
entries
components
requires
stateSchemas?
files
```

## 3. Nested Records

| Record | Fields |
| --- | --- |
| `target` | `os`, `arch`, optional `libc` |
| `entries` | `fgos`, optional `fgosRunner` |
| `components.legacyNode` | `root`, `entry`, `digest` |
| `components.runner` | `path`, `digest` |
| `components.workshop` | optional `skillsDigest`, `agentsDigest`, `proseDigest` |
| `requires` | optional `node`, `git` |
| `stateSchemas` | `read`, `write`, `migrations` |
| `files[]` | `path`, `kind`, `digest`, `mode`, `class` |

## 4. Digest Rule

`artifactDigest` is the canonical manifest/tree identity. It is recomputed from manifest content without `artifactDigest`, not from the compressed archive bytes.

Archive checksums still matter for transport integrity, but they are a different proof surface.

## 5. Safety Rules

Release building and staging should reject:

- symlinks in payload;
- entries escaping the source checkout or staged tree;
- corrupt file digests;
- non-canonical manifest file ordering;
- unsafe tar extraction paths.

## 6. Evidence

| Claim | Evidence |
| --- | --- |
| Manifest struct exists | `packages/distribution/rust/src/manifest.rs` |
| Manifest is built with legacy Node payload | `scripts/build-rust-distribution.mjs` |
| Artifact digest is reproducible | `test/rust-host/release-tree.test.mjs` |
| Stage verifies manifest and files | `packages/distribution/rust/src/store.rs`, `packages/distribution/rust/src/verify.rs`, `test/rust-host/fgctl-stage.test.mjs` |

## 7. Open Follow-Up

If external consumers start reading `manifest.json` directly, promote this from prose contract to a versioned JSON schema.
