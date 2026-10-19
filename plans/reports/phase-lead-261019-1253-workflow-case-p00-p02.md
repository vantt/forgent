# Phase lead report: workflow case ledger, phases 00 to 02

## Phase 00 facts

Scouted at branch base `99146586f`. Every fact below was re-read on that tree; "ok" means the plan's pointer was right.

| # | Fact | Result |
|---|------|--------|
| 1 | `runUnit` callers | ok, with a count: 6 production call sites in 5 files (`bin/fgos.mjs:2890`, `src/workflow/runner.mjs:668` and `:688` (now shifted a few lines by phase 02), `src/runner/work-dispatch.mjs:126`, `src/runner/fanout-batch.mjs:112`, `src/runner/operation-choice.mjs:2331`); definition `src/runner/execution/run.mjs:380`. 19 test files import `runUnit` (list: architecture, docs/run-doors-doctrine, dispatch-production-call-sites, fanout-batch-runner-commit, driver-unit-fixture.helper, loop-worker-fixture.helper, loop, provider-credential-renewal, spawn-worker, driver-rununit, operation-choice, loop-rununit, execution/run-sync, run-posture, run-provider-failover, run, run-herdr, dispatch-execute-for-capability, dispatch-execute-effort). |
| 2 | `advance` lock readers | ok. Only `src/workflow/runner.mjs` (`advanceLockParams`, `advanceHolderPid`, `liveAdvanceHolder`, `acquireAdvanceLock`, `advanceReport`, `withAdvanceLock`; `assertNoLiveAdvance` is gone after phase 02), registry row `packages/holder-lock/contracts/lock-registry.v1.json:55`, fences `src/holder-lock/fences.mjs:173`, doctor `src/setup/holder-lock-checks.mjs:382`. No reader in `apps/`, gateway or dashboards (rg over `src bin apps packages`). |
| 3 | Ledger | ok. 92 stored runs under the main checkout's `.fgos/workflow-runs/`, 1 events.jsonl each; 0 unparsable lines, 0 seq gaps, 0 unterminated tails (scratch scan). Event kinds seen: workflow.start 92, step.start 242, unit.scheduled 230, unit.started 166, unit.complete 226, step.complete 204, step.fail 34, gate.park 16, gate.answer 12, workflow.complete 49, workflow.fail 34, workflow.worktrees 2, unit.account-unpinned 3. |
| 3a | Correction | `answerWorkflowDetached` recorded the gate answer (`recordGateAnswer` -> `appendWorkflowEvent`) **without** holding `advance`: it only checked `assertNoLiveAdvance` and then appended. The plan said answers run under `advance` through `answerWorkflow`; the detached path did not. Fixed in phase 02 by taking the lock around the record. |
| 3b | Correction | `resumeWorkflow` and `resumeWorkflowDetached` read the ledger (`resolveResumeTarget`) before taking the lock, so a fail-closed reader would have refused a resume before any holder could repair an unfinished tail. Phase 02 splits the resolution (roots first, state read under the hold). |
| 4 | Custody lease | ok: `run.mjs:526` and `:594` (`admitSuccessor(createLockScope('unit-custody'), ...)`), `recordCustodyHandoff` `:390`, `cwdDevIno` private in `src/holder-lock/registry.mjs:39` (birthtimeNs in the key at `:48`). |
| 5 | "admission" name collision | ok: `admissionIdentityFor` `run.mjs:235` (used `:939`). |
| 6 | Pattern resolved late | not re-read in detail (phase 07 re-greps before editing). |
| 7 | Worker env | `workerBaseEnv` `src/runner/dispatch/adapters.mjs:112`; callers `transport.mjs:396`, `assignment-runner.mjs:2391`, `confinement/authority.mjs:1391`. Phase 08 enumerates the launch paths. |
| 8 | Gate answers | `writeGateAnswerFile` now at `runner.mjs` (was `:1264`) overwrites by rewriting the file; `ref-digests.mjs:4` comment still claims `gate-answer:` refs are immutable; reader `handoff-refs.mjs:102`, `:283`. Confirmed as stated. |
| 9, 10 | Dead `feature.yaml` fields; `--plan` | not re-read (phase 03 owns them). |
| 11 | A4 guard | `test/architecture.test.mjs:769-865` (guarded files, Work-layer module list, edge allowlist); green. |
| 12 | Manifest | `test/architecture.test.mjs` "đủ sổ" requires every `.mjs` under `src/` and `bin/` to have a manifest row, one to one. Phases 01 and 02 add no `src/` file, so no row. |
| 13 | `unit.json` workflow link readers | `normalizeWorkflowLink` `src/runner/execution/unit.mjs:60`, consumed `run.mjs:434`, `unit-summary.mjs:35` (`workflowLink`) and `:147`. |
| 15 | Existing write-scope overlap logic | only `matchesWriteScope` (`src/runner/dispatch/write-scope.mjs:130`) and `assertWriteChains` (`src/workflow/runner.mjs:266`); no scope-vs-scope overlap exists. Phase 05 adds it. |
| 16 | `birthtimeNs` | read as `stat.birthtimeNs` in the lock key on ext4 worktrees; tmpfs value not measured. |
| 14 | Tests answering a gate twice | not measured. |

Impact analysis: `fgos tool query --capability impact-analysis --status present` reports gitnexus `present`; its index is stale (hook: last indexed `b334695`), so posture is Degraded. Blast radius was cross-checked with `rg`: `appendWorkflowEvent` has 2 production callers (`advanceWorkflowRun`'s `recordEvent`, `recordGateAnswer`), `createWorkflowRun` 1 (`prepareWorkflowRun`), `readWorkflowEvents` 7 reads in `runner.mjs`; nothing outside `src/workflow` and its tests.

Prior art (`git log -S` on `src bin core domains docs/specs`):

- `advanceReport`, `ADVANCE_STALE_MS`: introduced by `8d89f238a feat(workflow): make a detached run observable through status and its log`; not removed.
- `aggregateBounds`: the retired L4 coordination engine (`232ef31e1`, removed in `2180b4e72`); `maxRounds` in its session cap is the old budget model. Reusable idea for frame counters: a session-wide hard cap with an escape valve; the code itself is gone and the case counters are specified fresh in the spec.
- `translatePlanToWorkflow`, `workflow-bindings`, `listedRoutesOnly`, `FGOS_CASE`, `acceptOutcomes`-as-ledger: no removed mechanism hits (`acceptOutcomes` appears only in the advisory contract work `8a2373937`, `b44ad3085`).
- `independentOf`: hits only role-seat work (`48d457a53`, `c821a6fc8`, `85322eb17`, `83fc94c75`), not a ledger.

Stored-run cross-check (phase 01 step 4): `observableOrder` run over the 92 stored runs and compared with the committed baseline of the same workflow id. 63 comparable runs match step by step and unit by unit (33 complete, 30 stopped early and equal to a prefix). 26 are not comparable (15 `--seats` runs, 8 `units/*`, 3 other ids). 3 differ only in unit templates of runs recorded under older playbook definitions (`shape-proposals` and `explore-perspectives` without `blind`, `synthesize-recommendation` `solo` instead of `reviewed`); their step order equals the baseline. That is definition history, not a change of the runner order.

## Commits

- Phase 00: read-only; its facts are the section above (no code).
- Phase 01: `a4ba90ff3 test(workflow): guard the observable order of every registered playbook`
- Phase 02: `ed85dd7ab fix(workflow): write the run ledger only under the advance lock, fsynced and read fail-closed`
- This report: committed after those two.

Phase 01 content: `test/helpers/workflow-fixture-repo.mjs` (one fixture repo plus confined fake worker; the three discussion suites now use it), `test/helpers/playbook-observable-order.mjs` (projection plus runner for all 7 registered playbooks, `marketing/content-publish` with its gate answered, and one three-unit `--units` wave), `test/workflow/playbook-observable-order.test.mjs`, committed baseline `test/fixtures/workflow/playbook-observable-order.json` (generated from code before phase 02, run twice, identical). The guard uses no stored run.

Phase 02 content: `src/workflow/store.mjs` (append takes the run's advance hold, fsyncs; fail-closed reader with `workflow-ledger-corrupt` and `workflow-ledger-unterminated`; `recoverWorkflowLedgerTail` writes `ledger.recovered`; exclusive run creation with fsync), `src/workflow/runner.mjs` (`acquireAdvanceLock` returns the hold and repairs an unfinished tail; every advance/answer/resume path passes the hold; `assertNoLiveAdvance` deleted), `src/workflow/index.mjs` (exports `recoverWorkflowLedgerTail`), tests.

## Tests

- Phase 01: the three discussion suites (42 tests incl. architecture guard) plus the new guard (3 tests): all pass.
- Phase 02 targeted (own tree, private script): `test/architecture.test.mjs`, all `test/workflow/*.test.mjs`, `test/state/domain-registry-compiled.test.mjs`, `test/holder-lock/lock-scope-order.test.mjs`, `test/cli/fgos-workflow.test.mjs`, `test/cli/dir-differs-from-cwd.test.mjs`, `test/runner/execution/{run,handoff-refs,unit-summary}.test.mjs`, `test/runner/assignment-enumerator-guard.test.mjs`, `test/runner/dispatch-confinement-blind.test.mjs`: 343 tests, 343 pass.
- Full `npm test` at the phase 02 commit: 8305 tests, 8123 pass, 86 fail, 31 skipped. None of the 86 are in `test/workflow`, `test/cli` or any file importing `src/workflow`.
  - 83 in `test/rust-host/*` (fgctl stage/init/upgrade/download, dev-host, release-tree, release-targets): environment; e.g. `release-tree` needs `target/release/libfgos_node_addon.so` which this worktree does not have.
  - `test/holder-lock/fences-rust-locks` (4), `fences-v1-tombstone` (known), `test/setup/skill-wrappers` (known, worktree only), `test/setup/event-store-checks`, `test/runner/custody-successor-admission`, `test/run-supervisor/crash-matrix-adopt-resume`: none import `src/workflow` or the new helpers (rg), and none touch the ledger.
  - Proof that they are not mine is by import graph, not by a base-tree rerun: I did not check out another tree. The first full run found one failure that was mine (a banned Work-shaped identifier in `architecture.test.mjs`); it was fixed before the commit and the guard is green.
- Host binary: the provided release binary rejects `--predecessor-kinds` (writing units failed with a holder-lock error), so tests ran against a binary built from this tree into `/home/vantt/projects/forgentX/.fgos/runtime/verify-target-wf`.

## Decisions

- The hold is a frozen object registered in a `WeakMap` in `store.mjs`; `appendWorkflowEvent` accepts only a live hold of the same run. `acquireAdvanceLock` is exported from `runner.mjs` (not from the public index) so tests that seed a ledger take a real lock.
- Recovery runs inside `acquireAdvanceLock` for every holder, so each advance, answer or resume path repairs an unfinished tail before it reads. `resumeWorkflow` now reads state under the lock.
- `answerWorkflowDetached` and `resumeWorkflowDetached` now take and release the lock around their record/check (previously the detached answer appended with no lock held); the refusal message for a live holder is unchanged.
- `statusWorkflow` throws `workflow-ledger-unterminated` on an unfinished tail rather than hiding it; the next advance repairs it.
- The baseline projection orders roles inside a round by name (seats of a round run together) and ignores unknown event kinds.
- The plan asked for the phase 00 facts in a separate convention-path report; the lead asked for them in this one, so there is one report.
- No CHANGELOG/spec edit in these phases: the new `ledger.recovered` kind and fail-closed read are covered by phase 09's doctrine closeout.

## Open questions

- Shared scratchpad: another agent in the session overwrote my `t.sh`/`run-script.sh` in the shared scratchpad dir mid-run, so several mid-session test runs executed in a different worktree. All results quoted above come from re-runs with a private script in `scratchpad/ab52/`.
- Feature idea (not done): a `fgos workflow doctor` check that reports an unfinished or corrupt ledger across all stored runs. Real problem: `status` now fails loudly on one bad run and there is no listing of which runs are affected.
