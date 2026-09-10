# Phase 11 — fgctl Crate, Manifest Verify, And Release Store

Depends on: Phase 10 closed and merged (and therefore Phase 09's release-tree
builder exists to produce a stageable tree).

## Objective

Stand up `apps/fgctl` (binary crate `fgctl`) and extend `fgos-distribution`
with manifest parsing, canonical release-tree digest recomputation, and
per-file digest verification, then implement `fgctl stage` and `fgctl status`
over a content-addressed machine release store. This cell does not activate
anything in a workspace — no `init`/`upgrade`/`repair`, no
`.fgos/installation/` writer (Phase 12/13 own those). Declaring those
subcommands here as unimplemented placeholders is not allowed.

## Requirements

- R1: `apps/fgctl` is a new binary crate `fgctl`, added as a fourth workspace
  member in root `Cargo.toml`, path-dependent on `fgos-distribution`. Its CLI
  recognizes exactly `stage` and `status`; any other subcommand exits
  non-zero with a usage line naming only those two.
- R2: `fgos-distribution` gains manifest types matching
  `runtime-identity-and-activation.md` §5's minimum fields (`schemaVersion`,
  `artifactDigest`, `digestKind`, `releaseVersion`, `sourceRevision`,
  `createdAt`, `target.{os,arch,libc}`, `entries.{fgos,fgosRunner}`,
  `components.legacyNode.{root,entry,digest}`, `requires.{node,git}`,
  `stateSchemas.{read,write,migrations}`, `files[]` with `path`/`kind`/
  `digest`/`mode`/`class`), deserialized from Phase 09's emitted
  `manifest.json` with no field renaming.
- R3: `fgos-distribution` gains a canonical release-tree walk that reads only
  the manifest's own `files[]` list (never re-walks the filesystem for its
  own path set), normalizes each `path` to `/`-separated UTF-8 NFC form,
  sorts lexicographically by normalized bytes, and refuses the manifest if
  two paths collide case-insensitively, any path is absolute, any path
  traverses outside the release root, or any entry names a symlink target —
  the Release Tree Canonicalization table in `runtime-identity-and-
  activation.md` §5.
- R4: `fgos-distribution::recompute_artifact_digest` recomputes
  `sha256(canonical-json(manifest without artifactDigest))` from the
  manifest on disk, plus a per-file verifier that re-hashes each `files[]`
  entry's bytes at its declared path under the release root and compares to
  its declared `digest`. Both return typed errors distinguishing a manifest
  digest mismatch, a specific file's digest mismatch, and a missing file.
- R5: Machine release store root is
  `${FGOS_STATE_HOME:-${XDG_STATE_HOME:-$HOME/.local/state}/fgos}/`
  (`FGOS_STATE_HOME` always wins so no test ever touches a real machine
  store): `releases/<artifactDigest>/`, `installs/<activationId>.json`,
  `install.lock`, `quarantine/<digest>-<timestamp>/`. Release directories
  are digest-only; version is read from that release's own `manifest.json`.
- R6: `fgctl stage --from <dir|.tar.gz>` acquires `install.lock` (create-
  exclusive file under the store root; a second concurrent `stage` observes
  a "stage already in progress" refusal, never a blocking retry loop);
  verifies the candidate's manifest (R2–R4); if `releases/<digest>/` already
  exists, treats the call as a no-op success without rewriting it; otherwise
  writes the candidate into a temp sibling under the store root and renames
  it into place only after the manifest digest and every file digest verify;
  on any mismatch, moves the temp directory to
  `quarantine/<digest>-<timestamp>/` and returns a quarantined error —
  nothing appears under `releases/` for a failed stage. Releases the lock on
  every path (success, no-op, quarantine).
- R7: `.tar.gz` input is extracted to a temp dir with the `tar` + `flate2`
  crates (pure Rust — `fgctl` must not depend on a system `tar` binary,
  since `install.sh`'s target machines are not guaranteed to have one beyond
  what the OS ships). A directory input is staged directly, no extraction
  step. Add `tar`/`flate2` as new `[dependencies]` in
  `packages/distribution/rust/Cargo.toml`; reuse whichever hashing crate
  Phase 08 already pinned for `data_hash` — do not add a second one.
- R8: `fgctl status --json` lists every release under `releases/` as
  `{artifactDigest, releaseVersion, createdAt}` read from each release's own
  manifest, sorted by `createdAt` descending; an empty store reports an
  empty array, not an error.
- R9: `test/rust-host/fgctl-stage.test.mjs` (Node, spawns the built binary):
  stages the tree `scripts/build-rust-distribution.mjs` builds into a temp
  dir, asserts the digest under the staged `releases/<digest>/manifest.json`
  matches the recomputed value; corrupts one byte of a source file before
  staging and asserts quarantine with nothing under `releases/`; fires two
  `stage` invocations back-to-back against the same store and asserts
  exactly one succeeds while the other observes the lock refusal; re-stages
  an already-staged digest and asserts a no-op (manifest mtime unchanged).
  Every case sets `FGOS_STATE_HOME` to a fresh temp dir.

## Files

Likely touch:

- `Cargo.toml` (add `apps/fgctl` workspace member)
- `apps/fgctl/Cargo.toml`, `apps/fgctl/src/**` (new)
- `packages/distribution/rust/src/**` (new modules, additive alongside
  Phase 08's `distribution.build.show` provider)
- `packages/distribution/rust/Cargo.toml` (dependency additions only)
- `test/rust-host/fgctl-stage.test.mjs` (new)

Do not touch:

- `apps/fgos/**` (no `fgctl` invocation lives inside the `fgos` binary)
- `packages/host-runtime/rust/**` (kernel stays provider-agnostic)
- `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`,
  `herdr-plugin/**` (`resolver` lease, already merged — read-only)
- `.fgos/installation/**`, real or fixture (no activation writer in this
  cell — Phase 12)
- `scripts/build-rust-distribution.mjs` (Phase 09's file; run as a fixture
  producer only)

## Verification

```sh
cargo build --release --workspace
node scripts/build-rust-distribution.mjs --out /tmp/fgos-release-p11
FGOS_STATE_HOME=$(mktemp -d) ./target/release/fgctl stage --from /tmp/fgos-release-p11
FGOS_STATE_HOME=<same dir as above> ./target/release/fgctl status --json
node --test test/rust-host/fgctl-stage.test.mjs
```

- `fgctl status --json` after staging lists exactly the one release `stage`
  reported, with the same digest.
- The corrupted-byte case proves quarantine, not silent acceptance.
- The concurrent-stage case proves exactly one lock winner.
- The alias-ban grep from `plan.md`'s Constraints, run over `apps/fgctl` and
  the new `packages/distribution/rust` modules, returns nothing.
- Capability annotation for this cell: `code:implement`.
