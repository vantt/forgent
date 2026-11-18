# Phase 3: write-scope, colliding pairs and the addon operations

## Inputs

- `docs/platform/write-scope/spec.md` (the lexical soundness contract, the chosen meaning, the error policy) and the limits from phase 1.
- `packages/write-scope/src/lib.rs` (`canonicalize`, `prefix`, `overlaps`, `matches`, `expand`).
- `packages/git/node-addon/src/git/write_scope.rs` (the `writeScope(method, args)` dispatcher: today `canonicalize`, `canonicalizeAll`, `matches`, `expand`).
- `src/runner/dispatch/write-scope.mjs` (`writeScopesOverlap`, `canonicalizeWrites`, `matchesWriteScope`).
- `test/git/write-scope-parity.test.mjs` (the facade it injects exports only the existing operations) and the golden suite `test/runner/write-scope.test.mjs`.

## Files it may write

`docs/platform/write-scope/` (decision history), `packages/write-scope/**`, `packages/git/node-addon/src/git/write_scope.rs` (this file only; the rest of the addon is phase 7's), `test/git/write-scope-parity.test.mjs` and `test/runner/write-scope.test.mjs`.

## Steps

1. Add the set-level function: given items `{id, scopes[]}`, canonicalize every scope, compare pairs with the pairwise `overlaps` and return every colliding pair with the shared entries in the first item's own spelling, in a deterministic order. An entry that does not canonicalize is reported by item and entry, never dropped (decision 17). Per-item limits give item-level findings; the emitted-pairs cap and the comparison cap return `truncated`. No trie (decision 19).
2. Expose `overlaps` and the colliding-pairs function through the `writeScope` dispatcher in `write_scope.rs`, with panic containment as in decision 16, and add the matching exports to the parity facade.
3. Extend the existing parity test, which already pins `canonicalize`, `matches` and `expand` between JS and Rust, with overlap and colliding-pair cases and a differential corpus over Unicode whitespace (the Rust `space()` set includes U+FEFF and U+3000), repeated `**`, empty segments and the malformed entries of decision 17, comparing JS and Rust on `overlaps` as well as `canonicalize`. Note that Rust `overlaps` takes canonical prefixes while JS `writeScopesOverlap` takes whole scopes: compare the whole-scope entry points. The owning test of the malformed-entry behaviour lives here. Do not add a second parity file (design principle 8).
4. List the census entries this phase changed (decision 14); each must lie inside this phase's footprint.
5. Record the settled decision in the `write-scope` spec's decision history.

## Verify

`cargo test -p fgos-write-scope -p fgos-node-addon`, then `node --test test/git/write-scope-parity.test.mjs test/runner/write-scope.test.mjs` against the addon staged from this tree (`ensureGitAddon()` of `test/helpers/git-addon.mjs`).

## Rollback

Revert the commit; the earlier functions are untouched.
