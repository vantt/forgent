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
      "entry": "bin/fgos.mjs",
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
| `stateSchemas` | object | Optional | Work-state schema compatibility (`read`, `write`, `migrations`). In V1, `migrations` is reserved and must be empty. |
| `files` | array | Yes | Array of manifest file entries (`path`, `kind`, `digest`, `mode`, `class`). |

## 4. Legacy Node Ownership Boundary Invariant

`components.legacyNode.root` and `components.legacyNode.entry` remain the **ONLY** legacy Node payload locator across the entire platform.

- The Rust host resolves the Node CLI entrypoint exclusively through `manifest.components.legacyNode`, never `PATH`, never `cwd`, and never hardcoded outside the manifest.
- Omission of `components.legacyNode` is a schema validation error.
- Empty, absolute, or parent-traversing `root`, `entry`, or `digest` fails `ReleaseManifest::validate_legacy_node_invariant`.
- `entry` is relative to `root`; it must not repeat the `root` prefix.

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
| Stage, preflight, and host verify manifest and release files (`verify_release_files` + `verify_legacy_node`) | `packages/distribution/rust/src/store.rs`, `packages/distribution/rust/src/verify.rs`, `apps/fgos/src/legacy_exec.rs`, `test/rust-host/fgctl-stage.test.mjs` |
| Payload safety and digest enforcement regression tests (commits 19000200, 3b3a95fc: symlink-component refusal, path traversal, legacyNode digest verification) | `packages/distribution/rust/src/verify.rs`, `apps/fgos/tests/cli_tests.rs`, `test/rust-host/fgctl-stage.test.mjs` |
| Schema golden tests (full, minimal, forward-compat, invariant) | `packages/distribution/rust/tests/schema_golden.rs`, `packages/distribution/rust/tests/goldens/release-manifest-*.json` |

## 8. Combined native addon (additive V1)

`components.nativeAddon` is optional and omitted when absent (never synthesized as
`null`); historical payload identities remain unchanged. When present it contains:

```json
{"path":"libexec/native/fgos.node","digest":"<64 lowercase hex>","target":"linux-x64","napiVersion":8,"crateChecksums":{"napi@2.16.17":"<Cargo.lock checksum>","napi-derive@2.16.13":"<Cargo.lock checksum>","napi-build@2.2.4":"<Cargo.lock checksum>"}}
```

The path is a canonical, release-relative `.node` file and must occur in `files[]`
with the same digest (the file entry uses the usual `sha256:` prefix). Neither the
file nor any path component may be a symlink. The target is `linux-x64` or
`win32-x64` (Node platform spelling), matching the release's Linux/Windows x64
target. The ABI line is Node-API 8 for the combined Git + Event Store addon.
`crateChecksums` records exactly the three pinned napi toolchain packages and their
crates.io checksums from `Cargo.lock`; the verifier compares against its compiled
lockfile. Checksums attest declared build inputs; the binary digest authenticates
payload bytes. CI builds with `--locked`, audits crates with `cargo deny check`,
and compares the addon digest with a second independent build on the same target.
Release staging includes `capabilities: ["git-wal-v1"]` with the addon.

Every staging and activation preflight verifies a present addon, including ABI,
target, checksum provenance and bytes. Absence remains accepted in this phase.
**M10 switch point:** the release carrying Git phase 05 makes the addon mandatory
for linux-x64 activation. That future switch must explicitly reject missing
`components.nativeAddon`; this additive step does not impose it on older releases.
