# Verify checkout leak (HARDEN)

## Proved cause
- `withTargetCheckout` (src/runner/merge.mjs) makes the checkout through `createVerifyCheckout`, runs the goal check and invariant checks inside it, then calls `removeWorktree(..., {force: true})` in `finally`.
- Those runs write ignored bytes (cargo `target/`, regenerated skills) the provisioning record never names. The record covers only what `provisionWorktree` placed.
- `removeProvisioned` sets aside only recorded bytes, so the Git port sees unknown ignored bytes and refuses `worktree-ignored-bytes-preserved`. The caller catches this and only prints "verification checkout retained", so the checkout leaks.
- Red proof: a test that leaves ignored bytes in a verify checkout failed at `removeWorktree` with exactly that refusal. The dispatch-checkout half of the same test passed in the red run.
- `target/` size not measured here. `/tmp/fgos-worktrees` does not exist on this machine, so no leaked checkouts could be inspected.

## Rule chosen
- `provisionWorktree` takes `{disposable}`; `createVerifyCheckout` passes `true`; the record carries `disposable: true`.
- `setProvisionedAside`: a disposable record first sets aside every current untracked or ignored entry, then the existing steps run. Discard deletes the aside dir and record after the port removes the checkout.
- Why: a verify checkout is made only to run a check, and nobody else works in it. Reuses the provisioning record and its set-aside/restore/discard. No new module, no port change.
- Port protection is untouched. Worker and person checkouts, and `fgos worktree remove`, have records without the flag and behave as before.

## Commits (branch harden/verify-checkout-cleanup)
- beb817c68 test: red test only
- d0d03e683 fix: src/runner/worktree.mjs, docs/platform/git/spec.md (one line), CHANGELOG.md (Unreleased), mutation census digest

## Tests
- Added in test/runner/worktree.test.mjs (owner of createVerifyCheckout/removeWorktree): "removing a verify checkout also removes the ignored bytes verification produced there, while a dispatch checkout with the same unknown ignored bytes is still refused". Asserts the directory is gone, the registration is gone, and no set-aside dir is left; also asserts the dispatch checkout still refuses.
- Existing owner of worker-preserved proof kept as is: test/verbs/worktree-remove.test.mjs (edited copy / foreign ignored bytes).
- Retired or changed: none.

## Commands and results
- Node via runChosenTests: worktree.test, worktree-callsite-wrapper.test, worktree-remove.test, worktree-create.test: 86/86 pass. merge-land.test + worktree-ports.test: 18/18 pass.
- No Rust change, so no cargo run.
- `node scripts/git-one-door-scan.mjs --check`: 5 undeclared sites (the known `unresolved-binary` ones), none new. `--write-census` run once at the pre-commit hook's request.
- Net lines: +16/-9 in fix commit source/docs (src +14/-8... see diffstat: worktree.mjs 22 lines changed, spec 1, CHANGELOG +1, census 2), test +29.

## Leftovers
- `/tmp/fgos-worktrees` absent after the runs. `git worktree list` in the main checkout shows no verify registration from me. Test runs use a per-process tmp root.
- Old `verify-*` dirs on other machines have no disposable record; CHANGELOG tells owners to `git worktree remove --force <path>`.

## Notes
- Untracked, non-ignored files in a verify checkout are also set aside now (dirty checkout would otherwise refuse). Intended for a disposable checkout.
- Unmeasured: whether `fgos return` reaches `withTargetCheckout` on every call; only the land-already-merged path calls it in src. The other machine's "every return" may mean that path.
