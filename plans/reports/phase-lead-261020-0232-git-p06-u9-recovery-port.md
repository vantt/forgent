# Git phase 06 unit 9: partial implementation; lock-contract blocker

Added a dormant Rust/addon/Node Recovery dispatch door and WAL inspection/pending
scan. Land, ScopedCommit, Sync, Restore, Worktree and Publication delegate to their
existing recovery implementations; refs and non-event transfers now expose
observe-only recovery entries. Resource scopes precede the recovery leaf; no
consumer settlement or network retry is introduced. Non-event transfers now
share worktree-admin exclusion with their recovery. Compacted inspection retains
the existing request digest and terminal outcome. Unknown payload decoding names
the unsupported variant.

**Blocker:** `repo-config` and `recovery` are both rank 80 in
`packages/holder-lock/contracts/lock-registry.v1.json`. The strict check in
`packages/holder-lock/rust/src/scope.rs` rejects equal ranks. A real attempted
config-then-recovery acquisition failed with `lock-order-violation`; that change
was removed. Unified ConfigChange reconciliation explicitly refuses with
`recovery-config-lock-order-unavailable`, while existing per-port config recovery
is unchanged and tested. Do not bypass the conflict with an unseeded second
scope or by releasing resource authority. Resolving the shared lock contract
requires files outside this assignment's scope. The program-board row is also
outside scope and was not edited.

SafeRestore N-L1 compares filesystem identity against indexed names and refuses
a distinct, exactly spelled untracked hardlink. N-L2 refuses all registered
worktrees and the driver state root, holds the destination directory before
canonical validation, checks its inode identity, and creates/fsyncs through
`openat` on that descriptor. Fixtures now separate state and extraction roots.
N-L3 documents that clean paths are not listed and must be read from expectedHead.
The case-only rename test passed on Linux; a real case-insensitive filesystem
was not available.

Added the GitHub adapter authorization/timeout/query contract and a real fake-gh
process test: the server-side fixture merges then reports timeout, and the
consumer queries state without sending a second merge. No adapter code moved.
E3 now has paired ScopedCommit/commitUnitWork and Land/current merge-path rows,
with 1.5/1.2 p95 ratios, verify excluded, equivalent fixture bytes/topology,
and ordinary TMPDIR selection keeping legacy candidates on the fixture disk.
Cargo artifacts resolve through metadata. The benchmark was not executed.

Validation (exact commands):

- `cargo check -p fgos-node-addon` — passed.
- `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings` — passed.
- `cargo test -p fgos-git --test safe_restore -- --test-threads=1` — 16 passed, 1 crash child ignored; includes real crash matrix (before the final hardlink test addition).
- `cargo test -p fgos-git --test safe_restore case_ -- --test-threads=1` — 2 passed.
- `cargo test -p fgos-git --test safe_restore extraction_refuses -- --test-threads=1` — 1 passed.
- `cargo test -p fgos-git --lib recovery::tests --test repository_config -- --test-threads=1` — unknown-kind test passed; filter selected no config tests.
- `cargo test -p fgos-git --test repository_config unified_recovery -- --test-threads=1` — blocker regression passed, config bytes preserved and original recovery still works.
- `cargo test -p fgos-git --test refs_remote --test repository_config --test scoped_commit_sync --test worktree --test publication -- --test-threads=1` — 76 passed, 2 crash children ignored.
- `node --check scripts/git/e3-bench.mjs` — passed; no dry mode exists.
- `node --test --test-concurrency=1 test/git/recovery.test.mjs test/git/github-adapter-contract.test.mjs test/git/safe-restore.test.mjs test/git/repository-config.test.mjs test/architecture.test.mjs` — 37 passed.
- `git diff --check` — passed.

No full npm test, E3 run, git add or commit. Impact-analysis: inactive (zero
registered providers). MDView preview was attempted for the spec; the CLI failed
with a readonly database error, so no preview URL is available.

Remaining acceptance work: resolve the shared rank contract, complete
ConfigChange dispatch, and add the requested interrupted-operation matrix for
every payload kind. Current unified-port tests cover interrupted Land and
terminal Restore, not that complete matrix. No claim of Recovery completion.

Status: BLOCKED
Summary: SafeRestore Lows, GitHub contract and E3 source rows are implemented; Recovery is partial and dormant, blocked by incompatible rank-80 contracts.
Concerns/Blockers: Shared Holder-lock scope/registry/spec changes are outside write scope; full per-kind interruption coverage remains outstanding. E3 timings and case-insensitive filesystem behavior remain unmeasured.
Context refs:
- (none)
