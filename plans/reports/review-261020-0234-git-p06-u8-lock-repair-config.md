# Code review: Git phase 06 unit 8 (native index-lock repair, RepositoryConfig owned hooks)

Scope: `git diff da8c1b6b9..3e0cc30af` in the git-p06-review worktree (commit 3e0cc30af, 26 files). This was a read-only review. I read the lead report, phase-06 requirements 7 and 8, Git spec §11 and the RepositoryConfig/§10 text, and every changed Rust, addon and Node source file. I also read the new Rust tests. I did not run cargo or node tests, because a build would write `target/` into the workspace. The lead report says the focused Rust tests, clippy, and 95/95 node tests pass.

## Verdict

**Merge-ready as dormant code once H1 is fixed.** H1 is a small change to a function's visibility and doc comment. No Critical findings. The quarantine path, the config writer and its recovery all fail closed in every race I could build: inode swap, same-inode content change, pid reuse, a lock re-created after the check, a human editing `.git/config`, and dead-writer residue. The Medium items can land in the next unit (Recovery port completion) or in phase 07, before any caller is wired.

## Critical

None.

## High

**H1. `record_owned_index_lock` is a `pub` API, and its ownership claim is not tied to whoever actually wrote the lock.** (`packages/git/rust/src/native_lock.rs:108-141`)
The recorder accepts any `child: &ProcTuple` and any `&File` whose (dev, ino) matches `.git/index.lock`. It only checks two things: the child is alive now, and the descriptor points at the same inode. It cannot check that the file was created exclusively by this operation, or that the child is the process writing to it. A caller can open an existing `index.lock` by path and pass a short-lived child it spawned itself. This is exactly the "discovering a pathname is ownership" route the doc comment forbids. Here is a concrete case: a human's long-running `git rebase -i` holds `index.lock`. A future caller records it against an fgOS child, and that child exits. The lock still has the same inode and state digest, and the recorded owner is now Dead, so repair quarantines a live human lock. Checkout exclusion does not prevent this, because human git does not take holder locks.

There is a second problem. Real git creates `index.lock` itself with `O_CREAT|O_EXCL`, so the documented producer model ("the producer creates it exclusively and passes the fd to its child") cannot work with a git child. A git child would fail with "index.lock: File exists". So no realistic production caller can satisfy the contract as written. The only caller today is the test fixture, which uses `sleep`.

The config writer avoids this problem because it creates `config.lock` itself with `create_new`, inside the same function, and records its own process identity. That path is sound.

*Fix:* Make the recorder non-public. Use `pub(crate)` plus a `#[cfg(any(test, feature = "test-support"))]` re-export for `tests/native_lock.rs`, or `#[doc(hidden)]` with a crate feature. State in the doc comment and in spec §11 that index.lock ownership has no realizable producer yet. Phase 07 should design that producer explicitly. One option is to record evidence only for files fgOS itself creates with `create_new`, as the config writer does.

## Medium

**M1. The four recovery refusals point to a repair that cannot succeed for any real artifact today.** (`land.rs:168`, `land.rs:1217`/`:1341`, `restore.rs:270`, `scoped_commit.rs:536`, `sync.rs:520`/`:559`)
These messages now name `repairNativeIndexLock`. But no operation records `NativeLockOwned` for `index.lock`, so for every real SIGKILL residue the repair returns `inspectedRepairRequired`. That makes the refusal a dead end. The only route that actually works is the manual runbook in spec §11 (line ~460, "Main-checkout cutover runbook: retained index.lock"). The SafeRestore test proves "repair, then recovery proceeds" only because the test synthesises ownership. *Fix:* Change the refusal text to say "inspect with repairNativeIndexLock; unowned residue follows the retained index.lock runbook". The spec line saying the caller "then resumes" should say this applies only when ownership evidence exists.

**M2. Hooks facts read the effective multi-scope config, but the writer edits only the local file.** (`driver.rs:2414-2423`, `repository_config.rs:hooks_value`, `:353-367`)
The filter `origin.starts_with(b"file:")` excludes the `-c` override but keeps global, system, included and worktree-scope files. The spec's RepositoryConfig row says "local config". Consequences:
- (a) Suppose a user has a global `core.hooksPath` and fgOS earlier wrote the local value. The user then sets the global value. Now `values.len() > 1`, so `inspectHooks`, `ensureHooks` and `removeOwnedHooksConfig` all fail with `hooks-config-ambiguous`, and our own value can never be removed.
- (b) A value that comes from an `include`d file or from a global or system file becomes `old`. A removal then runs `--unset-all` on the local draft, where that value does not exist, so git exits 5 and the call errors. This fails closed but cannot be resolved.

*Fix:* Use `--show-scope` (as `untrusted_transport_config` already does) or filter on origin == the common `config` file. Do this both for the write guard and for the exact-old value. Separately, report a higher-scope value as `skippedExisting`/`enforcementMissing` rather than treating it as an error. Add a test with `HOME`-scoped global config.

**M3. Hooks provenance is ordered by operation-directory mtime instead of WAL order, and it hand-builds the WAL layout path.** (`repository_config.rs` `hooks_provenance`, the `fs::metadata(common_dir/"fgos/git/operations"/id).modified()` block)
"Latest ensure versus latest remove" decides whether a value is owned, and that decision rests on filesystem mtimes. Mtimes change on any later append, and backup/restore, rsync or coarse-granularity filesystems reorder or tie them. On a tie, the first entry wins because the comparison is `>`. The function also duplicates the WAL's private directory layout outside `wal.rs`, which breaks the one-door rule. Today the repo-config lock serializes operations and pending chains are resolved first, so the current order is right in practice. *Fix:* Have the WAL expose an ordering, such as a sequence or the Intent's recorded time, through a `Wal` method, and select the newest by that value. Do not stat directories from `repository_config.rs`.

**M4. The `last().phase` → `last_state()` migration is incomplete.** (`publication.rs:290`, `:900`, `:907`, `:949`, `:981`; `wal.rs:1216`, `:1480`; `refs.rs:338`/`:350`)
`NativeLockOwned` is accepted after any non-terminal phase of Land, ScopedCommit, Sync, Restore and ConfigChange chains. The four checkout modules were converted, but the publication admission scan (`admit_pending`) still checks `chain.last().phase` for `Intent | Prepared`. A Land chain whose last record is `NativeLockOwned` would therefore be reported as `RecoveryRequired` instead of being abandoned. The same applies to the snapshot-retention check at `wal.rs:1216`. This is latent until a producer exists, but it splits one rule across two spellings (L10). *Fix:* Convert every remaining state check to `last_state()`. Optionally, make `last()` private to the digest and sequence users.

## Low

**L1. Residual window between the final recheck and `rename`.** (`native_lock.rs`, the final `state(path)` then `fs::rename(path, &quarantined)`)
The rename goes by path. If something unlinks the stale lock and a new git creates `index.lock` within microseconds, the live lock is moved. The consequence is that git's own `commit_lock_file` fails, with no data loss, and the bytes are kept. *Fix:* After the rename, compare `file_key` of the quarantined file with (dev, ino). If they differ, move it back with `RENAME_NOREPLACE`/`link`, and report.

**L2. Config recovery gets stuck permanently after a crash in the `write_all`..`NativeLockOwned` window.** (`repository_config.rs:446-459`)
The intent-time evidence holds the empty-file state digest. Once the bytes are written but before the second capture is appended, the digest no longer matches. Recovery then returns `git-wal-config-lock-preserved` until someone intervenes by hand, and that also blocks `ensureFetchMapping`. This fails closed, and the window is short. Mention it in the runbook.

**L3. `NativeLockOwned` may be recorded only once per chain** (`wal.rs` `validate_transition`, `already_owned`). Multi-child operations such as Sync (merge, then commit) could only ever cover the first child's lock. Settle this when the producer is designed.

**L4. `hooks_provenance` inspects every chain on each call** (scan bound 100 000). That is O(WAL) for an inspect call. It is acceptable while ConfigChange chains are never compacted, because `admit_pending` compacts only ref resources, which also keeps provenance alive.

**L5. Removal uses `git config --fixed-value`** (git ≥ 2.30). Confirm that this is at or below the declared git floor.

## Checked and found sound

- **Pid reuse and same pid tuple.** Death is decided by `facts::judge_here` on the full (host, boot_id, pid_ns, pid, start_time) record. Only `Dead` permits a move, and `Unknown` is preserved. It runs twice, before and immediately before the rename. A human git with a reused pid has a different start time and so never matches.
- **Inode swap and re-creation after the check.** dev/ino plus a digest over mode, size, mtime/ctime in ns and the bytes is checked again after `validate()`. The tests cover inode swap, same-inode content change and dangling links. Inode reuse by a newly created lock still differs in ctime_ns.
- **Contents preserved.** The file is renamed whole into a fresh 0700 per-operation directory, never overwritten (the destination is reserved by `mkdir`, with an occupied-destination test), and fsynced, including the parents.
- **Unknown external locks.** Without matching WAL evidence the result is always `inspectedRepairRequired`, never moved. Node has no ownership entry point (`native_lock.rs` addon, `src/git/native-lock.mjs`).
- **No `/proc` write used as an ownership test.** No new code or test writes to `/proc`.
- **Exclusion.** Repair runs under the checkout scope with `validate_quiescent`. Config recovery quarantine runs under repo-config 80 with `validate_publication_borrow`.
- **Hooks fill only an empty slot and preserve custom or unproven values** (`skippedExisting`). Removal requires both provenance and the exact current value. The exact-old guard (full-file bytes plus the hooks value) runs at Prepared and again after TargetAttempt, immediately before the rename. A human `.git/config` edit is detected by the byte compare (tested). A raw editor writing between the last compare and the rename remains an inherent git-level race.
- **WAL ConfigChange recovery.** Recovery observes and never replays. `staging` and `hooks` are `skip_serializing_if = None`, so historical digests are kept. The driver's `-c core.hooksPath` safety override is excluded from facts.
- **One config write door.** `ensure_fetch_mapping` and the hooks operations share `change_config`. The move from `fgos_holder_lock::acquire` to `LockScope` repo-config is consistent.

## Unresolved questions

1. Phase 07 needs a real index.lock ownership producer. Is the intent to record ownership only for artifacts fgOS creates itself? If so, should `index.lock` repair stay inspection-only and the runbook remain the supported route?
2. Should `core.hooksPath` facts be restricted to local scope (M2)? This is a product-intent question when a user has a global hooks manager.

Status: DONE_WITH_CONCERNS
Summary: No Critical findings. Fix H1 before merge: the public index-lock ownership recorder does not tie the claimed child to the lock's writer, and it cannot work with real git. M1-M4 (dead-end refusal hint, multi-scope hooks facts, mtime-ordered provenance, incomplete last_state migration) should land before phase 07 wires callers.
