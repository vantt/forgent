# Phase 3: write-scope, colliding pairs and the addon operations

## Inputs

- `docs/platform/write-scope/spec.md` (the lexical soundness contract, the chosen meaning, the error policy) and the limits from phase 1.
- `packages/write-scope/src/lib.rs` (`canonicalize`, `prefix`, `overlaps`, `matches`, `expand`).
- `packages/git/node-addon/src/git/write_scope.rs` (the `writeScope(method, args)` dispatcher: today `canonicalize`, `canonicalizeAll`, `matches`, `expand`).
- `src/runner/dispatch/write-scope.mjs` (`writeScopesOverlap`, `canonicalizeWrites`, `matchesWriteScope`; it has no set-level function and gets none).
- `test/git/write-scope-parity.test.mjs` (the facade it injects exports only the existing operations) and the golden suite `test/runner/write-scope.test.mjs`, which has no `writeScopesOverlap` case today.

## Files it may write

`docs/platform/write-scope/` (decision history), `packages/write-scope/**`, `packages/git/node-addon/src/git/write_scope.rs` (this file only; the rest of the addon and the panic wrapper are phase 7's), `test/git/write-scope-parity.test.mjs` and `test/runner/write-scope.test.mjs`.

## Steps

1. Add the set-level function: given items `{id, scopes[]}`, canonicalize every scope, compare pairs with the pairwise `overlaps` and return every colliding pair with the shared entries in the first item's own spelling, in a deterministic order. An entry that does not canonicalize is reported by item and entry, never dropped (decision 17). Per-item limits give item-level findings; the emitted-pairs cap and the comparison cap return `truncated` (decision 7). No trie, no dependency (decisions 15, 19).
2. Expose `overlaps` and the colliding-pairs function through the `writeScope` dispatcher in `write_scope.rs`, building the JSON with `json!` as the file already does; add the matching exports to the parity facade. Do not wrap the new entries in a panic guard here: phase 7 lifts one shared helper and wraps them once.
3. Extend the existing parity test, which already pins `canonicalize`, `matches` and `expand` between JS and Rust, with whole-scope `overlaps` cases (add a `writeScopesOverlap` case to the golden suite so both sides run it) and a differential corpus over Unicode whitespace (the Rust `space()` set includes U+FEFF and U+3000), repeated `**`, empty segments and the malformed entries of decision 17. Rust `overlaps` takes canonical prefixes while JS `writeScopesOverlap` takes whole scopes: compare the whole-scope entry points. Do not add a second parity file (design principle 8).
4. Prove the colliding-pairs function with Rust tests against a naive pairwise oracle over `overlaps`, including the truncation caps and the malformed-entry behaviour (the owning test lives here).
5. List the census entries this phase changed (decision 14); each must lie inside this phase's footprint.
6. Record the settled decision in the `write-scope` spec's decision history.

## Verify

`cargo test -p fgos-write-scope -p fgos-node-addon`, then `node --test test/git/write-scope-parity.test.mjs test/runner/write-scope.test.mjs` against the addon staged from this tree (`ensureGitAddon()` of `test/helpers/git-addon.mjs`).

## Rollback

Revert the commit; the earlier functions are untouched.
