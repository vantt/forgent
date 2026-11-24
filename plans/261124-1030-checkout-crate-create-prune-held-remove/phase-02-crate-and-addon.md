# Phase 2: Crate and addon entries

Capability: `code:implement`.

## Inputs

- `reports/facts.md` of this plan (phase 1).
- `packages/execution/checkout/src/` and `tests/`, `packages/git/node-addon/src/checkout.rs`, `src/runner/worktree.mjs`.

## Files it may write

packages/execution/checkout/src/**, packages/execution/checkout/tests/**, packages/git/node-addon/src/checkout.rs,
src/runner/worktree.mjs, test/runner/worktree-ports.test.mjs, test/runner/worktree.test.mjs

## Steps

1. **Create at branch, path and base.** Expose the crate's `create` (or the smallest extension the facts name) as one
   addon entry in the `checkout` namespace, and one export in `src/runner/worktree.mjs`. Keep every refusal rule the
   facts list for the copies that this plan keeps.
2. **Prune a missing checkout.** Make the prune of a missing checkout's registration a public crate function, reusing
   `orphan.rs`'s `prune_missing` path through the Git port; expose it as an addon entry and a `worktree.mjs` export.
3. **Remove under a held custody hold.** Let `remove` accept a hold the caller already holds (the shape the facts
   name), so it does not take the hold a second time; expose it the same way.
4. Add one crate test per new behaviour in `packages/execution/checkout/tests/` (find the owning test file first and
   extend it, design principle 8). Add no Node test that copies the crate's cases; at most one wiring proof in
   `test/runner/worktree-ports.test.mjs`.
5. Rebuild the addon in this worktree (`npm run fgos:dev -- version` builds the dev host) before running Node tests.

## Verify

- `cargo test -p fgos-checkout` is green (name from `packages/execution/checkout/Cargo.toml`).
- `node --test test/runner/worktree-ports.test.mjs test/runner/worktree.test.mjs` passes.

## Rollback

Revert the phase commit. No caller uses the new entries yet.
