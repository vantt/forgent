# Git phase 05, unit 3

ScopedCommit now snapshots declared producer files immediately before staging, retaining absence, binary bytes, permissions and symlink targets, including clean declared files, baseline dirt and ignored files. An observed rejection with unchanged HEAD restores that snapshot and the initially empty index, including hook-added entries. The move regression deliberately expects **old absent / new present**: those are the producer's pre-commit bytes. The previous review's `oldExists:true` expectation would undo producer work and contradict §8; §3's restore-both-paths means restoring both pre-commit states, not reversing the producer's move. The old scratch review script was unavailable; the persisted Node regression replaces its expectation. Uncertain/crashed attempts retain WAL evidence and refuse replay; no automatic crash rollback is claimed.

The adopted-holder failure came from treating every direct child as an unrelated pre-exec child. A setsid escapee adopted by the controller is also a direct child. The existing narrowed borrow drain and release settle now distinguish a tagged non-CLOEXEC borrowed copy from protected CLOEXEC pre-exec copies. Both reuse one descriptor predicate; unreadable facts do not authorize killing. Release retains its table-positive/full-tagged-scan, inode-checked noncreating probe and uncertainty behavior. No per-spawn Everyone scan, Process change or lock-table-parser change. The isolated subreaper regression exercises both borrow return and release; ordinary pre-exec, recipient, replacement and legitimate-contender regressions remain green.

Added `reachFloorTicks` to lock-fd's guarantee stdout contract with its actual decimal-string-or-null representation. Missing/future handover history remains a named refusal, as covered by the existing Rust FFI tests; an old host is not silently upgraded with a guessed floor. Reused ScopedCommit, its request/WAL, filesystem capture, holder-lock's scans and identity-pinned cleanup. Prior art: `0074f94ae`, `4a7f429a5`, `c9c378839`, and the earlier `54cc2f788` reach optimization. **impact-analysis: inactive** (zero registered providers).

Focused reproduction commands, from this worktree (no Cargo target override):

```sh
cargo build -p fgos -p fgos-node-addon
cargo test -p fgos-git -p fgos-holder-lock --lib
cargo test -p fgos-git --test scoped_commit_sync
cargo test -p fgos-holder-lock --test borrow_io
cargo test -p fgos-holder-lock --test borrow_git
cargo clippy -p fgos-git -p fgos-holder-lock --all-targets -- -D warnings
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/scoped-commit.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/cutover-grant.test.mjs test/git/commit-parent-death.test.mjs test/git/sync.test.mjs test/git/lock-handover.test.mjs test/holder-lock/registry-contract.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/runner/execution/commit-unit-work.test.mjs test/architecture.test.mjs
git diff --check
```

Rust: 48 library tests, five Git integration tests, 23 borrow-I/O tests and six real-Git borrow tests pass; clippy clean. The four raw borrow vectors cover alias/filter/hook/gc and the sibling check. ScopedCommit exercises ordinary/setsid hooks through both custody 30 and main 50; executable filter config refuses without running it. Node: ScopedCommit 12/12, hook/cutover/Sync/handover/contracts 36/36, runner/architecture 59/59. Real SIGKILL barriers retain custody after controller death and refuse uncertain commit/Sync replay. Temporary hook indexes pass; external/symlink indexes refuse. Invalid messages, post-preflight foreign staging and rejected-attempt replay refuse without losing producer bytes. Logs: `/tmp/fgos-work/p05-u3/`.

No full npm test or E3 bench was run, per coordinator instruction. Installed-release main cutover, unrestricted host/PID-namespace acceptance, full-suite/E3 results and macOS/Windows proofs remain coordinator acceptance work. Specs and changelog updated; no out-of-scope edits, repository staging or commits. Program-board/landing/review remain with the coordinator. MDView previews failed with its read-only database.

Status: DONE_WITH_CONCERNS
Summary: The unit-3 rollback, adopted setsid-holder and stdout-contract fixes have focused Linux evidence. Phase acceptance still needs the coordinator's host and release checks.
Concerns/Blockers: Full-suite/E3, installed-release cutover and cross-platform acceptance are not claimed.
Context refs:
- (none)
