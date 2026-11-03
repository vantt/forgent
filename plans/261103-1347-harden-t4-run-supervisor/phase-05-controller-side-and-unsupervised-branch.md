---
phase: 05
title: "Controller side: cancel written for a launching attempt (B-4), binding wait derived (B-5), lazy step import and no Node re-check (S7), one settled-result reader (S12); delete the non-supervised branch and the http adapter (decision 59 answer 4a)"
status: pending
depends_on: [02, 03]
parallel: "wave 2, with phase 04 (disjoint files); may also run beside phase 01 if 01 has not landed (disjoint files)"
effort: ~1.5d
net_size: "Node −236 / Rust 0 / tests −130 (estimate)"
---

# Phase 05 — Controller side and the non-supervised branch

## Context

[plan.md](plan.md) fact 4; arbitration §3 rows B-4, B-5 = RT4-04, S7 = speed B-5, S12; decision 59 answer 4a (the SEAT lane is closed, HARDEN edits `assignment-runner.mjs` and `settlement.mjs`). Correctness B-4, B-5; red-team RT4-04; simplicity S7, S8, S12; speed B-4, B-5; RT-P11, RT-P13.

Code read on `fcd42ecdc`:
- `src/run-supervisor/cancel-registry.mjs:107-141`: the first signal writes `cancel-requested.json` only for `delivered` dirs (`:120`) and waits for `launching` ones to bind (`:128`, deadline `cancelWaitMs`). The envelope exists before `beginAttemptLaunch` (`assignment-runner.mjs:2088` then `:2105`), so `requestCancel` (`:85-99`) can read its `attemptId` at once.
- `src/run-supervisor/direct-launch.mjs:26` `BINDING_WAIT_MS = 30_000` equals the supervisor's own terminal start budgets: shell ready 10 000 (`terminal-control route.rs:48` `DEFAULT_SHELL_READY_TIMEOUT_MS`), identify 5 000 (`:47` `DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS`), HELLO 15 000 (`supervise.rs` `HELLO_LIMIT`), plus herdr call time.
- `src/run-supervisor/attempt-step.mjs:14-17` imports all three step modules; `:64-72` re-checks digest, step id and env; `verifyPayload` `:34-49` re-checks `payloadRoot`, host existence and the release manifest. The route already verified the envelope, host and step id and execs exactly `<payloadRoot>/src/run-supervisor/attempt-step.mjs` (`attempt_step.rs:23-47`); only the release-manifest cross-check (`:45-48`) and the step environment check are Node-only. `step-support.mjs:22-34` (`readEnvelope` digest check).
- Settled-result reader twice: `settle-attempt.mjs:39-48` (`settledResultOf`) and `direct-launch.mjs:338-345` (`readSettledResult`, also imported by `assignment-runner.mjs:95,1605,2121`). Both import `interpretRunResult` from `src/runner/dispatch/run-result.mjs`.
- Non-supervised branch `assignment-runner.mjs:2173-2290` (else, then `runMeta` and `settleRunOutcome` for it); `supervised` `:1731-1735`. `httpAdapter` `transport.mjs:603-650`, registered `:700-702`; `via: 'api'` `config.mjs:650`, validation `:843-`. No config in `core/`, `domains/`, `.fgos/config.json` or `~/.fgos/config.json` uses `adapter: http` or `via: api`; tests do (`test/runner/dispatch.test.mjs:1079-1215`, `dispatch-production-call-sites.test.mjs:169-200`, `dispatch-confinement-authority.test.mjs:125`). `kind: 'http'` executors (`dispatch.test.mjs:1977`) are a different axis and stay.

## Requirements

- **B-4.** The first signal writes `cancel-requested.json` for every attempt in `delivered ∪ launching` at once; the "wait for the binding, then cancel" branch goes; the wait covers the receipts of every attempt asked. The header comment (`:1-7`) says so.
- **B-5.** `BINDING_WAIT_MS` = the three named Rust budgets + 15 000 ms slack (45 000), one constant whose comment names the three Rust constants; the spec line goes to H-T4g.
- **S7.** `attempt-step.mjs` imports only the named step module (`await import()` from a three-entry map). Node keeps only what the route cannot prove: the step environment (`REQUIRED_ENV`) and the release-manifest cross-check. `readEnvelope` parses without re-hashing; `verifyPayload` keeps only the manifest check. The refusals the route now owns get their owning proof in Rust (a move, see Tests to retire).
- **S12.** One `readSettledResult(runDir, runId)` in `run-result.mjs` (beside `interpretRunResult`); `settle-attempt.mjs`, `direct-launch.mjs` and `assignment-runner.mjs` import it from there; both copies go. The settle step must not import `direct-launch.mjs` (RT-P13).
- **4a.** Delete the non-supervised branch and the code only it reaches (`rawResult`, `executionError`, its `runMeta`/`settleRunOutcome` tail, imports left unused); a non-supervised adapter is refused by name where `supervised` is computed (`:1733`; one `DispatchError` code, e.g. `supervised-adapter-required`, listed in the CHANGELOG). Delete `httpAdapter` and its registration; delete `'api'` from `INVOCATION_VIA` and its validation branch (L10: its only adapter goes; a config naming it is refused by the existing unknown-`via` error). Before deleting, record the output of `rg -n "adapter: *['\"]http|via: *['\"]api|\"via\": *\"api\"" core domains src .fgos ~/.fgos/config.json`. `executeExecutorCli` stays (other callers: `dispatch.mjs`, `work-dispatch.mjs`, `cli.mjs`, `prepare.mjs`, `executor-governance.mjs`, `result-ladder.mjs`, `work-compat.mjs`).
- After 4a, list the callers of `resolveWorkerArtifactPath` and `settleRunOutcome`; if phase 02 left `resolveWorkerArtifactPath` with no caller, delete it here.
- `CHANGELOG.md`: `http` adapter and `via: "api"` removed; a non-supervised adapter is refused by name; a Ctrl-C during a slow launch now cancels it.

## Files

**Create:** none.

**Modify:**
- `src/run-supervisor/cancel-registry.mjs`, `direct-launch.mjs`, `attempt-step.mjs`, `step-support.mjs`, `steps/settle-attempt.mjs` (S12 import only)
- `src/runner/dispatch/run-result.mjs`, `assignment-runner.mjs`, `transport.mjs`, `config.mjs` (`worker-artifacts.mjs` only if its last caller went)
- Rust: the test that owns attempt-step route refusals (none today; `rg -n "attempt-step" packages/run-supervisor/rust/tests` finds only `release_slot_step.rs`), so the moved cases go into `tests/steps_runner.rs`
- Node tests: `test/run-supervisor/cancel-registry.test.mjs` (test 5, `:161`), `attempt-steps.test.mjs` (`:305`), `test/runner/dispatch.test.mjs`, `dispatch-production-call-sites.test.mjs`, `dispatch-confinement-authority.test.mjs`, and every test that drives the non-supervised branch (`rg -n "executeAssignment" test | xargs rg -ln "'http'"`)
- `CHANGELOG.md`, census

**Delete:** the non-supervised branch; `httpAdapter` and its registration; `'api'` in `INVOCATION_VIA` and its branch; `settledResultOf`; the Node re-checks in `attempt-step.mjs`/`step-support.mjs`; the wait-then-cancel branch.

**Tests to retire** (each with its new owner or "behaviour removed"):
- `test/runner/dispatch.test.mjs` "EXECUTOR_ADAPTERS registers adapters: cli-spawn (default), http, and herdr-spawn" (`:1079`): changed to two adapters, kept. The five `EXECUTOR_ADAPTERS.http …` tests (`:1107-1180`): behaviour removed (decision 59, 4a). The `via: 'api'` config cases (`:1185-1215`): behaviour removed; one case kept that `via: 'api'` is refused by name.
- `dispatch-production-call-sites.test.mjs` "http adapter routes through executeThroughConfinement …" (`:169`): behaviour removed.
- `dispatch-confinement-authority.test.mjs:125` loop over `['http']`: behaviour removed.
- Tests that drive the non-supervised settle: behaviour removed; the refusal-by-name case owns the new behaviour (one case, in the file that owns `executeAssignment` refusals).
- `attempt-steps.test.mjs` "the entry reports a missing step variable and a payload the envelope does not name" (`:305`): the step-variable half stays (Node-only); the payload and host halves move to `steps_runner.rs` as route refusals (owner there).
- `cancel-registry.test.mjs` test 5 is re-pointed ("a signal while an attempt is handed over writes its cancel request at once"), not retired.

## Net size

Node: B-4 −10, B-5 +2, S7 −25, S12 −10, 4a branch −120, `httpAdapter` −50, `via: api` −20, imports −3 → about −236. Tests: http and api cases −110, non-supervised settle cases −30, moved route refusals +10 → about −130.

## Steps

1. Find the owning tests for each item; record the `rg` evidence for 4a.
2. S12 and S7 (step entry), then B-4 and B-5.
3. 4a in one commit per file group (branch; adapter; `via`), each with its retired tests named in the body.
4. `node --check` on every touched file; FR on the files below; `test/architecture.test.mjs` and `test/runner/dispatch-reconciliation-import-graph.test.mjs` (import graphs move).
5. Measure the step import time before/after (`node -e "await import(...)"`, 3 runs, state the load).

## Validation (focused)

- FR `test/run-supervisor/cancel-registry.test.mjs test/run-supervisor/attempt-steps.test.mjs test/run-supervisor/direct-cutover.test.mjs test/run-supervisor/resume-adopts.test.mjs test/runner/dispatch.test.mjs test/runner/dispatch-production-call-sites.test.mjs test/runner/dispatch-confinement-authority.test.mjs test/runner/assignment-runresult.test.mjs test/architecture.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs`
- `cargo test -p fgos-run-supervisor --test steps_runner`
- `rg -n "httpAdapter|'http'|via: *'api'" src/runner/dispatch` → nothing; `rg -n "settledResultOf|function readSettledResult" src` → one definition in `run-result.mjs`
- `wc -l src/run-supervisor/*.mjs` ≤ 1 150 (acceptance criterion 2)
- census not higher.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A user config somewhere uses `adapter: http` or `via: api` | L × M | `rg` evidence recorded; refusal by name; CHANGELOG line; owner guide names it. |
| Deleting the branch removes a variable the supervised branch also reads | M × M | `node --check`, the supervised-branch tests (`resume-adopts`, `direct-cutover`, `terminal-cutover`) in FR. |
| Writing the cancel request before the binding reaches a supervisor that has not started its watch | L × L | The supervisor reads it on its first tick (`supervise.rs` `cancel_requested`); test 5 proves the file is on disk before the binding. |
| Lazy import changes error codes of a broken step module | L × L | A failed import maps to the same `internal` error line. |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change. A config using `via: api` would need the previous release.

## Done when

The branch, adapter and `via` are gone with their tests named; one settled-result reader; lazy step import measured; cancel written for launching attempts; binding wait derived; Node budget met; landed with a guide section.

## Lead brief essentials

Delete list above. Find the owning test before writing a new one. Record the 4a `rg` evidence before deleting. Δ-lines per language and step import time. All plan.md lead rules apply.
