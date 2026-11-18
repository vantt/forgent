# Phase 2: Mint kind `question`

Waits for session-verb phase 4, which rewrites `packages/identity/**`.

## Inputs
- `packages/identity/rust/src/mint.rs`: `RandomKind` (:18), the prefixes (:25-26), `KIND_NAMES` (:65),
  `Kind::parse` (:69) and `Kind::name` (:80).
- Every other place that lists the kinds:
  - `packages/identity/contracts/identity.write.v1.json:78`
  - `core/instructions/id-minting.md:15`
  - `docs/platform/identity/spec.md` §4a
  - `src/cli/command-registry.mjs:1153-1157` (the enum). This file is phase 4's hot file. If the enum is not
    generated from `KIND_NAMES`, note it in the commit, and phase 4 adds `question` there in the same wave as its
    own registry edit.

## Footprint
- `packages/identity/rust/src/mint.rs`
- `packages/identity/rust/tests/**`
- `packages/identity/contracts/identity.write.v1.json`
- `docs/platform/identity/spec.md`
- `core/instructions/id-minting.md`

## Steps
0. Re-grep the inputs.
1. Add `RandomKind::Question` with prefix `q`, using the same body as the other random kinds and no network.
2. Add `question` to `Kind::parse`, `Kind::name`, `KIND_NAMES`, the write contract, `id-minting.md` and spec §4a.
3. Extend the existing test that owns the random kinds so it covers `question`.

## Verify
- `cargo test -p fgos-identity` is green.
- `npm run fgos:dev -- identity mint question --json` returns an id in the random-kind format.

## Rollback
Revert the phase commit.
