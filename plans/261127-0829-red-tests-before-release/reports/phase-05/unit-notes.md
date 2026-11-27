# Phase 5: Dev-host store leak resolution

## Changes Made
- In `test/rust-host/help-routes.test.mjs`:
  - Imported `listLegacyNodeSourceFiles` and `resolveProductionDependencies` from `../../scripts/build-rust-distribution.mjs`.
  - Added lazy `devCheckout()` helper that constructs a temporary checkout under the test's `scratch/dev-checkout` directory (copying `listLegacyNodeSourceFiles(REPO_ROOT, HOST_BIN)`, `Cargo.lock`, and resolved production dependencies).
  - Updated `devDoor()` to spawn `scripts/run-rust-dev-host.mjs` inside `devCheckout()` instead of `REPO_ROOT`.

## Why
- `scripts/run-rust-dev-host.mjs` uses `checkoutRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')`.
- Spawning it from `REPO_ROOT/scripts/run-rust-dev-host.mjs` caused it to treat `REPO_ROOT` as `checkoutRoot`, staging runtime files into `.fgos/runtime/git-addon` and `.fgos/runtime/dev-host` in the real repository, and running `pruneRunDirs` on the real store.
- This triggered `diffFgosWrites` in `scripts/run-tests.mjs`, failing the `.fgos` store write guard during `npm test`.
- Spawning from the isolated temporary checkout confines all dev host staging and pruning to `scratch/dev-checkout`, leaving the repository's real `.fgos` store untouched.
