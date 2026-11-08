---
phase: 17
title: "Settle wins: a settled Unit run is never given back as not-started by another process's hold; a real settle supersedes a not-started release already on the ledger"
status: pending
depends_on: ["01-15 on main (T6 as closed 2026-11-08)"]
parallel: "final wave, with 16, 18, 19 and 20 step 1 (disjoint files)"
effort: ~0.5d
net_size: "Node +5 (range +3..+8) / Rust 0 / tests +35"
---

# Phase 17 — Settle wins (owner decision 73 (b); closing report idea 6)

## Context

Owner decision 73 (b): "settle wins: a settled Unit run is never released as `not-started` by another process's hold." The only open correctness item of the case runtime (T6 case-runtime lead report, "Open item: settled-before-release race"; closing report "Open items handed off").

### The window, traced (not assumed)

1. `runUnit` ends in a `finally` (`src/runner/execution/run.mjs:176-191`): custody release (`:183`), then **`scope.control?.release()` (`:186`)**, then **`settleAdmission(scope, result, failure)` (`:188`)**, which calls `port.settle` (`:208`). Those two adjacent statements are the window: after `:186` the Unit run's record is `settled` (`settleUnitRun`, `:332-335`, written before) and no controller is held.
2. `port.settle` (`case-admission-port.mjs:308-330`) takes `advance` without draining (`{ drain: false }`, `:328`) and calls `applySettle`; when `advance` is busy it writes a settle-pending file (`:329`, `writeSettlePending`) for the next holder.
3. Another process holding `advance` runs `drainCaseInbox` (`case-lock.mjs:64`; also `case-admission-port.mjs:200`, `case-verbs.mjs:211`, `runner.mjs:92`). It folds pending settles first (`case-runtime.mjs:285-295`), **then** `releaseDeadReservations` (`:296`, defined `:82-90`). A live writing reservation is "dead" when `reservationDead` (`:70-79`) finds: worktree exists, custody free, and a Unit record that is missing **or settled with no controller** (`:78`). In the window that is true of a real settled run, so the hold appends `outcome: 'not-started'` with `unitRunId: null` (`:85`).
4. The real settle then reaches `applySettle` (`:108-117`): `fresh` is false because a settle for that `reservationId` is already on the ledger (`:110`), so the real outcome, receipts and achieved milestones are dropped. The case reads a finished Unit as one that never started; the frame is refunded; a milestone the Unit earned is not achieved.

The other order (the real settle first) is already safe: the release judges only live reservations and `applySettle` is idempotent.

### Smallest rule (and what was rejected)

**Rule:** in `applySettle`, a settle that is not `not-started` is appended when the only settle(s) already on the ledger for its reservation are `not-started` releases; the projection already lets the later settle stand (`case-projection.mjs`, the `settle` branch assigns `settled`, `outcome`, `unitRunId` over the reservation). The unbind of the worktree binding runs only for the first settle of a reservation. Nothing else changes: no new event field, no fence (owner decision 1), `releaseDeadReservations` and `reservationDead` untouched.

Rejected, with the evidence:

| Option | Why not |
|---|---|
| Swap the two `finally` statements (settle before control release) | Closes the common window only. The settle-pending path (step 2) still races: a hold that has already folded pending settles and then reads the record free of a controller releases a reservation whose real settle is a file one step behind. It also holds the controller seat longer. |
| Make the release write the Unit record's own outcome instead of `not-started` | The record has no receipts or achieved milestones (they are computed from the results in `proposedAchievements`, `case-admission-port.mjs:313`); the ledger would show `pass` with nothing achieved, and the case would redo the work. |
| A fence or lease between control release and settle | New mechanism and new on-disk state; owner decision 1 forbids new fences. |

Side effects checked: `drainCaseInbox` counts `applySettle`'s boolean (`:292`); the superseding settle returns true. `case-frame.mjs:101` (`refund`) skips a reservation with any settle: a reservation refunded before a real settle is not a case this rule creates (refund runs only on reservations with no settle). Binding: the first settle unbinds the worktree's latest bound record (`:112-114`); a second unbind could drop another reservation's newer binding on the same worktree, hence the rule's last sentence.

## Requirements

1. Red first (the window is deterministic without timing): a live writing reservation with a settled Unit record and no controller; `drainCaseInbox` releases it as `not-started`; then `port.settle` / `applySettle` with the real result. Today the real settle is dropped.
2. After the change the ledger holds both settles in order, the projection shows the reservation settled with the real outcome and `unitRunId`, a milestone the settle achieves is achieved, and the frame counts the dispatch again.
3. A real settle already on the ledger is never followed by a `not-started` (the release judges only live reservations) and never by a second real settle (idempotent, as today).
4. The second settle does not unbind: with another reservation bound to the same worktree after the first release, its binding stays.
5. The settle-pending file path gets the same result: a pending real settle folded after a release supersedes it.
6. User-visible: one CHANGELOG line under `## [Unreleased]` (a Unit that finished is no longer recorded as never started when another process held the case meanwhile).

## Files

**Create:** none.

**Modify:** `src/workflow/case-runtime.mjs` (`applySettle` and its doc comment, which today says "A settle already on the ledger is not appended again"); `test/workflow/case-runtime.test.mjs` (owner of the release cases, `:188` and `:200`; append the cases below); `test/workflow/case-projection.test.mjs` (append one case: a later settle for the same reservation supersedes an earlier `not-started`, owner of the fold); `CHANGELOG.md`.

**Delete:** none.

**Tests to retire:** none; the existing release tests (`:188`, `:200`) keep every assertion.

**Spec lines (written at wave close, Vietnamese):** RUL-WF-37 (`docs/platform/workflow/spec.md:343`) gains: một settle thật luôn thắng một lần nhả `not-started` đã nằm trên ledger (settle thật được ghi nối tiếp, projection lấy settle sau, unbind chỉ chạy ở settle đầu).

**Do not touch:** `src/runner/execution/run.mjs` (the statements stay where they are), `reservationDead`, `releaseDeadReservations`, `case-frame.mjs`, `case-admission-port.mjs`.

## Red tests (names in plain words, in the owner files)

In `case-runtime.test.mjs`: (a) a reservation released as not-started by a hold, then settled for real, ends settled with the real outcome and the milestone it earned; (b) the same through the settle-pending file; (c) the second settle leaves another reservation's binding on the same worktree alone; (d) a real settle on the ledger is not replaced by a later release, and a second real settle is not appended. In `case-projection.test.mjs`: (e) the fold reads the later of two settles of one reservation and counts its frame.

## Steps

1. Callers by `rg` (`applySettle`: `case-runtime.mjs:87,292`, `case-admission-port.mjs:328`; no other). Red tests (a)-(e) committed failing.
2. One condition in `applySettle` and the unbind guard; update the comment.
3. CHANGELOG line. Focused run.

## Validation (focused, FR)

`test/workflow/case-runtime.test.mjs test/workflow/case-projection.test.mjs test/workflow/case-admission-port.test.mjs test/workflow/case-verbs.test.mjs test/workflow/case-bindings.test.mjs test/workflow/conductor-case.test.mjs test/workflow/workflow-runner-resume.test.mjs`. Then `git log origin/main..HEAD` before push.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A superseding settle double-counts the frame or `seatLaunchesUsed` | L x M | The fold assigns, it does not sum; test (e) asserts the count |
| The second unbind removes a newer binding | M x H if left unguarded | Rule's last sentence; test (c) |
| A reader of the raw ledger takes the first settle per reservation | L x M | Callers of `'settle'` events: `case-runtime.mjs:110`, `case-frame.mjs:101` (checked above), `case-projection.mjs` (the fold); no other (`rg "'settle'" src`) |

## Rollback

Revert the commit. A ledger that already holds a superseded pair stays readable by the old code (it reads the later settle too, since the fold assigns); no format change.

## Done when

Red (a)-(e) then green; the window cannot lose a real settle on the two paths (direct and pending); CHANGELOG line; report with the red evidence.

## Net size (honest)

Node +5: one boolean computation (a filter over the reservation's settles and one comparison) and an `if` around the unbind, plus a comment line. Tests +35: five small cases over existing helpers (`conductorWorkflow`, `withHold`, `settle`, `projectionOf` in `test/helpers/workflow-case-fixture.mjs`).

## Dependencies

None. Parallel with 16, 18, 19, 20. If phase 16 lands first, rerun `case-projection.test.mjs` after the rebase (the fold it moved must still let the later settle stand).
