---
phase: 3
title: "herdr session identity for reaper and recovery"
status: done
budget: "<= 70 added src lines; 0 new files; field herdrSession on launch-command record and ownership marker"
stop: 2026-10-13
---

# Phase 03: herdr session identity for reaper and recovery

## Context

- [plan.md](plan.md); [confinement-authority.md](../../docs/specs/confinement-authority.md) §8.6 (reaper checks liveness before cleanup).
- Reaper pane check uses ambient env: `src/runner/dispatch/confinement/cleanup.mjs:172-182`; rules `:256-273`; runs at every `fgos run` (`src/runner/execution/run.mjs:147`), loop (`src/runner/loop.mjs:1430`), doctor (`src/setup/registrations.mjs:5306`).
- Marker gets `paneId` only on failure: `cleanup.mjs:72-81`, `confinement/authority.mjs:1172`.
- Resume reconcile with no env: `assignment-runner.mjs:1977` -> `herdr-reconcile.mjs:212-213`. Launch record writer: `herdr-reconcile.mjs:66`. Pane split: `herdr-round.mjs:1664-1676`; round session key `:1580`.
- Session helpers: `socketPathForSession` (`worker-session.mjs:62`), fixed worker session `fgos-worker` (`worker-session-boot.mjs:28`).
- Prior evidence: [rows 8, 9, 15](../../archive/reports/discussion-advisory-approach-current-261008.md).

## Requirements

- Launch-command record stores `herdrSession` (name of the session the pane was split in; socket is derived, never stored).
- `reconcileHerdrSpawnRun` without an explicit client builds its client for the recorded session. Fix lives there once, not in each caller.
- Ownership marker gets `paneId` + `herdrSession` as soon as the pane exists (not only on failure), so a controller death mid-flight does not let the reaper delete a live worker's home.
- Reaper asks the marker's session (honouring `FGOS_HERDR_BIN`). Marker without session -> pane state unknown -> existing expiry rule decides.
- No lease, no journal, no controller-alive rule.

## Files

- Modify: `src/runner/dispatch/herdr-reconcile.mjs`, `src/runner/dispatch/herdr-round.mjs` (pass session to record; bind marker after split), `src/runner/dispatch/confinement/cleanup.mjs` (marker field; session-aware pane check; `markResourceRetained` renamed if its meaning becomes "bound to pane", no alias), `src/runner/dispatch/confinement/drivers/bwrap.mjs` (expose the bind handle), `src/runner/dispatch/confinement/authority.mjs` (pass the handle to the transport, only if needed).
- Tests: `test/runner/herdr-reconciliation.test.mjs` (T3), existing reaper tests in `test/runner/dispatch-confinement-credential-hygiene.test.mjs`, `test/setup/confinement-doctor-checks.test.mjs` stay green.
- Docs: `docs/specs/confinement-authority.md` §8.6 one sentence (reaper and recovery address the worker's recorded herdr session).

## Steps

1. Impact analysis on `reapOrphanedConfinementResources`, `reconcileHerdrSpawnRun`, `createHerdrLaunchCommand`, `runHerdrRound` (expect HIGH: warn Lead before editing).
2. Session field on launch record; reconcile client from it.
3. Marker bind at pane creation. Descope rule: if reaching the bind handle from the round needs > 25 lines of plumbing, ship steps 2+4 only and file early binding as its own item.
4. Session-aware `defaultPaneOpen(paneId, session)`.
5. T3 with a fake `FGOS_HERDR_BIN` that lists panes only when `HERDR_SESSION=fgos-worker`: ambient env = another session; resume reconcile finds the live pane; reaper keeps the home; after the pane closes the reaper removes it.
6. Spec sentence; independent review; merge.

## Done

T3 green, run by Lead, plus `npm test`.

## Risks / rollback

- herdr-round is GitNexus-CRITICAL territory; keep the diff to record fields and one call.
- Records written before this phase lack `herdrSession` -> treated as unknown (expiry rule); acceptable, single user.
- Rollback: revert; extra fields are ignored by the old reader.
