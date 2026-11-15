---
phase: 12
title: "S3 close: docs, proof consolidation, parity re-run, gates"
status: pending
effort: 1d
wave: D
step: S3
blockedBy: [7, 8, 9, 10]
---

# Phase 12: S3 close

As phase 11, for S3. S3 lands after S2: this phase runs its gates once on the S3 integration head, and the step lead
reruns them after rebasing onto `main` (after S2 and phase 13).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s3-p12`. Report slug `s3-p12-close`.

## Requirements

1. **Parity re-run, then deletion** of the S3 tables (`events`, `session`, `gateway`, `agents` under S23-Q1 = a), the
   S3 runner, the S3 base worktree and its target `rvm-s3-base-target`, as phase 11 requirement 1.
2. **Retired-code row** "retired Node S3 verb code" (allowed: none): `\bsyncUseCase\b`, `\bstatusUseCase\b`,
   `\bsealUseCase\b`, `\bexportUseCase\b`, `\bstartGateway\b`, `\bstopGateway\b`, `\bgatewayStatus\b`,
   `\bGatewayControlError\b`, `\bcreateSession\b`, `\bendSession\b`, `\breclaimOrphanedSessions\b`; under S23-Q1 = a
   nothing for `agents` (its modules stay as adapters).
3. **Docs:**
   - `docs/platform/event-store/spec.md`: the child paragraph near 454 (children are started from the host binary by
     both lifecycle wrappers; the Node wrapper resolves the host), decision history entry.
   - `docs/platform/runner/spec.md` (the session paragraph: the registry's owner is the host module, D7; the atomic
     write; Node's readers are clients of `session list`), `docs/platform/identity/spec.md` (177: the registry's writer
     moved; identity still reads it), and `docs/reading-map.md` row 174 (`src/runner/session.mjs` is a client; the owner path).
   - `docs/explanation/fgos-gateway-lifecycle-verb.md` and `docs/platform/herdr-web-dashboard/spec.md` 78, 239: same
     verb, served by the host; `AGENTS.md` "Starting the fgos gateway" only if a sentence names Node.
   - `docs/reading-map.md` row 190 (Event Store: `src/verbs/events/` gone but `rebuild`) and new source paths.
   - `docs/platform/host-invocation-routing/spec.md` §2 counts and the descriptor recount, recomputed after the rebase
     onto `main` (never merged with S2's numbers).
4. **Proof consolidation** as phase 11 requirement 4 (owners from 07-10).
5. **Gates** on the S3 integration head, then again after the rebase onto `main`: plan.md exit criteria 7 (children),
   8 (all gates) and 9 (`events status`, `session list`, `gateway status`).
6. **File-set check** and **hand-off** lines (`events`, `session`, `gateway` native; Event Store children start the
   host; `sessions.json` written atomically; S23-Q1 = a: `agents` native).

## Files

- Modify: the docs above, `docs/architecture-manifest.json`, `plan.md`, census, drift baseline (only if asked).
- Delete: the S3 runner and tables.

## Risk and rollback

- Rebase onto `main` after S2 conflicts in host list files (H x L): additive lines; regenerate generated files; rerun gates.
- Rollback: revert the phase; S3's code stands.
