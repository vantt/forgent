# HARDEN T3 part 04b council: simplicity seat (Event Store)

HEAD `c7522c86d`, branch `main`. 2026-10-25 00:2x (Asia/Saigon). Lens: one door, one authority, one proof, delete before add (design principles 1, 6, 7, 8; RUL104). Read-only in the real repository.

What I ran, so the evidence can be checked:
- `rg`, `wc`, `sed` over the crate, the addon namespace, the Node files and the tests (every line of `src/event-store/*`, `src/verbs/events/*`, `src/setup/event-store-*.mjs`, `src/cli/detached-child.mjs`, `src/state/consumer-event-gate.mjs`, `src/state/work-event-store.mjs`, the addon namespace and `legacy*.rs`, `export.rs`, `fence.rs`, `locks.rs`, `layout.rs`, `receipt.rs`, `refspec.rs`, `sync.rs` (unpublished part), `promote.rs` (abandon), `read.rs` (legacy path), `diagnostics.rs` (streams)). I did not read `seal.rs`, `walk.rs`, `order.rs`, `append.rs`, `checkpoint.rs`, `cursor.rs`, `envelope.rs` line by line: they hold no legacy or twin code on my lens.
- A throwaway clone `/home/vantt/projects/forgent-worktrees/simplicity-clone` (local clone of the repo plus the legacy mirror ref), `npm run fgos:dev -- list|edit` with `strace -f`, private `CARGO_TARGET_DIR` on ext4. One edit was applied to the clone's `receipt.rs` to prove S1. Clone and target directory are deleted. Load average during runs: 4.7 to 12.8 (other seats building), so I took no timings.
- No `cargo test`, no Node test file, no verb in the real repository.

## Part A: target shape of the Event Store (simplicity view)

**Authority.** The store is the authority for the bytes and the order of the event log: append, seal, sync, the reader, the pinned legacy history and the fence that pins it. It is not the authority for when to seal or sync (a consumer policy, spec §16), for Work's cache, or for how a doctor row is worded.

**Permanent legacy surface (one read path, owner 2026-10-21).** Keep exactly: the tracked fence `.fgos/events` and its reader (`fence.rs`), the pinned legacy ref and its mirrors, `verify_legacy_tree`, `legacy::parse_file/order` (also needed by the pending stray-shard import), the legacy part of `read` (`LegacyView`, `legacy_files`), the shrunk doctor row `event-store-legacy-layout`, and the shrunk write admission (pin matches ref and mirror, fetch mapping provenance). That is about 230 of the 895 lines of `legacy_import.rs`.

**Delete after the fence release (one release, same clock as H33).** Everything that reads the tracked legacy files from HEAD or writes the import: inventory, consumer inventory, `read_legacy_from_head`, `read_consumer_at`, `import_legacy`, `import_identity`, `ensure_clean`, `cutover_operation_id`, the `events migrate` verb and its parity code, the rollback export `events export --format legacy-layout`, and `decodeLegacyFiles`. Condition, already met by the owner: "3 máy sync hết rồi, các project kia xong hết rồi, không cần chuyển" (ES plan, hand-offs table, `plan.md:122`). Until: the first release cut after the cutover release, i.e. the same date H33 uses (`plan.md:119`). Nothing else may be added to these paths before then. Fence rule: a fence lives one release; the tracked `.fgos/events` pin is not a migration fence, it is the permanent pointer to the legacy history, so it stays.

**Contract and ports.** Unchanged: Inspect and Publication ports behind the crate, the N-API namespace as marshaling only. Target for the facade: 17 methods today, 13 after the deletes (`exportLegacyLayout`, `readLegacyFromHead`, `importLegacy`, `unpublishedSummary` go), 10 if the optional move of the seal policy (proposed additions P2) is taken. Node index exports 13 today, 10 after (`decodeLegacyFiles`, `ensureEventStoreRefspecs`, `eventStoreAddonAvailable` go). The `openStore` re-export has no product caller (tests only); keep it only as the test door and say so.

**Rust/Node boundary and Node budget.** Node keeps: the loader and marshaling, config validation of numbers, the consumer manifest, the consumer gate, the seal hand-off. Node stops deciding: the remote-name alphabet, the held-rank refusal twin, the refspec-overlap judgment, the doctor thresholds. Node lines in scope: 1 243 today (counted by the baseline) to about 860.

**Doctor rows kept: 7 of 10.** Keep `open-root`, `refspec`, `machine-id`, `legacy-layout`, `unsealed` (absorbs `orphan-branches`), `integrity`, `sync`. Merge away `git-version` and `native-addon`, and `orphan-branches` (table D). Setup fixes: 3 to 1 (`lock-dirs`).

**Size target (lines, net of the small additions below).**

| Area | Today | Target | Δ |
|---|---|---|---|
| Rust `src` | 7 757 | about 6 790 | about -970 |
| Addon `event_store.rs` | 779 | about 600 | about -180 |
| Node product files | 1 243 | about 860 | about -385 |
| Node tests (`test/event-store` plus setup/state parts) | about 3 400 | about 2 800 | about -600 |
| Rust tests | 9 007 | about 8 700 | about -300 |
| `scripts/event-store` | 723 | 574 | -149 (candidate) |

Layer total about -2 600 lines, +60 added (one stream listing, one test fixture helper). RUL104 holds: nothing new, one contract (stream listing) fixed in one place.

## Part B: findings

Severity follows the proposal §2.2. "Reproduced" means I saw it in the throwaway clone.

### S1. High, axis A/E/F, reproduced: a fresh clone fails every read because four copies of one directory listing disagree about a missing directory

- `packages/event-store/rust/src/receipt.rs:91` (`own_bounds`) does `read_dir(&layout.root).map_err(io)?`. A clone has no `.git/fgos/events` until first append or setup. The error surfaces as `event-store-io: NotFound: No such file or directory (os error 2)`, no path, no next step. Called from the reader at `read.rs:569` and `read.rs:702`, so every read verb dies.
- The same listing is written four times and only one tolerates a missing root: `diagnostics.rs:11-16` (tolerant), `sync.rs:121-134`, `receipt.rs:91-105`, `seal.rs:616-625` (all three not tolerant).
- Proof of cause and fix: in the clone I made `own_bounds` return the empty map on `NotFound` (7 lines). With no `.git/fgos` directory at all, `fgos list` then answered normally. Before the edit the same command failed with the quoted error.
- Fix shape (delete, not add): one `Layout::streams() -> Vec<StreamId>` in `layout.rs`, tolerant of a missing root (move the body of `diagnostics.rs:11`), used by the four callers. Net about -25 lines. No new mechanism, and the next copy cannot be written wrong.
- Answer to the fresh-clone question, read side: not a refusal to name, a bug to delete. A read of a store that does not exist yet is an empty read.

### S2. Medium, axis F, reproduced: the write refusal on a clone is a mode problem wearing the wrong name

- On the fresh clone, after the S1 fix and with no `.git/fgos`, `fgos edit` refuses by name: `event-store-refspec-missing: run setup to install mirror fetch mappings` (`refspec.rs:28-48`, reached from `legacy_import.rs:754`). That is the named refusal with a next step the brief asks for. It already exists.
- The baseline's `git-wal-unreadable: repository-identity-changed` appears when `.git/fgos` exists with mode 0775 (a plain `mkdir -p`). I reproduced both ways: `mkdir -m 700 fgos fgos/events fgos/events/locks` gives the named refusal; `chmod 775 .git/fgos` gives `event-store-io: Git: git-wal-unreadable: repository-identity-changed`. The setup fix builds every ancestor at 0700 (`src/setup/event-store-fixes.mjs:9-16`), so a user who runs setup never meets it. The baseline reached it by hand-made directories.
- Defect: Git's `WalError::Untrusted` is named `repository-identity-changed` (`packages/git/rust/src/wal.rs:43`), used for the identity check and for the mode/owner check (`wal.rs:1214,1233`, wrapped at `driver.rs:2480`). A mode problem reports an identity change. This is Git (T2) code: hand-off, not an 04b change. I did not read which of the `Untrusted` sites in `wal.rs` (1081, 1431, 1570, 1803) belong to which cause.
- Inferred only for the real fresh-clone write path beyond this: the first write also needs the activation fence `.fgos/locks/activation.lock` (`wal.rs:1190-1199`), which is untracked and absent in a clone. I did not get that far because the refspec refusal comes first.

### S3. Medium, axis D, inferred from `rg`: `promote::abandon` has no caller

- `packages/event-store/rust/src/promote.rs:117-194` (78 lines). `rg` finds no use in the addon, the Node facade or any product file; only `tests/branch_local_refs.rs:7,153,241` call it (2 tests, about 60 lines). The spec describes it (`spec.md:201`), but nothing can run it, so an orphan branch stream (a worktree gone without land) is listed by `status` and doctor `orphan-branches` with no remedy.
- Fix shape: delete `abandon` and its two tests, or the owner names the caller. Adding an `events abandon` verb is a feature (not allowed here). My pick: delete, and word the doctor orphan line as information only. Δ about -140.

### S4. Medium, axis D, inferred from `rg`: the unpublished-summary chain has no product caller

- `sync.rs:557-618` (`Unpublished`, `unpublished_summary`, `guarded_unpublished_summary`, about 62 lines), addon `event_store.rs:438-460` (about 25), `native.mjs:161-164` (4). Callers: `test/event-store/facade.test.mjs` (1 test), `tests/v_event.rs:7,39,87`, `tests/sync_review.rs:338`. `status` already carries the facts doctor uses (`status.sync.unpublishedSince`, `streams[].unsealedCount`, `closedSegmentsPending`, `event-store-checks.mjs:77-85`). This chain is also the fourth, non-tolerant stream listing in S1 (`sync.rs:571`).
- Fix shape: delete the chain; `v_event.rs` loses two assertions of a function that no longer exists (behaviour removed, no other owner needed). Δ about -115 including tests.

### S5. Medium, axis D/E, inferred (the code is reachable only for a clone that has not migrated): the HEAD legacy path is dead weight after the fence release

Reachable only when the tracked legacy files still sit at HEAD, which the owner says is nowhere. Per-function lines in `legacy_import.rs`:

| Lines | What | Δ |
|---|---|---|
| 17-348 (less `hashed_tree` 349-371, `nested_tree` 372-402 kept) | `Inventory`, path predicates, inventory and consumer inventory, `absent_roots`, `events`, `read_legacy_from_head`, `read_consumer_at`, `tree`, `import_files` | about -330 |
| 403-449, 526-542, 543-665 | `import_identity`, `validate_legacy_refs`, `import_legacy` | -187 |
| 666-700, 842-886, 887-895 | `ensure_clean`, `event_attribute`, `cutover_operation_id`, test | -80 |
| 701-769, 770-841 | `write_readiness` (unmigrated branch and inventory fetch), `legacy_layout` (retired-path and `.gitattributes` problems) | -55 |

Plus `read.rs:335-373` (`read_legacy` else branch, about -12), `export.rs:154-325` (the rollback export, about -170 with `legacy_value` and one test), addon `event_store.rs:686-780` minus `legacy_layout` (about -95), Node `src/verbs/events/migrate.mjs` (257), `parity.mjs` (18), the legacy branch of `export.mjs` (about -18), `src/state/event-log.mjs` `parseEventLines` (about -25; its only callers are `migrate.mjs` and `export.mjs`), `bin/fgos.mjs:2973-2976,4827-4828,4931` (about -8), `native.mjs` (about -20).
- Cost I must name: the Rust fence tests (`legacy_reader.rs`, `reader_review_regressions.rs:233`, `legacy_import.rs:131`) build their pinned legacy ref with `import_legacy`. Deleting it needs one test helper that builds the seal commit (about +40 lines). Not a reason to keep the code.
- Cross-layer follow-ups that die with the migrate verb, not counted above, for the T0/T2 seats to confirm (each needs its own other-consumer check): the host route `internal quiesce-scan` (`packages/holder-lock/rust/src/route.rs`, its contract, `apps/fgos/src/main.rs`; the only Node caller is `migrate.mjs:111-168`), Git's `cutoverGrant` (`packages/git/rust/src/grant.rs` 99 lines, `distribution/rust/src/git_grant.rs` 42, `scoped_commit.rs` 18 mentions, `test/git/cutover-grant.test.mjs`).
- Open decision for the owner (it changes the rollback promise): spec §18 keeps `events export --format legacy-layout` as the rollback to the previous release. After the fence release no previous release can be activated on a migrated clone (D18 makes an old binary fail loudly), so the export has no user. Options in Part E.

### S6. Medium, axis E, inferred: the Node side still decides what the crate decides

- `src/event-store/native.mjs:20-26` (`outsideGate`): refuses `hotLockDepth() > 0` and rank 60 with `event-store-seal-under-state`, then passes the same depth and ranks to native, where `locks.rs:validate_seal_context` refuses the same two cases with the same code. One authority: the crate. Node needs only the `ranksOf` normalization. Δ -6. (`prepareStore` and `openStore` keep their depth check: no ranks reach native there and Git would be spawned inside the gate.)
- `config.mjs:23-24`: remote-name regex "same alphabet as Git's `publication_fetch_mappings`". A twin of `packages/git/rust/src/repository_config.rs:52`. Let the crate refuse by name; Node keeps the number checks. Δ -2, one twin gone.
- `maintenance.mjs:10-13` `syncDue`: Node decides when a sync is due from facts the crate returns. Moves with P2.
- `event-store-checks.mjs:15-24` `overlaps()` judges refspec safety in Node; thresholds 3600 s (`:74`), twice the seal interval (`:74`) and 86 400 s (`:83`) are decided in Node. Moves with P3.
- `consumers.mjs:7-10,25,44,51` and `native.mjs:10-12` each define "linux only"; the crate and addon do it a third time (`event_store.rs:20-25`). A manifest reader needs no platform check. Δ -8, one definition.

### S7. Medium, axis E, inferred: doctor rows and setup fixes that repeat another component's

| Item | Evidence | Verdict |
|---|---|---|
| Fix `event-store-machine-id` | `event-store-fixes.mjs:18-20` is a one-line wrapper of the mint that the registered Identity fix `identity-machine-id` already runs (`identity-checks.mjs:169`, `registrations.mjs:6068-6072`); its other caller is `migrate.mjs:177` | delete, -5 |
| Fix `event-store-refspec` | `event-store-fixes.mjs:21-27` installs the mapping that Git's `git-publication-refspecs` fix installs from the same `publication_fetch_mappings` (`git-checks.mjs:105-114,129`), and that one also repairs the obsolete legacy mapping. Chain to delete: `ensureEventStoreRefspecs` in `native.mjs:174-177`, `index.mjs`, addon `event_store.rs:586-600`, `refspec.rs:11-19` | delete, about -45 |
| Row `event-store-git-version` | `event-store-checks.mjs:49`. Git's `git-component-compatible` already requires `floor.supported` (`git-checks.mjs:168`), and `supported` is exactly "all probes passed" (`packages/git/rust/src/driver.rs:73`) | merge away, no condition lost, -2 |
| Row `event-store-native-addon` | `event-store-checks.mjs:45-46`; its own message says "see git-component-compatible", which pins `contracts.eventStore === 4` (`git-checks.mjs:168`). Chain: `eventStoreAddonAvailable` (`native.mjs:178-185`, 8 lines), `test/distribution/native-addon.test.mjs:52` probe | merge away if the contract version moves with every export change; else fold the typeof list into `git-component-compatible`. Owner call. -12 |
| Row `event-store-orphan-branches` | `event-store-checks.mjs:86`, same `status.streams` input as `unsealed` | one row, two messages. -3 |
| Row `event-store-refspec` vs Git `git-repository-config` | both report a missing fetch mapping (`git-checks.mjs:57-60`) | keep both for now; the Event Store row also covers provenance, pinned URL and unsafe push mappings. Say which row owns "mapping missing" (suggest the store row). |

### S8. Low, axis E: the addon repeats its own boilerplate

- Repository resolve block three times: `event_store.rs:184-197`, `567-583`, `586-600` (one `fn resolve(cwd, state_root, trusted_main) -> (GitDriver, RepoHandle)`, about -20).
- Store-id-or-empty three times with two different tests (`symlink_metadata` at `128-140` and `481-490`, `.exists()` at `640-650`): one `fn origin()` helper (about -15). The `.exists()` form also treats a dangling store symlink as no store while the others raise.
- The test for "is this a legacy ref name" is spelled out five times (`legacy_import.rs` write_readiness, import_legacy tail, legacy_layout, `legacy_mirrors`; `read.rs:241-258`). One `is_legacy_ref(name)` (about -15 after S5, the survivors are three).

### S9. Medium, axis C, reproduced (11 children), cause inferred: a read verb pays for the lifecycle, and for the legacy history again at every start

- Sync on a read: `bin/fgos.mjs:5299` runs `maintainEventStore(..., { end: true })` in `finally` for every verb that opens the store (`opensEventStore`, `bin/fgos.mjs:4826-4832`, includes `list`, `show`, `ready`), and `maintenance.mjs:41-43` runs `store.sync({ opportunistic: true })` when due. So it is the policy of spec §16 applied by the caller's `finally`, not a store rule; the answer is printed first, but the process cannot exit until the fetch ends. The seals already take the other road: `handSealsToChild` (`bin/fgos.mjs:4821-4824`) hands them to one detached child. Fix shape inside existing code: the due sync takes the same road (`fgos events sync` through `spawnDetachedCli`), and the inline branch in `maintenance.mjs` goes. Net about -10/+10, deletes the "read verb waits for a fetch" case; `triggers.test.mjs:65` becomes the one proof of the new route.
- The 11 git children of `fgos list` (strace in the clone, 11 `git` execs, same count as the baseline): `var GIT_CONFIG_SYSTEM`, `var GIT_CONFIG_GLOBAL`, `config --list`, `config`, `rev-parse`, `for-each-ref`, then `cat-file` x3, `ls-tree -r`, `cat-file --batch`. The first four are the driver's construction per process, the next two are the tips listing. The last five belong to the fence read and the legacy history: fence blob and seal header (`fence.rs:46-68`), then `all_entries` (`ls-tree -r` of the pinned legacy commit, `legacy_import.rs:487`) and `blobs` (one `cat-file --batch`, `read.rs:285-333`). Repeats: the `ls-tree -r` and the blob read re-read an immutable commit at every process start (baseline: about 100 ms of the 0.45 s). The in-process memos (`commit_memo.rs`) do not help a fresh CLI process. See P1.

### S10. Low, axis D, inferred: tests named after plan phases or audits

`tests/p02_review.rs`, `tests/review_fixes.rs`, `tests/reader_review_regressions.rs`, `tests/sync_review.rs`, `test/event-store/phase07-fixture.mjs` (imported by 10 test files), `phase08-fixture.mjs`, `v-auth-01.test.mjs` break "Stable code artifacts" (no plan IDs, phase numbers or audit labels in test names). Renaming moves proofs, it does not weaken them; do it as one rename commit by behaviour (`maintenance-snapshot`, `identifier-grammars`, `reader-certification`, `sync-authentication`, `store-fixture`). Δ 0.

### S11. Low, axis E: `scripts/event-store/settle-host-proof.mjs` plus `settle-fault.py`

149 lines. No npm script, test or doc calls them (only each other and a few verification reports). All other scripts have a caller: `v-spawn-bench` (a test), `store-increment-worker` (`store-hardening.test.mjs`), `power-loss*` (docs, CHANGELOG), `forge-probe` (spec). Keep until the §23.2 candidate-release run retires, then delete (or name the caller in the spec). Δ -149 later.

### S12. Low, axis B, inferred: Windows

- Test targets: the files that import `std::os::unix` without a gate are `append_recovery`, `kill_append`, `legacy_import`, `legacy_reader`, `reader_review_regressions`, `seal_cas_race`, `seal_checkpoint`, `seal_publication`, `sync_review`, `v_event` (10 by my grep) plus any that include `reader_support` or `sync_support`; the baseline counted 11. Five files already carry `#![cfg(target_os = "linux")]` (`cursor_incremental`, `read_memo`, `walk_certified`, `checkpoint`, `read_head_children`). Fix: the same one-line inner attribute on each of the others. The crate is Linux-only for Node (`event_store.rs:20-25`, spec §22), so the gate is the honest declaration. The lib warning is `export.rs:45` (`let mut builder`, only mutated under `#[cfg(unix)]`); it disappears if S5 deletes `export_legacy_layout` neighbours or by gating the binding.
- Silent difference in the lib: `locks.rs:validate_directory` returns `false` on non-unix, so `acquire_append` and `acquire_seal` would refuse with `event-store-lock-dir-invalid: run setup fix`, a fix that cannot exist on Windows (`locks.rs:117-142`). The product never gets there (addon refuses first), so only crate users see it. Return `EventStoreUnsupportedPlatform` in that branch (3 lines).

### S13. Low, axis B: the detached seal child

- Bounded: the child (`spawnDetachedCli`, `src/cli/detached-child.mjs:17-31`) waits at most 5 000 ms for the seal lock (`locks.rs:12`, `Wait::Ms(APPEND_WAIT_MS)` in `acquire_seal`) and answers `{ busy: true }` (`seal.mjs:27-30`); its work is local Git object writes, no network. One child per distinct (root, stream) per command.
- Orphaned by design (`detached: true`, `unref`, own session). It cannot be harmful orphaned (the batch stays durable, spec §16). Two small gaps, inferred: the returned `pid` is dropped by `handSealsToChild` so nothing tracks it (the process-management rule asks to track what we start), and a child blocked on a hung `git` has no wall-clock bound. I saw neither happen; not above Low.

## Answers to the brief's questions (simplicity view)

- **Fresh clone.** Reads: S1 (a bug, four copies of one listing, fix proven in the clone). Writes: the named refusal exists already (`event-store-refspec-missing: run setup ...`), the baseline's `repository-identity-changed` was a 0775 directory made by hand and Git's misleading error name (S2). The setup fix `event-store-lock-dirs` and the missing doctor condition: `open-root` (`event-store-checks.mjs:50-54`) calls `fs.lstatSync(facts.openRoot)` and so fails with a raw `ENOENT` on a clone; word that one row as "open root missing: run setup" instead of adding a row.
- **Read cost.** S9: a caller's choice (the `finally` trigger) applying the store's policy; fix is to use the seal child's door for the sync.
- **Write path under contention.** Hot mutex: `WAIT_TIMEOUT_MS = 5000` (`src/state/hot-lock.mjs:32`), and the store's append lock waits another 5 000 ms (`locks.rs:12`). The append lock sits inside the hot mutex (ranks 70 inside 60) for the whole read-in-gate, fold, append (3 fsyncs, `tests/p02_review.rs:76`) and cache write. So 20 queued sessions share one 5 s budget that does not grow with queue depth: a real limit by construction, made worse by a dev build under strace. I did not run the benchmark (load average above 12), so not reproduced; there is no evidence of a lock held across unrelated I/O, only across the append's own fsyncs.
- **Does the Event Store still need the state hot mutex?** For log integrity: no. `append.rs:204` checks the own-stream cursor (`StaleCursor`) under the store's own append lock, and `append.rs:30` documents it. The mutex still earns its place for Work's check-then-append (a stale cursor would turn waits into `stale-cursor` failures that `consumer-event-gate.mjs:89-99` does not retry), the cache file write and the staged effects. Those belong to the state store. Evidence is reading only; I did not redesign it.
- **Node twins.** S6, S7.
- **Windows.** S12.
- **Detached seal child.** S13.

## Tables

### Migration (what moves, and to which layer)

| Item | From | To | Condition |
|---|---|---|---|
| Stream directory listing (4 copies) | Rust crate x4 | `Layout::streams` in `layout.rs` | now |
| Remote-name alphabet, held-rank refusal | Node | crate (already there) | now |
| Refspec overlap judgment, doctor thresholds | Node `event-store-checks.mjs` | crate `diagnostics` (P3) | owner pick |
| Seal-if-due and sync-due ordering | Node `maintenance.mjs` | crate (P2) | owner pick |
| Due sync | inline in the end trigger | the seal child door | now |
| `WalError::Untrusted` name | Git | Git (T2 seat): one name per cause | hand-off |
| Machine-id and refspec fixes | Event Store setup | Identity and Git fixes (already registered) | now |
| `quiesce-scan` route, Git `cutoverGrant` | holder-lock, Git | delete if no other consumer | T0/T2 seats confirm |

### Delete list (Δ lines are estimates from line ranges; tests included)

| # | Delete | Where | Δ src | Δ tests | When |
|---|---|---|---|---|---|
| D1 | Four stream listings become one | `receipt.rs:91`, `seal.rs:616`, `sync.rs:121`, `diagnostics.rs:11` | -25 (+12 new helper) | 0 | now |
| D2 | `promote::abandon` | `promote.rs:117-194` | -78 | -60 | now (owner confirm) |
| D3 | Unpublished-summary chain | `sync.rs:557-618`, addon `:438-460`, `native.mjs:161-164` | -91 | -25 | now |
| D4 | HEAD legacy path, import, migrate | `legacy_import.rs` per S5 table | -660 | -300 (+40 helper) | fence release |
| D5 | Rollback export | `export.rs:154-325`, addon export legacy branch, `export.mjs` legacy branch, `parity.mjs` | -250 | -203 (`rollback-export`, `export-legacy-parity`) | fence release, owner decision |
| D6 | `events migrate` verb | `migrate.mjs` 257, `bin/fgos.mjs` about 8, `event-log.mjs parseEventLines` about 25 | -290 | -343 (`migrate.test`, `migrate-cutover-grant`) | fence release |
| D7 | `decodeLegacyFiles` and its twins | addon `:759-773`, `native.mjs:187-191`, `index.mjs` | -27 | -11 (`legacy-order-parity`), the owner of that behaviour is `tests/vectors.rs:104` | fence release |
| D8 | Machine-id and refspec setup fixes, `ensureEventStoreRefspecs` chain | `event-store-fixes.mjs`, `native.mjs:174-177`, addon `:586-600`, `refspec.rs:11-19`, `registrations.mjs:6152-6153` | -62 | about -15 (`test/setup/event-store-fixes.test.mjs`) | now |
| D9 | Doctor rows `git-version`, `native-addon`, `orphan-branches` merged | `event-store-checks.mjs`, `native.mjs:178-185`, `registrations.mjs:6155` | -20 | about -10 | now (owner picks for `native-addon`) |
| D10 | Node duplicates of Rust decisions (S6) | `native.mjs:20-26`, `config.mjs:23-24`, `consumers.mjs available()` | -16 | 0 | now |
| D11 | Addon boilerplate (S8) | `event_store.rs` | -50 | 0 | now |
| D12 | Node benchmark-hash tests that re-prove Rust vectors | `test/event-store/canonical-vectors.test.mjs:14-30` (keep the first test as the door wiring proof) | 0 | -16 | now |
| D13 | `settle-host-proof.mjs`, `settle-fault.py` | `scripts/event-store/` | -149 | 0 | after the §23.2 candidate run |
| D14 | `test/event-store/door.test.mjs` reader census for retired files | one release after the fence | 0 | about -150 | fence release plus one |

Totals: src about -1 450 (Rust about -970, addon about -180, Node about -300), tests about -1 150 with the helper. The layer total of the table above is larger than Part A's size row because Part A counts only what stays dead after D14 and keeps D14 and D13 out.

Rust-side proof note for D4/D5: `read_legacy` (the pinned path, `read.rs:335-361`) and `legacy_files` stay; the `else` branch at `read.rs:362-373` goes with D4.

### Doctor (ten rows today, seven after)

| Row | Verdict | Condition kept where |
|---|---|---|
| `event-store-git-version` | merge into `git-component-compatible` | `floor.supported` (S7) |
| `event-store-native-addon` | merge into `git-component-compatible` (owner call) | contract `eventStore: 4` |
| `event-store-open-root` | keep, reword the missing-directory case | S1/S2 |
| `event-store-refspec` | keep (unique conditions: provenance, URL pin, unsafe push mapping) | |
| `event-store-machine-id` | keep (unique condition: shared machine ref) | |
| `event-store-legacy-layout` | keep, shrunk to fence, ref and sealed tree | |
| `event-store-unsealed` | keep, absorbs orphan branches | |
| `event-store-orphan-branches` | merged away | |
| `event-store-integrity` | keep | |
| `event-store-sync` | keep | |

Fixes: keep `event-store-lock-dirs`; drop `event-store-machine-id` and `event-store-refspec` (S7).

### Tests

| Group | Verdict |
|---|---|
| Node `migrate.test`, `migrate-cutover-grant`, `rollback-export`, `export-legacy-parity`, `legacy-order-parity` (5 files, 17 tests, 557 lines) | delete with D4 to D7; behaviour removed |
| Node `canonical-vectors` tests 2 and 3 | delete; the owner is `tests/vectors.rs` (hash and record vectors) |
| Node `store-hardening:11,:27` vs `triggers:56` vs Rust `p02_review.rs:213,232` | one behaviour (maintenance reads facts only) proved four times; keep `triggers:56` as the wiring proof, merge the other two Node tests into it. I did not run them, so verify before deleting. About -35 |
| Rust `tests/legacy_import.rs` (6 tests) | keep `:131` (clone verifies a published legacy commit), delete the other five with D4 |
| Rust `legacy_reader.rs` pre-migration test, `reader_review_regressions.rs:297` `head_legacy_ignores...` | delete with D4 (about -75) |
| Rust `branch_local_refs.rs` abandon assertions, `sync_review.rs:338`, `v_event.rs` summary assertions | delete with D2/D3 |
| `door.test.mjs` | keep one release after the fence, then delete (D14) |
| `store-hardening` benchmark seed and worker tests (3), `store-increment-worker.mjs` | keep: they are the proof of the spec §17 budget |
| Renames in S10 | rename only |

Cases of 134 Node and 182 Rust tests that prove the same behaviour twice across the boundary, by my reading: the maintenance-facts group above, and `facade.test.mjs:191` (legacy history not resent) which is the one wiring proof of `read.rs` `LegacyView` and stays. I found no other double.

## Proposed additions (each adds something, so each waits for the owner)

- **P1. Skip the legacy history read when the pin is unchanged.** Problem: every CLI process re-lists and re-reads the pinned legacy commit (`ls-tree -r` plus `cat-file --batch`, about 100 ms of the 0.45 s of `fgos list`, S9). Evidence: strace of 11 children in the clone, baseline timeline, immutability of a pinned commit (`fence.rs:46`). Benefit: warm reads lose two Git children and about 100 ms; it needs the legacy digest stored in the event-history checkpoint keyed by the pin oid, which touches read semantics (WORK reviews).
- **P2. One native `maintain(trigger, config)`.** Problem: `maintenance.mjs` makes five native calls and decides when a seal or sync is due; the owner rule says no deciding logic in Node. Evidence: `maintenance.mjs:10-45`. Benefit: facade -3 methods (`sealAll`, `sealIfDue`, `maintenance` out, one in), Node about -30, addon about -40, one proof. Net lines about -40.
- **P3. Doctor decisions in the crate.** Problem: S6 (`overlaps`, thresholds in Node). Benefit: `event-store-checks.mjs` 90 to about 35 lines, decisions in one language; Rust about +55. Net about -0.
- **P4. A typed error code on the napi error.** Problem: `native.mjs:27-41` parses the code back out of a message by regex or JSON. Evidence: `call()`. Benefit: that function shrinks to a re-throw; it changes the shared `error` helper of the whole addon, so it is a Git (T2) item.

## Rejected hypotheses

- "The state hot mutex is needed for the log's integrity": rejected, the crate checks the cursor under its own append lock (`append.rs:204`).
- "The fresh-clone write failure is a real repository identity problem": rejected, reproduced as a directory mode problem; a clone whose setup runs has 0700 parents and gets the named refusal.
- "The 20-session `hot-lock-timeout` is a lock held across unrelated I/O": not supported; the lock is held across the append's own fsyncs and the queue shares one 5 s budget. Not reproduced.
- "`legacy.rs`, `fence.rs`, `verify_legacy_tree`, `LegacyView` are dead": rejected, they are the permanent read path (owner 2026-10-21) and the pending stray-shard import needs the parser.
- "The Node canonical-hash and legacy-order vectors are duplicated across Rust files": rejected for `review_fixes.rs`, `registry_identity_layout.rs` and the protocol-counter test; they use the vector as a fixture for a different behaviour. Only `vectors.rs` owns the vector behaviour.
- "Deleting `export_legacy_layout` leaves `allowed()` unused": rejected, `verify_legacy_tree` (`legacy_import.rs:450`) uses it; it can shrink to a path check but stays.
- "Seal test seams (`seal_with_fs`, `rotate_with_fs`, `sync_with_fs`) are unused": rejected, tests own them and each has one owning proof.

## Part E: questions for the owner (decision question form)

1. **What is happening:** the rollback export `events export --format legacy-layout` and the whole `events migrate` verb serve a cutover that has landed everywhere. **Cause:** the fence has to live one release. **Options:** (a) delete both at the H33 date (about -540 src, -550 tests, recommended: no previous release can read a migrated clone); (b) keep the export one more release as the rollback promise and delete only `migrate`; (c) keep both. **Recommendation:** (a), same date as H33. **Scope:** D4 to D7.
2. **What:** `promote::abandon` has no caller, so orphan branch streams have no remedy. **Options:** (a) delete it and make the orphan doctor line information; (b) someone wires it (a feature). **Recommendation:** (a). **Scope:** D2.
3. **What:** `event-store-native-addon` repeats `git-component-compatible`. **Options:** (a) delete the row; (b) fold the export list into the Git row. **Recommendation:** (a) if the napi contract version bumps with every export change (it did to 4 in the cutover); check that rule first. **Scope:** D9.

Status: DONE_WITH_CONCERNS
Summary: Delete list of about -1 450 src lines and about -1 150 test lines (Rust src about 7 757 to about 6 790, doctor rows 10 to 7, setup fixes 3 to 1); fresh-clone read failure reproduced and its fix proven in a throwaway clone (four copies of one stream listing, one tolerant); the write refusal is already named and the baseline's `repository-identity-changed` was a 0775 directory plus a misnamed Git error.
Concerns/Blockers: Delta lines are range estimates, not measured diffs; I ran no Rust or Node tests and no benchmark (load average above 12), so the 20-session timeout, the Windows target list and the test-overlap merges are inferred and marked so; the cause of `WalError::Untrusted` sites other than the mode check, the cross-layer Git `cutoverGrant` and `quiesce-scan` deletions need the T2 and T0 seats; D4 to D7 and D13 depend on the owner decisions in Part E and on the fence release date.
