# Review: Git phase 06 units 12–13 (diff 5e512a829..3f3abcab3)

Verdict: no Critical or High findings. Two Medium findings, one about test honesty and one a small correctness regression in code that is not yet wired to production. Phase 06 is merge-ready only after three things happen on the host: the full suite passes, the E3 gate passes, and the bwrap-namespace test really runs (a run that prints UNVERIFIED does not count). I recommend fixing M2 before merge. It is a few lines, and it has to be fixed anyway before phase 07 wires the hooks caller.

Method: I read the full diff, the counsel report, both lead reports, the earlier review, Git spec §5 (lock table) and §11, the holder-lock spec and contract, the Process containment drivers, and each call site of the changed functions. Read-only: I ran no cargo or npm tests, because they would write build output into the workspace. One fact was checked directly with git 2.53.0 in a scratch directory outside the workspace: `git config --show-scope --list` reports values from a file included by `.git/config` with scope `local`.

## Critical
None.

## High
None.

## Medium

**M1. The namespace-init test can pass without running (packages/holder-lock/rust/tests/borrow_io.rs, end of file, `real_read_tree_deadline_as_namespace_init_cleans_its_native_lock`).** If the bwrap probe fails, the test prints `UNVERIFIED` and returns, so the harness reports it as passing. The unit 12 lead report says the sandbox rejects bwrap PID namespaces, so this case has never actually run. It is also the only check that Git running as PID 1 of a namespace gets SIGTERM and removes its lock. Fix: mark it `#[ignore = "requires bwrap PID namespace; host gate"]` and run it with `--ignored` as a named host merge gate, or let it fail when the probe fails. Do not add an env switch (L5).

**M2. Local hooks ownership now counts values from included config files (packages/git/rust/src/repository_config.rs:612-625, unit 13 L4).** `config --show-scope --list` gives scope `local` to values from any file pulled in by `include.path` / `includeIf` in `.git/config`. I verified this on git 2.53.0. Spec §11 (line 490) says ownership and exact-old removal checks use only the common local config file. Effects:
- If the value sits only in an included file, equals the owned path, and the WAL shows it as owned, `ensure` treats it as already installed. Enforcement then depends on a file fgOS does not own. This is fail-open on provenance.
- `remove` edits the common config, but the installed check at line 632 still sees the included value, so it reports stale or needs recovery.
- If both the common file and an included file set the value, the result is a spurious `hooks-config-ambiguous`.

Fix: read `git config --file <common>/config --null --get-all core.hookspath`. `--file` does not follow includes unless `--includes` is given. Alternatively, compare `--show-origin` against the common config by file identity (dev/ino) instead of by path spelling. Add a regression test that uses `include.path`.

## Low

**L1. A crash in the exchange step now needs manual repair (native_lock.rs:368-436).** If the process dies after `RENAME_EXCHANGE` but before the final `remove_dir(path)`, an empty guard directory stays at the native path and the destination is not empty. On re-entry the result is "recorded artifact cannot be inspected" or `native-lock-quarantine-destination-preserved`. Before this change, a crash after the rename healed itself because the path was absent. §11 documents "preserve the guard", and today's only production caller is ConfigChange staging, so the impact is small. Fix: on re-entry, if the path is an empty directory and the destination holds the owned (dev, ino), call `remove_dir` on the guard and finish. This removes no bytes.

**L2. GitHub adapter details (src/runner/github-adapter.mjs:48, 199-212).**
- `err.code === 'ETIMEDOUT'` can never be true, because `gh()` passes no `timeout` to `execFileSync`.
- Pre-connect failures such as DNS errors or refused connections, where the request certainly never went out, are also relabelled from `unreachable` to `outcome-unknown`, which loses a precise reason.
- The post-timeout check and the MERGED short-circuit both go through `viewGitHubPRStatus`, which keeps polling while `mergeable === 'UNKNOWN'`. If GitHub reports UNKNOWN for a closed or merged PR, that adds up to `pollTimeoutMs` (10 s) of delay. Stopping the poll once `state !== 'OPEN'` would avoid it.

Caller check: the only production importer is src/verbs/merge/approve.mjs:59, and `approve --github` throws at lines 358-359. No live caller's behaviour changes. Return shapes are only extended (new `observed` field, new reason value `outcome-unknown`). A double merge cannot happen: the pre-merge MERGED check and GitHub's own refusal to merge an already-merged PR both prevent it. The MERGED short-circuit is correct. Fix: either pass a bounded timeout to the merge call or drop the dead branch, and optionally keep `unreachable` when stderr shows a pre-connect failure.

**L3. Restore extraction ignores registrations whose directory is missing (restore.rs:740-745).** Extraction can now target exactly the path of a prunable sibling registration, which leaves user data at a registered worktree path. The risk is low, because Git's prune keys off the gitdir file. Fix: when `canonicalize` returns NotFound, compare against the registered path lexically.

**L4. Test robustness and placement.** The cooperative tests give python3 or the git smudge filter 500 ms / 1 s to reach `ready`. Under load, the "handler was not installed" and "Git never entered its smudge filter" assertions can fail; wider deadlines would fix that. The real `read-tree` test also makes the holder-lock test crate depend on git and on Git's `index.lock` semantics. Holder-lock's production source stays free of Git knowledge, but this test belongs in packages/git tests, which would keep the layering clean at test level as well.

**L5. Every metadata error is reported as an unowned lock (scoped_commit.rs:537, sync.rs:521, 560).** These `_ =>` arms map any non-NotFound `symlink_metadata` error (EACCES, EIO) to `native-index-lock-unowned`. The pattern predates this diff, but the new message makes a stronger claim. Fix: add a separate `Err(e) => failure(e)` arm, as land.rs and restore.rs already do.

## Focus answers

**1. Cooperative termination.**
- **Bounded:** the holder-lock grace loop stops at `terminate_grace_ms` (3000 ms) or on a waitid error, then sends SIGKILL to the root. Containment `kill_all(…, 3000)` uses a bounded `wait_until` in both Linux drivers. The ignored-TERM test asserts the 3.5–8 s envelope.
- **Root and process group:** the root stays unreaped (waitid WNOWAIT) through grace and drain, so its pgid stays pinned. `prepare_borrow` sets `process_group = true` (driver/flock.rs:216), so `killpg(pid)` is valid.
- **Drain, release and lock custody:** the drain/reach rule, `end_leftovers`, the reap order and the precedence of `borrow-leftover-not-killed` are unchanged. The caller's handle is held by reference throughout the grace, so lock custody is unchanged.
- **Deadline accounting:** on failure paths a call can now run up to 3 s plus `kill_wait` past its deadline. This is documented in the contract and holder-lock spec. The E3 happy path is untouched.
- **Parent-death containment:** the mechanism is unchanged; the window during which the parent waits is longer.
- **Layering:** Process `file_users` is generic and read-only, and holder-lock source has no Git knowledge. Only the tests mix layers (L4).
- **bwrap case:** see M1.

**2. `native-index-lock-unowned` and inspection.**
- Unowned bytes are never moved: `owned == None` produces an inspection report only.
- The holder report reads /proc with read-only `read_dir` and `stat`, and re-checks identity before and after.
- The sidecar read reuses the bounded, no-follow, nonblocking `state()` door, so a FIFO or symlink cannot hang it.
- The runbook text says plainly that a holder snapshot is not proof of anything.
- No Node or Rust consumer matched on the old refusal strings.

**3. Unit 13.**
- **M1:** consistent with the §5 table (line 273: "Publication uses only caller event-seal 58"), and safe for Event Store, because event-seal already serializes Publication writers and recoverers.
- **M2:** matches the §5 row "Remote fetch/push of non-event refs: none"; transfer recovery alone takes 40 then 80.
- **M3:** see L2.
- **M4:** see L3.
- **M5:** `release_pin` is idempotent. It returns early on PinReleased and accepts an absent pin, so replaying a terminal ref recovery is safe.
- **L1–L3, L6, L8, L9:** fine.
- **L4:** see M2.
- **Registry reuse:** the one `recovery` entry with `runDir=<common>/fgos/git` agrees with `recovery::leaf`.

## Unresolved questions
- I could not confirm that `index~pid.lock` is the sidecar name current Git uses. It is diagnostic only, so it carries no safety impact.
