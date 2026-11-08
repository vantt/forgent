# HARDEN T6 P11 lead report: workflow doors and verbs

Branch `harden/t6-p11-workflow-doors` from origin/main `282d5ad94`. Status of this draft: code commit `e4f5010a2` done, retire gate pending.

## What changed

- `startWorkflow`, `answerWorkflow`, `resumeWorkflow` take `{ detached }`; one `handOff` (runDirOf, spawn, result) replaces three copies; the three `*Detached` functions are gone. `case-verbs.mjs` 416 -> about 330 lines.
- B-14: the detached resume discarded the hold it won from `acquireAdvanceLock` and reported a Playbook case as a conductor. Now one path: the hold it wins is used. No deterministic red exists (the window is between two lock calls); the regression proof is the held-resume test (both forms refuse naming the holder and leave the lock free), plus the unified path having no discarded hold.
- Facade `index.mjs` 30 -> 12 lines, 7 names (the ones the door calls); 22 test files import the rest from the owning file.
- Bin `workflow` arm: 112 lines (was about 147), one `detached` flag, one `runIdOf`, one `withDirWarning`; room for the prune subcommand (about 6 lines).
- B-17: `caseNotFound(id)` in `case-lock.mjs` (code `case-not-found`) used by the lock and by `readCase`. Touches `case-lock.mjs` by one line plus the helper (not in the phase file list; no other running phase owns it).
- `workflow status`: new `bindingsJudgment { sound, problems }` (problems of `inspectCaseBindings` that name this case; read only). Per-seat account was already in `seatProviders` (`account` per row); the status text in the registry now names both; a proof asserts every row carries `account`.

## Retire gate

| Retired test (title) | File | Behaviour | Owner now |
|---|---|---|---|
| `CLI: the detached child logs a line per step start and end, and workflow status prints the advance block` | `test/workflow/workflow-runner.test.mjs` | the detached child logs one line when a step starts and one when it ends; `status` carries `advance.running false` and the `advance.logPath` | `the detached advance child leaves progress lines in advance.log and no dump of its result` in `test/workflow/case-verbs.test.mjs`, strengthened in the same change to assert exactly two step lines (started, completed) and the advance block; the door wiring stays proven by `CLI: fgos workflow start returns the run id at once and a detached process finishes the run` |

No other test is retired. The paired-function cases the plan expected do not exist as duplicates: each former `*Detached` case proves a behaviour the foreground function does not (the answer kept for a live proposer, the held refusal, the log lines, the conductor no-spawn), so they were migrated to `{ detached: true }` in place. Three CLI wiring proofs that observe the detached child (start, answer, resume) stay. No behaviour is removed. Test count: -1.

## Proof so far

Focused set (22 readers of the verbs and facade, playbook-proposer, workflow-runner, architecture, doc-health, decision-citation-drift): 262 pass, 0 fail.
