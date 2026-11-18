# Phase 2: Mint kind `question`

## Inputs
- `packages/identity/rust/src/mint.rs`: `RandomKind` (:18), the prefixes (:25-26), `Kind::parse` (:69),
  `Kind::name` (:80) and `KIND_NAMES` (:65).
- `docs/platform/identity/spec.md` §4a (around line 99).
- The id-minting law in `core/instructions/id-minting.md`.

## Footprint
- `packages/identity/rust/src/mint.rs`
- `packages/identity/rust/tests/**`
- `docs/platform/identity/spec.md`

## Steps
0. Re-grep. The session-verb plan (a blocker) has changed this crate.
1. Add `RandomKind::Question` with prefix `q`. Give it the same 10-character base32 body as the other random kinds,
   and it needs no network.
2. Add `question` to `Kind::parse`, `Kind::name` and `KIND_NAMES`.
3. Extend the existing mint test that owns the random kinds (do not write a new file) so it covers `question`: the
   format, and that no network is used.
4. Add the kind to the table in §4a of the identity spec.
5. If `fgos identity mint --help` text is generated from `KIND_NAMES`, nothing else changes. If it is written by
   hand, leave it alone and note that in the commit; phase 9 regenerates it.

## Verify
`cargo test -p fgos-identity` must be green.

`npm run fgos:dev -- identity mint question --json` must return an id of the form `q-[a-z2-7]{10}`, or whatever form
the random kinds already use.

## Rollback
Revert the phase commit.
