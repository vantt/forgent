# Contract: Release Manifest

```txt
Document type: Contract
Audience: Maintainer, release engineer, implementation agent
Purpose: Describe the fgOS release manifest contract used by packaging-distribution
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of scripts/build-rust-distribution.mjs, packages/distribution/rust/src/manifest.rs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- packages/distribution/rust/src/manifest.rs
- packages/distribution/rust/tests/schema_golden.rs
- scripts/build-rust-distribution.mjs
```

## 1. Purpose

`manifest.json` is the release identity and verification record for a staged fgOS runtime. It is located at the root of every staged release tree under `machineReleaseStore/releases/<artifactDigest>/manifest.json`.

## 2. Frozen Schema V1 Shape

The schema is frozen at `schemaVersion: 1`. Rust serde definitions live in `packages/distribution/rust/src/manifest.rs` (`ReleaseManifest`).

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:<64-hex>",
  "digestKind": "sha256",
  "releaseVersion": "0.1.0",
  "sourceRevision": "abcdef123456",
  "createdAt": "2026-09-14T00:00:00.000Z",
  "target": {
    "os": "linux",
    "arch": "x86_64",
    "libc": "gnu"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "libexec/legacy-node/bin/fgos.mjs",
      "digest": "sha256:<64-hex>"
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:<64-hex>"
    },
    "workshop": {
      "skillsDigest": "sha256:<64-hex>",
      "agentsDigest": "sha256:<64-hex>",
      "proseDigest": "sha256:<64-hex>"
    }
  },
  "requires": {
    "node": ">=20.0.0",
    "git": ">=2.30.0"
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": [
    {
      "path": "bin/fgos",
      "kind": "file",
      "digest": "sha256:<64-hex>",
      "mode": "0755",
      "class": "binary"
    }
  ]
}
```

## 3. Field Specifications & Optionality

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer | Yes | Fixed at `1` for V1. |
| `artifactDigest` | string | Yes | Canonical SHA-256 tree digest over manifest without `artifactDigest`. |
| `digestKind` | string | Optional | Defaults to `"sha256"` if omitted. |
| `releaseVersion` | string | Optional | Semantic release version (e.g. `"0.1.0"`). |
| `sourceRevision` | string | Optional | Git commit hash from which release was built. |
| `createdAt` | string | Optional | ISO 8601 UTC timestamp of build. |
| `target` | object | Yes | Target platform info (`os`, `arch`, optional `libc`). |
| `entries` | object | Yes | Native executable entry points (`fgos`, optional `fgosRunner`). |
| `components` | object | Yes | Payload component locators (see section 4). |
| `requires` | object | Yes | System prerequisites (optional `node`, `git` semver range strings). |
| `stateSchemas` | object | Optional | Work-state schema compatibility (`read`, `write`, `migrations`). |
| `files` | array | Yes | Array of manifest file entries (`path`, `kind`, `digest`, `mode`, `class`). |

## 4. Legacy Node Ownership Boundary Invariant

`components.legacyNode.root` and `components.legacyNode.entry` remain the **ONLY** legacy Node payload locator across the entire platform.

- The Rust host resolves the Node CLI entrypoint exclusively through `manifest.components.legacyNode`, never `PATH`, never `cwd`, and never hardcoded outside the manifest.
- Omission of `components.legacyNode` is a schema validation error.
- Empty `root`, `entry`, or `digest` fails `ReleaseManifest::validate_legacy_node_invariant`.

## 5. Digest Rule

`artifactDigest` is the canonical manifest/tree identity. It is recomputed by canonicalizing the manifest without `artifactDigest` using pure Rust SHA-256 (`packages/distribution/rust/src/verify.rs`), not from archive bytes.

## 6. Safety Rules

Release staging and preflight reject:
- symlinks anywhere in payload;
- entries escaping the source checkout or staged tree (path traversal);
- corrupt or mismatched file digests;
- non-canonical manifest file ordering;
- unsafe tar extraction paths and Windows drive letter paths.

## 7. Evidence

| Claim | Evidence |
| --- | --- |
| Manifest struct frozen and documented | `packages/distribution/rust/src/manifest.rs` |
| Manifest builder with legacy Node payload | `scripts/build-rust-distribution.mjs` |
| Artifact digest reproducible | `test/rust-host/release-tree.test.mjs` |
| Stage verifies manifest and files | `packages/distribution/rust/src/store.rs`, `packages/distribution/rust/src/verify.rs`, `test/rust-host/fgctl-stage.test.mjs` |
| Schema golden tests (full, minimal, forward-compat, invariant) | `packages/distribution/rust/tests/schema_golden.rs`, `packages/distribution/rust/tests/goldens/release-manifest-*.json` |
