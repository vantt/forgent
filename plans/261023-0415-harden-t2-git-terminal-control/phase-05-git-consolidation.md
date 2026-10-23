---
phase: 05
title: "Git consolidation, one port file per slice: one error mapping and one constructor per code, one layout cause, one transaction skeleton, the WAL on the T0 leaves, the rest of the remote/readers duplication, dead surface, the port contract made true"
status: pending
depends_on: [03, 04]
parallel: "none for Git files; phase 06 may run beside it"
effort: ~2d
net_size: "Node −30 / Rust −130 floor, −560 best (only measured folds count) / tests −45 floor, −80 expected"
---

# Phase 05 — Git consolidation

## Context

Arbitration D1 step 5, §2.1 "Errors", "One transaction skeleton per question", "The WAL uses the T0 leaves", "Node budget"; §2.5 (ceiling: a fold that does not pay is dropped); D7 (digest switch only after a byte-equality run); D9; verdict 9 (kept on purpose list, [plan.md](plan.md)). Simplicity seat E-1..E-9, E-20..E-24, F-1, F-2, F-5 (file:line and fix shapes; its lines were read on `2f3ad28af`/`3bc2c1059` — the lead re-greps each before editing, and the phase report cites current lines). Red-team: Rust −1 100 is not evidence; folds not proved byte-identical are not counted.

Moved out of this phase: E-3's `git-checks.mjs:135` site and E-4 → phase 7 (that file is phase 7's); the remote-door half of E-24 → phase 2 (D-T2-3); the "dormant" labels of E-24/F-9 → phase 9; E-25 (Q4 arms) → phase 8.

## Leads

<!-- Updated: Red Team 2026-10-23 - split for one-lead size -->
Two leads, one after the other, each in its own worktree:
- **05A** runs slices 1–6: errors, driver, WAL, Publication readers, refs/worktree/remote, config/inspect. Branch `harden/t2-p05a-git-errors-wal`.
- **05B** runs slices 7–12: the transaction skeleton, native_lock/objects, `ResultCode`, addon/Node, ports, checkpoint. Branch `harden/t2-p05b-git-skeleton-surface`. It starts after 05A has merged and has OPC's verdict.

## Rules for every slice

- **One port file per slice, one commit per slice**, lowest layer first (order below). Each slice: re-grep the seat's sites → name the behaviour the fold must keep → find its owning test (extend it if the fold unifies two answers that used to differ) → fold → focused tests → Δ lines. A slice whose Δ is ≥ 0 and that fixes no drift is **dropped** and listed as "not paid".
- A fold that **unifies drifted behaviour** (different native-state lists, two replay-equality rules, a hook that sees the operation id in one port only, two names for one failure) changes an answer somewhere. That change gets a test stating the unified behaviour, and, if a public cause name changes, every caller moves in the same commit (`rg -n "<old-cause>" src bin packages test`, listed in the commit body).
- **WORK overlap**: slices touching `lib.rs`, `grant.rs`, `scoped_commit.rs`, addon `scoped_commit.rs`, `ports.v1.json`, `tests/{recovery_matrix.rs,scoped_commit_sync.rs}` say so in the commit body. If `work/es-cutover` is on main when this phase starts, rebase first and add slice 12; if not, avoid WORK's hunks (`git diff 8189f127b..work/es-cutover -- <file>`) where a fold allows it.

## Slices (commit order)

1. **`lib.rs` — one constructor per code (E-6) and one `WalError → (ResultCode, kebab cause)` mapping (F-5).** Constructors `refused`, `recovery`, `failure`, `busy`… in `lib.rs`; delete `driver.rs:143 refusal()`, `refs.rs:15 failure()`, `inspect.rs:11 refused()`, `repository_config.rs:11 error()` (its cause-string sniffing goes), `publication.rs:14 err()`, `grant.rs:109-113` hand-rolled refusal (use `lib.rs:547 require_lock_scope_platform`), the inline literals the seat lists (re-grep `OperationError {`). The mapping: `Busy → busy/refused` as Refs does today (`refs.rs:394`, re-grep), `OperationIdConflict → refused operation-id-conflict`, `Untrusted`, `FenceMissing → git-fence-missing`, `PublicationBorrowUnavailable → publication-borrow-unavailable`, `Corrupt/Io → recovery-required` with a kebab cause (never `Debug` text); `WalError`'s `Display` stops being `{self:?}` (`wal.rs:32-39`). Publication's `werr` (`publication.rs:27-31`) and `BoundReader`'s collapse (`:999,1006,1020,1053`) use it; `:449-451` (`starts_with("directory-fsync")`) and `:775-793` (stderr sniffing) read typed fields instead where the WAL/driver error carries them (else they stay and are named in the report). Deferred compaction (`publication.rs:295,306` `eprintln!`) goes into the receipt's warnings. **Contract change:** a Publication caller that saw `recovery-required` may now see `refused`/`busy` with a named cause. `rg -n "recovery-required|publication-wal" src bin packages/event-store packages/identity` found no production caller switching on it (2026-10-23); tests asserting the old code move. Phase 1's F-5 test turns green.
2. **`driver.rs` — one `layout_cause(&RepoLayout, fallback)` (E-5)** at the six sites (seat `:860,2151,2202,2430,2450,3414`; current `:861,2152,2203,2431,2451,3415`); one order promisor → alternates → shallow → fallback; phase 1's E-5 test green. **Duplicated directory safety (E-9)**: the two empty-hooks checks (the `unsafe readdir_r` one goes), two uid checks, two hooks-dir creators, four cfg-gated pipe helpers, stale `#[allow(dead_code)]` on `Policy`, duplicate `use std::io::Read`, `derive(Clone)` on `GitFloorVerdict`. **F-2**: one name per failure class across borrowed and contained paths (`borrow-deadline: …` vs `git-timeout`; `path: borrowed|contained` in `detail`), every free-text cause gets a name, and the silent `if let Ok(chain) = wal.inspect(..)` (current `:2556`) refuses like `:2550`. MAIL overlap: `:415-450,1543+` (board note).
3. **`wal.rs` — the T0 leaves (E-22, E-8 for the WAL).** The WAL's `FileSystem`/`OsFileSystem`/`FaultAdapter` (`wal.rs:48-68`) go onto `fgos_durable_file`'s checkpoint trait (`packages/durable-file/rust/src/lib.rs:56-64`; add `Send + Sync` there if needed — check every implementor compiles: terminal store, run-supervisor publish); the nine raw directory `sync_all()` calls use `fgos_durable_file::sync_directories`; `Wal::open_with(repo, fs)` replaces the eight fence+open pairs (seat list; re-grep `Wal::with_filesystem`); `wal::Attribution` and `lib.rs:246 Attribution` become one type; the ledger digest tuple is built once. **Digest half of E-22: kept by evidence (D7), closed now, no switch.** <!-- Updated: Red Team 2026-10-23 --> The two encoders differ by construction, so no run over today's records could make the switch safe for every future record:
- the T0 leaf `fgos-canonical-json` writes every number through `as_f64` and `ryu_js`, losing integers above 2^53 (`packages/canonical-json/rust/src/lib.rs:28-33`), and sorts keys by UTF-16 order (`:43-46`);
- `canonical_digest` serialises integers exactly and sorts keys by `String` (UTF-8) order (`wal.rs:286-318`).

A WAL record with an astral-plane key or a large integer would get a different digest and turn every retained chain `Corrupt` after activation. The twin stays. The report names this evidence in place of a byte-equality run. `fgos-git` gains no `fgos-canonical-json` dependency. **E-23**: delete `ObservedRef::Unknown`, `Recovery::Unprepared` (fold into `RecoveryRequired`), the redundant arms; `Backlog.ledger_entries`/`ledger_capacity_warning` are dropped with their assertion (`wal.rs:2964,3029`) **unless** the owner picked A1 before this slice (then phase 12 wires them; leave them). `prior_target_attempt` stays (digest tombstone). The v1 ledger branch is phase 8's.
4. **`publication.rs` — readers and syncers (E-22 rest).** One ref reader (the patterned one) for `publication.rs:1211-1257` and `refs.rs:53` `direct` where their answers are the same; `WalReader::read_ref` stays (kept on purpose); one `candidate_intact` strictness (the stricter, `publication.rs:1012-1073`) with a test if `driver.rs:1915-1935`'s looser answer ever differed; one ref-directory fsync walker with a `concurrent` flag (`refs.rs:241-262` vs `publication.rs:367-419,1080-1092`).
5. **`refs.rs`, `worktree.rs`, `remote.rs` (E-24 rest).** `worktree.rs:1602-1612 byte_path` ≡ `refs.rs:279-289 path` → one; one "which worktrees check out this branch" scan (`worktree.rs:685-721`, `refs.rs:441-510`, `restore.rs:1111`); one zero-OID constant; the repeated canonicalisation in `worktree.rs:111-131` vs `:917,:1085`; the unreachable `#[cfg(not(unix))]` arms behind `lib.rs:547` (seat list). Name grammar used once (`remote.rs`, `repository_config.rs:76-83`, `wal.rs:330`).
6. **`repository_config.rs`, `inspect.rs` (E-24 rest).** Five config readers → `driver.rs config_facts` (`hooks_value`/`local_hooks_value` stay two questions — red-team: included hooks vs local file — but share the reader); `inspect.rs:744-752 paths_at_revision` alias goes; literal-path validation three ways → one.
7. **`scoped_commit.rs`, `sync.rs`, `land.rs`, `restore.rs` — one transaction skeleton (E-21), test-only wrappers (E-20).** One `authority_gate`, `replay_known_id` (one equality rule, one cause name; today `operation-id-reused` vs `operation-id-conflict`), `commit_result(outcome, head, observed)`, `Intent::for(..)`, `native_state_probe` with **one** file list (union of the four; a test states it), `store_path()`, `skipped_paths()`; `git commit -F -` argv built once — ScopedCommit's `-c fgos.operationId` now also reaches Sync's hooks (unified behaviour; test in `scoped_commit_sync.rs`). E-20: one function per verb taking `(filesystem, wait_ms)`; integration tests call it; `pub(crate)` for the rest; the `lib.rs:24,587` re-exports go. WORK overlap: `scoped_commit.rs`, `scoped_commit_sync.rs`. Expected −250; drop any sub-fold that does not pay.
8. **`native_lock.rs`, `objects.rs` (E-8).** 16 hand-rolled directory fsync chains → `sync_directories`; one `RENAME_EXCHANGE` helper; one parent-missing error (no bare `.unwrap()` on `path.parent()`).
9. **`ResultCode` (E-7).** Delete the six variants nothing constructs (`Created, Landed, ConflictedOpen, ConflictAborted, Cancelled, PublishedCheckoutPending`: `rg` over `packages/git/rust/src` = 0 each, 2026-10-23) together with their rows in `packages/git/contracts/result-codes.v1.json` and `tests/contracts.rs:49-70`; Sync's `"conflicted-open"`/`"conflict-aborted"` stay `SyncResult.state` values (spec §2 sentence in phase 8/9 separates result codes, Sync states and outcome kinds). On-disk: WAL and ledgers store outcomes, not `ResultCode` (`wal.rs:1888-1938`), so no stored receipt names them; Node: `rg -n "'(created|landed|cancelled|published-checkout-pending)'" src` checked in the commit.
10. **Addon and Node (E-1, E-2, E-3).** Delete `GitNativeLockRepair` (`packages/git/node-addon/src/git/native_lock.rs`, its registration), `src/git/native-lock.mjs`, the export at `src/git/index.mjs:33`; the refusal `native-index-lock-unowned` stops naming a Node door (spec §11 runbook text stays); Rust `native_lock.rs` inspection stays. `src/git/recovery.mjs:2` imports `hotLockDepth` from `../holder-lock/hot-guard.mjs` (E-2). `nativeError` moves down into `src/native/door.mjs` (lowest layer that needs it; `door.mjs:96` uses it) and `src/git/native.mjs` re-exports it (E-3, design principle 2); the T2-owned sites use it; the consumer sites outside T2 are T5's (H26).
11. **`ports.v1.json` made true (F-1).**
    - Regenerate the `ports` object from what the addon serves: the method names each `GitX.call` dispatches, plus the free functions in `packages/git/node-addon/src/lib.rs`. Drop the stale `implementationStatus` prose.
    - Pin it with a **runtime** check against the loaded addon, not a parse of Rust source text (phase 6 retires exactly that kind of proof). In `test/git/native-load.test.mjs`, the owner of addon-load facts, add one case: for every operation `ports.v1.json` names, `call(name, {})` on the loaded port answers anything **except** the addon's unknown-method refusal; and one unlisted name does get that refusal. The lead names that refusal's cause from the addon source.
    - `tests/contracts.rs` keeps its existing result-code pin.
    - WORK overlap: `ports.v1.json` (`legacyEvents` row).
12. **(Only if `work/es-cutover` is on main.)** Delete Rust `checkpoint_tracked_files` (`scoped_commit.rs`, current location: `rg -n "fn checkpoint_tracked_files" packages/git/rust/src`), its addon arm and facade method, and its Rust test (`noop_is_durable_and_checkpoint_selects_only_non_event_tracked_files`; behaviour removed by WORK), in one commit. Otherwise the big lead does it on main right after WORK merges (H28).

## Files

**Modify**: `packages/git/rust/src/{lib.rs,driver.rs,wal.rs,publication.rs,refs.rs,worktree.rs,remote.rs,repository_config.rs,inspect.rs,scoped_commit.rs,sync.rs,land.rs,restore.rs,native_lock.rs,objects.rs,grant.rs}`, `packages/durable-file/rust/src/lib.rs` (trait bound only, if needed), `packages/git/node-addon/src/{lib.rs,git.rs}`, `packages/git/contracts/{result-codes.v1.json,ports.v1.json}`, `packages/git/rust/tests/{contracts.rs,publication.rs,scoped_commit_sync.rs,land.rs,safe_restore.rs,refs_remote.rs,worktree.rs}` (callers of E-20 wrappers, unified-behaviour cases), `src/git/{index.mjs,recovery.mjs,native.mjs}`, `src/native/door.mjs`. **Delete**: `src/git/native-lock.mjs`, `packages/git/node-addon/src/git/native_lock.rs`, the duplicates named per slice. **Tests to retire**: `test/git/native-lock-repair.test.mjs` (behaviour now owned by `native_lock.rs::unknown_external_lock_has_inspection_report_and_is_never_moved` (`:652`) and the crate's refusal tests; the Node door is deleted); `wal.rs` assertions on `ledger_capacity_warning` (behaviour removed, unless A1); `tests/contracts.rs` rows of the six deleted codes (behaviour removed); `wal.rs` inline `Recovery::Unprepared` assertion (`:2664`) retargeted to `RecoveryRequired`. **Not retired here** (INFERRED owners, arbitration verdict 10): the `wal.rs:3055-3182` real-git case stays unless the lead re-proves `tests/publication.rs:703` owns it with a mutation check, then it retires naming that owner.

## Verification (exact)

Per slice: the crate tests of the touched file plus the crash matrices:

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p05-target
cargo test -p fgos-git
cargo test -p fgos-durable-file -p fgos-terminal-control -p fgos-run-supervisor   # slice 3 trait bound
cargo test -p fgos-event-store -p fgos-identity -p fgos-node-addon
cargo clippy --workspace --all-targets -- -D warnings
```

Node (one-file command): `test/git/*.test.mjs test/setup/git-checks.test.mjs test/runner/land-vs-manual-commit.test.mjs test/runner/worktree-admin-multiprocess.test.mjs test/e2e/main-checkout-borrow-hook.test.mjs`.

`rg -n "fn refusal\(|fn failure\(|fn refused\(|fn err\(|fn werr\(" packages/git/rust/src` → only `lib.rs`. `rg -c "promisor-object-unavailable" packages/git/rust/src/driver.rs` → 1 non-test site. `rg -n "createGitNativeLockRepair|GitNativeLockRepair" src packages` → nothing.

## Net size

Node −30 (`native-lock.mjs` −12, `index.mjs` −1, door/native ±5, E-3 sites −10). Rust: floor −130, best −560 by slice (1: −60; 2: −90; 3: −60, no digest switch; 4: −40; 5: −50; 6: −30; 7: 0 to −200; 8: −40; 9: −12; 10: −44 addon; 11: JSON ±), **counted only as measured**; the plan's sum uses the floor; contracts shown apart. Tests −80 (native-lock-repair −40, capacity/variant rows −20, wrapper callers ±, +4 unified-behaviour cases +60, ports runtime pin +15, −95 from moved E-20 callers only as measured; floor −45).

## Test-cost line

Added ≈ 5 (unified native-state list, unified replay rule, Sync hook operation id, F-5 mapping already from phase 1, ports runtime pin); retired 1 file + ≈ 4 assertions; no new spawn.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A fold silently changes a public cause or answer | M × H | Unified-behaviour rule: test + caller move in the same commit; OPC review per slice |
| A durable-file trait bound breaks other crates | L × M | Slice 3 runs those crates' tests |
| Slice 7 is too large for one review | M × M | Sub-commits per port file (scoped_commit, sync, land, restore); OPC reviews in that order |
| WORK lands mid-phase and conflicts in `scoped_commit.rs` | M × M | Rebase rule; slice 12 |

## Rollback

Revert per slice commit (each is independent after slice 1; reverting slice 1 needs the later slices reverted first). On-disk: none (no digest change).

## Done when

Phase 1's E-5 and F-5 tests green; every slice either merged with its Δ or listed "not paid"; E-22's digest half recorded "kept by evidence"; the greps above clean; crash matrices green; OPC verdict per slice recorded.
