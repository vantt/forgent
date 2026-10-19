# Phase 00 — Facts and prior art (read-only)

## Context

- Spec §9 (rework size), §11.2 (proof obligations), §18 (code pointers); AGENTS.md "Prior art before design".
- Output: one facts report at the path `fgos convention path --kind report --type facts --slug workflow-case-ledger-facts --plan 261019-1238-workflow-case-ledger-and-admission` returns. No code change.

## Requirements

Answer, with `file:line`, what existed before, which change removed it, and whether that was intended; confirm or correct every pre-scouted fact below against HEAD at phase start (the planner scouted `51f42fa3f`).

## Pre-scouted facts to re-verify

1. `runUnit` callers that can carry `writes` (B3′, §11.2):
   - `bin/fgos.mjs:2890` (`fgos run`)
   - `src/workflow/runner.mjs:668`, `:688` (playbook loop; second call is the per-unit worktree)
   - `src/runner/work-dispatch.mjs:126` (`spawnWorker`, called from `src/runner/loop.mjs`)
   - `src/runner/operation-choice.mjs:2331` (`executeDriverOperationChoice`, called from `src/runner/loop.mjs:895`, `:1533` and `src/verbs/state/step.mjs:73` = `fgos plan --validate`)
   - `src/runner/fanout-batch.mjs:112`
   - Test callers: 19 files under `test/` (list them; fixtures `test/runner/driver-unit-fixture.helper.mjs`, `loop-worker-fixture.helper.mjs` matter most).
2. `advance` lock readers (Shape C, spec §5.4): `src/workflow/runner.mjs:826-930` (`advanceLockParams`, `advanceHolderPid`, `liveAdvanceHolder`, `assertNoLiveAdvance`, `acquireAdvanceLock`, `ADVANCE_STALE_MS`, `advanceReport`, `withAdvanceLock`); registry row `packages/holder-lock/contracts/lock-registry.v1.json:55`; fences `src/holder-lock/fences.mjs:173`; doctor `src/setup/holder-lock-checks.mjs:382`; tests `test/workflow/workflow-runner.test.mjs:533-643`, `test/holder-lock/lock-scope-order.test.mjs:39`, `fences-v1-tombstone.test.mjs:71,95`. Confirm no reader outside these (gateway `apps/fgos-gateway`, dashboards).
3. Ledger: `appendWorkflowEvent` `src/workflow/store.mjs:75` (seq = count+1, `appendFileSync` no fsync `:94`); reader skips every bad line `:116-120`; callers `src/workflow/runner.mjs:390`, `:1243`; `createWorkflowRun` `:1080`. Stored runs: 92 under `.fgos/workflow-runs/` (untracked), 0 corrupt lines today; per-guide counts (council-lite 8, architecture-advisory 34, group-cognition 23, content-publish 5, units/* 8, others).
4. Custody lease (Git phase 04, landed): `scope.custody = admitSuccessor(createLockScope('unit-custody'), …)` `src/runner/execution/run.mjs:526`, `:594`; verify borrows it `:1049`; `recordCustodyHandoff` `:390`; lease impl `src/runner/dispatch/cwd-lock.mjs:36`. Worktree identity key `cwdDevIno` `src/holder-lock/registry.mjs:39` (private; phase 05 exports it as the one door).
5. Name collision: Run Supervisor attempt admission (`admissionIdentityFor` `run.mjs:235`, `assignments/<id>/admission/generations`). New code must not reuse "admission" bare.
6. Pattern is resolved at `run.mjs:1065` after the unit dir and custody exist; the declared check resolves it early at `:297`/`:509`. Phase 07 hoists the pure name resolution.
7. Worker env: `workerBaseEnv` `src/runner/dispatch/adapters.mjs:112` strips session ids and lock fds; codex gets the writer id via `shell_environment_policy.set` `src/runner/dispatch/assignment-runner.mjs:600`. Enumerate every executor launch path that does not pass env (pi, agy, omp, herdr panes).
8. Gate answers: `writeGateAnswerFile` `src/workflow/runner.mjs:1264` overwrites; `ref-digests.mjs:4` comment claims immutability; Execution Core reads them by path `src/runner/execution/handoff-refs.mjs:102`, `:283`.
9. Dead runner fields in `domains/coding/workflows/feature.yaml` (`units`, `dependsOn`, `gate`, `kind: integrate`, steps `integrate`, `approval`); compiled into `domains/coding/compiled.json` (9 hits); readers `test/workflow/advisory-m-contracts.test.mjs:174`, kernel isolation `test/state/domain-registry-compiled.test.mjs:26-41`, `src/setup/registrations.mjs:1054-1100`, `workflow-pool-independence.mjs`, `blind-steps-proven-pools.mjs`.
10. `--plan`: `src/workflow/plan-source.mjs` (134), import `runner.mjs:25`, `resolveStart` `:978`; CLI `bin/fgos.mjs` workflow start (`sources` check ~`:2291`); `src/cli/command-registry.mjs:2195`, `:2225`; `core/skills/fgos-run/SKILL.md:43-55` (Mode B); test `test/workflow/workflow-runner.test.mjs`.
11. A4 guard `test/architecture.test.mjs:769-865` covers `src/runner/dispatch/**`, `src/runner/execution/**`, `src/runner/dispatch.mjs`, `src/workflow/**`; Work-layer modules `:778-790`. Work-layer files may import `src/workflow` (reverse is forbidden).
12. Manifest ranks `docs/architecture-manifest.json`: `run.mjs`, `workflow/runner.mjs`, `index.mjs`, `loop.mjs`, `operation-choice.mjs`, `work-dispatch.mjs`, `fanout-batch.mjs`, `verbs/state/step.mjs` use-case; `store.mjs`, `ref-digests.mjs`, `loader.mjs` infra; `definition.mjs`, `steps.mjs` kernel. Confirm the architecture test requires every new `src/**` file in the manifest.

13. Readers of the `unit.json` `workflow` link (`normalizeWorkflowLink` `src/runner/execution/unit.mjs:60`, written `run.mjs:425`, `:539`): list every reader (unit-sync, settlement, inspect, gateway) — phase 07 changes the shape to `{caseId, activity, reservationId}`.
14. Tests that answer a gate twice: re-park after rejection (allowed) vs overwrite (phase 05 refuses).
15. Existing write-scope vs write-scope overlap logic anywhere (`claim-port.mjs`, fanout, `assertWriteChains` `src/workflow/runner.mjs:266`): reuse before phase 05 adds `writeScopesOverlap`.
16. `birthtimeNs` value on the filesystems in use (ext4 worktrees, tmpfs fixtures) for the binding identity key.

## Prior art sweeps (record hits or "none")

`git log --oneline -S'<term>' -- src bin core domains docs/specs` for: `sequencer`, `translatePlanToWorkflow`, `acceptOutcomes`, `gate-answer`, `advanceReport`, `ADVANCE_STALE_MS`, `workflow-bindings`, `reservation`, `frame`, `milestone`, `listedRoutesOnly`, `FGOS_CASE`, `workflowRunId` (Work pointer), `coordination` (retired `fgos coordination` session store — it had sessions, rounds and budgets: what was its budget/counter model, why removed, anything reusable for frame counters?), `maxRounds`/`aggregateBounds` (old coordination caps), `independentOf` (role ledger). Also read `docs/specs/runner.md` history for 0047/0048/0049 and RUL84/89/94/95.

## Steps

1. Run `fgos tool query --capability impact-analysis --status present`; record posture. If full: GitNexus `impact` upstream on `runUnit`, `appendWorkflowEvent`, `readWorkflowEvents`, `advanceWorkflowRun`, `answerWorkflow`, `statusWorkflow`, `resumeWorkflow`, `workerBaseEnv`, `writeGateAnswerFile`, `resolveStart`; cross-check zero results with `rg`.
2. Re-verify facts 1–12; correct line numbers.
3. Prior art sweeps.
4. Write the report: facts table, corrections, prior-art findings ("reuse X", "missing Y"), any fact that changes a later phase.

## Done when

Report committed; every later phase's `file:line` either confirmed or corrected in the report; big lead acknowledges corrections before 01 starts.

## Risks

Low. Stale line numbers are the main risk; later phases re-grep before editing (Verification Discipline).
