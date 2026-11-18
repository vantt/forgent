# Phase 7: Addon bindings and ABI

The Node surface that Work and the scripts share. It changes no consumer; the door plan starts after
this plan lands.

## Inputs

- The `graph` crate (phase 4) and the write-scope operations exposed in phase 3.
- The addon's source layout (`packages/git/node-addon/src`: `lib.rs` with its `versions()` object, `canonical_json.rs`, `agent_protocol.rs`, `git/write_scope.rs` and others). The addon has no shared panic helper: `checkout.rs:153` and `git/land.rs:65` each carry a private `guarded` with its own error name.
- `src/native/door.mjs` (`combinedAbiMatches`, `loadNativeAddon`), `test/config/config-door.test.mjs` (the existing ABI test), `test/git/native-load.test.mjs` (pins `versions()` whole with `deepEqual`) and `packages/git/contracts/ports.v1.json` (lists the addon's top-level functions, `writeScope` among them).
- The staging helper `test/helpers/git-addon.mjs` (`ensureGitAddon()`) that later tests use to build and point at this checkout's addon.

## Files it may write

`packages/git/node-addon/src/**` (a `graph` module, the shared helper in `lib.rs`, the `versions()` fields, and the wrapping of the `git/write_scope.rs` additions of phase 3), `packages/git/contracts/ports.v1.json`, `src/native/door.mjs`, `test/config/config-door.test.mjs` and `test/git/native-load.test.mjs`. The mutation census is not touched.

## Steps

1. Bind `graph` into the addon. There is no `resource-referee` binding: no Node caller exists (decision 16).
2. Lift one panic-containment helper into the addon's `lib.rs` (the existing private `guarded` functions stay: their error names differ), wrap every new entry once, including the `write_scope.rs` additions of phase 3, and answer a caught panic with a named `*-internal-error`.
3. Add a `versions()` field for `graph` and for `writeScope` and the matching clauses in `combinedAbiMatches`; make the refusal name the first missing or low field instead of the generic mismatch message. List `graph` in `ports.v1.json`.
4. Update `test/git/native-load.test.mjs` (the one test that owns the shape of `versions()`) and extend the ABI test with cases that an addon lacking each new field is refused by name. Prove the panic helper with a Rust unit test of the helper itself; add no production branch that exists only to be tested.
5. List the census entries this phase changed against its footprint.

## Verify

`cargo test -p fgos-node-addon`, then `node --test test/config/config-door.test.mjs test/git/native-load.test.mjs test/git/write-scope-parity.test.mjs`.

## Rollback

Revert the commit; the earlier namespaces are untouched.
