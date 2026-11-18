# Phase 7f: The secretary head runs in the leads' permission mode

Owner decision 2026-11-19 02:2x (via supervisor, option 1): the secretary head runs in the same Claude permission mode
as the leads (bypass / skip-permissions, inside its sandbox), so a peer's SendMessage to it is delivered instead of
being held for approval. Seen 2026-11-19: a supervisor message to Miu gen 8 was held and expired because the modes
differed (leads bypass, Miu auto). Depends on phase 7e (shares `src/session-host/**`, its tests, the session-host spec
and CHANGELOG).

## Inputs (read first)
- How a head's CLI invocation and permission mode are chosen: `src/session-host/head-start.mjs`,
  `src/runner/dispatch/session-attempt.mjs`, `src/runner/dispatch/worker-home.mjs` (`permissionMode` 'ask'|'bypass',
  :61-144), `transport.mjs:225`, `resolve.mjs` (`permissionMode` from the executor's cli invocation),
  `core/config-standard/runner.yaml` (personas, executors), the schema.
- Prior art: `git log -S permissionMode` and the confinement spec's rule for bypass inside a sandbox.

## Steps
1. Decide the one place a head's permission mode comes from (persona setting in the release standard, read through the
   config door; or the head launch) by what exists; the secretary persona gets `bypass`. No other persona changes.
2. The head launch carries it through the existing `permissionMode` path (no new flag path); bypass still runs only
   inside the head's confinement.
3. Tests: one owning proof that the secretary head's launch carries bypass (and a shaper head does not, unless its
   persona says so); config standard/schema tests.
4. Specs: session-host (head permission mode) and agent-confinement (bypass inside the head sandbox; owner decision);
   CHANGELOG `[Unreleased]` one line.

## Verify
- Focused Node session-host, dispatch and config tests; architecture test; census scan.
- Live after release + Miu restart: a lead's SendMessage to Miu is delivered without a held-for-approval prompt.

## Rollback
`git revert`; the head returns to its previous permission mode.
