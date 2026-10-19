# Git phase 05, unit 2

Fixed both unit-1 scope blockers. The existing Rust guarantee call now supplies an actual boot-tick observation before Node opens the acquired description; the private handle retains that conservative floor and passes it through the opaque loan. Rust uses start-time filtering for the cross-process floor and its existing lagged proofs within each loan. Missing/future facts refuse; no handover-time floor or per-spawn Everyone scan is substituted. A pre-loan copy regression proves older borrowers remain visible. The lock-table parser and Process sources are untouched.

`nativeAddonComponent` now emits the platform capability list, including `git-wal-v1` on linux-x64. Release, dev-host and test descriptors already share this producer; all three have capability assertions. No Cargo target override was introduced.

The recovery review also fixed actual-file-set receipt replay, Sync ref durability, and a missing durable barrier immediately before Sync's commit. Interrupted commit attempts refuse replay; a rejecting Sync hook retains its cause, attempted chain, open merge and target pin rather than reporting not-started. WAL transition checks/schema cover ScopedCommit, Sync, their outcomes and the commit barrier. Existing WAL resource-schema drift was corrected to admit the actual `worktree:` resources. Sixteen real records validate against the schema. Reused the existing WAL, hardened driver, LockScope, process creation facts and opaque handover; no new execution mechanism.

Validation (logs `/tmp/fgos-p05-u2-*.log`; commands from this worktree):

```sh
cargo build -p fgos -p fgos-node-addon
cargo test -p fgos-write-scope -p fgos-git -p fgos-node-addon -p fgos-holder-lock
cargo test -p fgos-distribution -p fgctl
cargo test -p fgos-git --test scoped_commit_sync
cargo clippy -p fgos-write-scope -p fgos-git -p fgos-node-addon -p fgos-holder-lock --all-targets -- -D warnings
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/*.test.mjs test/runner/write-scope.test.mjs test/runner/execution/commit-unit-work.test.mjs test/distribution/native-addon.test.mjs test/architecture.test.mjs test/e2e/main-checkout-borrow-hook.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/sync.test.mjs test/git/commit-parent-death.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node /tmp/fgos-work/p05-u2-review.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node /tmp/fgos-work/p05-u2-review.mjs --setsid
node scripts/git/e3-bench.mjs run --samples 20 --out /tmp/fgos-p05-u2-e3.json
mkdir -p /tmp/fgos-work/p05-u2-suite/fgos
chmod 700 /tmp/fgos-work/p05-u2-suite/fgos
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_STATE_ROOT=/tmp/fgos-work/p05-u2-suite/fgos FGOS_HOST_BIN="$PWD/target/debug/fgos" npm test
```

Split Rust runs: 165 foundation passes/one ignored, 100 distribution/fgctl passes; targeted Rust commit tests 5/5; clippy clean. The initial combined phase command reproduced the existing distribution `test_lock_exclusive_and_release` immediate-reacquire failure; its separate run passed. Focused Node run: 170 pass, one skip, zero failures. After the final rejected-hook pin-preservation adjustment, Sync/parent-death rerun passed 7/7 and clippy passed. Real SIGKILL barriers prove custody remains held by Git/the hook after controller death and uncertain attempts never repeat. Genuine temporary hook indexes pass; external/symlink indexes refuse. Foreign staged entries, stale baselines, foreign merge state, hook-expanded receipt replay and background-hook cleanup under custody 30/main 50 have coverage. Executable repository filters are refused by the existing driver policy, not executed through this route.

Full suite: 8,348 tests, 7,293 pass, 857 fail, 133 skipped, 65 todo; not all failures triaged. The wider holder-lock Node run also encountered missing release fixture binaries, a copied fixture unable to resolve `yaml`, and host-process scans correctly refusing this PID namespace. E3 stopped at `bwrap --unshare-pid` with permission denied, before completion; concurrent suite load also prevents treating its partial timings as budget acceptance. No installed-release main cutover, unrestricted host-process proof, macOS or Windows proof is claimed. MDView refused its read-only database.

Remaining blockers:

- **File-move rollback:** the review script exits 1 and reports `fileMoveRollback:false, oldExists:false, newExists:true, staged:""` after a rejecting hook. Both paths are unstaged, but the move is not undone. The existing generic commit request does not distinguish a move from independent deletion/addition; §3's restore-both-paths requirement and §8's preserve-producer-bytes requirement need an explicit, durable rollback interpretation before restoring or deleting produced bytes.
- **Full new-route V-BORROW:** the `--setsid` reproduction exits 1 with `lock-description-foreign-holder`. A hook's reparented/adopted holder is not cleared through this operation path; the test script kills its fixture process afterward. Raw holder-lock borrow vectors pass, and ordinary hook background children pass under both ranks, but that is not full route acceptance. Filter/alias coverage through this route and release-time behavior need reconciliation with the existing config refusal/subreaper rules. No Process change was made because the integration lane owns it.
- **Missing-history compatibility:** the updated acquisition path always records its real floor; an older host that omits it refuses handover. An already-existing handle with unknown provenance is not upgraded using a guessed mark or an unproven handover-alone claim.
- **Write-scope follow-up:** `packages/holder-lock/contracts/internal-route.lock-fd.v1.json` needs the additive `reachFloorTicks` stdout declaration. It is outside this assignment's write scope and was not changed. No other out-of-scope edits; program-board/landing/review remain with the coordinator.

The Event Store handoff from unit 1 is unchanged: activate the reviewed release first, capture main preflight before deleting files, then submit exact deletion paths/current legacy ref/seal digest with the non-store declared writes. Do not perform the real cutover from this worktree.

Status: BLOCKED
Summary: Both original scope blockers and additional recovery defects are fixed with targeted Linux evidence. Phase acceptance remains incomplete.
Concerns/Blockers: File-move rollback, full new-route V-BORROW, the scoped contract declaration and unrestricted release proofs remain open.
Context refs:
- (none)
