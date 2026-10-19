# Git phase 04 custody lease: host failure classification

Branch `git/p04-custody` at `e11c4299f` compared with baseline main `476d06d39`. Run on the host (Linux, 24 cores, bwrap user and PID namespaces available) on 2026-10-18/19, Asia/Saigon. Read-only verification: no code was changed and nothing was committed.

## Setup

- Private Cargo output directories: `/home/vantt/.claude/jobs/e1505f04/tmp/p04/tgt-branch` and `tgt-main`. Each tree built `cargo build --locked -p fgos` (debug host) and `cargo build --locked --release --workspace` (for the `target/release/fgctl`/`fgos` fixtures). Both builds exited 0.
- The release fixtures are reached through `<tree>/target/release`, which is a symlink to the private directory.
- npm: `CARGO_TARGET_DIR=<private> FGOS_HOST_BIN=<private>/debug/fgos env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID npm test`. The branch suite and the baseline suite ran one after the other, not at the same time.
- Single-file reruns: `node --test <file>` with the same environment that `scripts/run-tests.mjs` sets. `npm test -- <file>` does not narrow the run (R5: it always runs the full suite).

## Rust (branch)

| Check | Result |
|---|---|
| `cargo test --locked -p fgos-run-supervisor -p fgos-holder-lock -- --nocapture` | **166 pass, 0 fail, 0 ignored** |
| pidns vectors | **Ran for real.** There are 0 `no-bwrap-pidns` skip lines. The containment report shows `"driver":"bwrap-pidns","level":"kernel"`. All 9 `gate_pid1` tests ran, including the gate as pid 1, a killed gate killing a setsid grandchild, and the gate being the only lock holder. |
| `cargo clippy --locked ... --all-targets -- -D warnings` | Clean (exit 0) |

## npm full suite

| Tree | Tests | Pass | Fail | Skip |
|---|---|---|---|---|
| Branch `e11c4299f` | 8203 | 8067 | 39 | 32 |
| Baseline `476d06d39` | 8190 | 8089 | 5 | 31 |

- **Failures in both trees (4):** fences-v1-tombstone real v1 acquire (`yaml` module missing), crash-matrix-adopt-resume direct no-binding resume, holder-lock-checks monitor/supervisor membership, and skill-wrappers `instruction-audit` projection.
- **Baseline only (1):** hot-lock-multiprocess fast path within 10%. This is a perf flake; it also failed in 2 of 4 extra full branch runs.
- **Seen only in extra full branch runs (2 of 4):** holder-lock-checks "a payload registry without the Rust callers' locks...". It is a flake under load: run alone it passed 2 of 2 times on the branch and 2 of 2 times on the baseline.
- **New on the branch: 35.** Each one reproduced in all 5 full branch runs and in 2 of 2 single-file reruns. None is a flake.

## New custody tests (host, single file, 2 runs each)

| File | Result |
|---|---|
| `test/runner/custody-lease-commit.test.mjs` | 2/2 pass, both runs |
| `test/runner/custody-successor-admission.test.mjs` | 7/7 pass, both runs |

Both files also passed inside the full branch suite.

## Classification of the 35 new failures

No failure is (b) a real regression and none is (c) a flake. Every one is (a) an intended contract change. Root cause for 34 of them: `executeExecutorCli` (`src/runner/dispatch/cli.mjs:650`) now throws `custody-domain-required` for any call without `sharedCwd`. It throws before the herdr check, the confinement refusal (`:741`), the cwd-existence check and the spawn. The remaining one comes from the controller now keeping its lease.

| # | Test file | Tests (count) | Error excerpt | Cat. | Fixture should migrate to |
|---|---|---|---|---|---|
| 1 | `test/runner/dispatch.test.mjs` | 21: providerModel/modelForTier, model override, tier override, task-executor self-exec, cli self-exec, chokepoint stderr line, `--for` resolution (x2), unsignaled/DONE/verifiedSha/backtick outcome (x4), lostUncommittedPaths (x2), purpose-named prefer, disallowedProviders, rigor floor | `DispatchError: a mutating producer must run through a supervised Assignment with a declared domain` (`custody-domain-required`) | a | Tests of argv, model, outcome or governance: pass `sharedCwd: true` (read-only) so they still exercise the same resolution. Tests of the lostUncommittedPaths/headBefore/headAfter writing outcome: move to `runUnit`/Assignment (`fgos run --writes --worktree`). |
| 1b | same file | 3: "refuses a concurrent dispatch for the same cwd (dispatch-in-flight)", "refuses while a dispatch in another process holds the cwd ... SIGKILLed", "holds the cwd lock while it runs: symlink refused, sharedCwd not" | Same DispatchError; `assert.throws` validation false | a | The cwd exclusion property now belongs to the supervised Assignment lease. Rewrite against `assignment-cwd-mutex-concurrency`/custody tests (or delete as duplicates). Keep "sharedCwd is admitted" as a read-only test. |
| 1c | same file | 1: "refuses a cwd that does not exist with a plain DispatchError" | Got `custody-domain-required` instead of `worker-spawn-fail` | a | Expect the custody refusal for a mutating call, or test the missing-cwd path through `admitSuccessor`/Assignment, which still throws `worker-spawn-fail`. |
| 2 | `test/runner/dispatch-execute-effort.test.mjs` | 3: `--effort` renders level, no `--effort` leaves argv, surfaces CLI-reported model | custody-domain-required | a | `sharedCwd: true` (argv/report-only assertions), or the supervised Assignment door. |
| 3 | `test/runner/dispatch-execute-for-capability.test.mjs` | 3: leftover `for` inert + doctor names it, `--for` without confinement runs unconfined, `--for` picks preferred invocation | custody-domain-required (`errorClass: 'custody-domain-required'`) | a | `sharedCwd: true`, or `fgos run --capability`. |
| 4 | `test/runner/dispatch-confinement-authority.test.mjs` | 2: MED-2 (research folded to `code:implement`), MED-3 (tool `for[]` order) | `err.capability` is `undefined` (expected `code:implement` / `code:review`): the custody refusal fires first and carries `{}` details | a | `sharedCwd: true`. The confinement-required refusal (`cli.mjs:741`) comes after the custody check and still sets `capability`. |
| 5 | `test/runner/dispatch-production-call-sites.test.mjs` | 3: herdr-spawn cannot be executed directly; http adapter through executeThroughConfinement; R8 legacy openDispatchRun stamps `dispatch-run.legacy` | herdr: message is the custody refusal, not `/herdr-spawn runs as an attempt of the run supervisor/`; others: custody-domain-required | a | herdr: accept either refusal, or call with `sharedCwd: true` to reach the herdr refusal (`transport.mjs:660`). http/R8: `sharedCwd: true`, since the http adapter is a non-supervised door and is refused for mutation by design. |
| 6 | `test/runner/dispatch-stray-write-attribution.test.mjs` | 2: another session's write is not blamed; a worker writing into the main checkout is flagged | custody-domain-required | a | The stray-write watcher (`cli.mjs:668`) is reachable only on read-only calls now. Move these writing-worker cases to the supervised Assignment/`runUnit` path, or drop them if that path has its own stray-write check. |
| 7 | `test/run-supervisor/direct-crash-matrix.test.mjs` | 1: "9. read-only attempts share cwd without a lease; a writing attempt holds the lease until its gate is gone" | `timed out after 10000 ms waiting for the controller to let go of the cwd lease` | a (lease-lifetime change, not a refusal) | Requirement 1 now keeps the controller's copy until settlement. Assert that the controller pid stays among the `dispatch-cwd` holders while the attempt runs, that the attempt processes are members, and that the lease is free after the run exits. Drop "freed before closed.json". The read-only half of the test still passes. |

Counts: (a) 35 (34 custody refusals + 1 lease-lifetime change), (b) 0, (c) 0.

## Observations, not failures

- The custody refusal is thrown with empty details (`{}`), so callers lose the `cwd`, executor and capability context they used to get. MED-2/3 show the effect. Adding `{ cwd, executorId, capability }` would be a small diagnostic improvement. The owner decides.
- With mutation refused, the mutating-only logic inside `executeExecutorCli` (stray-write watcher, `lostUncommittedPaths`, head shas) now runs only for read-only calls. This is a possible L10 cleanup to do together with the fixture migration.
- None of this changes the lead's own blockers: Workflow fresh-worktree redispatch, the doctor `git-worktree-recovery` check, and the Windows/macOS host runs.

## Cleanup

The baseline worktree `.claude/worktrees/p04-baseline` was removed and the `target/release` symlink added to the branch worktree was deleted. No background processes from this verification are still running. The logs are kept under `/home/vantt/.claude/jobs/e1505f04/tmp/p04/` (`branch-npm.log`, `main-npm.log`, `rust-test.log`, `clippy.log`, `file-*.log`, `hlc-*.log`).
