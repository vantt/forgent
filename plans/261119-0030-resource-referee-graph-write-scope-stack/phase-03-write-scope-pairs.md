# Phase 3: write-scope, colliding pairs in a set

## Inputs

- `docs/platform/write-scope/spec.md` (the lexical soundness contract, the chosen meaning, the error policy) and the numeric limits from phase 1.
- `packages/write-scope/src/lib.rs` (`canonicalize`, `prefix`, `overlaps`, `matches`, `expand`).
- `src/runner/dispatch/write-scope.mjs` (`writeScopesOverlap`, `canonicalizeWrites`, `matchesWriteScope`).
- `test/git/write-scope-parity.test.mjs` (runs the JS golden suite `test/runner/write-scope.test.mjs` against the native leaf).

## Files it may write

`docs/platform/write-scope/` (decision history), `packages/write-scope/**`, `test/git/write-scope-parity.test.mjs` and `test/runner/write-scope.test.mjs`. The addon exposure of this function is written in phase 7.

## Steps

1. Add the set-level function: given items `{id, scopes[]}`, canonicalize every scope, compare pairs with the pairwise `overlaps` and return every colliding pair with the shared entries in the first item's own spelling, in a deterministic order. An entry that does not canonicalize is reported by item and entry, never dropped (decision 17). Cap the emitted pairs and the number of comparisons by the contract limits and return `truncated`. No trie (decision 19).
2. Extend the existing parity test, which already pins `canonicalize`, `matches` and `expand` between JS and Rust, with overlap and colliding-pair cases and a differential corpus over Unicode whitespace (the Rust `space()` set includes U+FEFF and U+3000), repeated `**`, empty segments and the malformed entries of decision 17, comparing JS and Rust on `overlaps` as well as `canonicalize`. The owning test of the malformed-entry behaviour lives here. Do not add a second parity file (design principle 8).
3. Run the census scan without `--write-census` and list the changed entries; each must lie inside this phase's footprint.
4. Record the settled decision in the `write-scope` spec's decision history.

## Verify

`cargo test -p fgos-write-scope`, then `node --test test/git/write-scope-parity.test.mjs test/runner/write-scope.test.mjs`.

## Rollback

Revert the commit; the earlier functions are untouched.
