# Review: Event Store phase 07 (verbs, setup, doctor, config; dormant)

Scope: `git diff 0f5bc8694..408e0d694` in the es-p07-review worktree, against the phase-07 file, plan D18/D20/M5 and red-team rows 10-11, the lead report, spec sections 15, 16, 18, 21, 22 and the "Phase 07 dormant implementation contracts" section, and the AGENTS.md gates. This was a read-only review. I did not run the suite because the addon is not built in this worktree and building it would write into the workspace. One mechanism was checked empirically with plain git (C1).

**Verdict: do not merge yet.** The legacy-layout export, which is the rollback path, refuses every real legacy tree. It also sends v4 porting events to the wrong place. The rest is sound and mostly matches the spec.

## Critical

**C1. `export_legacy_layout` refuses every legacy tree that has a subdirectory** (`packages/event-store/rust/src/export.rs:163-175`).
- **Cause:** `Inspect::list_tree` runs `git ls-tree -r -t` (`packages/git/rust/src/driver.rs:1873-1882`). The `-t` flag also lists the tree entries themselves, for example `040000 tree … events`. I confirmed this with a scratch repo. The export loop rejects any entry that is not `allowed(path)`, not mode `100644` or not a blob, so the `events` tree entry (and any `porting` tree entry) returns `unsafe legacy tree entry`.
- **Impact:** Spec §18 step 3 imports `events/<name>.jsonl` shards, and this repo tracks 93 such files. Rollback export therefore cannot run on real data.
- **Why tests miss it:** the tests only pin a flat `events.jsonl` (`test/event-store/export-legacy-parity.test.mjs:32,47,55-59`). The reader avoids the problem because it filters `kind == Blob` (`read.rs:173`).
- **Fix:** accept a tree entry only when it is mode `040000`, its kind is Tree, and its path is a directory on an allowed path (`events`, `porting`, `porting/<safe>…`). Keep rejecting gitlinks, symlinks and any other tree. Add a parity vector with `events/a.jsonl`, `events/b.jsonl` and `porting/events.jsonl`.

## High

**H1. v4 `project:porting` events are written into the Work shard directory** (`export.rs:205-218`, file `events/v4-project-porting.jsonl`).
- On rollback, the old porting store reads only `<dir>/porting/events.jsonl` (`src/state/porting-store.mjs:27-29`), so those events disappear from the porting view.
- Work discovery reads every `events/*.jsonl` (`src/state/replay.mjs:838-851`), so the porting events get folded into Work instead.
- The parity report cannot show this. Rust merges legacy porting and Work events into one `legacyOrder`, and Node folds both with Work's `foldEvents` only (`src/verbs/events/export.mjs:18-19`), so the porting view is never compared.
- **Fix:** append converted `project:porting` lines to `porting/events.jsonl` after the pinned legacy bytes. The historical prefix stays byte for byte, because the legacy file was append-only. Order and compare each discovery directory separately, using the porting reducer for porting. Alternatively, refuse porting streams until that is done.

## Medium

**M1. Legacy-layout export includes private streams by default** (`export.mjs:12-13`).
- With no `--stream`, the export takes every stream listed by status, including `local` and `branch:*`.
- Those scopes never existed in the tracked legacy layout and are never published. Writing them as `events/v4-local.jsonl` or `events/v4-branch-*.jsonl` would turn private events into tracked Work shards once the rollback is committed.
- **Fix:** for legacy-layout, default to the project-scope streams and refuse `local` and `branch:*`.

**M2. `event-store-refspec` fails on any push refspec** (`src/setup/event-store-checks.mjs:33`).
- `push_refspecs` returns every `remote.<r>.push` value (`driver.rs:2158-2160`).
- An ordinary user setting such as `push = HEAD` or `refs/heads/*:refs/heads/*` therefore fails doctor with "unsafe publication refspec", even though it cannot publish `refs/fgos/*`.
- Spec §21 does literally say "any push refspec". The risk it guards against is pushing Event Store refs, though.
- **Fix:** fail only on push refspecs whose source can match `refs/fgos/`, reusing the overlap logic of `privateMapping`. Alternatively, confirm the strict reading with the owner (listed under open questions).

**M3. Doctor repeats the full history walk for every check** (`event-store-checks.mjs:25-41`, `diagnostics.rs:80-110,145-156,224-243,245-287`).
- Every check except `native-addon` recomputes the facts, which spawn several git subprocesses.
- Six of them also call `store.status`, which does all of the following:
  - walks every `refs/fgos/*/events/*` chain with full verification;
  - walks them again through `read::read`;
  - walks the mirror a third time for `machineRefShared`;
  - builds two complete reachability sets for ahead/behind.
- That is roughly six full-history walks per doctor run. Spec §22 already budgets 2 s for one full rebuild.
- **Fix:** compute the context and status once per doctor run (memoize, or pass a precomputed context). Compute ahead/behind with one bounded walk using the exclude-tips argument of `walk_commits`.

**M4. The machine-id fix refuses a state root under any symlinked ancestor** (`src/setup/event-store-fixes.mjs:9-20`).
- `realDirectory` lstat-checks every ancestor of the state root, so a symlinked `/home` or an `XDG_STATE_HOME` on another volume makes setup throw.
- `GitDriver::new` canonicalizes and accepts that same state root (`driver.rs:247-249`).
- The spec asks only the lock-directory setup to refuse symlink ancestors. The open root is canonical anyway, because Git canonicalizes the common dir.
- **Fix:** canonicalize the state root, or check only the leaf, in the machine-id fix.

## Low

- **L1. Sort tag differs from the reader.** `export.rs:189-193` and `:212` pass the full `events/<name>.jsonl` as the legacy sort tag. The legacy reader uses the basename (`replay.mjs:851`, `read.rs:186-189`). Relative order among shards is unchanged, but ties against `porting/events.jsonl` can order differently. Use the basename, which matters once H1 separates the directories.
- **L2. Export runs a full status just to list streams.** `export.mjs:11` calls `store.status(heldRanks)` without the configured remote, which runs every walk in M3. Use the remote from config or the facts, or a cheap stream list.
- **L3. Partial output on failure.** Files are installed one at a time, and Node writes `parity-report.json` afterwards. A mid-way failure, or a `foldEvents` throw, leaves a partial `--out` with no report. Build the export in a sibling temp directory and rename it into place, or document that a partial directory can be left.
- **L4. The orphan-branch test proves only the positive case.** The test runs with an unborn HEAD, so every branch stream counts as orphan (`event-store-checks.test.mjs:52-55`, `diagnostics.rs:157-181`). No vector shows that a branch stream with a live worktree is *not* reported, or that `branch_key` matches the layout's naming.
- **L5. `privateMapping` mistakes negative refspecs for unsafe ones.** It strips `^`, so a protective negative refspec such as `^refs/fgos/local-events/*` fails as unsafe (`event-store-checks.mjs:12-13`).
- **L6. `event-store-sync` can warn when there is nothing to push.** It warns permanently on a clone that has never pushed because it has no own ref. This follows spec §21 literally. Consider using `unpublishedSince` instead.
- **L7. The `remote: 'origin'` default exists twice.** It is in `EVENT_STORE_DEFAULTS` and in the existing row at `registrations.mjs:6627` until phase 09. This is accepted under D8 and red-team row 11. Phase 09 must replace that row's shape with the import, not add a second row.
- **L8. Distinct v4 lines can be deduplicated.** Converted v4 lines carry no `h`, so legacy identity falls back to the raw line. Two distinct events from different origins with identical seq, ts, type, payload and src would collapse into one during legacy ordering. This is rare.

## Verified as correct (no finding)

- **Byte parity of pinned files:** blob bytes are installed unchanged with no re-encoding. The D18 pin is authenticated through `fence::pinned_legacy`, and a non-empty history without a pin is refused.
- **Output safety:**
  - the destination must be absolute and is created exclusively;
  - symlinked parents are refused;
  - files are installed with the durable no-overwrite installer;
  - every entry is validated before the output directory is created, and the test proves the directory does not exist afterwards.
- **v4 conversion:** `h`, `origin`, `seen` and the markers are dropped, and the field names match real legacy lines (`v:3`, `src`). Deferred events are never exported.
- **`--since` behaviour:** the comparison of a partial export against the full view is documented in the spec, so it is not a finding.
- **Sync records:** `lastFetch` and `lastPush` are persisted even on error, because `sync.rs:504-528` writes the state after the closure. `--no-push` keeps the last push. Old records still parse because of the serde defaults.
- **Doctor is read-only:** the checks write nothing beyond the existing `GitDriver` hooks directory. Store recovery is never triggered, and the corrupt-log test proves the bytes stay unchanged.
- **Conventions:** the `warning:` pass convention matches `registrations.mjs:533`. The remote-name alphabet matches `publication.rs:1460`. Project-over-global config works through `mergeConfigDefaults`.
- **Fixes:**
  - all three are idempotent;
  - no push refspec is ever written;
  - the refspec fix goes only through `ensure_fetch_mapping`, which records the current URL, so re-pinning by setup is the behaviour D20 specifies;
  - the machine id is minted exactly once under concurrency (Rust test).
- **Dormant:** there are no changes to registrations, the command registry, routes or CHANGELOG.
- **Layering:** native exports are imported only from `native.mjs`, and the architecture guard was extended to cover them. The `trustedMain = cwd` default follows Git phase 02's discovery-hint design (`driver.rs:326-347`) and the phase-06 handoff.
- **Envelopes:** the use cases return data payloads and the adapter wraps the envelope, the same convention as `src/verbs/merge/*`.

## Open questions

1. Should `event-store-refspec` fail on unrelated push refspecs (spec §21 read literally), or only on push refspecs that can include `refs/fgos/`?
2. On rollback, should v4 `project:porting` events be appended to `porting/events.jsonl` (recommended), or should legacy-layout refuse porting streams until phase 08?
