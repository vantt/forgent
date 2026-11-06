# Small fixes: assignment record drop, one worker-session server, recover adopt-only, receipt-only provider stop, ready timeout fold

Branch `harden/t5-p07`, base `7a4fa3654` (origin/main). Not pushed.

## What changed

- **Assignment record.** `dropAssignmentRecord` (provider-capacity.mjs) removes `state.assignments[*:<assignmentId>]` under the provider-state lock; `run.mjs` calls it right after the attempt outcome is persisted. No age rule. A controller that died before that line leaves the entry (sticky account of a rebind of the same id). Entries written by earlier releases are not reached.
- **Worker session.** `ensureWorkerSession` keeps one pending boot per session name (joiners wait on it and report `startedServer: false`); the socket check, stale-socket removal, spawn and wait for the server run under a new machine-scope `worker-session` lock (`<lockRoot>/worker-session/<session>.lock`, rank 80, acquired with the async `acquire`, so no event-loop block). The socket is looked at again once the lock is held. New registry row, doctor lock-file scan entry, spec leaf list updated.
- **Recover.** `resume-driver` / `reassign-driver`, their re-checks, `clearDispatchClaimForRecoveredDriver`, the epoch-bump and settled re-check tail of apply (nothing but those two actions reached it), `DRIVER_FRESH_MS` (x2), the `60000` window, the `liveness` and `replacement-authority` evidence are deleted. The one action is `adopt`; `--intent reassign` parks with a reason. `findRunningRuns(fgosDir)` (signature kept for `state read`) and `live-proven` read the attempt lock through new `attemptLockState` (holder-lock `probe`, read-only, no lock file made): `held` / `free` / `unknown`; `unknown` is never listed as an orphan. Contract `recover-actions.v1.json` and the command-registry example updated.
- **Provider stop text judge.** All five families have `login` and `usage-limit` vectors, direct and terminal (table below), and `providerStopOf` always gives a cause with a provider stop. Deleted: `AUTH_ANCHOR_PATTERNS`, the openai stderr branch, the text fallback for auth-vs-quota. `quotaQuarantineUntil` still reads the text for the reset time. `provider-auth-failure.mjs` left the reconcile import closure (test list updated); probes still use it.
- **Ready timeout.** `READY_TIMEOUT_MS` is now exported by `terminal-control-checks.mjs` (its only production reader; the test reader re-pointed); `herdr-deadlines.mjs` and its manifest row deleted.
- CHANGELOG line added.

Vector check (blocked reasons in `packages/agent-protocol/contracts/fixtures/{direct,terminal}/<family>/vectors.json`):

| family | direct login / usage-limit | terminal login / usage-limit |
|---|---|---|
| claude | 5 / 1 | 2 / 1 |
| codex | 1 / 4 | 1 / 4 |
| pi | 1 / 2 | 2 / 3 |
| omp | 2 / 1 | 1 / 1 |
| agy | 1 / 1 | 1 / 1 |

No gap, so nothing recorded for the backlog.

## Red to green

First commits (cherry-picked from the red-proofs branch, only these three rows) were red: boot test `a second server was started ...` (2 vs 1), failover test `the provider state still holds entries ...`, recovery test `plan offered resume-driver, reassign-driver ...`. All three green after the fix commits. The sticky-account behaviour stays owned by `test/runner/execution/bind.test.mjs` ("bind reads the lease state: ... the account this assignment holds ranks first"), unchanged and green. The cross-process boot case is added in the worker-session commit (`a worker session another process was bringing up is not started a second time`).

## Tests retired / rewritten (owner)

- `test/verbs/dispatch-recovery.test.mjs`: retired the cases that recommend, re-check or apply the two actions, the three claim-unlink cases, the control-epoch bump / live-holder `held` / settled-window re-check cases, reassign needs-input, replacement-authority evidence cases (behaviour removed). Door-level compare-and-set cases (missing field, expiry, tampered key, replayed key, repeat apply, lock-busy, killed holder, epoch ledger) were rewritten onto an adoptable attempt. Snapshot-change staleness and "closed after apply" are owned by `test/run-supervisor/inspect-recover-adopt.test.mjs` and Rust `adopt_matrix.rs`; a held lock offering no action by the adopt test `an attempt whose lock is held offers no action and reads running`.
- Heartbeat-age cases rewritten to the lock fact: `dispatch-visibility-session` (findRunningRuns), `dispatch-runtime-inspect` (live-proven), `fgos-stale-orphaned-runs` (run left alone), `assignment-layout`.
- Classifier cases that fed stderr text and expected `auth-token` / `quota-limit` without a `stopCause` are retired or given the `stopCause`; owner: the vectors (`direct_vectors.rs`, `terminal_vectors.rs`) plus the `stopCause` cases in `provider-capacity.test.mjs` ("a pane seat stopped on a dead login ...", "... used-up quota ...").
- `contracts-unit-state`, `inspect-recover-adopt` (legacy-run now parks), registry/doctor lock count 23 to 24.

## Size

Node src net -255 (+118 / -373), budget about -310 (apply tail went but the new probe, drop function and boot lock add 60). Tests net -193 (+230 / -423) including the three red rows (+57), budget about -50. Rust 0.

## Verification

- Focused set (all phase files, architecture, doc-health, citation-drift, registry contract, holder-lock checks, reconcile import graph): green after one fix (lock count).
- `cargo test -p fgos-holder-lock`: green (registry row read by Rust). No Rust source changed, so clippy / msvc / darwin checks not re-run.
- `git-one-door-scan`: 0 undeclared; census regenerated per commit.
- Full suite (`/dev/shm/p07-full.log`, run before the last test fix): 8732 tests, 2 fail = the known frozen-addendum case and `a run being driven right now is left alone` (fixed afterwards in the last commit, focused run green: 5/5 in that file). No `run-tests: ERROR` lines. I did not rerun the full suite after that one test-only commit.

## Deviations from the phase file

- New files touched outside the listed ownership: `packages/holder-lock/contracts/lock-registry.v1.json` (new `worker-session` row), `src/setup/holder-lock-checks.mjs` (doctor scan entry), `docs/platform/holder-lock/spec.md` (leaf list), `test/setup/holder-lock-checks.test.mjs` (lock count), `test/runner/dispatch-reconciliation-import-graph.test.mjs`, `test/runner/dispatch-runtime-inspect.test.mjs`, `test/runner/dispatch-visibility-session.test.mjs`, `test/cli/fgos-stale-orphaned-runs.test.mjs`. The boot lock needs a registered machine-scope name keyed by the session; no existing row fits (`sessions` is repo scope, the herdr session is machine-wide). Not a new mechanism: the same holder-lock door.
- The assignment record is dropped by assignment id across providers (like the audit's lookup), not by provider key, since run.mjs does not carry the provider name.
- Resume-keeps-account proof lives in `bind.test.mjs`, not `run.test.mjs`.

## For other phases

- P13 spec lines: recover is adopt-only; running is the attempt lock; the `worker-session` lock row; recovery-planner has no liveness evidence. Docs under `docs/platform/agent-coordination/` still describe the two actions (history, not touched).
- `needs-input` in the recovery planner / `checkApply` is now never produced by the planner; left for the phase that owns the recover contract.
- Guide note for the owner machine: assignment entries written before this release stay in the provider state file until a manual cleanup (hand-off H-T5f); panel smoke (two seats, one worker session server) still to run at landing.

Status: DONE_WITH_CONCERNS
Summary: All five items done in six commits on `harden/t5-p07` with the three red rows green and the full suite clean except the known failure; one stale-run test missed by the focused set was fixed after the full run.
Concerns/Blockers: full suite not rerun after the last test-only commit; the landing panel smoke is not done; touched six files outside the phase's ownership list (registry row and tests listed above).
