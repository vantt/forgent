# Phase 3: Deterministic windows-msvc addon

## Inputs
- Phase 2's summary: the differing PE section and the run id of the mismatch pair.
- .github/workflows/release-assets.yml, root Cargo.toml `[profile.release]`, packages/git/node-addon/Cargo.toml and
  build.rs, scripts/build-rust-distribution.mjs, docs/platform/packaging-distribution/spec.md (decision history).

## Files it may write
.github/workflows/release-assets.yml, Cargo.toml, packages/git/node-addon/Cargo.toml, packages/git/node-addon/build.rs,
scripts/build-rust-distribution.mjs, docs/platform/packaging-distribution/spec.md

## Steps
1. From the named section, find the source of the non-determinism, for example a linker or rustc flag, codegen
   partitioning, an embedded path or GUID, or build-script output. Fix it at that source, so that the shipped and
   independent builds of one commit are byte-identical. Do not relax the compare: no retry, no non-blocking step,
   and no stripping of bytes before hashing.
2. If the cause lies in a file outside this footprint, stop and report it instead of editing that file.
3. Record the cause and the fix as a settled fact in docs/platform/packaging-distribution/spec.md, in the place that
   describes the reproducible addon or its decision history.

## Verify
- Linux: the release workspace still compiles. Ubuntu digests stay equal.
- Windows: the lead dispatches `release-assets-check` on the branch at least three times on one commit, and
  `compare addon digests` is green in all of them. lead:OPC reviews before the land.
