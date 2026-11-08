# Lead report: HARDEN T6 playbook runner cut, slim ledger, resume

Branch `harden/t6-p05-playbook-runner-cut`, rebased on `116d14545`. Phase file: `plans/261108-0934-harden-t6-workflow/phase-05-playbook-runner-cut.md`.

## What changed
- `advanceWorkflowRun` 465 lines to 48: `createRun` (one `emit`, `reread`, `failStep`), `isReady`, `advanceStep`, `runStepUnit` (73, the longest helper), `runUnitWithRecovery`, `refuseUnit`, `parkGate`, `completeStep`. `prepareUnitWorktree`, `foldUnitOutcome`, `gateQuestionOf` live in `unit-handoff.mjs`. The 14 hand-built event wrappers, the second `step.fail`/`workflow.fail` pair copies and the `*At` payload fields (never read; the ledger line carries `ts`) are gone.
- The loop's `stateChanged` flag is replaced by "the pass appended events", which also ends the old quirk where a step completed on resume (all units already done) stopped the run until a second resume.
- Escaping throws fold into the unit: a failing write check ends the unit `execution-failure` (rerunnable) via `foldUnitOutcome`; a failing worktree cleanup after an admission refusal fails the step with the cleanup message in the reason.
- Ledger: `unit.complete` results are stored without `runResult.evidence` (measured on the 87 real `unit.complete` lines of fg-server2: evidence is essentially all of their bytes). Readers checked by `rg` over src, bin, scripts, packages: none read it from a ledger (`handoff-refs` reads the Unit run on disk). Old ledgers still read (fold test).
- Resume: fold marks a unit `rerunnable` when its outcome is `execution-failure`/`not-started`, it has no out-of-scope paths, no `refused` and no settled verdict seat; a `step.start` of a failed step reopens (clears step and run failure and `workflow.worktrees`, units go `pending` keeping worktree/branch/base/unitRunId as predecessor). `resumeWorkflow` appends that `step.start`; a verdict is refused `nothing-to-resume: step <id> ended <outcome>` (also before the detached spawn). The runner reruns the unit as a fresh admitted Unit run; a writing rerun reuses the recorded worktree and branch when both exist. Same reuse fixes the crash window between `unit.scheduled` and `unit.started`.
- Run-level pin: the unscoped fallback override carrying the account has `origin: 'workflow'`; after P08, the per-unit dry bind and `unit.account-unpinned` are deleted. Provenance of the seat is the record. `seatProviders` gains `account` (`pool/id`, else the skip reason, else null).
- `projectWorkflowState` 195 to 45 lines (table of fold steps, 54 real ledgers fold identically except the new `rerunnable` mark). Duplicate env constant removed from `dir-guard.mjs`.

## Red to green
Red commit `a347391e8` (6 red: resume infra rerun read-only and writing, R-5 crash window (old code: unit failed with `unitRunId: null`, results `[]`, its worktree creation refused), verdict refusal, slim ledger, fold reopen, seatProviders account, write-check throw). Green after `9d5f9ad7e` and `b35b47257`. The write-check throw case was written against the new helper `foldUnitOutcome` (no way to make a confined worker delete its own branch), so it was never red against old code; stated, not claimed.

## Tests
- Added: fold reopen/verdict/old-ledger (3, store ledger), resume infra rerun, slim ledger (workflow-runner), writing rerun and crash window (units-runner), write-check throw (unit-handoff), seatProviders account (seat-evidence). Changed: policy-refusal test now asserts the named refusal; account test asserts `override:workflow` and the unpinned seat's `account-pin-other-pool` instead of `unit.account-unpinned`; raise-door fallback origin; `work-path-case-admission` regex follows the runner's option shape.
- Retired: no whole test. Dry-bind assertion replaced by the provenance assertion (owners: `account-pin.test.mjs` and the units-runner case).
- Focused set (all `test/workflow`, cli workflow doors, architecture, doc-health, citation drift, census, account-pin): 545 pass before the two repairs above, then green.

## Size
Node: runner -168, store -28, dir-guard -3, unit-handoff +74, case-verbs +20, seat-providers +8: about -97 (phase estimate -105). Tests +172 (estimate +35: five new proofs of new behaviour). Playbook runner budget: 1325 lines against 1300 (index.mjs shrinks in P11), gap 25 reported.

## Open
- `fgos workflow status` prints `seatProviders` only when the run has `--seats` (`case-verbs.mjs` statusWorkflow); showing the account for every run is P11's status work.
- COOK message with the Q4 rule text goes out at landing.
