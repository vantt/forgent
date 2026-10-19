# Review: Git phase 06 unit 4, dormant SafeRestore (6f16ca086..0c26f17c9)

**Verdict: not merge-ready.** One confirmed, reproducible loss of user bytes (Critical) and one confirmed silent clobber that breaks the documented reapply-refusal contract (High). Both come from one root cause with a small fix. Everything else is merge-acceptable for a dormant unit, provided the capacity issue (High, functional) is fixed or tracked as a blocker before phase 07 routes production writers through this port.

Method: I read the full diff, the lead report, `restore.rs`, the SavedPath/WAL/durable-file install paths, admission and compaction callers, and the Rust and Node tests. I ran Git experiments, and also ran a probe test against the real driver in a scratch export of the commit (`git archive 0c26f17c9`, separate CARGO_TARGET_DIR under the session scratchpad). I modified nothing in the worktree.

## Critical

**C1. An ignored file at an ancestor of an incoming path is deleted by `reset --hard` and never captured.** File and line: `packages/git/rust/src/restore.rs:146-187` (path set) and `:404` (reset).
The snapshot path set is tracked ∪ target-tree paths ∪ `ls-files --others --exclude-standard`. When the target adds `cfg/x` and the worktree has an *ignored regular file* `cfg`, the code runs `capture("cfg/x")`. That call gets `NotADirectory` and records the path as `Absent`. `cfg` itself is in none of the three lists. With force, `git reset --hard` unlinks a file that stands where a directory is needed (`entry.c create_directories`). The bytes are therefore destroyed with no copy.
Probe result against the real driver, for both `reapplyLocalDelta` values: the outcome is `Restore{state:"restored"}` with `warnings: []`, `cfg` becomes a directory, and the snapshot path keys are `["a","b","cfg/x","dd","dd/y"]`, with no `cfg`. This contradicts the spec text "ignored target collisions are included". Ignored files are exactly where `.env` files, local configs and secrets live.
Fix: in `restore_checks`, for every target path, walk each proper ancestor prefix. If an ancestor exists on disk as anything other than a real directory (regular file, or a symlink, which `safe_path` already refuses), either add it to `paths` so it is captured (and, when `reapply_local_delta` is set, refuse with `restore-untracked-target-collision`), or refuse outright. Apply the same rule to the existing exact-path collision check. Add a test with an ignored file and an untracked file at an ancestor of an incoming path.

## High

**H1. With `reapplyLocalDelta: true`, an untracked file at an ancestor of an incoming path is silently clobbered instead of refused.** File and lines: `restore.rs:166-173`.
The collision check calls `symlink_metadata(target_path)`, which returns `NotADirectory` for `dd/y` when `dd` is a file, so the check passes. The probe confirms this: untracked `dd` is replaced by a directory, and the result is `restored` with no warning. The bytes do sit in the snapshot, because `dd` is listed by `ls-files --others`. But the spec promises "Untracked/ignored incoming collisions refuse reapplication", and the caller is told everything was preserved. The fix is the same ancestor walk as C1.

**H2. The capacity ceiling counts every tracked file, so SafeRestore refuses on ordinary repositories.** File and lines: `restore.rs:174-184` and `:222-234`.
`restore_capture` reads the full bytes of every tracked file, every target file and every untracked file against a 32 MiB budget. This repository has about 155 MiB tracked, so restore can never run here, nor on most real projects. It fails closed, so no bytes are lost, but phase 07 cannot migrate production writers onto this port as built. A JSON byte array takes about four bytes per input byte, so a snapshot of up to 32 MiB of files approaches the 128 MiB serialized cap. The code also captures the whole checkout three times per apply (`:348`, `:384`, `:464`) and stores two snapshots.
Fix: capture bytes only for paths whose content Git does not already hold. That means dirty and staged paths (`local_paths`), untracked paths, collision paths and ignored ancestors. For clean tracked paths, record only the mode (or the full permissions) plus the HEAD blob id, which can be read back from the object store. Then size the budget against what is actually captured.

## Medium

**M1. A corrupt or missing snapshot permanently blocks the checkout.** File and line: `restore.rs:521`.
`restore_observe` reads the snapshot before it closes any chain, including chains still at Intent/Prepared, where no effect happened. If the snapshot file is damaged or deleted, recovery always errors. The chain then stays active, and `admission` (`refs.rs:127-145`) returns `resource-recovery-required` for every ScopedCommit, Sync, Land, Restore and worktree lifecycle operation on that checkout. No supported way out exists, which repeats the earlier lesson against a permanent per-worktree block. The test at `safe_restore.rs:340-352` asserts the error but never shows the checkout can be used again.
Fix: when the snapshot is unreadable, close the chain anyway (`AbandonedBeforeAttempt` before an attempt, `recoveryRequired` after one) with a `restore-snapshot-unreadable` warning, and leave the damaged file untouched as evidence.

**M2. On a locally modified path, the incoming executable-bit change is reverted.** File and line: `restore.rs:433-446`.
The skip covers only `mode_changes ∧ ¬local_paths`. Take a path where the target flips 644→755 and the user has an unstaged content edit (no chmod). After reapply the code restores the saved 644, and `git status` shows a mode change the user never made. A later ScopedCommit would then commit that change. Fix: for local paths that had no local mode change (head mode equals local mode), take the target's executable bit and keep only the bits Git does not track from the saved mode. This finding comes from reading the code; I did not run a probe for it.

**M3. Retention has no bound.** Locations: `wal.rs:1998-2003` (compaction refuses Restore), `wal.rs:1107-1129`, and `restore.rs:352`/`:464`.
Every apply keeps an operation directory plus two snapshots of up to 128 MiB each. A crash during the snapshot write also leaves `.durable-file-*.tmp` orphans of up to 128 MiB, and a crash between store and `begin` leaves an unbound snapshot. Nothing deletes any of these. Every admission scans all retained chains, and `retained(100_000)` turns into RecoveryRequired at the bound. The lead documents this as deliberate. It is acceptable while the port is dormant, but it needs a retention or acknowledgement item before phase 07. No deferred compaction warning tells anyone that the data is piling up.

**M4. The "retained" bytes have no extraction path.** The snapshot is JSON holding byte arrays, and the recovery warning says "inspect before a new restore". No preview, extract or rehydrate verb exists, so in practice an operator must write a script to get the work back. This should be tracked with the Recovery port unit, and it should gate phase 07.

## Low

- **L1.** `restore.rs:169` calls `checkout::root(repo).unwrap()` inside a closure. Use `?`, as the rest of the function does.
- **L2.** `git apply` without `--3way` accepts hunks at offsets inside files the target also changed. This counts as a plausible merge rather than a guess, but stricter "refuse rather than guess" behaviour would refuse reapply when `local_paths ∩ diff(head,target)` is non-empty, or use `--3way` and refuse on conflict. Binary patches already refuse on a preimage mismatch, which is correct.
- **L3.** An intent-to-add entry becomes a plain untracked file after reapply. The bytes are kept; only the flag is lost.
- **L4.** If `restore_checks` fails after reset (`:455`), the result is reported as recoveryRequired even when the restore succeeded. That is conservative and correct, but noisy.

## Checked and found sound

- **Ordering and durability.** The snapshot is written with fsync of both file and directory (`install_ordered`), then read back and its digest verified before Intent. A drift re-capture after Prepared compares the digest before TargetAttempt, and the reset happens only after TargetAttempt. Content-addressed dedup works because an existing file is accepted as `Installed::AlreadyExists` and then digest-verified.
- **Staged and unstaged separation.** The staged patch is `diff --cached HEAD` applied with `--index`, then the worktree patch is applied to the worktree only. Each `git apply` is atomic. A failure returns `restore-reapply-required` and keeps the snapshot.
- **Recovery is observe-only.** It never replays or resets. Intent/Prepared chains close as abandoned. The post-state is accepted only when it matches the recorded post snapshot exactly, so an ABA case cannot slip through. Native residue such as `index.lock` is refused with a named error and left untouched. Same-id retry routes to observe.
- **No ScopedCommit behaviour change from the SavedPath reuse.** Capture now uses an O_NOFOLLOW, nonblocking, fstat-verified bounded read, which is only stricter. `Head` is marked `serde(skip)` and never produced by restore. The restore path never calls `restore()`.
- **Lifecycle exclusion and custody.** Lifecycle versus checkout exclusion uses custody-keyed resource sets. Producer custody is verified, so another lease cannot be acquired.
- **Tests run real Git.** The SIGKILL matrix covers 78 boundaries. Native-state, corrupt-snapshot and collision cases are covered, and the Node test exercises both main 50 and linked custody. None of the tests cover ancestor collisions (C1 and H1) or a dirty path with an incoming mode change (M2).

## Merge decision

Fix C1 and H1 before merge; they share one fix and need one new test. H2, M3 and M4 must be fixed, or filed as blockers on the phase 07 lane, before production writers move. M1 and M2 should be fixed in this unit if cheap. Otherwise file them as items.

## Unresolved questions

- Should a restore without reapply also refuse untracked and ignored collisions? It currently lets them be clobbered, with the bytes kept only in the snapshot. That is an owner decision on what "snapshot-backed replacement" means.
