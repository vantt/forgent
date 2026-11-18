# Phase 2: Workspace scaffold and write-scope move

One phase owns the workspace manifest edges so later phases never edit `Cargo.toml` or a crate manifest.
It commits in its own linked worktree (decision 14). The names it creates are those of decision 26.

## Inputs

- The specs from phase 1 are not required: the names are fixed in `plan.md`.
- `Cargo.toml` (workspace `members`), `packages/git/write-scope`, and the manifests that depend on it by a relative path: `packages/git/rust/Cargo.toml`, `packages/git/node-addon/Cargo.toml`, `packages/supervision/rust/Cargo.toml`.
- `domains/coding/slice-kinds.yaml` (the `platform` kind matches the crate with the glob `packages/*/write-scope/**`) and its generated `domains/coding/compiled.json`.
- `docs/platform/git/spec.md` (RUL84 sections describing the leaf; edit only a line that names the old location).
- An existing pure crate for layout and lint conventions, for example `packages/convention/rust`.

## Files it may write

`Cargo.toml`, `Cargo.lock`, `packages/write-scope/**` (moved with history), `packages/git/write-scope/**` (removed), the manifests above, `docs/platform/git/spec.md`, `domains/coding/slice-kinds.yaml`, `domains/coding/compiled.json`, `test/workflow/propose-classify.test.mjs`, and skeleton `packages/graph/rust/**` and `packages/resource-referee/rust/**` (manifest plus an empty `lib.rs` each).

## Steps

1. Move the crate with `git mv packages/git/write-scope packages/write-scope`; the crate name stays `fgos-write-scope`.
2. Point the consumers' relative `path` entries at the new location and fix the `members` list.
3. Create the two skeleton crates and declare every dependency edge up front: `graph` depends on no internal crate; `resource-referee` on `graph` and `write-scope`; the native addon on `write-scope` and `graph`; the supervisor only on `write-scope` (it already does). Both new crates declare `serde` and `serde_json` with `workspace = true`. No new external crate is added, and `fgos-write-scope` itself stays dependency-free (decision 15), so neither the root lock nor the gateway's own lock changes for it. The `apps/fgos` edges are the door plan's.
4. Search for every reference to the crate, not only its literal path: `rg "write-scope"` across Cargo manifests, `domains/`, `core/`, `docs/` and `test/`, and the anchored `rg "packages/git/write-scope"`. Update every hit outside history files: the known ones are `test/workflow/propose-classify.test.mjs:48`, the manifests' relative paths and the stale glob `packages/*/write-scope/**` in `domains/coding/slice-kinds.yaml` (change it to `packages/write-scope/**` and regenerate `compiled.json`). Add one non-`.rs` file of the crate to the classification test so the glob is proven, not assumed.
5. Regenerate `Cargo.lock` once; commit it with the manifests. Do not regenerate the mutation census.
6. List the census entries this phase changed (decision 14); each must be a moved or new file of this phase.
7. Announce the move to the lanes that hold `Cargo.toml` and `packages/git` (board) before starting.

## Verify

`cargo build --workspace --locked -j4` and `cargo test -p fgos-write-scope`, run alone with `free -g` checked first, then `node --test test/workflow/propose-classify.test.mjs test/distribution/native-addon.test.mjs`. The anchored search finds nothing outside history. The node addon still builds (`cargo build -p fgos-node-addon --locked`) and `apps/fgos-gateway` still builds from its own lock without changing it. The two named census tests are expected to be red until the landing.

## Rollback

Revert the commit; the crate returns to `packages/git/write-scope`.
