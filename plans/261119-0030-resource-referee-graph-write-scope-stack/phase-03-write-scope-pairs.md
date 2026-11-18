# Phase 3: write-scope, colliding pairs in a set

## Inputs

- `docs/platform/write-scope/spec.md` (the soundness contract, the chosen meaning, the error policy) and `reports/facts.md` from phase 1.
- `packages/write-scope/src/lib.rs` (`canonicalize`, `prefix`, `overlaps`, `matches`, `expand`).
- `packages/git/node-addon/src/git/write_scope.rs` (what Node can call today: `canonicalize`, `canonicalizeAll`, `matches`, `expand`).
- `src/runner/dispatch/write-scope.mjs` (`writeScopesOverlap`, `canonicalizeWrites`, `matchesWriteScope`).
- `test/git/write-scope-parity.test.mjs` (runs the JS golden suite `test/runner/write-scope.test.mjs` against the native leaf).

## Files it may write

`docs/platform/write-scope/`, `packages/write-scope/**`, `packages/git/node-addon/src/**`, `test/git/write-scope-parity.test.mjs` and `test/runner/write-scope.test.mjs`.

## Steps

1. Add the set-level function: given items `{id, scopes[]}`, canonicalize every scope, compare pairs with the pairwise `overlaps` and return every colliding pair with the shared entries in the first item's own spelling, in a deterministic order. An entry that does not canonicalize is reported by item and entry, never dropped (decision 17). Cap the number of emitted pairs by the contract limit and return `truncated`.
2. Measure the largest real input (the folded Work view and the largest plan table) and record the time in `reports/facts.md`. Add a path trie only if that measurement shows pairwise is too slow (decision 19); otherwise do not.
3. Expose the function to Node through the native addon, next to the existing four operations in `write_scope.rs`.
4. Extend the existing parity test, which already pins `canonicalize`, `matches` and `expand` between JS and Rust, with overlap and colliding-pair cases and a differential corpus over Unicode whitespace (the Rust `space()` set includes U+FEFF and U+3000), repeated `**`, empty segments and the malformed entries of decision 17, comparing JS and Rust on `overlaps` as well as `canonicalize`. Do not add a second parity file (design principle 8).
5. Record the settled decision in the `write-scope` spec's decision history.

## Verify

`cargo test -p fgos-write-scope -p fgos-node-addon`, then `node --test test/git/write-scope-parity.test.mjs test/runner/write-scope.test.mjs`.

## Rollback

Revert the commit; the earlier functions are untouched.
