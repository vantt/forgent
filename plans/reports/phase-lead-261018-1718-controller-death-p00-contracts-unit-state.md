# Phase P00: contracts for unit state, signal cancel, recover adopt

Status: DONE_WITH_CONCERNS (concerns are hand-offs to later phases)

## Delivered
- `packages/run-supervisor/contracts/unit-state.v1.json` (new): unitState, attemptState, resume rules, signal exit codes 130/143, `dispatch.cancelWaitMs`, deferred automatic resume with seam named (controller.json + exclusive attempt mkdir).
- `cancel-requested.v1.json`: added `by` (signal:SIGINT|signal:SIGTERM|recover) and `requester` tuple; kept `requestedBy`, `at`. Rust reader reads only `attemptId`, no writer existed in src.
- `recover-actions.v1.json` (new): `adopt` beside `resume-driver`, `reassign-driver`.
- `test/run-supervisor/contracts-unit-state.test.mjs` (new).

## Decisions
- attemptState also names `abandoned-before-brief` (receipt outcome) and `abandoned-legacy` (doctor fix only, never from the probe).
- Missing controller.json judges `unknown`, so unit stays `running` (unknown = keep).
- `at` kept as the request time instead of renaming to `requestedAt`: no compat break for existing fixtures.
- `by: recover` reserved; no recover action cancels a live attempt yet.

## Evidence
- `node --test` contracts-unit-state, contracts, contracts-terminal: 22 pass, 0 fail, on phase branch and again on integration after merge.
- Sonnet review run; plan/phase labels in contract text removed, gaps above settled.
- No src/*.mjs added: architecture test not required. No existing symbol edited (no impact run needed).

## Hand-offs
- Doctor/setup phase: generalize `gate-kill-grace.mjs` reader for `cancelWaitMs` (no parallel reader); register key in setup/doctor.
- Recovery phase: extend RECOGNIZED_EVIDENCE_TYPES with outbox result evidence.
- Not pushed; CI branch push for `controller-death/**` is the big lead's call.

## Unresolved questions
- None.
