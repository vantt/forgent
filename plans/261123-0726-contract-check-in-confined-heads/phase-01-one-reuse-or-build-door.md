# Phase 1: One reuse-or-build door in the leaf

Capability: `code:implement`.

## Inputs

- `plans/261123-0726-contract-check-in-confined-heads/plan.md` (Facts, Prior art).
- `scripts/lib/git-addon-stage.mjs` (`ensureGitAddon`, `ensureAddonForScript`, `gitAddonSourceDigest`,
  `gitAddonDirectory`).
- `scripts/git-addon.mjs` (its reuse-or-build `ensureGitAddon`).
- `scripts/lib/dev-host-manifest.mjs` (`devHostEnv`), `src/native/door.mjs` (`loadNativeAddon` with `descriptor`).
- `test/distribution/native-addon.test.mjs`, the test "addon test builder respects Cargo target/home ..." (its cargo
  stub and temporary checkout are the fixture to extend).
- Importers of `scripts/git-addon.mjs`: `rg -n "git-addon.mjs" scripts test`.

## Files it may write

`scripts/lib/git-addon-stage.mjs`, `scripts/git-addon.mjs`, `test/distribution/native-addon.test.mjs`.

## Steps

1. Move the reuse check from `scripts/git-addon.mjs` into the leaf as an exported function that reuses this
   checkout's staged addon when it is fresh, or returns nothing. "Fresh" keeps all of today's checks: the
   `source-digest` matches, the addon loads through the native door with the manifest as descriptor, the staged host
   exists, and the `bin/fgos.mjs` digest matches. On reuse it sets the env through `devHostEnv`. Keep the leaf's
   imports legal under `test/architecture.test.mjs`. If the guard refuses an import, use the shared leaf it names;
   never copy code.
2. `ensureAddonForScript` tries the reuse first and builds only when it returns nothing. If the build fails because
   the target directory is not writable (`EROFS`/`EACCES`, or cargo's read-only error), throw an error that names the
   cause: the staged addon for this checkout is missing or stale, and it must be restaged from an unconfined session
   (`node scripts/git-addon.mjs`). Do not throw a raw cargo stack.
3. `scripts/git-addon.mjs` exports the leaf's reuse-or-build function as its `ensureGitAddon`, so its importers keep
   their name and behaviour. Its own copy of the reuse logic is deleted in the same change (L10).
4. Leave `scripts/run-tests.mjs` on the build path. Change it only if you can show, in the commit message, that reuse
   cannot hand the suite stale bytes. If you can't show that, leave it.
5. Extend the owning test file with one test named for the behaviour, for example "a script reuses a fresh staged
   addon without cargo and names a stale one it cannot rebuild". Fresh case: the stub cargo is not called and the env
   trio is set. Stale case with an unwritable target: the named error is thrown. Say in the test why no existing test
   covers it (the existing test exercises only the build path).

## Verify

- `node scripts/run-tests.mjs test/distribution/native-addon.test.mjs test/architecture.test.mjs` passes.
- `rg -n "GIT_ADDON_SOURCE_DIGEST_FILE" scripts` shows the read only in `scripts/lib/git-addon-stage.mjs`.
- `node scripts/plan-contract-check.mjs --plan plans/261123-0726-contract-check-in-confined-heads` exits 0 from a shell
  where `target/` is writable (no regression outside confinement).

## Rollback

Revert this phase's commit. Scripts go back to always building into `target/`.
