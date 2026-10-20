# Risk review: Git phases 07 and 08, branch `git/p07-switch` at 876ea737f

Reviewed 2026-10-20 (Asia/Saigon), read-only. Merge base with main: `ec9cb0d94`. The branch has 40 commits and about 380 changed files.

I read the Land cutover, the Work settlement path, SafeRestore, the worktree cluster, the lock-route protocol bump, the linux-pgroup watch and the one-door scan and spy. I also ran the scan against throwaway trees built in the session scratchpad. I did not run the product test suites. The Rust native addon reports `git-addon-unavailable` outside the repo's test harness, so every claim about native behaviour comes from reading the Rust source.

## Verdict: merge after fixes

I found no demonstrated data loss. The risky Rust paths (SafeRestore, the worktree remove guards, Land recovery) fail toward keeping bytes. Two issues break user-visible behaviour (H1 and H3), and one makes the census gate unsound (H2). I would fix those three before main. The Mediums can be tracked as follow-up items.

## Critical

None.

## High

### H1. A retried `approve` can be refused for good: `landOperationFor` trusts a journal that may not exist
`src/verbs/merge/approve.mjs:152-169`, together with `src/runner/merge.mjs:1126-1165`.

`landOperationFor` records an engine decision carrying a fresh `landOperation` before Land starts. On the next approve of the same source and destination it finds that decision and calls `inspectOperation` on the recorded id, with no try/catch.

The Rust side fails on an id that was never journalled. `inspect_operation` (`packages/git/rust/src/recovery.rs:49`) calls `wal.inspect`, which opens the operation directory with `create=false` (`wal.rs:1320-1326`, `wal.rs:1439`), and that open fails when the directory is missing.

The following exits all leave a decision but no journal:
- The no-wait probe in `landRunnerItem` throws `lock-held` before Land starts (`merge.mjs:1137`).
- Land's own `lock-acquire-unavailable` at prepare.
- The early `merge-blocked-other-item` return when main has a `MERGE_HEAD`.
- `declareLandFiles` returning `conflict` or `fgos-write-rejected` before `port.prepare`.

Failure scenario: `fgos approve X --no-wait` is refused because the merge slot is held. The user retries once the slot is free. The source branch is unchanged, so the prior decision matches. `inspectOperation` throws, and approve fails with a raw native error. It fails the same way on every later retry, because the matching decision is never removed.

I read this from the source and did not execute it. The existing no-wait test (`test/direct/merge-gate.test.mjs:348`) uses a fresh item and never retries.

There is a second variant. If the process dies after the target attempt starts, the op is non-terminal in `target-attempt` or `land-verified`. `landOperationFor` then throws "requires recovery before another publication". I found no verb in `src/` or `bin/` that runs Land recovery for it. `listPending` and `reconcile` are never called outside `src/git/recovery.mjs`, and `acknowledgeLand` only works from the writer that ran Land (`land.rs:1608`). A different session cannot clear it.

Suggested fix:
- Treat an unknown operation as "no prior": catch the not-found error and mint a fresh id (or reuse the recorded id, since Land has no journal under it). Match on the error code, not any error.
- Add a regression test: approve with the slot held and `--no-wait`, release the slot, approve again, and expect delivery.
- Give the interrupted-attempt case an operator route, such as an `fgos` verb or a `doctor --fix` that calls `reconcile`. Otherwise name the manual step in the refusal message.
- With the first fix, decision growth stays bounded, because a retry no longer writes a new decision for every refused attempt.

### H2. The one-door scan can class a real raw git write as `production-sandbox-probe`
`scripts/git-one-door-scan.mjs:2218`. The class is decided by text co-occurrence, not by data flow.

The line is `cls === 'git' && repo && fn && (rustTempRepo(...) || (/temp_dir\(\)/.test(fnBody) && /\binit\b/.test(fnBody)))`. The second branch only asks whether the function body contains `temp_dir()` and the word `init` anywhere.

I verified this on a synthetic crate. `wipe(real_repo)` writes a scratch file under `std::env::temp_dir()` and then runs `Command::new("git").arg("-C").arg(real_repo).args(["reset","--hard","HEAD~5"])`. The scan produced no site. It reported `class: production-sandbox-probe, repository: real_repo`.

So a raw write against a caller-supplied repository passes `git-mutation-one-door`. The branch contradicts the scan's own header ("a Rust Git spawn whose repository the same function creates under `temp_dir()`").

Suggested fix: delete the fallback. Keep only the `rustTempRepo` data-flow proof, which already follows params, `self.field` and local lets. Add this case as a seeded negative probe in the scan tests.

### H3. Forced and verify checkout removal now refuses ignored bytes, so dispatch and verify checkouts leak
`src/runner/worktree.mjs:1278-1307` (`removeWorktree`) and `:1261` (`removeDispatchWorktree`). Callers are `src/runner/merge.mjs:1332`, `src/runner/loop.mjs:393-1489` and `src/runner/session.mjs:396`.

The old `removeWorktree` ran `git worktree remove --force`. The new one goes through the Worktree port, which refuses `worktree-ignored-bytes-preserved` (`packages/git/rust/src/worktree.rs:309-331`). The `force` option is no longer read, because the options object only feeds `withCheckoutCustody`.

`createWorktree` (via `finishWorktreeSetup`) runs `provisionDependencies`. For any project with npm dependencies that leaves an ignored `node_modules`. `withTargetCheckout` provisions the same way. The set-aside logic (`setProvisionedAside`) is only used by `fgos worktree remove`, not by these callers.

Failure scenario: every dispatch worktree of a dependency-bearing project is "cleaned up" after its attempt, but the port refuses. `removeDispatchWorktree` only logs. Each attempt leaves a full checkout with `node_modules` on disk, and the `fgw/*` branch stays checked out there. Re-approving an already-merged branch leaves an `os.tmpdir()/fgos-worktrees/verify-*` directory the same way, with one stderr line.

This is not data loss. The CHANGELOG documents the new behaviour for `fgos return`'s verify checkout only, not for dispatch teardown. For dispatch worktrees it is a regression in resource use.

Suggested fix: have `removeWorktree` set aside what provisioning placed, the way the `fgos worktree remove` verb does. Record it in `createWorktree` and `createVerifyCheckout`. Alternatively give the runner's own temporary checkouts an explicit "regenerable bytes" declaration to the port. Add a loop test that provisions dependencies, tears down, and expects no leftover directory.

## Medium

### M1. A failure in post-publication drift detection is reported as a failed merge
`src/runner/merge.mjs:1172` and `:1237`. `withPostLand` runs inside the `try` that wraps publish, although the comment says the detection is "never inside it".

If `detectPostLandDrift`, `listWork` or `listSessions` throws after a real publish, the catch falls through to `merge-failed-unclassified` with an `abandoned` settlement. `approve` then parks the item at `blocked`, records friction, and acknowledges Land with `work-blocked`. The ref has already moved.

A retry heals it through the `land-already-merged` path, with a second goal-check run, but the first report is false. Compute `postLand` after the `try` or guard it separately.

The same catch-all also returns `merge-failed-unclassified` with an `abandoned` settlement for any unclassified error in the `publish` phase, where the effect may be unknown. The Rust `recover_land` is the real arbiter and should refuse a publication it cannot prove abandoned, but the Node code should not claim "abandoned" for the publish phase.

### M2. The "operator-confirmed" discard is a flag the CLI fills in
`bin/fgos.mjs:4481-4486`, `packages/git/rust/src/restore.rs` (`confirmed_main_discard`).

`confirmedBy` is `fgos main-checkout-reset --confirm (writer <id>)`, written by the same verb that read `--confirm`. The Rust port checks only that the string is non-empty and that the checkout is main. The real protection is the Node guard `assertSafeMainCheckoutReset` plus the snapshot and the pin. Those are good: the old HEAD stays pinned and the discarded delta is snapshotted.

Note two behaviours:
- A confirmed reset bypasses the ancestry rules entirely (`restore_checks`), so it can move to any commit.
- The pin is never released, because no verb acknowledges it. That is safe but leaks refs under `refs/fgos/git-operations/`.

The CHANGELOG should say that `--confirm` does not require a human, in case an agent can pass it.

### M3. Land candidates are retained whenever cleanup cannot get the main-checkout lock
`src/runner/merge.mjs:1300-1311` (`acknowledgeLand`) and `packages/git/rust/src/land.rs:1223-1330` (`recover_land`).

`Land.recover` takes the merge slot with no wait, then `main-checkout` for up to 5 s, then calls `validate_quiescent`. Under the shared main checkout other sessions are often active. A deferral is returned as a warning and nothing sweeps it later. Each candidate is a full worktree, possibly with the installed `node_modules`. The CHANGELOG states that "Land's published candidate is removed", which is only true when the lock is free.

Consider a later sweep, for example in doctor with `--fix`, or a retry inside `acknowledgeLand`.

### M4. New refusal `restore-orphaned-patch` on every restore, without a CHANGELOG line
`packages/git/rust/src/restore.rs:222`, called at `:709` and `:752`.

Any SafeRestore (including `resync-worktree` and `main-checkout-reset`) now refuses while `fgos-resync-patches/<branch>-*.patch` exists. I found no verb that lists or clears those patches. The refusal text says "inspect preserved patches before resync". Add a CHANGELOG line and name the clearing step.

### M5. The scan skips directories by name, and the scan roots are an allowlist
`scripts/git-one-door-scan.mjs:35-36`.

`SKIP_DIRS` includes `dist` and `fixtures` at any depth. A raw git write in `src/**/fixtures/x.mjs` produced no site and no class. I confirmed this on a synthetic tree. Today only Rust test fixtures and a contracts data directory match, so nothing is hidden now.

`SCAN_ROOTS` leaves out `tools/`, `domains/`, `plugins/`, `herdr-dashboard/`, `components/` and the root `install.sh`. I found raw `Command::new("git")` in `tools/platform-probe/src/git.rs`. It runs in its own temporary repo, so it is probably acceptable, but the gate never sees it. A name or root decided by path conflicts with the "never by path" rule the spec sets for classes.

### M6. JS data flow gaps in the scan
I tested these on synthetic trees:
- `const run = promisify(execFile); run('git', [...])`: missed, also across modules.
- `spawnSync('ls && git add -A', opts)` with `opts = { shell: true }` held in a variable: missed. The same call with `{ shell: true }` inline was not tested.
- `cp['exec' + 'FileSync'](...)` and escape-coded template strings: missed.

Direct, aliased, namespace-imported, wrapper, env-fallback and consumer-marker cases were all resolved correctly. The consumer marker on a wrapper is not laundered. The current tree uses none of the missed idioms, so the census is not wrong today, but a new `promisify(execFile)` writer would pass the gate.

## Low

- **L1. `READ_VERBS` includes write forms.** `scripts/git-one-door-scan.mjs:43` lists `reflog` and `symbolic-ref`. `git reflog expire`/`delete` and `git symbolic-ref HEAD <ref>` write. A `.githooks/` file doing either would be classed `hook-read-context`, which is decided by the `.githooks/` path prefix (`:2338`) plus the verb list. Also note other classes decided by path: `git-driver` (`packages/git/rust/src/`) and `rust-test` (`tests/`).
- **L2. The test spy covers only JS `child_process`.** Rust host and addon spawns are covered statically only. The sandbox check does not read `GIT_WORK_TREE`, `GIT_DIR` env or `--work-tree=<p>` in the `=` form. It also accepts `opts[CONSUMER_COMMAND]` with no check of the binary. All of this is test infrastructure and accidental use only.
- **L3. `quiesce-scan` no longer lists linked worktrees itself.** `route.rs` now takes `--dir` from the caller. The in-repo callers I found all pass it: `src/holder-lock/fences.mjs:442`, and `git_gate.rs:96` for the activation gate. An old Node payload on a new host omits `--dir` and silently scans only the root. A one-line host note would help.
- **L4. `removeWorktree` evidence.** `deliveredTo` defaults to `expectedTip` (`worktree.mjs:1295`), so the port's "tip is contained in delivered ref" check is trivially true for runner-internal removals. The dirty, process and preserved-state refusals still hold.
- **L5. The already-merged verification runs the goal check on the main checkout with no lock.** `withTargetCheckout(..., onMain)` at `merge.mjs:1248`. I did not check whether the old code did the same.
- **L6. `sync-root` records an engine decision for every blocked result.** This is event growth, but bounded per call.

## Checked and fine

- **Protocol bump (item 4).** `PROTOCOL = 2` is the only source for every Node lock-route caller (`src/holder-lock/protocol.mjs`, `driver.mjs`, `hold-transport.mjs`, `holder-lock-checks.mjs`). No in-repo caller sends 1 to a lock route. `quiesce-scan` stays on 1 by design, and `git_gate.rs`, `fences.mjs` and `fgctl` all agree on that. `src/util/session-identity.mjs:224` sends 1 to a different route (`identity`), which is unaffected. An old facade is refused with `host-version-mismatch` before any lock is taken.
- **E4 watch.** The watched path is used only on `linux-pgroup` and only when user code may run. Git children already get `gc.auto=0`, `maintenance.auto=false` and `core.fsmonitor=false`, so git's own daemons will not trigger a false `containment-unproven`. The marker is unique per run. Residual risk: a project hook that legitimately starts a daemon (an eslint, prettier or build-tool daemon) will now return `recovery-required` after a successful commit on such hosts. The CHANGELOG documents the behaviour, but not that effect.
- **Work settlement.** Delivery is idempotent on `(repoIdentity, operationId, settlementKind)` under the state transaction (`store.mjs:742-754`), a conflicting binding is refused, and `replay.mjs:249` folds it. `abandoned` settlements are only an acknowledgement string, which is fine for cleanup. Open question: does event compaction keep `landSettlement` on old `work.move` events? If it drops them, the lost-acknowledgement lookup could append a second delivery.
- **SafeRestore.** A snapshot and an operation pin come before `reset --hard`. Untracked files stay in place. The unconfirmed `.fgos` rule refuses while a tracked `.fgos` path differs from HEAD (index or work tree). Remaining race: tracked event shards can be appended by a process that does not hold the main-checkout lock between the last check and the reset. `restore-snapshot-drift` narrows this to a very small window; I cannot confirm `validate_quiescent` closes it.
- **Worktree.** Forced session removal keeps the old HEAD on a named ref plus a snapshot. The provisioning set-aside restores on refusal and deletes only after success.

## CHANGELOG gaps (item 6)

1. `restore-orphaned-patch` refusal (M4).
2. Dispatch and forced teardown now refuse ignored bytes (H3); the existing line covers only `fgos return`.
3. Approve now writes an engine decision per attempt and each blocked `sync-root` result writes one, both visible in the decision log.
4. Candidate retention when the cleanup lock is busy (M3).

Everything else I traced has a matching line.

## Unresolved questions

- Does the Rust `recover_land` refuse an `abandoned` acknowledgement for an operation whose publication is unknown? This decides whether M1 can leave a published merge parked as blocked with its candidate removed.
- Is `fgos worktree` dispatch teardown meant to keep checkouts that hold `node_modules`, or did that fall out of the Worktree port's guards?
- Is `--confirm` on `main-checkout-reset` meant for agents, or for humans only?

## Notes on this run

The brief asks for the report at `plans/reports/review-261020-2329-git-p07-p08-risk-review.md`, but this operation is read-only with an enforced write scope of the outbox. I wrote the report here and listed the plans path under `needsWrites`. Scratch scripts live in the session scratchpad, outside the workspace.
