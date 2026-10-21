# ScopedCommit speedups that need no spec change

Host fg-server2 (ext4, Samsung 980 PRO), git 2.53.0, worktree `git-fu` (branch `git/followups`), 2026-10-21 16:00-17:00 Asia/Saigon. Fixture, method and probe copy are those of `debug-261021-1329-scoped-commit-e3-breakdown.md` (warm = a prior operation in the repository already created the WAL directories; preflight + commit timed together; constructor excluded).

## Outcome

| Candidate | Result |
|---|---|
| (1) contained-spawn polling fix | **Dropped.** Implemented (pidfd wake instead of the 2 ms sleep), measured, did not deliver. |
| (2) ref-directory fsync overlapped with the Outcome record install | **Shipped.** Order proven. |
| (3) post-commit `show` + `diff` fused into one child | **Shipped.** One Git child fewer per commit. |

Warm port row (preflight + commit), n = 40 per sample, only while 1-min load at start was below 3 (max seen inside a run 3.5), interleaved before/after, scratch scripts under `/home/vantt/.claude/jobs/e1505f04/tmp/sc-speed/`:

| | p50 (ms), per round | median p50 | median p95 |
|---|---|---|---|
| before (baseline binaries of the breakdown) | 155.6, 158.8, 156.7 | 156.7 | 164.9 |
| after (shipped: C2 + C4) | 147.6, 147.0, 147.9, 150.8 | **147.7** | **154.7** |

Saving about 9 ms p50 (about 6 percent). Legacy is 74 ms, so the p50 ratio is about 2.0 (was 2.1). Absolute budget (owner, `e3-budgets.md`: ScopedCommit p95 <= 250 ms): warm p95 154.7 ms; a cold first operation adds about 22 ms (breakdown, section 2), so it stays below 250 ms with margin. I did not re-measure cold.

## (1) Contained-spawn polling: dropped, why

Change tried: after the contained spawn, open a pidfd (`fgos_holder_lock::port::exit_descriptor`, made `pub`) and `poll` it for the 2 ms step instead of `sleep`, so an exit wakes the waiter at once while output-limit and deadline checks keep their 2 ms cadence. Unit tests for both behaviours passed.

Evidence it does not deliver: with a build identical except for the wait (`sleep` vs pidfd poll), interleaved 4 rounds, warm port p50 was 147.6, 147.0, 147.9, 150.8 (sleep) against 148.4, 145.7, 146.6, 147.4 (pidfd): about 0.7 ms on 8+ contained spawns, and the preflight (2 contained spawns) is unchanged (20.1 vs 20.2 ms); the only visible effect is about 0.9 ms on the constructor. The breakdown's 8-10 ms estimate (1.3 ms per spawn) was wrong: its own shim log shows the parent reaping bwrap 0.3 ms after the inner Git, so the loop was losing about 0.1 ms per spawn, not 1.3. The remaining contained-spawn cost is bwrap itself (2.1 ms standalone vs 0.65 ms plain Git). About 1 ms does not justify new `unsafe` poll code plus a visibility change in holder-lock (RUL104: better, not bigger), so the change was reverted entirely (`driver.rs`, `holder-lock/port.rs` untouched in the final tree).

## (2) Ref directory fsync overlapped with the Outcome record

`scoped_commit.rs`: the Outcome install went from `sync_refs(...)` then `wal.append(...)` to one `wal.append_ordered(..., Some(&ref_durable), ...)` (the same mechanism Publication uses, `append_after_ref_durable`). `ref_durable` runs `refs::sync_refs` on another thread while the record's bytes are synced; the record's name is installed only after both returned `Ok` (`durable-file::install_ordered`, `before_install` after the join). An error in either leaves only the temporary, so the Outcome still never exists before the ref directories are durable (§10). The recovery path (`scoped_commit.rs` observe + `sync_refs`) is unchanged. No fsync was dropped: same count, one less serial flush (the 5.1 ms step of the breakdown).

Order proof (existing syscall-order check, `scripts/git/e1-power-cut.mjs`):
- `trace --ops 12` (Publication workload, built from this worktree): 48 records, 386 fsyncs, 28 ref renames, **0 violations**.
- `order` over an strace of 3 warm ScopedCommit operations (3 x preflight+commit in a warm repository, plus 3 warmup commits; strace -f with the harness's syscall set, `sc-speed/order.sh`): records 24, 18 ref renames, **0 R1, R3 or R4 violations**: every Outcome is preceded by a directory fsync of `refs/heads` after Git's ref rename and by its temp file fsync. The only reports are R2 ("fan-out of `next` fsynced before prepared"), which is a Publication rule that reads `next` and ScopedCommit has `next == baseline` (an old object): R2 is reported identically (same 6 lines) by the baseline binaries, so it is not applicable and not caused by this change. So the "0 violations" requirement holds for the trace the check was written for and for R1/R3/R4 on ScopedCommit; ScopedCommit has no R2 meaning. This is a judgement call worth a second look by the owner.
- There is no in-suite test of the order for ScopedCommit (the E1 check is a manual strace script and `strace` is not guaranteed in CI); I did not add a new suite-level strace test. Existing behaviour tests (`scoped-commit.test.mjs`, `scoped_commit_sync.rs`, `recovery_matrix.rs`) pass.

## (3) Fused post-commit `show` + `diff`

`scoped_commit.rs`: one `show --name-only --no-renames --no-relative -z --format=%H%x00%T%x00%P%x00 HEAD` child replaces `show -s` plus `diff --name-only -z <baseline> <observed>`. `split_observation` parses it strictly: three NUL-ended header fields, the format's terminator, then (only if paths changed) Git's single `\n` separator and NUL-ended paths; any other shape refuses with `commit-header-invalid`, as the old header parser did. The fused path list is used only when the commit's single parent equals the baseline head, where `show` (diff against the parent) equals the old `diff baseline observed`; otherwise (a foreign parent, which is already a contract violation) the old `diff` child still runs, so the reported file set is unchanged in every case. One child fewer per commit (census 30 -> 29).

Tests (principle 8): parser unit tests in `scoped_commit.rs` (`observation_tests`: header + paths with a leading-newline path, no-path commit, five malformed shapes); `test/git/scoped-commit.test.mjs` first test now also commits a path with a space and a non-ASCII nested path and checks the sorted receipt files; the census proof (`scoped-census`, owner of the Git child count) updated 30 -> 29.

## Verification

- `cargo test -p fgos-git -p fgos-holder-lock -p fgos-durable-file` (`--test-threads=1`): all green, 0 failed. `cargo clippy -p fgos-git -p fgos-holder-lock --all-targets -- -D warnings`: clean.
- Focused node via the npm environment (`one.mjs`): `scoped-commit`, `e3-census`, `one-door`, `sync` tests 42/42.
- Census regenerated with `node scripts/git-one-door-scan.mjs --write-census` (0 undeclared sites); only `packages/git/contracts/mutation-census.v1.json` shifted (line/hash facts of the changed file).
- Full `npm test` (581 files, 8092 tests): 78 failures, all in `test/runner/*` (dispatch policy snapshot 50, bind-committed-config 7, provider-adapter 6, herdr-provider/claude invocations 11, tier-fallback, dispatch, executor-profile, terminal-skill-attach 1 each) and none under `test/git/`. The three largest files fail identically (37 of 40) with my changes stashed, so they are pre-existing host/config failures unrelated to Git; the known flakes did not occur. I did not triage them further.

## Files

- `packages/git/rust/src/scoped_commit.rs` (C2, C4, `split_observation` + tests)
- `test/git/scoped-commit.test.mjs`
- `packages/git/contracts/mutation-census.v1.json` (regenerated)
- Not touched: `src/git/native.mjs`, addon loader, `src/state/hot-lock.mjs`, driver, holder-lock.

## Not done, by instruction

Status-read fusion, config/format fusion, skipping the pin read in compaction (spec-text options, deferred by the owner); nothing that drops an fsync.
