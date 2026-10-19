# Git phase 05 — ScopedCommit, Sync and cutover guard

Implemented dormant Rust ScopedCommit/Checkpoint/Sync ports, mechanical addon/Node bindings, a dependency-free Rust write-scope leaf, WAL payloads/state, the protocol-1 activated-host grant route, hook delegation and Linux-x64 addon admission. Existing production commit/sync callers and the Node matcher remain until the phase-07 switch specified by the phase plan. Removed direct hook replay; the runner preserves the original failure evidence and runs a refusing hook once.

Reused GitDriver, LockScope, opaque native loans, the registry custody key, WAL TargetAttempt, Refs pins and release admission. Prior art: native handover arrived in `9c8308897`; `c9c378839` made missing reach facts fail closed. Impact-analysis query returned zero providers: **impact-analysis: inactive**. Caller checks used `rg`; no agents were dispatched. No repository staging or commits.

Two scope blockers prevent completion:

- `BorrowedHandle::from_acquired_description` initializes reach history to `(None, None)`. `Reach::of(None)` refuses the first borrowed Git child with `borrow-leftover-not-killed: []`. Seven new linked-worktree Node tests reproduce this; the equivalent Rust-owned custody tests pass. Fix the existing Holder-lock handover/provenance door, including its port/driver as needed; never initialize a later timestamp without proving earlier descriptor copies drained. Those files are outside this assignment's scope.
- `scripts/build-rust-distribution.mjs:nativeAddonComponent` omits `capabilities`. It must emit `git-wal-v1` before the new activation gate can accept releases produced by today's builder. This shared producer also serves dev-host/test descriptors. It is outside scope. The program-board lane update is also outside scope and remains the coordinator's.

Validation (logs under `/tmp/fgos-p05-*`; Cargo target override was unset):

```sh
cargo test -p fgos-write-scope -p fgos-git -p fgos-node-addon -p fgos-distribution -p fgctl
cargo test -p fgos-write-scope -p fgos-git -p fgos-node-addon
cargo test -p fgos-distribution -p fgctl
cargo test -p fgos-git --test scoped_commit_sync
cargo test -p fgctl --test git_wal_activation_gate
cargo clippy -p fgos-write-scope -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
cargo build -p fgos -p fgos-node-addon
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/cutover-grant.test.mjs test/git/write-scope-parity.test.mjs test/runner/write-scope.test.mjs test/e2e/main-checkout-borrow-hook.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/cutover-grant.test.mjs test/git/write-scope-parity.test.mjs test/e2e/main-checkout-borrow-hook.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/runner/execution/commit-unit-work.test.mjs test/architecture.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$PWD/target/debug/fgos" npm test
mkdir -p /tmp/fgos-work/p05-suite/fgos
chmod 700 /tmp/fgos-work/p05-suite/fgos
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_STATE_ROOT=/tmp/fgos-work/p05-suite/fgos FGOS_HOST_BIN="$PWD/target/debug/fgos" npm test
```

The split Rust suites passed; direct port tests passed 5/5, including exact two-parent sync, marker refusal, tree-tampering detection, durable no-op replay and tracked non-event checkpointing. Activation tests passed 2/2, covering init/upgrade/repair rollback refusal with unchanged activation and Windows optionality at the shared admission function. Clippy and cargo check passed. The combined Cargo command intermittently fails the existing `store::tests::test_lock_exclusive_and_release` immediate-reacquire assertion; its separate distribution run passed. This is not a green combined result.

Focused Node validation: 58/65 passed, seven failed at the handover blocker. Grant/parity/borrow-hook subset passed 42/42; runner/architecture passed 59/59, including a new real-hook single-invocation regression. The cutover fixture uses the real repository hook, legacy seal ref, event/state/backup deletions, directory-to-fence replacement and porting-log deletion; forged text authority and wrong legacy ref/digest refuse. This uses the built host through FGOS_HOST_BIN, **not an activated release on the real main checkout**.

Default npm test stopped at the read-only global full-suite lock. Retrying with the existing writable FGOS_STATE_ROOT setting completed: 8,341 tests, 7,271 pass, 872 fail, 133 skipped, 65 todo. Failures include read-only `/var/tmp` fixture creation/npm cache, unavailable PID namespaces/terminal attempts, and the named handover blocker. These failures were not all individually triaged. No bypasses or test-only production branches were added. MDView preview failed because its database is read-only.

Event Store handover: after the reviewed inert code lands and the phase-05 release is activated, call `createGitScopedCommit({stateRoot, repoPath: main, trustedMain: main, writer})`. Keep `preflight()`'s baseline before deleting files; then `commit({operationId, baseline, request: {writes, message, cutoverGrant: {exactPaths, legacyRefOid, sealDigest}}})`. exactPaths lists only the exact `.fgos/` deletions; sealDigest is lowercase SHA-256 of legacy commit seal.json bytes. Non-store code/log paths remain consumer-declared writes. The `.fgos/events` fence is included only when replacing the granted event directory. Checkpoint refuses all `.fgos` payload. Missing/old host, missing borrower, mismatched index/WAL/ref/seal and spent grants refuse. Do not run this cutover from this blocked worktree.

Before DONE: repair both scope blockers; finish receipt/recovery and file-move rollback review; complete refusal-case coverage, crash/parent-death barriers and full V-BORROW, validated temporary-index/hook contexts, installed-release main cutover and cross-platform proofs; rerun the validation block without confinement restrictions. No opus review or merge was attempted; both belong to the coordinator.

Status: BLOCKED
Summary: Dormant ports and guards are implemented with targeted real-repository evidence; phase acceptance is incomplete.
Concerns/Blockers: Holder-lock handover loses required reach facts; release builder omits the newly required addon capability; full validation and remaining protocol proofs are not green.
Context refs:
- (none)
