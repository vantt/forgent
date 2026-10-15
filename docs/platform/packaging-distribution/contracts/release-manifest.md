# Contract: Release Manifest

```txt
Document type: Contract
Audience: Maintainer, release engineer, implementation agent
Purpose: Describe the fgOS release manifest contract used by packaging-distribution
Design status: Candidate
Contract design status: Frozen (V1)
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


## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

#### 5. ReleaseManifest

The release manifest is the immutable statement of what an fgOS release
contains.

The canonical artifact digest is computed from this release tree manifest, not
from a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive
digests may still be recorded for download/integrity diagnostics, but they are
not runtime identity. Runtime identity must survive different compression
formats, package transports, and mirror locations.

The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```

The release build, not the installer, owns byte normalization. Install should
not rewrite line endings or file contents to make a digest pass.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:...",
  "digestKind": "release-tree-manifest",
  "releaseVersion": "0.1.0",
  "sourceRevision": "...",
  "createdAt": "2026-09-04T00:00:00Z",
  "target": {
    "os": "linux",
    "arch": "x64",
    "libc": "glibc"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:..."
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:..."
    },
    "workshop": {
      "skillsDigest": "sha256:...",
      "agentsDigest": "sha256:...",
      "proseDigest": "sha256:..."
    }
  },
  "requires": {
    "node": ">=20 <23",
    "git": ">=2.39"
  },
  "adapter": {
    "protocolVersion": "1",
    "entry": "bin/fgos adapter",
    "capabilities": []
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": []
}
```

`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../../host-invocation-routing/architecture/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.

##### Release Tree Canonicalization

V1 uses a logical release file tree, not raw filesystem metadata.

| Field / Rule | V1 Decision |
|---|---|
| Path root | All paths are relative to the release root. Absolute paths are invalid. |
| Path separator | Always `/`, including on Windows. |
| Path normalization | UTF-8 NFC normalization before ordering and digesting. |
| Path order | Lexicographic byte order after normalization. |
| Case collision | Refuse a release if two paths collide under case-insensitive comparison. |
| File digest | SHA-256 of exact release-build bytes. |
| Line endings | Included in file bytes. Build must normalize if needed; install must not rewrite. |
| Executable bit | Included as `mode`, at least `755` vs `644`. |
| Directory entries | Not hashed as separate entries; directories are inferred from file paths. |
| Symlink | Refused in V1. Add explicit `kind: "symlink"` later only with relative, non-escaping targets. |
| mtime / owner / group | Excluded from runtime identity. |
| Archive digest | Optional `transportDigest`; never the runtime identity. |

Each file entry should include an ownership class:

```json
{
  "path": "bin/fgos",
  "kind": "file",
  "digest": "sha256:...",
  "mode": "755",
  "class": "immutable-entry"
}
```

Initial classes:

| Class | Meaning |
|---|---|
| `immutable-entry` | Public executable entry included in the release. |
| `immutable-runtime` | Runtime implementation/provider file. |
| `immutable-workshop-source` | Canonical skills, agents, or prose shipped with the runtime. |
| `immutable-doc` | Shipped documentation/prose used by users or agents. |
| `metadata` | Manifest or metadata file that participates in release identity. |

Generated workspace projections are not recorded as release-tree files at
their projected workspace paths. The release manifest records their canonical
source material; `ProjectionLedger` records where that material was projected
inside the workspace.

`files` may eventually contain every immutable release file and digest. The
minimum useful fingerprint set is:

- public entry binaries;
- provider descriptors;
- active host entry at `bin/fgos` whether implemented by Node first or Rust
  later;
- legacy Node payload;
- runner;
- adapter metadata/entry;
- init/doctor registries;
- skills, agents, prose source;
- manifest files themselves.
