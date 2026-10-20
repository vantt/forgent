# Git phase 06 unit 11: Recovery matrix; ownership remains blocked

B: Added one Rust integration file, `packages/git/rust/tests/recovery_matrix.rs`,
covering all twelve requested payload kinds. Every case calls the real operation
port, then the existing ptrace crash technique SIGKILLs the controller after the
Intent installation directory fsync. Each kind runs twice on fresh repositories:
Recovery first, and owning recovery first (24 real interruptions). Assertions
cover listPending, kind/intent inspection, terminal abandonment, equivalence to
the owning port, compaction, stable request digest/outcome, compacted reconcile,
and removal from pending. Publication's terminal refusal receipt is checked;
compacted Recovery's Outcome response is distinguished from Sync's typed status.
The fixture reuses support/land.rs (also used by SafeRestore), real custody/seal
handles, and the per-port fixtures' production APIs and syscall crash technique.
Coverage is the pre-attempt row for every kind, not every internal/post-effect
boundary. Git spec documents that exact limit.

C: Not implemented. Holder-lock delegates child creation to Process's
`spawn_mapped` (`packages/process/rust/src/mapped.rs`); MappedSpawn has no
pre-execution identity/GO boundary. Strict bottom-up layering puts that primitive
and its tests in Process, outside the supplied write scope. Needed additional
scope: `packages/process/rust` and `docs/platform/process/spec.md`.
Further, a durable pid/start-time plus a pre-exec absence check cannot establish
inode ownership: foreign Git may win O_EXCL after the check while our child is
stopped; killing our child then leaves a foreign lock. The implementation must
also establish exclusive-creation attribution, rather than adopt the pathname.
The fixture recorder remains test-only. Borrow/drain/reach rules are unchanged;
production repair and its killed-real-Git acceptance probe remain outstanding.
No E3 census was measured; no execution-boundary performance claim is made.

Prior art: reused the existing fixture, WAL/Recovery ports, real-ref reader,
acknowledgement/compaction doors and ptrace harness pattern. History:
3e0cc30af introduced ownership evidence; 8afafb6f3 introduced Recovery;
c9c378839 and 6656b06d1 cover the borrowed-I/O/release path.
Impact-analysis: inactive (zero registered providers).

Verification (passed, exact commands):

- `cargo test -p fgos-git --test recovery_matrix --test repository_config -- --test-threads=1` — matrix passes all 24 cases; 6 config tests pass; 3 helper tests ignored directly and invoked by their parent tests.
- `cargo test -p fgos-git --lib native_lock::tests -- --test-threads=1` — 7 passed; ownership recovery here remains fixture evidence.
- `cargo test -p fgos-holder-lock -- --test-threads=1` — 62 tests and 1 compile-fail doctest passed.
- `cargo clippy -p fgos-git -p fgos-holder-lock --all-targets -- -D warnings` — passed.
- `node --test --test-concurrency=1 test/git/recovery.test.mjs test/git/native-lock-repair.test.mjs test/architecture.test.mjs` — 32 passed.
- `git diff --check` — passed.

MDView spec preview failed: readonly database; no preview URL. No full npm test,
E3 run, git add/commit, lifecycle verbs or program-board mutation.

Status: BLOCKED
Summary: The twelve-kind pre-attempt Recovery interruption/compaction matrix is implemented and passes focused checks. Production index-lock ownership remains incomplete.
Concerns/Blockers: Process-layer scope is required for the child-start boundary; process identity alone cannot prove native lock creation ownership.
Context refs:
- (none)
