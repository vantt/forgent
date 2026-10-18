# Phase report: 6.4 P00r, re-check against the landings

Status: DONE. Docs only; no build, no tests (shared machine with the 6.3 full suite).

## What changed
- `plans/261016-1351-controller-death-settle-and-resume/plan.md`: new section `CẮT LẠI 2026-10-18` (prerequisites, moot steps, per-phase deltas, files other lanes move, run order).
- `.github/workflows/process-containment.yml`: push trigger now includes `controller-death/**`.

## Findings that change the phases
1. `executeAssignment` already has a resume branch (adopt, settled result, named refusals). `runUnit` does not use it: no `retryId`, and `unit.json` records an attempt's `runId` only after the attempt returns. P02's real work is wiring unit resume to that branch, finding the attempt by assignment dir.
2. Pre-6.2 runs are refused by name (`legacy-run`/`run-unreconciled`) today; the old P02 "rerun with warning" contradicts it. Kept the landed behavior.
3. 6.3 already made `result-*.json` a recognized `worker-result` in `collectEvidence`; P03 still adds the `adopt` recommendation.
4. `cancel-requested.json` is only honored by the supervisor when `attemptId` matches: P01 must write it.
5. `inspectRunControl` exists; P00's `controller.json` only if it cannot tell a dead controller.
6. N7 (cwd lease through runner commit) moved to Git plan phase 04 (owner 10-18 10:05): D5 and open question 1 are moot.
7. No 6.4 phase edits `publish.rs`, `store.rs`, `envelope.rs` (to be moved by Git/ES after 6.3).

## 6.3 facts used (per terminal-mode/integration @6f2e922bf)
Removed `herdr-reconcile.mjs`, `liveness.mjs`, `worker-session.mjs`; `recovery-planner.mjs` recognizes `result-*.json`; `run.mjs` `sweepAttempts` call without `tempRoot`; terminal crash matrix test exists. Big lead re-checks after the 6.3 landing.

## Decisions
No D-ADR numbers used (0057 collides). Impact analysis: none, no symbol edited.

## Unresolved
- Does the unit-level `mkdir` exclusivity (D6) still add anything over `admitRunAttempt`? Left to P02.
- ~2100 open attempts count comes from the brief, not re-measured.
