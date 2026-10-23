# Phase 13 lead report: one repository fact cache with formats and the config stamp

Branch `harden/t2-p13-repo-handle`, cut from `fd734fa2b`. Git-area commits for OPC review:

| SHA | Subject |
|---|---|
| `ec66c5f22` | perf(git): checkout handles reuse the config and formats the stamp still proves |
| (last commit) | chore(git): regenerate the mutation census |

## What was found, what changed

The track tip already held a process-wide map (`REPOSITORY_CONFIG`, keyed by git dir) with records, formats and the `ConfigStamp`, and every non-checkout resolution already reused it. The remaining waste was the checkout handle (`checkout_repository`, used by worktree create, ScopedCommit, Sync, Land, Restore): it called `validated_config(.., None, ..)` (always a `config --null --show-origin --list` child) and never reused formats (always a `rev-parse --show-object-format --show-ref-format` child).

Change, all in `packages/git/rust/src/driver.rs` (`worktree.rs` untouched, so no overlap with the pin-fsync phase):
- `checkout_repository` seeds its operation-local cache from the process entry for the same git dir. `validated_config` already compares the stamp and returns the cached facts (records and formats) only on a match, else re-reads. After the operation's own checks pass, the proven entry is published back, so the next handle starts from it.
- Formats are read and kept through `cached_formats` / `keep_formats`, which hit the local cache for a checkout handle and the process entry otherwise. The `checkout_config.is_some()` special cases are gone. There is one cache structure holding records, formats and stamp; the per-operation cell is only the fence (inner `None` after a refused refresh) and the seed.
- No new mechanism, no state outliving the process, no env switch, no test-only branch.

## Freshness argument

- A cached fact is returned only by `validated_config`, and only when `ConfigStamp::read(paths) == cached.stamp` for the full path list: system and global config (from the cached `git var` answer), `<common>/config`, `<git dir>/config.worktree`, and every origin file the last listing named. The stamp is dev, inode, length, mtime and ctime in nanoseconds, missing files included. Any difference re-lists config, re-checks trust (`check_config`) and drops the cached formats (`formats: None` on a fresh entry), which are then re-read.
- Object format and ref storage are `extensions.*` config facts. Re-initialising in place, or `git refs migrate`, rewrites `config`, so its inode, size and ctime move. I did not add `HEAD` to the stamp: it would invalidate on every checkout or worktree add and widen the stamp's meaning; the phase text mentions it, the brief says freshness rests on the existing stamp, and the config file carries both formats.
- A refusal (untrusted key, change during read) returns an error before anything is published; a refused checkout call keeps the old process entry and the operation-local fence is unchanged (`checkout-facts-invalidated`).
- The post-hook refresh (`refresh_checkout_facts`) still clears the local cell and runs `checkout_repository`; it is answered from the process entry only while the stamp matches, so a hook that edits config is seen (the two Node tests "fences post-hook config changes on rejection/success" stay green).
- Residual: stamp granularity is the filesystem's ctime resolution, the same exposure the long-lived handle and the between-children check always had.
- Not changed, on purpose: a brand-new linked worktree has its own git dir and so its own entry; its first resolution still costs one config and one formats child. Sharing across worktrees needs a proof about `config.worktree` and is a new mechanism.

## Proof

Owning proof extended, no new file: `driver.rs` `checkout_stamp_rechecks_external_config_writes_between_children` now runs the driver on a logging git and asserts (a) first handle: 1 config listing and 1 format read; (b) a checkout handle for the same repository adds none; (c) an external untrusted config write is refused by a new checkout handle (the held stamp no longer matches) as well as by the in-flight one; (d) after the unset the stamp moved, so config and formats are read again; (e) the next handle after that reads nothing. Why no existing test proves it: the old test asserted refusal and recovery but not reads, so it passed whether or not facts were reused. Red/green checked: with the seed forced to `None` the test fails at (b) with `(2, 2) != (1, 1)`; with the change it passes.

Node census retarget (`test/git/scoped-commit.test.mjs`, the wiring proof for typed ScopedCommit probes): the case "probes config and formats once per loan and once after hooks" asserted 1 and 2 probes and 29 execs; it is now "answers config and formats from the stamp-proven facts instead of probing per loan and after hooks" asserting 0 and 0 and 23 execs (config and formats were 6 of the 29). It is the same behaviour (reads per ScopedCommit phase), now stronger. The post-hook config-change behaviour keeps its owners (the two "fences post-hook config changes" cases and the Rust test above). Tests added 0, retired 0, one retargeted, new CLI/host spawns 0 (the Rust test spawns a shell wrapper around git).

## Children and p50 per worktree add (release build, `t2-p13-target`, ext4)

Probe: a scratch integration test (deleted, not committed) doing, per add: `resolve_repo` on the held driver, a fresh driver plus `resolve_repo` (the mutation port opening), `create_worktree`, then `resolve_repo` of the new checkout (worker side); run under `strace -f -e trace=execve`, marginal = (n=3 minus n=1) / 2.

| per add | before (`fd734fa2b`) | after |
|---|---|---|
| contained children (bwrap) | 15 | 13 |
| `config --null --show-origin --list` | 2 | 1 |
| `rev-parse --show-object-format --show-ref-format` | 2 | 1 |
| per inspect call (new driver, same repo, `resolve_repo`) | 0 | 0 |

The phase's "child count drops by at least 3" is not reached: the track tip already answered non-checkout resolutions from the process entry (inspect calls cost 0 children before and after), so only the checkout handle's pair was left, and the new worktree's own first read stays. The speed seat's 2 to 3 reads per add already shrank to 2 each at the tip.

Add p50 (15 adds per round, 4 interleaved rounds, ms, machine load 3.8 to 4.4 from other leads): before 169 / 174 / 198 / 222, after 167 / 165 / 179 / 187. Direction: 2 to 35 ms faster, about 10 ms at the typical round; noisy, consistent with two fewer contained children at about 4 ms each.

## Verification

```
cargo test --no-fail-fast -p fgos-git            lib 72 passed; every integration target ok (land 18, land_crash_matrix 15 (2 ignored), publication 34, recovery_matrix 5x1 + 3, refs_remote 18, repository_config 11, safe_restore 24, scoped_commit_sync 32, sequence 7, ssh_transport 6, worktree 9, inspect 7, head_* 1 each, contracts 4)
cargo test --no-fail-fast -p fgos-event-store -p fgos-identity   all binaries ok
cargo test --no-fail-fast -p fgos-node-addon     ok (0 tests)
cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings   clean
Node one-file command, test/git/*.test.mjs + test/runner/worktree-admin-multiprocess.test.mjs:
  ℹ tests 181  ℹ pass 180  ℹ fail 0  ℹ skipped 1     (no `run-tests: ERROR` lines)
```

The first Node run had the single expected red (the retargeted census case); fixed as above and rerun green.

## Docs

`docs/platform/git/spec.md`: four clauses said a checkout handle "reads every fact afresh" and that facts "never persist beyond the operation"; they now describe the seed-and-publish through the per-process entry (3 lines). No CHANGELOG line: no user-visible behaviour.

## Delta lines (`fd734fa2b..` this branch, before the census commit)

- Rust src: +38 / -13 = +25 (`driver.rs`; the phase estimate was +40).
- Rust tests: +37 / -1 = +36 (the extended case plus two small helpers, `log_git_children` and `fact_reads`; the estimate was +15).
- Node src: 0. Node tests: +4 / -4 = 0. Docs: +3 / -3.
- Census: hashes only (see last commit).

## Notes

- `read_paths_at` (WORK) untouched; `worktree.rs`, `refs.rs`, terminal-control, `git-checks.mjs` untouched.
- Scratch removed: probe test file, `t2-p13-measure`, `t2-p13-probe`. Target dir `t2-p13-target` left for the big lead to remove after merge.

Status: DONE
