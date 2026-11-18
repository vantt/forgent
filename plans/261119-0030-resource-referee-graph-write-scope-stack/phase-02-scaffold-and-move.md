# Phase 2: Workspace scaffold and write-scope move

One phase owns every manifest edge so later phases never edit `Cargo.toml`, `Cargo.lock` or a crate
manifest. It commits in its own linked worktree (decision 14). The names it creates follow the owner's
answer to Owner question 1; if that is open, the names in `plan.md` apply.

## Inputs

- The specs from phase 1 are not required: the names are fixed in `plan.md`.
- `Cargo.toml` (workspace `members`), `packages/git/write-scope`, and the manifests that depend on it: `packages/git/rust/Cargo.toml`, `packages/git/node-addon/Cargo.toml`, `packages/supervision/rust/Cargo.toml`, plus `apps/fgos/Cargo.toml` (it depends on none of the new crates today).
- `docs/platform/git/spec.md` (RUL84 sections naming the crate's home, around lines 91 and 310).
- An existing pure crate for layout and lint conventions, for example `packages/convention/rust`.

## Files it may write

`Cargo.toml`, `Cargo.lock`, `apps/fgos/Cargo.toml`, `packages/write-scope/**` (moved with history), `packages/git/write-scope/**` (removed), the manifests above, `docs/platform/git/spec.md`, `test/workflow/propose-classify.test.mjs` (it names the old path), and skeleton `packages/graph/rust/**` and `packages/resource-referee/rust/**` (manifest plus an empty `lib.rs` each).

## Steps

1. Move the crate with `git mv packages/git/write-scope packages/write-scope`; the crate name stays `fgos-write-scope`.
2. Point the consumers' `path` entries at the new location and fix the `members` list.
3. Create the two skeleton crates and declare every dependency edge up front: `graph` depends on no internal crate; `resource-referee` on `graph` and `write-scope`; the native addon on `write-scope`, `graph` and `resource-referee`; `apps/fgos` on `supervision`, `write-scope`, `graph` and `resource-referee`; the supervisor only on `write-scope` (it already does). Both new crates declare `serde` and `serde_json` with `workspace = true`. No new external crate is added.
4. Search the repository for the anchored old path (`rg "packages/git/write-scope"`) and update every hit outside history files: the known ones are `test/workflow/propose-classify.test.mjs:48` and the RUL84 lines of `docs/platform/git/spec.md`. The substring `git/write-scope` also matches `test/git/write-scope-parity.test.mjs`, so always use the anchored pattern.
5. Regenerate `Cargo.lock` once; commit it with the manifests. Do not regenerate the mutation census.
6. Run the census scan without `--write-census` and list the changed entries; each must be a moved or new file of this phase.
7. Announce the move to the lanes that hold `Cargo.toml` and `packages/git` (board) before starting.

## Verify

`cargo build --workspace --locked -j4` and `cargo test -p fgos-write-scope`, run alone with `free -g` checked first, then `node --test test/workflow/propose-classify.test.mjs test/distribution/native-addon.test.mjs`. `rg "packages/git/write-scope"` finds nothing outside history. The node addon still builds (`cargo build -p fgos-node-addon --locked`) and `apps/fgos-gateway` still builds from its own lock without changing it. `test/git/one-door.test.mjs` is expected to be red until the final landing.

## Rollback

Revert the commit; the crate returns to `packages/git/write-scope`.
