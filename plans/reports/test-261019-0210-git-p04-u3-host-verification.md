# Git phase 04 unit 3: host verification of the custody lease review fixes

Branch `git/p04-custody` at `b16ca6087`. Run on the host (Linux, bwrap user and PID namespaces available) on 2026-10-19, Asia/Saigon. Read-only verification: no product code was changed.

## Setup

The setup is the same as in `test-261018-2330-git-p04-host-failure-classification.md`. The private Cargo directory is `/home/vantt/.claude/jobs/e1505f04/tmp/p04/tgt-branch`. Both `cargo build --locked -p fgos` and `--release --workspace` were rebuilt from `b16ca6087`, and both exited 0. `target/release` is a temporary symlink to the private directory. The full suite ran as `CARGO_TARGET_DIR=<private> FGOS_HOST_BIN=<private>/debug/fgos env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID npm test`. Single-file reruns used `node --test <file>` with the same environment that `scripts/run-tests.mjs` sets. Logs: `u3-*.log` in that directory.

## Rust

| Check | Result |
|---|---|
| `cargo test --locked -p fgos-run-supervisor -p fgos-holder-lock -- --nocapture` | **168 pass, 0 fail, 0 ignored** |
| pidns vectors | **Ran for real.** The log has 0 `no-bwrap-pidns` skip lines and the containment report shows `"driver":"bwrap-pidns","level":"kernel"`. All 9 `gate_pid1` tests ran. All 3 `unix_lease_record` tests ran: the mismatched cwd lease refusal, the linux-pgroup supervisor draining the setsid escapee, and the domain being recorded before the agent with the controller keeping custody. |
| `cargo clippy --locked ... --all-targets -- -D warnings` | Clean (exit 0) |

## npm full suite

**8212 tests: 8079 pass, 36 fail, 32 skip, 65 todo.** The baseline on main `476d06d39` was 8089 pass, 5 fail.

- **Known baseline failures (4), all present:** fences-v1-tombstone (`yaml`), crash-matrix-adopt-resume direct no-binding resume, holder-lock-checks monitor/supervisor membership, skill-wrappers projection.
- **Known flake (1):** holder-lock-checks "a payload registry without the Rust callers' locks…".
- **The 35 failures from the `e11c4299f` classification are gone.** The dispatch, effort, for-capability, confinement-authority, production-call-sites and stray-write fixture migrations now pass. `custody-domain-required` appears in the log only once, as an expected assertion.
- **New: 31 failures in 7 files.** Each file was rerun alone twice, and the same tests failed both times (deterministic):

| File | Fail/total alone (run 1, run 2) |
|---|---|
| `test/runner/assignment-dispatch.test.mjs` | 14/57, 14/57 |
| `test/runner/operation-choice.test.mjs` | 12/154, 12/154 |
| `test/runner/dispatch-execute-effort.test.mjs` ("an Assignment launched with --effort and --model…") | 1/21, 1/21 |
| `test/runner/dispatch-governance-operability.test.mjs` | 1/6, 1/6 |
| `test/runner/dispatch-operability-production-door.test.mjs` | 1/4, 1/4 |
| `test/runner/effective-execution-contract.test.mjs` (production-door fixture) | 1/14, 1/14 |
| `test/runner/operation-prompt-templates.test.mjs` (pinned template snapshot retry) | 1/36, 1/36 |

### Classification: (b) real regression, one root cause, 31 of 31

Every failure has the same form: the test asserts `result.status` (or `result.confidence`) and gets `undefined`.

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ undefined
- 'done'          (also 'failed', 'no-evidence', 'reported')
    at test/runner/assignment-dispatch.test.mjs:193:10
```

Cause: the M1 fix (`b16ca6087`, `src/runner/dispatch/assignment-runner.mjs`) now returns `handedOffResult = { ...settledResult }` (and `{ ...early }`) instead of the settled result itself. `status` and `confidence` are **non-enumerable getters** defined in `src/runner/dispatch/run-result.mjs:640-662` (and `:869`, `:911`). The `runResult` self-link in `settlement.mjs:479` is non-enumerable too. Object spread drops all three. Every supervised `executeAssignment` caller therefore loses `status` and `confidence`. That covers the Work-advancing paths in `operation-choice` (validate-plan, review-item, scout-blast-radius). This is a public contract of the Assignment result, so the failures are not an intended change. The printed result in the effort test confirms it: `classification.outcome.category` is `ok`, but there is no `status` key.

These failures were not visible in the lead's verification. Their full suite had 418 failures from the sandbox, and their focused files (custody, Assignment concurrency, Unit) do not assert `status`. A fix must copy the result without losing those properties, or attach the warning to the original object before freezing it. The handoff warning attachment and the immutable-result vector must keep passing. No code was changed here.

Counts: (a) intended contract change 0, (b) real regression 31 (one cause), (c) flake 0 new, plus 1 known flake and 4 known baseline failures.

## Targeted confirmations (host)

| Test | Full suite | Alone, run 1 / run 2 |
|---|---|---|
| `test/workflow/units-runner.test.mjs` "workflow resume preserves an unknown custody predecessor and redispatches in a fresh worktree" (end to end) | pass | file 22/22, 22/22 |
| `test/workflow/workflow-runner.test.mjs` "integration uses the recorded replacement branch and preserves the predecessor branch" | pass | (full suite only) |
| `test/run-supervisor/direct-crash-matrix.test.mjs` test 9 "…a writing attempt holds the lease until the run exits" (not skipped; bwrap pidns usable) | pass | file 13/13, 13/13 |
| `test/runner/custody-successor-admission.test.mjs`, including "best-effort handoff limitation…setsid escapee" and "controller death with a setsid escapee…" | pass | 12/12, 12/12 |
| `test/runner/custody-lease-commit.test.mjs` | pass | 3/3, 3/3 |
| `test/runner/assignment-cwd-mutex-concurrency.test.mjs` | pass | 3/3, 3/3 |

## Cleanup

The temporary `target/release` symlink was removed. No temporary worktree was created. No background processes from this run are still running.
