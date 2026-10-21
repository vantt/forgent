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
