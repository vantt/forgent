# Debug: intermittent `run-tests: ERROR` naming `.fgos/runtime/git-addon`

## Cause
Proven by reproduction. The leak ERROR is a real mtime change on one file, `.fgos/runtime/git-addon/<checkout-hash>/source-digest`, between the run's two `.fgos` snapshots.

- Leak check: `scripts/run-tests.mjs` `snapshotFgos` records (mtimeMs, size) of every file under `.fgos` before the spawn (~line 470). `diffFgosSnapshots` compares after the spawn. Only `cache/state.json` is allow-listed (`DERIVED_FGOS_FILES`).
- Staging: `ensureGitAddon` (`scripts/lib/git-addon-stage.mjs`) writes `fgos.node`, `fgos` and `manifest.json` only when bytes differ, but writes `source-digest` unconditionally (`fs.writeFileSync(... GIT_ADDON_SOURCE_DIGEST_FILE ...)`). Same content, new mtime.
- Trigger: any second staging of the same checkout while a first run is between its snapshots. Every `run-tests` start stages before its own "before" snapshot (`buildTestEnv` -> `stageDoorManifest`, or `queueAfterStaging`), so the run that started FIRST is the victim; the later one is clean.

## Evidence
- Reproduced in fresh linked worktree `debug-git-addon-leak` (created with `fgos worktree create`, own CARGO_TARGET_DIR, small file sets, no full suite):
  - Run alone (doc-health, 9 pass): no ERROR.
  - Run A (doc-health) started, run B (check-undefined-names) started 15 s later in the same worktree: A printed
    `run-tests: ERROR ... Modified (1): * .fgos/runtime/git-addon/df1962c0a6d0ae67/source-digest`; B clean. Both tests passed.
  - Direct `ensureGitAddon` twice: `source-digest` sha256 identical, mtime 07:09:19 -> 07:09:24; `manifest.json` mtime unchanged.
- Prior art: board log 2026-10-24 20:55 (`lead:TEST`) traced the same file to `test/scripts/run-tests.test.mjs` restaging the real checkout mid-suite; fixed `7498a8200` (test passes the suite's staged door). 986680477 did the same byte-compare fix for `stageLauncherDoor`'s manifest. `source-digest` write in `ensureGitAddon` was not given the same treatment.
- 11-08 T5/T6 gates: no log of the ERROR text was kept (`plans/reports/research-261108-0831-harden-t6-baseline.md` notes it was not saved), and lead reports of that date list "no run-tests: ERROR" on their final full runs. The reproduced mechanism matches the symptom (intermittent, names only git-addon); a concurrent run-tests / script staging in the same checkout during those gates (main checkout addon dir was restaged at 06:47 today by another session) is the consistent explanation but not proven for those two specific runs.

## Eliminated
- Test staging the addon itself: the only in-suite path found (run-tests.test.mjs:184) already passes the staged manifest env; `scripts/git-addon.mjs` `ensureGitAddon` fast-path writes nothing when the digest matches.
- Fresh-worktree first run: staging precedes the snapshot, no leak.
- Rust source edit mid-run (digest mismatch -> real rebuild): would also trigger it legitimately; separate, genuine staleness.

## Fix (not implemented)
Smallest cause-aligned: in `ensureGitAddon`, write `source-digest` only when its current content differs (same pattern as addon, host, manifest in that function). Add to `test/scripts/run-rust-dev-host-staging.test.mjs`-style proof or the owning stage test: second stage leaves `source-digest` mtime unchanged. Do not allow-list `source-digest` (hides a genuine rebuild).
Without the code change the rule stands: never start two run-tests (or any script staging this checkout) in one worktree at once.

## Unresolved
- Which concurrent process caused the two 11-08 ERRORs (no kept log).
