# Phase 17: A woken head resumes its kept transcript, or opens fresh with the handoff

Depends on phase 16. Decision: D3 of the settled discussion
`ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads` (§4, owner 15:56): on wake, resume the kept transcript
in the new launch's private home when the context was below `sessionRotation` soft and the same provider binds, with a
wake line to re-read plan and git first; otherwise, or when the transcript was not kept or the resume is refused, a
fresh session with the handoff. This is the wake half of phase 6's hand-off item (e).

## Inputs

- `src/session-host/head-start.mjs` (`startHeadSession`, `placeHead`, `defaultHandoff`, `defaultOpening`; the start
  reads the old `placement.json` before it replaces it).
- `src/runner/dispatch/confinement/authority-twin.mjs`: `seatSessionDir` (where the predecessor's kept transcript is),
  `keepSessionBeforeRemoval` (its warnings `session-dir-undeclared`, `session-not-written`, `session-copy-failed` mean
  no transcript), `bindPlanResources` (the private home and its `sessionDir`).
- `packages/execution/engine/src/transport_round/session_attempt.rs` and
  `apps/fgos/src/wiring/unit_run_host/session_attempt.rs` (the head launch behind `launchSessionInHost`).
- `core/config-standard/runner.yaml` (executor `credentialStore.sessionDir`), `src/runner/dispatch/provider-capacity.mjs`
  (`CREDENTIAL_STORE_KEYS`), `core/config-standard/sessionRotation.yaml` (the `soft` threshold).

## Footprint

`src/session-host/head-start.mjs`, `src/runner/dispatch/confinement/authority-twin.mjs`,
`src/runner/dispatch/provider-capacity.mjs`, `packages/execution/engine/src/transport_round/session_attempt.rs`,
`packages/execution/engine/tests/transport_round.rs`,
`apps/fgos/src/wiring/unit_run_host/session_attempt.rs`, `apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs`,
`core/config-standard/runner.yaml`, `core/config-schema/runner.schema.yaml`, `test/session-host/head-start.test.mjs`.

## Steps

1. Executor config gains `credentialStore.resumeArgs` (a list of argv tokens with one `{sessionId}` placeholder; set
   for the Claude executors, absent for the rest). No default is registered anywhere else. An executor without it never
   resumes.
2. In `startHeadSession`, when the old record has `retiredReason: sleep`, decide the wake: resume only when all hold:
   `contextFraction` is below `sessionRotation` soft, the new binding's provider equals the old record's provider,
   `resumeArgs` is set, `cliSessionId` is set, and `seatSessionDir(old runDir)` names a kept transcript. Otherwise
   fresh, which is today's start with the latest handoff. Record the choice and its reason code in the new
   `placement.json` as `wake: { mode: resume | fresh, reason }`.
3. Resume: the launch request carries `seedSession: { from, sessionId }`; the private-home binding copies the kept
   transcript into the new home's `sessionDir` before the CLI starts, and the launch appends `resumeArgs`. The opening
   text is the wake line: re-read the plan and `git worktree list`, reuse `<plan dir>-p<NN>`, then continue.
4. A refused resume (the CLI exits within its first turn naming the session, or the copy fails) falls back to a fresh
   start with the handoff in the same `session start` call, `wake.reason: resume-refused`. The fallback is proven by
   a fake CLI that refuses; a signed thinking block's replay under another account is not assumed (discussion §3 row 9).

## Verify

`node --test test/session-host/head-start.test.mjs`, `cargo test -p fgos session_attempt` (the wiring's
session-attempt unit tests) and `cargo test -p fgos-execution-engine --test transport_round`. Pass: a slept head below soft with the same provider launches with `resumeArgs` and a
seeded home; above soft, another provider, no kept transcript or no `cliSessionId` each start fresh with the handoff
and name the reason; a fake CLI refusing the resume ends in a fresh start with `resume-refused`.

## Rollback

Revert the phase commit; every wake then starts fresh with the handoff (phase 16 keeps writing it). `resumeArgs` leaves
config with the revert.
