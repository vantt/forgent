# Phase 2: Friction layer value for owner communication

Capability: `code:implement`. Wave 1, no dependencies.

## Inputs

- Discussion OC-D4 and OC-D14 (`plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, section 4).
- `packages/observe/rust/friction-kinds.json`: the closed layer list.
- `docs/platform/observe/spec.md` line 136: the spec's copy of the layer list.
- `packages/observe/rust/src/friction.rs`: reads the file with `include_str!`; no code change is expected.

## Files it may write

`packages/observe/rust/friction-kinds.json`, `docs/platform/observe/spec.md`.

## Steps

1. Add `"owner-communication"` to `attrs."fgos.friction.layer".values`.
2. Add the value to the layer list in `docs/platform/observe/spec.md` line 136, with a few words: talking to the
   owner (questions, reports, presentation).
3. Find the test that proves the layer list is enforced (search `packages/observe/rust/tests` for a layer value
   such as `"attestation"`). If one enumerates the accepted values, extend that test with the new value; do not
   add a second test.

## Verify

```bash
cargo test -p fgos-observe   # or the observe crate's package name from packages/observe/rust/Cargo.toml
npm run fgos:dev -- friction record --subject session:plan-check --layer owner-communication --error-class unexplained-id --disposition advisory --producer plan-check --kind awkward --detail "phase check"
```

Pass: tests green and the record is accepted (the second command needs a writable project; if the sandbox
cannot write, the crate test that accepts the value is the proof).

## Rollback

`git revert` the phase commit.
