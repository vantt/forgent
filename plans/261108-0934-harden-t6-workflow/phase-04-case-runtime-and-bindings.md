---
phase: 04
title: "Case runtime and bindings: a writing reservation proven dead is released, the gate's child dies with it, reservation files go, binding repair runs on the case's own normal path, the inbox reads safely, and advance.log holds progress only"
status: pending
depends_on: [03, "08 landed before the drain-release commit"]
parallel: "wave 2, with 05, 06, 07, 08, 09"
effort: ~1.5d
net_size: "Node −75 / Rust 0 / tests +70 (estimate)"
---

# Phase 04 — Case runtime and bindings (B-2, B-13, B-7, B-8, doctor P09 Workflow half, R-9 inbox, B-17, R-3, simplicity 13/14)

## Context

Arbitration §2.1 rows B-2, B-13, B-7, B-8, R-9 (inbox), B-17, R-3, simplicity 13 and 14 (admission port and case files); §1 Admission ("crash-left binding records are settled on the Workflow normal path under the case's `advance`, not by `doctor --fix`"); §3 row doctor P08/P09; doctor plan [P09](../261106-1216-doctor-readiness-only/phase-09-work-handoff.md) requirement 2 ("the check becomes a read section of a Workflow verb, the repair runs on the Workflow normal path … before the fix leaves `doctor --fix`; the sentinel-only repair stays a readiness fix"). P01 already took the round's `stepId` from its directory (same lines).

Code read on `595faa273`:
- B-2: `reservationQuiet` `case-runtime.mjs:61-65` (no caller; returns true for a falsy `worktree`); `drainCaseInbox` `:216-256` returns early when neither inbox directory exists (`:217-218`); called from `tryAcquireAdvanceLock` (`case-lock.mjs:70`) and admission (`case-admission-port.mjs:272`); `applySettle` `:81-93` (reads the reservation file `:85`, removes it `:89`); `writes-overlap` against live reservations (`case-admission.mjs:187-193`); gate `runCaseGate` `case-gate.mjs:100` `runCommand(verify, realWorktree, limit)` — `runCommand(command, cwd, timeoutMs, { custody })` exists (`src/runner/goal-check.mjs:51`). The reorder of custody before `port.admit` is P08's (`unit-run-start.mjs:367,387`).
- B-13: `writeReservationFile`/`removeReservationFile`/`readReservationFile`/`readReservationFiles` `case-runtime.mjs:41-59`; written at `case-admission-port.mjs:285` (a Unit asked again re-binds and rewrites the file, `:276-287`, with no new event) and `:317`; the ledger already records every bind as a `binding` event with key, generation and worktree root (`case-bindings.mjs:138`) and every unbind (`:161`).
- B-7/B-8 and P09: `checkWorkflowCaseBindings` `src/setup/workflow-case-checks.mjs:70-98`, `fixWorkflowCaseBindings` `:100-124` (visits only `casesWithBindings` `:33-49`, B-7); `repairCaseBindings` `case-bindings.mjs:181-197` handles only `pending` (B-8); `unbindWorktree` appends `unbound` then unlinks `:151-166`; `readBinding` answers `binding-unsettled` `:78-90`; admission calls `readBinding` under its own `advance` (`case-admission-port.mjs:271,305`).
- R-9 inbox: a `settle` from any `settle-pending/*.json` is applied (`:229-235`) even with no `reservation`; `readJson` `:27-33` follows links and blocks on a FIFO; T5 rule: host reads of files another process can write go through `readAgentFileSync`.
- B-17: "already being advanced" has no code (`case-lock.mjs:45-50`); an unreadable `settle-pending` file is skipped silently (`:231`).
- R-3: the detached advance child (`spawnDetachedCli`, `case-start.mjs:129`, stdout and stderr to `advance.log`) prints its whole JSON result; progress lines already go to stderr (`runner.mjs:68`).
- Simplicity 13/14: `caseEnvOf`, `nextGeneration`, `GATE_ACTIVITY`, `reservationQuiet` (kept, loses its export); `bindingsDir` imported twice and the `'.root'` literal (`case-admission-port.mjs:23,27,142`); `worktreeFacts` alias `:31`; the holder-list twin `advanceHolderPid`/`liveAdvanceHolder` (`case-lock.mjs:27-43`); duplicate bind blocks `:278-287`, `:310-318`; `refusal(...).refused` wraps.

Not reproduced at arbitration, so **red first**: B-8 (the FR runner stages the addon for a hold), R-9 inbox (a settle with no reservation; a FIFO in `settle-pending`), B-17 (codes), B-13 re-admit (admit → kill → drain → re-admit → settle leaves no binding), B-2 with **no inbox directory present**.

## Requirements

1. **B-2 release, on positive evidence (RT-15, RT-16).** On every hold (`tryAcquireAdvanceLock` and admission), before and independent of the inbox early return, release as `not-started` through `applySettle` each live reservation for which all hold: it has a writing worktree (`worktree` not null); that worktree's custody listing is readable and empty (`dispatchCwdHolder`; an unlistable or unknown holder is not quiet); its Unit run is not resumable (no `unit.json` found through the assignment layout resolver `assignmentDir`, or a settled one) or it is a `gate-run-` reservation. A read-only reservation, a reservation with no worktree, and anything not proven dead stay. `reservationQuiet` becomes this predicate. This commit lands only after P08's reorder.
2. **Gate lease.** `runCaseGate` takes the worktree custody lease (`admitSuccessor`, the door `runUnit` uses) before admitting and holds it through `runCommand(..., { custody })`, so a killed gate's child dies with it and its reservation is provably dead. No edit to `goal-check.mjs`; lead:ES told.
3. **B-13 without a new field (RT-17, RT-24).** The four reservation-file functions go, with no compatibility read (owner decision 1: add no new fence; the plan's on-disk table carries the rollback step). `applySettle` takes the binding to release from the ledger: the case's latest `binding` event with `state: 'bound'` for the reservation's worktree root. A Unit asked again that re-binds is therefore covered without writing anything new.
4. **One bind-and-reserve block** (`bindIfWriting`) and one `refusal` wrap in `createCaseAdmissionPort` (≤ 110 lines).
5. **Bindings on the case's own normal path (doctor P09 Workflow half, RT-18).** One judgment reader `inspectCaseBindings(mainRoot)` in `case-bindings.mjs` (today's check body, every condition kept: record unparseable, pending, not bound on its ledger, of a closed case; open case bound with no record; ledger unreadable after `retryTail`), used by `checkWorkflowCaseBindings` (row id and registration unchanged) and by P11's `workflow status` section. `repairCaseBindings` iterates records, not cases with a `binding` event (B-7), and removes a committed record whose ledger's last event for its key is `unbound` at its generation (B-8). Repair runs only under the owning case's own hold: in that case's hold (the B-2 pass) and in its close. `readBinding` stays pure: its `binding-unsettled` refusal names the owning case and says `fgos workflow resume <case>` or `close <case>` settles it. `fixWorkflowCaseBindings` keeps only the sentinel repair (readiness); its settle/rebuild half is deleted from `src/setup`.
6. **R-9 inbox.** A `settle` with no matching `reservation` event is refused (file kept and reported); inbox JSON and directory listings read through `readAgentFileSync` (regular files only, no link, a size cap the lead names from the largest real file); a FIFO is refused by name, never waited on.
7. **B-17.** `case-lock.mjs` refusal gets a code (`case-advance-busy`, or the port's existing busy code if one name fits both); an unreadable `settle-pending` file is reported in the drain result.
8. **R-3.** The detached advance child writes only progress lines to `advance.log`; its JSON result goes nowhere (the ledger is the record). Smallest change inside `case-start.mjs` (the spawned child's stdout not routed to the log), no new flag.

## Files

**Create:** none.

**Modify:** `src/workflow/case-runtime.mjs`, `case-admission-port.mjs`, `case-bindings.mjs`, `case-gate.mjs`, `case-lock.mjs`, `case-start.mjs`, `src/setup/workflow-case-checks.mjs`, `CHANGELOG.md` (dead writing reservations released; gate child dies with the gate; `advance.log` progress only; binding refusal names the case), census.

Tests: `test/workflow/case-runtime.test.mjs` (B-2 with and without inbox, read-only kept, R-9), `case-admission-port.test.mjs` (reservation-file assertions → ledger `binding` event; re-admit case), `case-bindings.test.mjs` (B-7, B-8, repair on the owning case's hold only), `test/setup/workflow-case-checks.test.mjs` (row conditions through the shared reader; fix = sentinel only), `case-verbs.test.mjs` (append-only: R-3 log), `test/cli/fgos-case-doors.test.mjs` (killed gate leaves no child: one wiring case).

**Delete:** four reservation-file functions; the second bind block; the double import and `'.root'` literal; the holder-list twin; the settle/rebuild half of `fixWorkflowCaseBindings` and `casesWithBindings`; exports of `caseEnvOf`, `nextGeneration`, `GATE_ACTIVITY`, `reservationQuiet`; the child result dump.

**Tests to retire:**
- `case-runtime.test.mjs` "a settle that could not take advance … its reservation file goes with it" and `case-admission-port.test.mjs` `readReservationFiles` count: rewritten to the ledger's `binding`/`settle` events in the same files (same fact, new carrier).
- `workflow-case-checks.test.mjs` cases that prove `doctor --fix` settles/rebuilds a record: behaviour moved; owner `case-bindings.test.mjs` repair cases (titles in the report before deletion).

**Cross-lane one-liners:** none. P08 owns `unit-run-start.mjs`.

## Net size

Node: B-2 +15, gate lease +6, B-13 −25, bind block −12, refusal −5, P09 half (setup side −45, workflow +18), B-7/B-8 +6, R-9 +8, B-17 +4, R-3 −2, dead names/twins −35 → about −75 (setup side −45 counts toward the Doctor-side budget). Tests about +70.

## Steps

1. Board: WORK line (P09 Workflow half) and lead:ES heads-up.
2. Red tests (list above); B-13 scan.
3. B-13 from the ledger + bind block + refusal (port); R-9; B-17; dead names.
4. P09 half: shared reader, repair on the owning case's hold, fix split.
5. Gate lease; R-3.
6. B-2 release pass — rebase onto P08's landed reorder first.
7. CHANGELOG, census.

## Validation (focused)

- FR `test/workflow/case-runtime.test.mjs test/workflow/case-admission-port.test.mjs test/workflow/case-bindings.test.mjs test/workflow/case-verbs.test.mjs test/workflow/confined-nested-write.test.mjs test/workflow/case-authority.test.mjs test/setup/workflow-case-checks.test.mjs test/cli/fgos-case-doors.test.mjs test/runner/execution/run-case-admission.test.mjs test/runner/work-path-case-admission.test.mjs test/runner/dispatch/worker-env-case-context.test.mjs`
- A test asserts admission under a held `advance` never takes another case's `advance` (RT-18).
- `fgos doctor --json` on the dev host: `workflow-case-bindings` and `workflow-case-binding-sentinel` present, same ids.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A live reservation released (RT-15) | M × H | Positive evidence only; lands after P08; activation note (plan) |
| Nested rank-80 holds (RT-18) | M × H | Repair only under the owning case's own hold; `readBinding` pure; test above |
| Old release after rollback cannot settle (no reservation files) | M × M | Guide step: finish or close open conductor cases before rollback; old `doctor --fix` settles a left binding |
| A doctor condition lost in the split | L × H | Shared reader keeps every condition; the row's test asserts each by name |

## Rollback

Revert; see the plan's on-disk table (no reservation files) for the rollback step.

## Done when

Red tests recorded then green; P09 Workflow half done (board line to WORK and the doctor track); landed with smoke: the `rsv` scenario (gate killed, second gate admitted) and `fgos doctor` rows unchanged; guide section written.

## Lead brief essentials

No new lock, no new event kind, no new field, no compatibility read, no edit to `goal-check.mjs` or `registrations.mjs`. The release commit waits for P08. All plan.md lead rules apply.
