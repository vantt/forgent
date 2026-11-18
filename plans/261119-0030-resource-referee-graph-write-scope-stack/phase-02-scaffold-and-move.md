# Phase 2: Workspace scaffold and write-scope move

One phase owns the workspace manifests so later phases never edit `Cargo.toml` or `Cargo.lock`.

## Inputs

- The specs from phase 1.
- `Cargo.toml` (workspace `members`), `packages/git/write-scope`, and the manifests that depend on it: `packages/git/rust/Cargo.toml`, `packages/git/node-addon/Cargo.toml`, `packages/supervision/rust/Cargo.toml`.
- An existing pure crate for layout and lint conventions, for example `packages/convention/rust`.

## Files it may write

`Cargo.toml`, `Cargo.lock`, `packages/write-scope/**` (moved with history), `packages/git/write-scope/**` (removed), the three manifests above, `test/workflow/propose-classify.test.mjs` (it names the old path), and skeleton `packages/graph/rust/**` and `packages/resource-referee/rust/**` (manifest plus an empty `lib.rs` each).

## Steps

1. Move the crate with `git mv packages/git/write-scope packages/write-scope`; the crate name stays `fgos-write-scope`.
2. Point the three consumers' `path` entries at the new location and fix the `members` list.
3. Create the two skeleton crates. In their manifests declare every dependency edge the plan needs: `graph` depends on nothing internal; `resource-referee` depends on `graph` and `write-scope`; the supervisor depends on `write-scope`, `graph` and `resource-referee`. Both new crates also declare `serde` and `serde_json` with `workspace = true`. No new external crate is added (`proptest` is not in the workspace).
4. Search the whole repository for the old path (`rg "git/write-scope"`) and update every hit outside history files; the known one is `test/workflow/propose-classify.test.mjs:48`.
5. Regenerate `Cargo.lock` once; commit it with the manifests. Do not regenerate the mutation census: phase 10 owns it.
6. Announce the move to the lanes that hold `Cargo.toml` and `packages/git` (board) before starting.

## Verify

`cargo build --workspace --locked -j4` and `cargo test -p fgos-write-scope`, run alone with `free -g` checked first, then `node --test test/workflow/propose-classify.test.mjs`. `rg "git/write-scope"` finds nothing outside history. The node addon still builds: `cargo build -p fgos-node-addon --locked`.

## Rollback

Revert the commit; the crate returns to `packages/git/write-scope`.
