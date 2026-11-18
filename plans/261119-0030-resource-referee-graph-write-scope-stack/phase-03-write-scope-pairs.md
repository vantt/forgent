# Phase 3: write-scope, colliding pairs in a set

## Inputs

- `docs/platform/write-scope/spec.md` (the soundness contract and the chosen meaning) from phase 1.
- `packages/write-scope/src/lib.rs` (`canonicalize`, `prefix`, `overlaps`, `matches`, `expand`).
- `packages/git/node-addon/src/git/write_scope.rs` (what Node can call today: `canonicalize`, `canonicalizeAll`, `matches`, `expand`).
- `src/runner/dispatch/write-scope.mjs` (`writeScopesOverlap`, `canonicalizeWrites`, `matchesWriteScope`).
- `test/git/write-scope-parity.test.mjs` (runs the JS golden suite `test/runner/write-scope.test.mjs` against the native leaf) and the Node access decision in `reports/facts.md`.

## Files it may write

`packages/write-scope/**`, `packages/git/node-addon/src/**`, `test/git/write-scope-parity.test.mjs` and `test/runner/write-scope.test.mjs`.

## Steps

1. Add the set-level function: given items `{id, scopes[]}`, return every colliding pair with the shared entries in the first item's own spelling, in a deterministic order. Build it on a path-segment trie so the cost follows the number of paths and hits, not the square of the item count.
2. Keep the pairwise `overlaps` as the one definition of the relation; the trie is an optimisation that must agree with it. A property-style test compares the trie against the naive pairwise result on generated inputs from a small seeded generator in the test file (no new crate); one owning test per behaviour.
3. Expose the new function to Node the way phase 1 decided (if the native addon: next to the existing four operations in `write_scope.rs`; if the host verb: nothing here).
4. Extend the existing parity test, which already pins `canonicalize`, `matches` and `expand` between JS and Rust, with overlap and colliding-pair cases, so the JS port cannot drift until dispatch migrates. Do not add a second parity file (design principle 8).

## Verify

`cargo test -p fgos-write-scope -p fgos-node-addon`, then `node --test test/git/write-scope-parity.test.mjs test/runner/write-scope.test.mjs`.

## Rollback

Revert the commit; the earlier functions are untouched.
