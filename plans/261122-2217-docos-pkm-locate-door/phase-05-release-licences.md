# Phase 5: Third-party licences in the release

## Context

Spec 8.2: releases carry pkm's third-party licence list and the "Grant to fgOS" notice. F10: the list is
`pkm_cli::third_party_json()` (pkm-cli), the grant is pkm's root `LICENSE`. F21: the payload is `package.json` `files`.
Decision 8. Can run beside phases 3 and 4 (disjoint footprint).

## Files it writes

`packages/documentation/third-party/pkm/third-party.json`, `packages/documentation/third-party/pkm/LICENSE`,
`packages/documentation/rust/tests/third_party.rs`, `package.json` (`files` gains `packages/documentation/third-party`),
`test/rust-host/release-tree.test.mjs`.

## Steps

1. Copy pkm v0.7.0 `crates/pkm-cli/data/third-party.json` and `LICENSE` byte for byte.
2. `tests/third_party.rs`: the committed JSON equals `pkm_cli::third_party_json()`; the committed `LICENSE` has the
   sha256 recorded in the test for tag v0.7.0 and contains the heading `Grant to fgOS`. A pin raise fails this test
   until both copies and the hash are refreshed, which is the intended reminder.
3. Add the directory to `package.json` `files` and one assertion in the release-tree test that both files are in the payload.

## Validation

```sh
env -u CLAUDE_CODE_SESSION_ID cargo test -p fgos-documentation --test third_party
env -u CLAUDE_CODE_SESSION_ID node --test test/rust-host/release-tree.test.mjs
```

## Risk

The JSON covers pkm's own binary (clap, mcp), a superset of what fgOS links: acceptable, it under-claims nothing.
ORT's own ThirdPartyNotices is referenced by pkm's notice, not copied (same as pkm).

## Rollback

Revert the commit.
