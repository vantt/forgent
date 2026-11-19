# Phase 5: A live writer's pending Git op answers resource-busy

## Context
p-k6apgwaddh: catch-up was refused `resource-recovery-required` while a live `fgos watcher tick` fetch was pending.
The WAL intent records no pid and a fetch holds no lock during transfer. Design decided by lead:OPC (Git owner,
reviews every line): every Git operation holds a per-operation leaf holder-lock from `wal.begin` until its terminal
outcome or drop; admission that meets another active chain probes it: held = Busy `resource-busy` (retryable),
free = `resource-recovery-required`. Kernel-lock liveness, no Identity lookup. Prior art: registry row `repo-config`
added in d1d4ec7ee (follow it).

## Requirements
1. `packages/holder-lock/contracts/lock-registry.v1.json`: entry `git-operation`, kind mutex, scope repo, rank 80,
   owner git, v3Path `<common>/fgos/git/locks/op--<operationId>.lock`. Update what d1d4ec7ee touched for a row:
   `docs/platform/holder-lock/spec.md`, `test/holder-lock/registry-contract.test.mjs`, and
   `src/setup/holder-lock-checks.mjs` + `test/setup/holder-lock-checks.test.mjs` only if they enumerate entries.
   The path comes only from the registry. Do not touch `packages/holder-lock/rust/src/port.rs` (lead:S6A).
2. `packages/git/rust/src/wal.rs` `Wal::begin` (~l.1622): after the chain is created take `git-operation` for that op
   id with `Wait::Ms(0)` in its own `LockScope::seeded(vec![])` (never the caller's scope: ops take worktree-admin 40
   and main-checkout 50 after begin). Keep it until an Outcome is appended or the Wal/session drops. Recovery that
   continues an op does not take it.
3. `packages/git/rust/src/refs.rs` admission (~l.115-160): for the conflicting chain probe its `git-operation` lock with
   `fgos_holder_lock::port::probe`. Held: `pending(busy("resource-busy"), &op_id)`, detail names op id and kind
   (`busy()` in lib.rs:300). Free/absent/probe error/unsupported platform: keep `recovery("resource-recovery-required")`.
4. `docs/platform/git/spec.md`: `resource-busy` in the catch-up/refs refusal list.
5. Tests: new `packages/git/rust/tests/pending_op_liveness.rs` reusing the child-process pattern of
   `tests/land_crash_matrix.rs`: (a) live child mid-op -> `resource-busy`; (b) after SIGKILL -> `resource-recovery-required`;
   (c) the op lock is released after the outcome is appended.

## Validation
`cargo test -p fgos-git` (whole crate incl. land_crash_matrix), `cargo test -p fgos-holder-lock`, clippy -D warnings,
msvc + darwin check (zig env, board 15:52), `node scripts/run-tests.mjs test/holder-lock test/architecture.test.mjs`;
census regenerate if the scan asks. Then send branch + sha to lead:OPC for review.
