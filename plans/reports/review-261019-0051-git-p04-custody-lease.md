# Review: Git phase 04, custody lease and successor admission

I reviewed `476d06d39..ca3cccf09` (branch `git/p04-custody`, 48 files) read-only, against Git spec §6/§17, holder-lock §3/§5/§8/§19, run-supervisor §4, the phase file, the plan's D8, and the two lead reports. I built nothing and ran no tests: the contract is read-only, and a build writes `target/` in the worktree. The verdicts below come from reading the code. I did not write `plans/reports/review-261019-0051-git-p04-custody-lease.md`, because that path is inside the read-only workspace. The coordinator can copy this report there.

**Verdict:** no Critical findings. There are two High findings. One is a bug that changes how a busy worktree is classified. The other is an asymmetry in the custody proof that needs an owner decision. Both should be resolved or explicitly accepted before the stop-everything landing.

## Critical

None found.

## High

**H1. The admission precheck mislabels a live concurrent writer as `custody-predecessor-unknown`, and a test was weakened to accept this.**
`src/runner/dispatch/cwd-lock.mjs:39-42` reads the predecessor record *without the kernel lock*. While another writer legitimately holds the worktree, that writer's own supervisor has just declared `linux-pgroup` or `macos-tree` on the lease. Every macOS host and every unconfined Linux host declares one of those kinds. The second dispatcher is then refused with `custody-predecessor-unknown`, plus recovery advice to preserve the worktree and use a new one, instead of `dispatch-in-flight`.
- Consequences:
  - The recovery action becomes `park` instead of `retry` (`recovery.mjs`).
  - Workflow treats a busy tree as an unprovable predecessor.
  - A `fgos run --worktree` user is told to abandon a worktree that is only busy.
  - On `linux-gate` hosts the same situation still answers `dispatch-in-flight`, so the classification now depends on the platform.
- Test evidence: `test/runner/assignment-cwd-mutex-concurrency.test.mjs:149-151` was changed to expect `custody-predecessor-unknown` on Unix. It also dropped the assertion that the refusal names a holder pid inside the attempt.
- Fix: delete the precheck. `predecessor::disallowed_kind` already runs under the kernel lock and before `admit` (`port.rs:580`, `route.rs:316`). So it neither kills nor erases a best-effort record, and the precheck adds nothing except this misclassification. If the precheck stays, run it only after a free kernel probe. Restore `dispatch-in-flight` and the holder-pid assertion on every platform.

**H2. A recorded handoff over a best-effort domain certifies the same emptiness that admission refuses to trust.**
On success, `runUnit` (`run.mjs:385-392`) and standalone `executeAssignment` (`assignment-runner.mjs:2648-2652`) call `clearDomain()`. That call removes the record once `domain_watch` says Empty (`predecessor.rs:157-174`). For `linux-pgroup` and `macos-tree`, that watch cannot see a `setsid` or double-fork escapee. The record therefore disappears, and the successor's absent-record rule admits it while the escapee may still be writing.
- Admission refuses these exact kinds after a controller death "even when the group appears empty" (holder-lock §19). Spec §6 says best-effort Linux and macOS domains are never assumed empty. §17 prohibits claiming that a process-group kill drains descendants.
- V-CUSTODY tests only the case where the controller dies.
- This needs an owner decision; there are two options:
  - (a) `clear_domain` refuses best-effort kinds. This fails closed, but it strands the worktree after every unconfined or macOS run. Repeated `fgos run --worktree` on macOS would always be refused, and Workflow would always redispatch.
  - (b) Keep the current behavior, but state the limitation in Git §6, holder-lock §8 step 0 and §17. A recorded handoff over a best-effort domain does not cover `setsid` escapees. Add a vector for a live controller with a `setsid` escapee.
- Recommendation: (b) now, because (a) breaks every macOS user. Revisit when containment drivers land.

## Medium

**M1. A `clearDomain` failure in `finally` replaces a committed success with an exception.**
At `run.mjs:385-392`, if `clearDomain` throws (for example `lock-domain-not-empty` after a cancel whose wait expired), the exception replaces the returned result. The commit and the persisted result have already landed. Workflow then records `execution-failure` and does not integrate a committed branch. The same pattern is at `assignment-runner.mjs:2648-2652`.
- Fix: catch the error and keep the record, which stays fail-closed. Attach a warning such as `custody-handoff-not-recorded` to the result instead of throwing.

**M2. On Windows, a controller death now kills an adoptable producer.**
With `cwdLeaseOwner` set, the supervisor no longer takes its own lease (`windows.rs:53-57`). When the controller dies, its lock-hold helper exits and frees the lease while the producer job is still running. Any successor, including a resuming controller, then kills that job as a `windows-job` predecessor.
- Before this change, the Windows supervisor's own copy kept the lease, and on Unix the gate's copy still keeps it. 6.4's adopt-after-controller-death therefore regresses on Windows only.
- This is fail-closed, but it differs by platform and is not stated in run-supervisor §4, which mentions only supervisor death.
- It was not executed on a Windows host.
- Fix: document it as intended, or add a Windows host vector and decide.

**M3. The verification command runs in the worktree without custody.**
`verify` (`run.mjs:1036`) runs `execSync(verifyCmd)` in the worktree while custody is held. That child is neither borrowed nor declared. If the controller dies, the child keeps writing after the lease is released. The record only names the producer domain, which is already empty, so a successor is admitted.
- Spec §6 requires that a dying caller not free the worktree while its children write.
- Fix: run verify through `runBorrowed`, or record it as a separate item.

**M4. Stale records outlive their worktree, and nothing can clear them yet.**
Records are keyed by the cwd's dev:ino (`registry.mjs:36-43`) and are never removed when a worktree is deleted. ext4 reuses inode numbers, so a new, unrelated worktree can inherit an old best-effort record and be refused with a spurious `custody-predecessor-unknown`.
- After any throw on an unconfined or macOS host, the same worktree is refused permanently.
- `git-worktree-recovery` is metadata only until phase 03. There is no documented way for an operator to clear a record.
- Fix: the worktree removal door acquires the lease and admits or clears the record. Document manual recovery until phase 03.

**M5. Git output limits changed under custody.**
Commit git children now go through `runBorrowed`, which caps output at 16 MiB (`index.mjs:58`; hold transport `MAX_LOG_BYTES`). The previous limit was 64 MiB (`GIT_LIST_MAX_BUFFER`).
- On Unix, a large output now throws `borrow-spawn-failed` (ENOBUFS) where it used to succeed.
- On Windows, `readLog` silently truncates. A truncated `-z` path list then feeds the staged-path, scope and committed-set checks with a wrong set.
- Fix: pass a per-call output limit and make truncation an error.

## Low

- **L1.** The holder-lock spec §19 bullet still says Workflow redispatch is "outside phase 04's write scope". Unit 2 implemented it, and the runner spec says so.
- **L2.** The new `--clear-domain` mode in `route.rs:253` hardcodes the name `"dispatch-cwd:3"` inside the generic holder-lock layer. That is a lower layer naming an upper-layer lock (design principle 2). Use a neutral slot name.
- **L3.** Unix `declare_on_lease` (`unix.rs:56-60`) trusts the envelope's `cwdLeaseFile` path without checking that it is the same file as the fd-4 description (dev:ino). A mismatch would declare on the wrong record. The check is cheap.
- **L4.** Admission runs after the Unit run is created and announced (`run.mjs:585` follows `onUnitRunCreated`). A refusal leaves a settled `execution-failure` run, and the Workflow journal records `unit.started` for a run that never started. Move admission before the run is created.
- **L5.** Unborrowed git reads remain: `preflightUnitWorktree` and `commitOnBranch` (`run.mjs:180,830,880`). `status` and `diff` may refresh the index. This is minor.
- **L6.** The unsupervised read-only `executeExecutorCli` lost its stray-write watcher for writes outside the workspace. Supervised read-only Assignments still detect mutation. Confirm this is intended, because a read-only executor that writes is exactly what the watcher caught.
- **L7.** Conflicts with `git/p01-publication-perf` (`cf32dd33b`, same base `476d06d39`):
  - Textual: in `port.rs` `acquire_traced`, p01 adds the `since` field to the `Handle` literal right where p04 inserts `disallowed_kind`. In `route.rs` `lock_fd`, p01 adds `Reach::Everyone` to `--drain-child` right after p04's new `--clear-domain` block. Neither branch adds another `Resource` struct literal.
  - Semantic: p01's per-handle `since` scan floor assumes only this process held the description since acquire. p04 hands the Unix lease description to the supervisor and gate at fd 4, and those processes are created after `since`. Today Node commit borrows drain through the route with `Reach::Everyone`, so nothing breaks. If commit borrows later move to Rust `run_borrowed` with the floor, a still-open supervisor or gate copy would be classified as a leftover.
  - Re-run `cargo test -p fgos-holder-lock` and the custody tests after the merge.

## Focus areas checked with no defect found

- **Lease lifetime.** There is one `finally` (`run.mjs:385-392`), and every throw path releases without clearing. Releases are idempotent. Borrows are synchronous, so release can never run during a borrow. Failover reuses the handle (`direct-launch.mjs:49-67` validates name, path and released state). The Unix gate keeps its own copy, so a lease released on a throw stays held until the gate exits.
- **Clearing.** `clear_domain` is exclusive-only, validates the handle, never kills, and refuses a record that changed. The Windows `declare-domain` acknowledgement means a dead helper cannot authorize GO. A helper that dies after acknowledging leaves a provable `windows-job` record.
- **The allowed-kind check under the kernel lock** closes the gap between observation and acquire, in both the Rust port and the fd route. Not-acquired results close the description.
- **Commit children.** `withPaths` is used only for `add -A` and `reset -q`, so batching on Windows cannot split a commit. Only `withPaths` uses stdin. Hook env, args, messages and error shape (`status`, `stdout`, `stderr`) are preserved, apart from the limits in M5.
- **Workflow redispatch.** It preserves the old checkout and branch and creates the new worktree from the recorded base SHA on a unique recovery branch. The journal `unit.scheduled` resets state to the new branch. Integration (`runner.mjs:497`) and the out-of-scope check use the replacement branch, so the work is not integrated twice. A second refusal settles as `execution-failure` with the recovery run id.
- **Lost-uncommitted-path warning.** Its logic moved into Assignment settlement unchanged. The deleted executor-level tests are covered by the custody tests and by registry-level symlink tests (`dispatch-reconciliation.test.mjs:41`). The weakened assertion is H1.

## Unresolved questions

1. The owner needs to choose between options (a) and (b) for H2.
2. Is the Windows kill-on-controller-death in M2 intended?
3. The Workflow redispatch end-to-end test, the pidns, Windows and macOS vectors, and `npm test` have not passed on a real host (lead reports). V-CUSTODY must not be claimed until they do.

Status: DONE_WITH_CONCERNS
Summary: No Critical findings. Two High findings (the admission precheck misclassifying a busy worktree, which a weakened test hides, and recorded handoff over best-effort domains), five Medium and seven Low; host vectors are still unproven.
