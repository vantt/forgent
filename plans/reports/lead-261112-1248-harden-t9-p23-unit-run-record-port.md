# HARDEN T9 P23: a Unit-run record port; Workflow stops reading Execution's private files

Branch `harden/t9-p23-unit-run-record-port`, from origin/main `08cd1dbc2`.

## What changed

- **The port.** New `src/runner/execution/unit-run-record.mjs` (contract `unit-run-record` v1):
  - `unitRunFacts(fgosDir, unitRunId)` gives `{ exists, settled, controllerHeld, worktree, writeScope, resumable, caseId }`; a bad id or unreadable record reads as not settled and not resumable.
  - `judgeUnitRun` and `removeUnitRun(fgosDir, id, { caseId, unless })` carry the keep-reasons table (link, unsafe-path, unit-record-missing, names-other-case, named-by-other-case, controller-held, custody-held, unsettled), moved whole from `case-close.mjs`. `unless` is the set of runs another case names. `removeUnitRun` judges again just before deleting, and it is the only place a Unit run directory is deleted.
- **One settle door.** `case-admission-port.mjs` (Execution) gains `unitRunSettle` (the settle message, formerly built inline in `run.mjs`) and `releasedUnitRunSettle(caseId)` (Unit shape of a run that never started, reason `reservation-released`). `case-runtime.mjs` gains `settleRecord`, the one ledger-record builder, used by the admission port's `settle` and by the dead-reservation release. Workflow no longer spells the `not-started` settle fields.
- **Workflow sites.** `canResumeUnitRun` and `reservationDead` read `unitRunFacts`; prune calls `judgeUnitRun` and `removeUnitRun`. `rg 'unit\.json|unitControllerHeld|KEEP_REASONS|assignments' src/workflow` finds nothing.
- Manifest row for the new file (`infra`); census regenerated (line shifts only; scan count unchanged, 0 undeclared).

## Behaviour

Same runs are kept, released and deleted for the same inputs. Two edges changed on purpose: a removal that now finds its run refused at delete time (race) keeps it under the refusal's reason instead of deleting; the admission port's settle record writes `unitId: null` where a reservation had none (the release path already did).

## Tests

- New `test/runner/execution/unit-run-record.test.mjs` owns facts, every keep reason, link safety and the released-settle shape. Written red first (module missing).
- Moved, not copied: `test/workflow/case-close.test.mjs` cases "unsettled, controlled or in custody stays" (now one blocking reason showing the case-level rule: ledger and siblings stay) and "a symbolic link ... is kept" (link and untouched target are owned by `unit-run-record.test.mjs`). The `names-other-case` prune case stays as the case-goes wiring proof. `case-runtime.test.mjs` release cases stay: they own the Workflow rule (no record, or settled with no controller, in a quiet worktree).
- Focused: 1054 tests over `test/workflow` and `test/runner/execution` pass; architecture, doc-health, `fgos-case-doors`, worktree-admin and worker-env-case-context pass.

## Touched outside the phase's file list

- `src/runner/execution/run.mjs` (settle message through `unitRunSettle`; one import) and `src/workflow/case-admission-port.mjs` (settle builds its record through `settleRecord`), both needed to make the settle shape one door. No Work code.
- `withActivity` (`run.mjs`) and `unfrozenCopy` (`assignment-runner.mjs`) are still two copies of one helper: the port touches neither, so not merged here.

## Authority

- A Unit run's record, resumability, removability and keep reasons: were Workflow's reads of Execution's files, now Execution's, read through the port. Done.
- The settle record's shape for a never-started run: now Execution's (`releasedUnitRunSettle`); Workflow only maps it onto its ledger.
- Still Workflow's by design: "a case names this run" (`refsOfEvents`), "a case goes whole", and the gate-run prefix (a gate's run has no record). `case-projection.mjs:175` still spells `'not-started'` for the budget count; it belongs to the case projection owner.
- The contract's port section should say `settle` messages are made by `unitRunSettle` (DOC/COOK, P16).

## Lessons

- A zsh `--include` glob or a directory argument to `run-tests.mjs` fails with a misleading module error; pass explicit files.
- A `pgrep -f` wait loop in the same command line matches itself; wait on a pid instead.
- Moving a table of rules plus its tests together (red test first on the new module) made the Workflow side a pure deletion.
