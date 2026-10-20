# Phase 06 — Playbook proposer on admission, Shape C, case verbs (F6, F12)

Status: done (report: plans/reports/phase-lead-261019-1814-workflow-case-p05-p06.md); the live `council-lite` run and the stored-run cross-check are the big lead's step 4.

## Context

- Spec RUL-WF-9, -10, -18, -19, -20, -24, §5.4 Shape C (owner 2026-10-19 12:20), §7.1, §7.4–7.6, §8 rows `workflow start <playbook>`, `--units`, `answer` while proposer lives, `status`/`resume`, `close`; §9 row "vòng `advanceWorkflowRun` … viết lại … tách `src/workflow/runner.mjs` theo vai trong cùng commit"; §2.1 (physical name `src/workflow/runner.mjs` stays until a separate L10 step); battery 8, 9 (playbook half), 10, 12, 14, 22, 25.
- Code: `src/workflow/runner.mjs` (1408): roles today — seat/handoff helpers `:52-234`, write-chain + scope `:234-366`, loop `advanceWorkflowRun` `:387-~800` (`acceptOutcomes` `:738`, `runUnit` `:668`, `:688`), lock/liveness helpers `:819-930`, detached spawn `:932-965`, start sources `:966-1107`, verbs `startWorkflow` `:1150`, `statusWorkflow` `:1175`, `answerWorkflow` `:1202`, `recordGateAnswer` `:1229`, `resumeWorkflow` `:1355`; `src/workflow/index.mjs` (barrel); CLI `bin/fgos.mjs` workflow verbs (`:2278-2352`), `src/cli/command-registry.mjs` workflow entries.
- Depends on 02 (hold-gated append), 04 (guide model + playbook normaliser), 05 (projection, predicate, gate-answer file, `drainCaseInbox`, bindings).

## Requirements

1. **Split by role (F12), same commit as the rewrite.** `src/workflow/runner.mjs` keeps only the Playbook proposer loop (physical name stays, §2.1). New files: `unit-handoff.mjs` (handoff/seat/pattern/override helpers), `case-lock.mjs` (`advance` acquire/hold/liveness, `drainCaseInbox` wired inside acquire), `case-start.mjs` (start sources: preset id, `--units`; detached spawn), `case-verbs.mjs` (start, status, answer, resume, close). `index.mjs` re-exports; every importer moved (L10); manifest ranks: proposer + verbs use-case, the rest infra.
2. **Proposer** (RUL-WF-18): holds `advance` for its whole life (unchanged lock use; existing tests at `test/workflow/workflow-runner.test.mjs:533-643` keep passing). Each cycle: drain inbox → project → take the single SHOULD among eligible activities at listed-routes-only points → admit through the 05 predicate **using its held `advance`** (never re-acquire; battery 25) → append `route` + `reservation` (fsync) → `runUnit` exactly as today (same options, worktrees, seats, handoffs) → settle (receipt, counters, milestones) → re-read. Observable order identical to today (phase 01 guard + stored-run cross-check).
2b. **Open** (§7.1): `start` appends `case.opened` with the guide snapshot, the frame (guide defaults narrowed by flags, never widened), `request-received` achieved with the request digest, and binds the known worktrees (05 bindings, under the case's `advance`). A `kind: playbook` guide spawns the proposer as today; a `kind: guide` guide opens a **conductor case** and returns its `caseId` with no driver (admission into it through the doors arrives in 08).
3. **Waves** (RUL-WF-19): a playbook step's unit set, and a `--units` file, are declared waves; "one Unit outside `acceptOutcomes` fails" stays only inside the wave that declares it (today's playbook behaviour unchanged); `findings` never fails a case by itself.
4. **`answer`** (§5.4 bullet 4, RUL-WF-24): writes the gate-answer file (05), then tries `advance` once. Acquired → drain appends `gate.answer`; playbook case with no live proposer → becomes/spawns exactly one proposer (today's detached path); conductor case → release. Held → return `{ recorded: true, appliedBy: 'live proposer' }`; the proposer appends `gate.answer` at its next re-read (after each settle, and once, bounded, before exit) **before** acting on it. No other ledger write by `answer`.
5. **`status`** = projection (F6): milestones with digests, eligible + listed routes + unlisted path, frame remaining, open gates, live reservations. Playbook case: `running` = `advance` held (today). Conductor case: `running` = at least one live reservation (attempt not quiet); no stale hint, no resume suggestion because `advance` is free. Legacy stored runs keep today's fields readable.
6. **`resume`**: playbook — spawn a proposer only when nobody holds `advance`; conductor — take `advance` once, drain gate-answer/settle-pending files, release; never spawns a driver.
7. **`close`** (new verb, F6): refused while a closure milestone is `stale` or a consent gate is parked; appends `case.closed`; closing with live attempts keeps their bindings (unbind later, generation-checked, 05).
8. **Restart** (§7.6, battery 22): a new proposer adopts live unit runs (`canResumeUnitRun` `:1139` / `resumeUnitRunId`) before replacing their work; a reservation is not released by proposer death.
9. **Snapshot** (RUL-WF-9, battery 10): a run keeps its pinned guide when the YAML changes; resume reads the snapshot only.
10. CLI: `fgos workflow close <id>`; `status` output gains the projection block; `command-registry` text updated; CHANGELOG line.

## Files

- Modify `src/workflow/runner.mjs` (reduced to the proposer), `src/workflow/index.mjs`, `bin/fgos.mjs` (workflow verbs incl. `close`), `src/cli/command-registry.mjs`, `docs/architecture-manifest.json`, `CHANGELOG.md`.
- Create `src/workflow/unit-handoff.mjs`, `case-lock.mjs`, `case-start.mjs`, `case-verbs.mjs`.
- Tests: retarget `test/workflow/workflow-runner.test.mjs`, `units-runner.test.mjs` imports to the barrel; new `test/workflow/playbook-proposer.test.mjs`, `case-verbs.test.mjs`; `test/cli/fgos-workflow.test.mjs` (close, status shape).

## Steps

1. Move helpers out verbatim first (pure move commit inside the phase branch; tests green), then rewrite the loop on the predicate; squash at landing only if the lead prefers one commit.
2. Wire `drainCaseInbox` into the `case-lock` acquire wrapper; delete the old direct append in `recordGateAnswer`.
3. Verbs; CLI; registry text.
4. Big lead: stored-run cross-check (phase 01 step 4) again; `fgos workflow start council-lite` live once on the owner machine, compare its order with the 8 stored council-lite runs.

## Tests (battery → test)

- 8 a Unit returning `findings` in a conductor-shaped fixture case does not fail the case; inside a declared wave it does.
- 9 playbook: `status` `running` while `advance` held; restart from JSONL + pinned guide + frame + unconsumed gate-answer files only (no chat state).
- 10 YAML edited mid-run → resume uses the snapshot.
- 12 guard identical; seat counts unchanged (ceiling enforcement lands in 07).
- 14 concurrent resume + answer → exactly one proposer; `answer` while proposer lives appends nothing; `gate.answer` precedes the action on the ledger; an answer arriving as the proposer exits is picked by the next resume.
- 22 kill the proposer while a worker lives → reservation not released; next proposer adopts the unit run.
- 25 proposer admits and settles with its held `advance`; no self-refusal.
- `close` refusals (stale closure milestone, parked consent gate).

## Risks / rollback

- Risk (H×H): order drift in a playbook (fan-in steps, seat providers, handoffs). Mitigation: phase 01 guard, pure move before rewrite, stored-run cross-check, live council-lite run.
- Risk (M×M): answer race at proposer exit loses an answer. Mitigation: bounded final drain + resume picks files (battery 14 last clause).
- Risk: helper move breaks imports in tests that reach into `runner.mjs` internals — re-grep `from '../../src/workflow/runner.mjs'` in `test/`.
- Rollback: revert the phase commit(s); ledger events added here (`route`, `reservation`, `settle`, `case.opened`, `case.closed`) are ignored by the old fold only if it tolerates unknown kinds — phase 05's fold must; verify the pre-06 code reads a post-06 run (status only) before landing.

## Done when

All listed tests, guard, A4, kernel isolation and full `npm test` green; live council-lite run matches stored order.
