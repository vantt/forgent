# Phase 7: Addon bindings and ABI

The Node surface that Work and the scripts share. The door plan (phase 7b onward) starts after this plan lands.

## Inputs

- The crates from phases 3, 4 and 5 and the Node access decision (decision 16).
- The addon's source layout (`packages/git/node-addon/src`: `lib.rs` with its `versions()` object, `canonical_json.rs`, `agent_protocol.rs`, `git/write_scope.rs` and others) and `packages/git/node-addon/src/git/write_scope.rs` (what Node can call today).
- `src/native/door.mjs` (`combinedAbiMatches`, `loadNativeAddon`) and `test/config/config-door.test.mjs` (the existing ABI test).
- The staging helper `test/helpers/git-addon.mjs` (`ensureGitAddon()`) that later tests use to build and point at this checkout's addon.

## Files it may write

`packages/git/node-addon/src/**` (new modules for `graph` and `resource-referee`, the colliding-pairs operation next to `write_scope.rs`, and the `versions()` fields; the manifest edges were declared in phase 2), `src/native/door.mjs`, and `test/config/config-door.test.mjs`. The mutation census is not touched.

## Steps

1. Write the addon bindings for `graph` and `resource-referee`, and expose the colliding-pairs function of phase 3 next to the four existing write-scope operations.
2. Add a `versions()` field for each new namespace and the matching clause in `combinedAbiMatches`, so an addon from before them is refused by name and never fails at its first call.
3. Extend the existing ABI test with a case that an addon lacking the new fields is refused by name.
4. Run the census scan without `--write-census` and list the changed entries against this phase's footprint.

## Verify

`cargo test -p fgos-node-addon`, then `node --test test/config/config-door.test.mjs test/git/write-scope-parity.test.mjs`.

## Rollback

Revert the commit; the earlier namespaces are untouched.
