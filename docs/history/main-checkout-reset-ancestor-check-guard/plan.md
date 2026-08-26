# main-checkout-reset ancestor check guard plan

## Problem
`fgos main-checkout-reset`'s guard (`assertSafeMainCheckoutReset`, `src/runner/main-checkout-reset-guard.mjs`) previously only checked whether the main checkout working tree was dirty (uncommitted changes). When the working tree was clean, `assertSafeMainCheckoutReset` permitted `git reset --hard <sha>` unconditionally without `--confirm`, even when `--sha` was behind current `HEAD` by committed commits.

## Approach
1. Extend `assertSafeMainCheckoutReset` (`src/runner/main-checkout-reset-guard.mjs`) to take `lostCommitCount` (or `lostCommits` list), `sha`, `dirty`, and `confirmed`.
2. If `lostCommitCount > 0` (or `dirty`), refuse the reset unless `confirmed` is `true`, throwing `UnsafeMainCheckoutResetError`.
3. Update `main-checkout-reset` verb in `bin/fgos.mjs` to compute `lostCommitCount` via `git rev-list <sha>..HEAD` and format the commits about to be discarded (author, message, files touched via `git log --stat`) when throwing validation error on unconfirmed resets.
4. Add RED-first unit tests in `test/runner/main-checkout-reset-guard.test.mjs`.
5. Update `docs/how-to/safely-reset-the-main-checkout.md` and `CHANGELOG.md`.
