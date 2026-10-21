# three_clones flake: not reproduced; diagnosability defect fixed

## Verdict
Root cause NOT proven. The flake did not reproduce in ~390 runs under heavy load. One real product defect was found and fixed: the event store dropped the Git child's exit status and stderr, so every earlier failure arrived as a bare cause code (`git-command-failed`, `path-read-failed`) that cannot be diagnosed.

## Reproduction attempts (plain main code, CARGO_TARGET_DIR on disk under the worktree)
| Shape | Complete runs | Failures |
|---|---|---|
| 4 parallel loops x 15, host load ~35 | 60 | 0 |
| 8 parallel loops x 25 + 24 busy-loop CPU hogs (killed at 285s) | 72 | 0 |
| 24 parallel runs of the test binary at once (killed at 200s) | 120 | 0 |
| 6 parallel loops of `cargo test -p fgos-event-store --test three_clones` x 12 | 72 | 0 |
| Full `cargo test -p fgos-event-store` after the fix | 1 (suite) | 0 |

Incomplete runs killed by the loop timeout were excluded and checked: no `panicked` or `FAILED` in any log.

## Candidates eliminated (with evidence)
- Shared temp dir or fixture name: `World::new` names the root `es-sync-{pid}-{counter}`; one test per binary; no fixed port (local bare remote over file path). No collision possible.
- Git auto-gc/maintenance racing: the driver passes `gc.auto=0` and `maintenance.auto=false` on every invocation (`packages/git/rust/src/driver.rs:985-992`). Only the remote side `receive-pack` lacks it, but the thresholds (6700 loose objects / 50 packs) are far above this test's size. Not proven impossible, not observed.
- bwrap containment flakiness: 2560 concurrent `bwrap --unshare-pid --as-pid-1 ...` runs, 0 failures.
- PID reuse in the process-group scan (`containment/linux.rs`): `pid_max`=4194304, ~3300 pid/s, no wrap within the scan window.
- Timeouts (10/30/120 s) and the 1 s capture handoff: not reached at load 35.
- Product fsync/ordering gap: the test is single-threaded; nothing in `packages/event-store/rust/src` spawns threads; the repository is on tmpfs where fsync is a no-op, so an ordering gap cannot show here either way.

## Leading, unproven hypothesis
Environment: `/tmp` is tmpfs with `usrquota` (`mount`), and other sessions have held it at 81% (13G/16G, `df.txt` in the job dir). The test and every Git child write there (`std::env::temp_dir()`). ENOSPC or quota failure would hit Git children at varying sites and produce exactly the observed spread of panic sites. This fits the variance but is not demonstrated: I could not read the quota limit, and I did not fill /tmp (would harm other sessions).

## Defect found and fixed
`packages/event-store/rust/src/walk.rs` `git_error` kept only `OperationError.cause`, discarding `exit_code`, `signal` and `stderr` (the driver already captures and redacts them, `driver.rs` `Output::error`). Now the detail reads `Git: <cause> (exit N) (signal S): <stderr>`, the `Git: <cause>` prefix unchanged. Owning proof: `walk::tests::a_failed_git_command_keeps_its_exit_status_and_stderr_in_the_store_error`. Census regenerated (`packages/git/contracts/mutation-census.v1.json`).

## Gates
- `cargo test -p fgos-event-store`: all binaries ok.
- `cargo clippy -p fgos-event-store --all-targets -- -D warnings`: clean.
- `fgos-git` untouched, its tests not rerun.

## Next step if it recurs
The failure message now names Git's stderr. If it says "No space left on device" / "Disk quota exceeded", the cause is the /tmp quota: point the harness `World::new` at a repo-local scratch dir (`.fgos/runtime/tmp/`) per AGENTS.md scratch rules. Do not add retries.

## Unresolved
- Real cause of the observed 2/12 failures: unknown.
- Whether the other session ran at high /tmp occupancy at that time.

## Update: `with_port` Held under load (sync_review)
Failure: `Held { reason: KernelLockHeld, domain: None }` at `tests/sync_support/mod.rs` `with_port`, `acquire(.., Ex, Wait::Try, 2000)`.

Cause (proven, deterministic): the seal lock is a `flock` on an open file description (`packages/holder-lock/rust/src/driver/flock.rs`, never `LOCK_UN`), so it lasts until every copy of the description closes. Test threads in one binary share one process; any sibling thread that forks (a Git child, `pre_exec` setsid) gives the child a copy of every descriptor, CLOEXEC only closing it at exec. Handle drop deliberately spares such a direct child (parent == self) and waits `kill_wait_ms` (2000) for it, then returns `Release::Stuck` which `Drop` discards. The next `Wait::Try` sees the lock held.
Repro (scratch test, since removed): hold the lock, fork a child blocked in `pre_exec` from another thread, drop the handle. Drop took 2.03 s, then `acquire(Try)` = not acquired; after the child exec'd, acquire succeeded. Under load the fork-to-exec window exceeds 2 s, hence the flake. The lock's answer is truthful, so the product is innocent; the existing sparing logic in `flock.rs` owns the product behaviour.

Fix (harness only): `with_port` waits `Wait::Ms(30_000)` instead of `Try`, with a comment. Not a retry or sleep: it waits on the lock itself. `Wait::Try` remains in the product only for opportunistic seals (`acquire_seal`), where "held" is a valid answer.

Evidence after: sync_review x 48 runs (8 parallel x 6, no hogs) 0 failures; sync_review, v_event, three_clones pass; clippy clean. Before: failure seen once by HARDEN, not reproduced by me in 140 loaded runs of sync_review (killed by the stop request), so the after-count is weaker than the deterministic repro above.

Does it explain three_clones? No. three_clones is one thread and never calls `with_port`, so no sibling fork exists; its panic sites (`sync`, `hashes`, `git-command-failed`, `path-read-failed`) stay OPEN. The earlier stderr fix will name their cause when they recur; /tmp quota remains the unproven lead.

Product note (not changed): `Handle::drop` discards `Release::Stuck`; a caller needing proof of release cannot see it. Candidate follow-up, owner's call.
