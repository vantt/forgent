# Phase 05 — Herdr And Legacy Confinement Convergence

Depends on: Phase 04 closed.

## Objective

Bring the existing herdr session/home/worktree confinement behavior under the
Authority contract, or leave a precisely bounded partial-maturity marker that
tests and doctor expose. The target is no second runtime confinement door.

## Requirements

- R1: Normalize legacy herdr flags into v1 policy controls before runtime:
  `privateHome -> home: private`,
  `isolatedSession -> session: isolated`,
  `ownWorktree -> workspace: own`.
- R2: Route herdr-spawn execution through Authority exactly like cli-spawn.
- R3: Move any pre-adapter preparation that can move safely into backend or
  Authority prepare. If a piece cannot move yet, record it as partial maturity
  with a named mismatch and doctor finding.
- R4: Preserve herdr interactive behavior: round keywords, prompt delivery,
  status polling, pane visibility, exit command, timeout classification, and
  error reporting.
- R5: A legacy bypass/permissionMode route must still refuse unless its full
  legacy protection is represented and satisfied.
- R6: Authority attestation for herdr routes must never call external-harness or
  local lifecycle hygiene "OS confinement" unless backend coverage proves it.

## Files

Likely touch:

- `src/runner/dispatch/herdr-round.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/confinement/**`
- `test/runner/herdr-spawn-adapter.test.mjs`
- `test/runner/dispatch-production-call-sites.test.mjs`
- `src/setup/registrations.mjs`
- `docs/specs/confinement-authority.md` if the partial maturity statement changes
- `CHANGELOG.md`

## Verification

- Existing herdr interactive tests remain green.
- Legacy partial confinement no longer returns success-shaped unconfined result.
- Doctor reports herdr confinement maturity separately from bwrap backend
  readiness.
- Capability annotation for this cell: `code:implement`.

