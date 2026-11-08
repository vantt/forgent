---
title: "HARDEN T6 sub-plan: Workflow (guide and case)"
description: "Step 4 of the HARDEN per-layer loop for T6: the accepted findings of the T6 arbitration and owner decision 71 (1a 2a 3a 4a 5b 6a 7a) split into fifteen sub-phases with one writer per hot file, six parallel leads in the widest wave, net size below zero, self-landing on fg-server2 and a Vietnamese owner-machine guide."
status: pending
priority: P1
effort: ~8d lead time (wave 0 ≈ 1d; P03 1d; wave 2 ≈ 2d; wave 3 ≈ 1.5d; P13 1.5d; P14 0.5d; P15 1d)
branch: main (plan only; each phase runs on its own track branch `harden/t6-pNN-<slug>` in its own linked worktree from origin/main)
tags: [harden, workflow, case-ledger, admission, playbook, guide, seat-binding, retention, tests]
blockedBy: []
blocks: [261021-1118-harden-low-layers-bottom-up]
created: 2026-11-08
---

# HARDEN T6 sub-plan: Workflow (guide and case)

Main `595faa273` (2026-11-08 09:44 Asia/Saigon, fg-server2). Every `file:line` below was re-read on this commit; arbitration line numbers that moved are given at their current place. Step 4 of [the per-layer loop](../261021-1118-harden-low-layers-bottom-up/plan.md#the-per-layer-loop) for T6 (owner decision 70: HARDEN runs T6 through the same loop). Inputs: [arbitration](../reports/council-261108-0914-harden-t6-arbitration.md) (authority: §1 shapes, §2.1 accepted, §3 cross-lane asks, §5.2 order sketch), owner decision 71 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) (`^71\. `), the seats ([correctness](../reports/council-261108-0900-harden-t6-seat-correctness.md), [red-team](../reports/council-261108-0900-harden-t6-seat-redteam.md), [speed](../reports/council-261108-0900-harden-t6-seat-speed.md), [simplicity](../reports/council-261108-0900-harden-t6-seat-simplicity.md)), the [baseline](../reports/research-261108-0831-harden-t6-baseline.md), and the [doctor readiness plan](../261106-1216-doctor-readiness-only/plan.md) (its P09 Workflow half is folded in here, arbitration §3). Where a seat and the arbitration differ, the arbitration wins. Two places where code evidence forces a different home than the arbitration named are marked "deviation" with the evidence. This plan reopens no owner decision; one consequence the owner did not see is a lead question (Q-1).

Citations, glossed once: **RUL104** (D-ADR0062, "better, not bigger": hardening makes what exists better and adds no feature, layer or mechanism; a contract change moves every caller and deletes the old path); **L10** (platform law: extend through the door, never beside it); **L3** (platform law: the JSONL is the truth, anything else is a view); **D-ADR0070** (Workflow is a guide plus an admission ledger; the agent picks the order, the harness admits); **D-ADR0073** (one word per layer: workflow, case, unit, pattern, run).

## Outcome

When T6 closes: an owner answer reaches only a gate that is asked, never from inside a dispatch and never a delivery milestone, and a round file planted beside the ledger is checked by the same rule; a gate receipt comes only from the capability's declared check; the Playbook has no second merge door; a dead controller's writing reservation no longer blocks a case; `resume` reruns a step that failed on infrastructure and refuses a verdict by name; a run-level `--account` never moves a seat to another pool and `status` shows each seat's account; `propose` p50 is about 0.3 s instead of 2.1 s; a new ledger is about 97 percent smaller and `advance.log` holds progress only; finished cases and their Unit runs are pruned by a verb and when a case closes, under the A1 safety rules; one case reader, one run-directory door, one durable-write path, one glob engine, one slice-shape check; no function over 300 lines; each behaviour has one owning proof and the Workflow test time drops. All Node (spec 5.6, N14); one condition in the Seat Binding crate. Lands phase by phase on fg-server2 (decision 71, 7a); owner machine and fg-server by a Vietnamese guide.

**Limit stated, not closed:** an unconfined process of the owner's own OS user can still run `fgos workflow answer` at depth 0 or write the case directory; T6 makes every such path pass the same checks, but only a channel the agent cannot reach (the host hook of the two-level gate plan, owner decisions 55/56, where "the same-OS-user limit is accepted" was decided) can tell the owner from such a process. The spec says so (P15).

## Target shapes (approved, decision 71 6a)

Not copied. Read [arbitration §1](../reports/council-261108-0914-harden-t6-arbitration.md#1-part-a-target-shapes-for-owner-approval). The arbitration's baselines are on `0291d40ed`; "now" below is `wc -l` on `595faa273` (the loader fix took 19 lines from Guide). The budgets are the approved ones.

| Component | Files | Arbitration baseline | Now | Budget | Function budgets |
|---|---|---|---|---|---|
| Guide | `guide-schema`, `definition`, `steps`, `loader`, `checked`, `ref-digests` | 1 345 | 1 326 | ≤ 1 290 | `validateWorkflow` ≤ 80 (384, `definition.mjs:131`); no helper over 110; no file over 500 (`definition.mjs` 514) |
| Case ledger | `store`, `case-projection`, `case-runtime`, `case-lock`, `case-frame`, `case-close` | 1 251 | 1 251 | ≤ 1 200; prune counted apart (≤ 150) | `projectWorkflowState` ≤ 150 (195, `store.mjs:246`); `projectCase` ≤ 120 (168) |
| Admission | `case-admission`, `case-admission-port`, `case-bindings`, `case-gate` | 965 | 965 | ≤ 930 | `admitProposal` ≤ 110 (164); `createCaseAdmissionPort` ≤ 110 (148) |
| Conductor entry | `propose*`, `case-start`, `case-inherit`, `case-verbs` | 2 171 | 2 171 | ≤ 2 040 (Q1 a) | `propose.mjs` ≤ 640 (654); no function over 120 |
| Playbook runner | `runner`, `unit-handoff`, `units-source`, `seats`, `seat-providers`, `dir-guard`, `index` | 1 556 | 1 556 | ≤ 1 300 (Q2 a) | `advanceWorkflowRun` ≤ 150 (521, `runner.mjs:77`); no helper over 80 |
| Doors | `workflow` arm of `bin/fgos.mjs` (`:2233`) | ≈ 145 | ≈ 147 | ≤ 120 (+ the `prune` subcommand) | — |
| Doctor side | `src/setup/workflow-case-checks.mjs`, `workflow-definition-files.mjs` | 238 | 238 | ≤ 180 | — |

Whole `src/workflow`: 7 269 lines now; target about 6 750 before prune, about 6 900 with it; 0 functions over 300. The phase estimates for the Playbook runner reach about −220 against the −256 the budget needs: the budget binds, and P05 continues the cut in `unit-handoff.mjs` (478 lines, its integrate third gone with P02) until it holds, or reports `DONE_WITH_CONCERNS` with the gap. The Work step-machine residue (`phase`, `skill`, `operations`, `transitions`, `aliases`, `statusSkills` in `definition.mjs`/`steps.mjs`, about 200 lines) is T7's (`wf-coding-cutover`): P06 isolates it into named normalizers and no budget counts it.

## Already landed or in flight (excluded from the phases)

| Item | State | What it did / does |
|---|---|---|
| R-2 loader (arbitration P00) | **landed** `f16e2e983` (board 09:32) | fallback scans `OWN_PAYLOAD_ROOT` (`loader.mjs:11,51`), `resolvePackageRoot` gone; one case in `workflow-loader-persona-scope.test.mjs`; Node −19 |
| R-1 = B-1 core (arbitration P01) | **in flight** `harden/t6-answer-gate` (worktree `forgent-worktrees/harden-t6-answer-gate`; red commit `c08145662`, fix not yet committed at 09:40) | `recordAnswer` refuses a step with no `gate` (`gate-unknown`, `case-verbs.mjs:172`) and drops the `?? ''` question fallback; `recordGateAnswerRound` refuses `gate-not-parked` when the step never parked (`case-runtime.mjs:173`); the fold's `gate.answer` branch skips delivery milestones (`case-projection.mjs:118`); CHANGELOG line |

What the in-flight branch does **not** cover is in P01 (checked against its working diff at 09:40): the dispatch-depth refusal, a guide decision point's `gate:` activity, a gate asked again after an answer, the same checks on a round file the drain folds, `p-3ydqquajy2`. If the branch lands with any of these, P01 drops that item and says so.

## Where each item goes

| Item (arbitration id) | Phase |
|---|---|
| R-1 residue (depth refusal, decision-point gate, open-gate rule, drain re-validation), `p-3ydqquajy2` receipt merge, R-1b = Q1 (a) gate runs only the declared `verify`, `--verify` and slice `gate` key go | [P01](phase-01-consent-and-gate-receipts.md) |
| Q2 (a) = simplicity 3 = R-4 = B-6: Playbook `integrate` step deleted; Land consumer proof re-homed (OPC) | [P02](phase-02-playbook-integrate-step-deleted.md) |
| Simplicity 4 (+ R-9 reader race), simplicity 8 = B-15 = R-9 ids, simplicity 7 = B-10..B-12 durable writes, `CASE_EVENT_KINDS` | [P03](phase-03-case-reader-and-path-doors.md) |
| B-2 drain release + gate lease, B-13, B-7, B-8, doctor P09 Workflow half, R-9 inbox, B-17 (busy code, unreadable file), R-3, simplicity 13/14 in its files | [P04](phase-04-case-runtime-and-bindings.md) |
| Simplicity 1 (+ B-16), W-2, B-5 (layer part), R-5 crash window, Q4 (a) fold, runner and named refusal, `projectWorkflowState` cut | [P05](phase-05-playbook-runner-cut.md) |
| Simplicity 2, vocabulary to `guide-schema.mjs`, R-8 cycle, simplicity 15, Work-machine normalizers isolated | [P06](phase-06-guide-cut.md) |
| W-1, simplicity 10 (one glob engine), simplicity 11 (one slice check), conductor dead names | [P07](phase-07-conductor-entry.md) |
| B-2 custody before `port.admit` (T5 file), the run-level pin at the door (needed by B-5), W-3, `admitProposal` six guards and dead `bindings` output | [P08](phase-08-execution-core-seams.md) |
| Q3 (a): a pin never moves a seat across pools (Seat Binding crate + golden vectors), help text | [P09](phase-09-seat-pin-rule.md) |
| B-4 = `p-zpgzqdoy4z` = D4: a pattern swap admitted as `unlisted`; `activityUnitOf` goes where the catalog can take the activity from the port | [P10](phase-10-pattern-deviation-admission.md) |
| Simplicity 12 (+ B-14) verb fold, facade cut, B-17 `not found` code, `workflow status` bindings judgment and per-seat account | [P11](phase-11-workflow-doors-and-verbs.md) |
| Q5 (b) = A1 = `p-tslryr3buq`: `fgos workflow prune` and pruning when a case closes | [P12](phase-12-prune-finished-cases.md) |
| W-10 tests to owning pure functions, `workflow-runner.test.mjs` split, nine definition tests moved, fixed waits | [P13](phase-13-test-owners-and-split.md) |
| Simplicity 9: `RunnerConfigError` to an import-free leaf, every importer moved | [P14](phase-14-runner-config-error-leaf.md) |
| Spec Part A and stale text, lock-registry text, help text, backlog rows, COOK/DOC checks, re-measure, guide, close | [P15](phase-15-spec-measure-close.md) |

Settled without a phase: D5 (`fgos-cook` retry) closed by `b75259cbd`; W-6, W-7 need no change; arbitration §2.3 rejections stay; R-4/B-6 half-landing needs no red test because Q2 (a) deletes the step; additions A2–A8 not taken (decision 71, 6a); the other D6 rows stay backlog.

## Facts this plan rests on (verified on `595faa273`)

1. **The in-flight answer branch is narrower than R-1.** It checks `state.workflow.steps.find(...)?.gate` only (`case-verbs.mjs:172`), so a guide decision point carrying `gate:` (`guide-schema.mjs:231-240`) is refused `gate-unknown`; no shipped guide declares one (`grep -n "gate:" domains/coding/workflows/feature.yaml` is empty). It refuses "never parked", not "answered after its last park". `confinedWriteRefusal` (`case-admission-port.mjs:138-146`) returns `null` at depth 0 and, at depth > 0, refuses only when the case view is unwritable, so it is not a depth refusal by itself. `drainCaseInbox` (`case-runtime.mjs:216-256`) folds any round file into `gate.answer` without the verb's checks. `achieve` replaces a milestone entry (`case-projection.mjs:81-84`).
2. **R-1b's command path.** `bin/fgos.mjs:2333` passes `--verify` to `gateWorkflow` (`case-verbs.mjs:376-384`, `command: options.verify`), and `runCaseGate` prefers it over `verifyCommandOf` (`case-gate.mjs:68-70`). The slice list's `gate` key: `propose.mjs:34` (`MANIFEST_KEYS`), `:82`, `:257`, `:460-462`. `propose --request … --verify` (`bin/fgos.mjs:2316`, sizing a single run) is a different flag and stays.
3. **The one reader and path door must land before the parallel wave.** `readCaseProjection` lives in `case-close.mjs:14`; copies at `case-admission-port.mjs:45`, `case-verbs.mjs:43`, `runner.mjs:102` (`const reread`); a discarded guard read at `propose.mjs:606`. The run directory is built at `store.mjs:43`, `case-lock.mjs:20`, `case-runtime.mjs:20`, `case-admission-port.mjs:29,140`, `case-bindings.mjs:26`, `propose.mjs:590,592`, and outside at `src/runner/execution/handoff-refs.mjs:91`, `src/setup/workflow-case-checks.mjs:34`, `src/setup/holder-lock-checks.mjs:225`, `scripts/backfill-unit-summaries.mjs:22`. Not builders (left as they are): the relative-path check `handoff-refs.mjs:230` and the confinement mask template `src/runner/dispatch/confinement/resources.mjs:31`.
4. **Deviation: the path door cannot live in `store.mjs` alone.** The A4 guard (`test/architecture.test.mjs:841-859`) refuses any import of a `workflow/` module from `src/runner/execution` or `src/runner/dispatch`, and `handoff-refs.mjs:89-92` (`gateAnswerFile`) builds a case path that Workflow itself imports (`case-runtime.mjs:14`). Design principle 2 puts a shared path primitive in the lowest layer that needs it: P03 creates one small leaf in `src/runner/execution/` holding `runsRoot`, `runDirOf` (with the id rule) and `gateAnswerFile`; `store.mjs` and every other builder import it.
5. **Custody is taken after admission today.** `unit-run-start.mjs:367` `port.admit`, then `:387` `admitSuccessor(...)`. B-2's drain release judges "quiet" by custody, so P08's reorder lands before P04's release commit.
6. **The runner's dry bind is what keeps a run-level pin from being refused at the door.** `assertDoorChoicesBeforeRun` (`unit-run-start.mjs:158-196`) throws "the pinned account applies to no seat of this unit" (`:192`) when an override pins an account and no seat takes it; the runner avoids it by dropping the pin when its dry bind finds no taker (`runner.mjs:367-404`). Workflow overrides already carry `origin: 'workflow'` on seat-scoped entries (`unit-handoff.mjs:189`); the unscoped fallback (`:200-205`) does not. So deleting the dry bind (B-5) needs the door to treat a pin that comes only from a Workflow run as "run unpinned when no seat takes it" (decision 71 3a), and `fgos run --account` keeps its refusal: P08 does the door part, P05 the runner part, P05's deletion lands after P08.
7. **Q4 as the seats wrote it does not rerun anything.** The runner skips any unit whose state is `completed` (`runner.mjs:262`), and the fold sets `completed` for every `unit.complete` whatever its outcome (`store.mjs:324-329`); a fresh writing unit takes a new branch `wf/<run>/<unit>` (`runner.mjs:300`), which fails when the failed unit's branch exists; `settleUnitWorktrees` records `workflow.worktrees` on failure and the guard `!state.worktrees` (`runner.mjs:584`) blocks a second settle. P05 changes all three.
8. **The integrate step has no shipped user.** `VALID_STEP_KINDS` (`definition.mjs:30`), target rule `:202-207`, guide mapping `guide-schema.mjs:162-164`, runner branch `runner.mjs:205-250`, `mergeWorkflowBranch` `:604`, `acknowledgeWorkflowLand` `:632`, `resolveIntegrationTarget` and the write-chain walk `unit-handoff.mjs:212-233,326,359-398`. The only `kind: integrate` in `core`/`domains` is the guide activity `feature.yaml:148` (`unit: { kind: integrate }`, no capability), which the conductor runs through `fgos workflow gate`; that activity kind stays. Git spec names the consumer at `docs/platform/git/spec.md:361,1072`.
9. **The Seat Binding pin rule is shared with `fgos run`.** `rank.rs:489-541` narrows survivors to the pinned pool whenever the pool serves any survivor. Q3 (a)'s one condition therefore also changes a lone `fgos run --account` seat whose first choice is in another pool: today moved into the pool, after the change unpinned and then refused by the door (`unit-run-start.mjs:192`). The owner's Q3 text named only Workflow seats: lead question Q-1; P09 lands after the answer.
10. **The pattern catalog's `activityUnit` selector has two other jobs.** Besides the swap refusal (`patterns/catalog.mjs:112-118`), it selects the activity's pattern source and declared params (`:97,110,220-228,348`) and the doctor's seat-binding check passes it (`src/setup/seat-binding-checks.mjs:117`). P10 keeps the selector and moves only the deviation rule to admission.
11. **`fgos workflow` is one legacy-cli route** (`packages/host-runtime/contracts/command-routes.json:1061-1068`, no subcommand list); a `prune` subcommand needs only `src/cli/command-registry.mjs` (the `invoke` string `:2385` lists subcommands, plus a `subcommands.prune` entry) and the bin arm, no host rebuild.
12. **No retention mechanism exists** (prior art: `git log -S"older-than" -- src bin` empty; nothing prunes `.fgos/assignments` or `workflow-runs` in `src`). Reused doors for prune: `assignmentDir` (`src/runner/dispatch/assignment-layout.mjs:48`, refuses absolute and `..` ids and checks containment), `tryAcquireAdvanceLock` (`case-lock.mjs:58`), custody (`dispatchCwdHolder`, `src/run-supervisor/cwd-lock.mjs`), `listBindingRecords` (`case-bindings.mjs:169`), the one reader (P03).
13. **The full suite takes the machine-wide queue** (`scripts/lib/full-suite-queue.mjs`, taken by `node scripts/run-tests.mjs`); a board HOLD line pauses new suites (COOK held 09:36–09:57 for an activation).
14. **Impact analysis is degraded.** `fgos tool query --capability impact-analysis` shows one provider with status `unknown`, none `present`. Every lead lists callers with `rg` and names the gap ("GitNexus registered but not present on this machine; blast radius by rg").

## Phases

| # | Phase | Depends on | Group | Hot files written | Δ Node / Rust / tests (estimate) |
|---|---|---|---|---|---|
| 01 | [Consent and gate receipts](phase-01-consent-and-gate-receipts.md) (**landed** 2026-11-08 `1be4d59af..233ba29e7`) | answer-gate branch landed (gate files may start now) | wave 0 | `case-verbs.mjs`, `bin` workflow arm | +5 / 0 / +35 |
| 02 | [Playbook integrate step deleted (Q2 a)](phase-02-playbook-integrate-step-deleted.md) (**landed** 2026-11-08 `37a94a335..76e8a3aa5`) | OPC's pick for the Land proof (step 1) | wave 0 | `runner.mjs`, `definition.mjs` | −130 / 0 / −250 |
| 03 | [One case reader, one run-directory door, durable writes](phase-03-case-reader-and-path-doors.md) (**landed** 2026-11-08 `639bf6986..b353b95bf`) | 01, 02 | wave 1 (alone) | `store.mjs`, `case-verbs.mjs`, `runner.mjs` | −60 / 0 / +20 |
| 04 | [Case runtime and bindings](phase-04-case-runtime-and-bindings.md) | 03; release commit after 08 lands | wave 2 | — | −75 / 0 / +70 |
| 05 | [Playbook runner cut, slim ledger, resume](phase-05-playbook-runner-cut.md) | 03; dry-bind deletion after 08 lands | wave 2 | `runner.mjs`, `store.mjs`, `case-verbs.mjs` (resume only) | −105 / 0 / +35 |
| 06 | [Guide cut](phase-06-guide-cut.md) (**landed** 2026-11-08 `35436e8a5..d07b8b3c6`) | 03 | wave 2 | `definition.mjs` | −55 / 0 / +10 |
| 07 | [Conductor entry](phase-07-conductor-entry.md) (**landed** 2026-11-08 `a7b70d50f..bb388da2e`) | 03 | wave 2 | — | −70 / 0 / −50 |
| 08 | [Execution Core seams](phase-08-execution-core-seams.md) (**landed** 2026-11-08 `2465e26c8`) | 03 | wave 2 | — | −20 / 0 / +15 |
| 09 | [Seat pin rule (Q3 a)](phase-09-seat-pin-rule.md) (**landed** 2026-11-08 `4225e0397..3ed9a6741`) | 01 (`command-registry.mjs`); lands after Q-1 is answered | wave 2 | — | 0 / +5 / −5 |
| 10 | [Pattern deviation at admission](phase-10-pattern-deviation-admission.md) | 04, 06, 08 | wave 3 | — (`bin` `run` arm only, if at all) | −10 / 0 / +20 |
| 11 | [Workflow doors and verbs](phase-11-workflow-doors-and-verbs.md) | 04, 05, 09 | wave 3 | `case-verbs.mjs`, `bin` workflow arm | −80 / 0 / −30 |
| 12 | [Prune finished cases (Q5 b)](phase-12-prune-finished-cases.md) | 04, 05; wiring step after 11 | wave 3 | `case-verbs.mjs`, `bin` workflow arm (wiring step only) | +130 / 0 / +90 |
| 13 | [Test owners and split](phase-13-test-owners-and-split.md) | 02, 05, 06, 11 | wave 4 | — | 0 / 0 / −325 |
| 14 | [`RunnerConfigError` leaf](phase-14-runner-config-error-leaf.md) | 01–13 landed; announced quiet window | wave 5 (alone) | all (one import line each) | +2 / 0 / 0 |
| 15 | [Spec, measure, close](phase-15-spec-measure-close.md) | 01–14 | close | — | 0 / 0 / 0 |

```
wave 0:  P01 ∥ P02                    P01 edits case-verbs/-runtime/-projection only after the answer-gate branch lands
wave 1:  P03 (alone: the reader and the path door reach every case file)
wave 2:  P04 ∥ P05 ∥ P06 ∥ P07 ∥ P08 ∥ P09        six leads, disjoint source files
         landing order inside the wave: P08 first (P04's drain release and P05's dry-bind deletion rely on it)
wave 3:  P10 ∥ P11 ∥ P12 (code)       P12's wiring step (case-verbs, bin arm, registry) after P11 lands
wave 4:  P13
wave 5:  P14 (alone)
close:   P15
```

**First batch to start now:** P02 (step 1 is the OPC message) and P01 on its gate files (`case-gate.mjs`, `propose.mjs`, `bin` workflow arm, `command-registry.mjs`, `core/skills/fgos-cook`), its answer half as soon as `harden/t6-answer-gate` lands. P09 may start its crate work now (it touches `command-registry.mjs` only in its last step, after P01 lands, and lands only after Q-1 is answered).

### Hot-file chains (one writer at a time)

| Hot file | Writers, in order |
|---|---|
| `src/workflow/runner.mjs` | P02 → P03 (`reread` swap only) → P05 → P14 (import line) |
| `src/workflow/store.mjs` | P03 → P05 → P14 |
| `src/workflow/case-verbs.mjs` | answer-gate branch → P01 → P03 (`readCase` swap) → P05 (resume refusal) → P11 → P12 (close hook) → P14 |
| `src/workflow/definition.mjs` | P02 → P06 → P14 |
| `workflow` arm of `bin/fgos.mjs` | P01 → P11 → P12 (wiring step); the `run` arm (`:2851,2905`) is P10's, a different arm |

## File ownership (no two phases of one wave share a source file)

Rebase-only (never a reason to serialize; regenerate or re-apply on rebase): `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json` (`node scripts/git-one-door-scan.mjs --write-census`), `docs/architecture-manifest.json` rows (the phase that adds, moves or deletes the file). `test/suite-baseline.json` is TEST's: report retired files, never hand-edit. A one-line import change in another lane's file inside a wave is allowed in the commit that moves the symbol (arbitration §5.2); each such touch is named under "Cross-lane one-liners" in its phase. Test files marked "append-only" below take new test blocks from two lanes of one wave; neither lane edits the other's blocks, the later lander rebases.

| File(s) | Phases, in order |
|---|---|
| `case-verbs.mjs` | branch → 01 → 03 → 05 → 11 → 12 → 14 |
| `case-runtime.mjs` | branch → 01 → 03 → 04 → 14 |
| `case-projection.mjs` | branch → 01 → 03 → 06 (vocabulary import) → 14 |
| `case-gate.mjs` | 01 → 04 |
| `propose.mjs` | 01 → 03 (paths, import) → 07 (+ 06 one-liner: `orderSlices` moves to the kernel) → 14 |
| `propose-classify.mjs`, `propose-frame.mjs`, `propose-validate.mjs`, `case-inherit.mjs`, `src/runner/dispatch/write-scope.mjs` | 03 (`case-inherit` import) → 07 (+ 06 vocabulary one-liners) → 14 |
| `runner.mjs`, `unit-handoff.mjs` | 02 → 03 (`runner.mjs` reader only) → 05 → 14 |
| `index.mjs` | 02 → 11 → 14 |
| `units-source.mjs`, `seats.mjs`, `seat-providers.mjs`, `dir-guard.mjs` | 05 → 14 |
| `definition.mjs`, `guide-schema.mjs` | 02 → 06 → 14 |
| `steps.mjs`, `loader.mjs`, `checked.mjs`, `src/setup/workflow-definition-files.mjs` | 06 → 14 |
| `store.mjs` | 03 → 05 → 14 |
| `case-close.mjs` | 03 → 12 |
| `case-lock.mjs`, `case-bindings.mjs`, `case-start.mjs`, `case-frame.mjs`, `src/setup/workflow-case-checks.mjs` | 03 → 04 → 14 |
| `case-admission-port.mjs` | 03 → 04 → 10 → 14 |
| `case-admission.mjs` | 08 (+ 06 vocabulary one-liner) → 10 → 14 |
| `ref-digests.mjs` | 03 → 14 |
| new path leaf in `src/runner/execution/` (fact 4) | 03 |
| `src/runner/execution/unit-run-start.mjs` | 08 → 10 |
| `src/runner/execution/patterns/catalog.mjs`, `src/setup/seat-binding-checks.mjs` (read only unless P10 needs it) | 10 |
| `src/runner/execution/handoff-refs.mjs`, `unit-run-history.mjs` | 03 (`gateAnswerFile` moves to the leaf) → 08 |
| `src/setup/holder-lock-checks.mjs`, `scripts/backfill-unit-summaries.mjs` | 03 (one line each) |
| `packages/seat-binding/**`, `test/runner/execution/account-pin.test.mjs` | 09 |
| `src/cli/command-registry.mjs` | 01 → 09 (last step) → 11 → 12 (wiring step) → 15 |
| `bin/fgos.mjs` | 01 (workflow arm) → 10 (`run` arm) ∥ 11 (workflow arm) → 12 (workflow arm) → 14 (import line) |
| `docs/platform/git/spec.md`, `test/git/e2e-consumer-noncoding.test.mjs`, `test/runner/merge-land.test.mjs` (if OPC picks it) | 02 (OPC review) |
| `core/skills/fgos-cook/**` gate text, generated render surfaces (`npm run build:skills`) | 01 |
| `test/workflow/workflow-runner.test.mjs`, `units-runner.test.mjs` | 02 → 05 → 11 (CLI cases) → 13 |
| `test/workflow/case-verbs.test.mjs` | branch → 01 ∥ 02 (append/delete-only: 01 adds cases, 02 deletes `:52`) → 04 ∥ 05 (append-only) → 11 → 12 |
| `test/cli/fgos-case-doors.test.mjs` | 01 → 04 → 11 |
| `test/workflow/case-admission-port.test.mjs` | 02 → 04 → 10 |
| new `test/workflow/definition.test.mjs` | 06 (creates, own cases) → 13 (moves nine cases in) |
| new `test/workflow/case-close.test.mjs` | 12 |
| `docs/platform/workflow/spec.md`, `docs/platform/component-boundary.md`, `packages/holder-lock/contracts/lock-registry.v1.json`, `docs/backlog.md` | 15 (each phase lists its spec lines; P15 writes them, DOC told first) |
| `docs/platform/seat-binding/spec.md` (one line) | 09 |

## Acceptance criteria (layer)

1. Every row of "Where each item goes" is done; every Medium/Low not reproduced at arbitration (B-8, the R-9 reader race and inbox, R-5 crash window, B-4, `p-3ydqquajy2`, B-10..B-17) has a red test, or for a structure-only finding a recorded red scan, in its phase report before its fix.
2. Budgets of the Target shapes table met, printed by `wc -l` and the function-length scan in P15; 0 functions over 300 lines in `src/workflow`.
3. Doors, scanned in `src/workflow` and the `workflow` arm of `bin/fgos.mjs` only: `rg -n "export function readCaseProjection|function readCase\b|\breread\b"` → one definition (`case-projection.mjs`); `rg -n "'workflow-runs'" src/workflow src/setup scripts` → none (all through the leaf); `rg -n "renameSync|fsyncDir\b|writeReservationFile|activityUnitOf|mergeWorkflowBranch|acknowledgeWorkflowLand|\bentryStep\b|CASE_EVENT_KINDS|VALID_RIGORS|answerWorkflowDetached|startWorkflowDetached|resumeWorkflowDetached|account-unpinned" src/workflow` → nothing; `rg -n "function segmentRegex" src` → one; `rg -n "activityUnitOf" src bin` → nothing, unless P10 records why it stays.
4. Behaviour, each by its owning test: an answer to a non-gate, an unasked gate, or from dispatch depth > 0 is refused by name; a planted round file that breaks the same rules is not folded; an answer never reaches a delivery milestone; two receipts on one milestone are both kept; `workflow gate` takes no `--verify`; a Playbook step `kind: integrate` is refused by name; a killed gate leaves no live reservation and no child; a dead controller's never-linked writing reservation is released by the next hold, with or without an inbox; a read-only or unproven-dead reservation is never released; `resume` reruns an `execution-failure`/`not-started` unit (read-only and writing) once per call and refuses a verdict with `nothing-to-resume`; a Workflow run-level pin that no seat of a unit takes runs that unit unpinned; a pin never moves a seat; a pattern swap is admitted as `unlisted` and refused at a listed-routes-only point; `prune` never removes what the A1 rules protect, follows no link and deletes no Unit run that does not name its case.
5. Measured on the activated release in P15 (same machine and load class as the baseline): `fgos workflow propose` p50 ≤ 0.35 s (2.14 s at load 4); a new panel run's `unit.complete` lines ≤ 5 percent of the old size for the same preset; `advance.log` holds no JSON result; test time of the 40 baseline Workflow files at least 70 s below 686 s.
6. Every retired test names the test that now owns its behaviour: phases 02, 07, 11, 13 write the retired-title → owner table **before** deleting (the big lead reviews it), and the commit body carries it.
7. Land gate green at each land; Workflow doctor row ids and count unchanged by T6 (the pointer form is doctor plan P09's); no condition of the arbitration §1 doctor table lost.
8. Net size of HARDEN T6 commits ≤ 0 per language, measured in P15: Node ≤ −300, Rust ≤ +10, tests ≤ −200 (estimate sum of the phase rows: Node −468, Rust +5, tests −365).

## Land gate (every phase, run by the big lead on a host built from the tree)

- Read the board head for HOLD lines before any full suite.
- Full `npm test` through `node scripts/run-tests.mjs` (it takes the machine-wide full-suite queue), every `HERDR_*` and `CLAUDE*` variable unset, private `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<branch>-target` (never `/tmp`); read both the ERROR lines and the fail count. Known pre-existing red: the V7n frozen addendum test (MAIL).
- One-door census: `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared.
- Rust touched (P09 only): `cargo test -p fgos-seat-binding`, `cargo clippy -p fgos-seat-binding --all-targets -- -D warnings`, `cargo fmt --all --check`, `cargo check --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin` for the crate and the host that embeds it (`apps/fgos`).
- On any docs change or `src/` deletion: `test/scripts/doc-health.test.mjs` and `test/scripts/check-decision-citation-drift.test.mjs`.
- `test/architecture.test.mjs` on any `src/` file add, move or delete.

## Lead rules (every brief carries these)

- One Sonnet lead per phase, own linked worktree from `origin/main` (never local main), own ext4 `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<name>-target`, deleted when the phase lands; stop every process you started.
- **Find the owning test before writing a new one** (design principle 8); a retired test names its new owner in the phase report and the commit body; never weaken an assertion of a behaviour that still exists; a deleted mechanism retires its tests in the same change.
- **Red first:** each fix whose finding was not reproduced (named per phase) starts with a failing test committed on the branch; a structure-only finding starts with a recorded failing scan (`rg -c`, the function-length scan).
- Focused Node tests only through the FR one-liner (never `npm test` or `scripts/run-tests.mjs <file>`), with `FGOS_HOST_BIN` naming a host built from the worktree:
  `node --input-type=module -e "import { runSelectedTests, buildTestEnv } from './scripts/run-tests.mjs'; import { ensureGitAddon } from './scripts/lib/git-addon-stage.mjs'; const env = buildTestEnv(process.env); ensureGitAddon(env); process.exitCode = runSelectedTests(process.argv.slice(1), { env }).status;" -- <test files>` (FR). No focused run in a worktree while a full suite runs there. Never SIGKILL a test run; message the big lead before any heavy run.
- Callers by `rg` before editing any exported symbol (fact 14); name the gap in the report.
- `git diff --cached --stat` before every commit; explain any large deletion or empty file; stage explicit paths.
- Every edit to a hashed file regenerates the census in the same commit. A user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md`.
- RUL104 and L10: change a contract → move every caller and delete the old path in the same change; no new mechanism beyond the phase's approved item; no env switch, flag or test-only branch to make a test pass; no new compatibility fence (owner decision 1: add no new fence).
- No plan ids, phase numbers or finding codes in code, tests or commit messages; trim existing ones in code the phase touches.
- Report: Δ lines per language next to the phase estimate, test-cost line (tests added/retired, new spawns and why), red evidence per fix; name from `fgos convention name --kind report --type phase-lead --slug harden-t6-pNN-<slug> --json`; only what you ran yourself; end with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`.

## Landing (decision 71, 7a)

- **fg-server2 self-lands each phase** when its land gate passes, in a quiet window announced on the board (one `log.md` line with window and branch): rebase on `origin/main`, gate, `git log origin/main..HEAD` before push; build, stage, activate the release on fg-server2; `fgos doctor` and the phase's smoke. WORK, TEST, ES, COOK told before the window. OPC reviews P02 (Git spec, consumer proof, census), P03 (T1 contract line, census) and P14 (the 45-file sweep). lead:ES is told before P04 lands (the gate uses `runCommand`'s `{ custody }` in `goal-check.mjs`, a runner file Work uses).
- **No `~/.fgos/config.json` schema change** in any phase (Q5: N is a flag), so no all-machines-together activation.
- **Owner machine and fg-server:** one Vietnamese guide, name from `fgos convention name --kind report --type guide --slug owner-machine-harden-t6-workflow --json` at the first landing, linked from the board; one section per landed phase: main commit, what changes for the user, commands (pull, build/stage/activate on forgentX, mdview, mcp-skill-hub, and `~/projects/forgent` on fg-server; doctor; smoke), expected doctor rows, rollback. P15 finishes it.
- **Rollback per phase:** revert the phase's merge commit on `main`, re-activate the previous release on both machines (prior release id recorded in the guide), record the revert SHA on the board (a later re-merge reverts the revert first). Once a later phase has merged on top, roll forward with a fix.

### On-disk formats this plan changes

| Format | Phase | Previous release reads it? |
|---|---|---|
| `gate.answer` events only for asked gates; a planted round that breaks the rule stays unfolded (reported) | 01 | yes |
| proposal commands carry no `--verify` for the gate; `workflow gate --verify` refused | 01 | n/a (command text); an old release still accepts `--verify` after rollback |
| no Playbook `integrate` events in new ledgers; a YAML step `kind: integrate` refused by name | 02 | yes; old ledgers with integrate steps still fold and print in the new release (P02 proves it on one old-ledger fixture) |
| first ledger line by `installOnce`, answer file by `replaceDurably` (same bytes) | 03 | yes |
| no `reservations/*.json` files; `applySettle` takes the binding from the ledger's `binding` event of the reservation's worktree | 04 | **partly**: an old release settling a reservation the new one made finds no file and cannot unbind through `applySettle`. No compatibility read is added (owner decision 1: no new fence). Guide step before rollback: finish or close open conductor cases; after rollback the old release's `doctor --fix` settles a left binding |
| `advance.log` holds progress lines only | 04 | yes |
| `unit.complete` results without `runResult.evidence`; no `unit.account-unpinned` event | 05 | yes (subset; P05 proves the old fold on a new ledger; no reader outside `src/workflow` reads the dropped field, red-team check) |
| reopened step: `step.fail` then a later `step.start` of the same step; failed units marked rerunnable in the fold | 05 | **no**: an old fold keeps the run `failed`. Guide step: no rollback while a reopened run advances; after rollback `resume` of such a run reports `failed` as today |
| seat-binding golden vectors v1 updated for the pin rule (contract file id unchanged) | 09 | n/a (test vectors); an old release keeps "a pin moves seats" |
| `.fgos/workflow-runs/<case>/` and the `.fgos/assignments/<unitRunId>/` naming that case removed for terminal cases older than N days | 12 | yes (missing history only) |

### Activation note (P04, P08)

An old-release `fgos run --case` that is between admission and custody while fg-server2 or the owner machine activates P04 has a reservation with free custody; P04's release refuses to judge it dead without positive evidence (P04 requirement 1), and the guide says to activate P04 with no `fgos run --case` running.

## Cross-lane steps (explicit, each owned by a phase)

| What | Other side | Step | Phase |
|---|---|---|---|
| Seat-binding crate condition + golden vectors (Q3 a) | Seat Binding (T5 component; HARDEN owns T5, OPC not needed) | one condition in `rank.rs`, vectors updated, Rust land gate incl. msvc and aarch64-apple-darwin | P09 |
| Land consumer proof re-homed after the integrate step goes | Git (OPC agrees) | step 1: message OPC (SendMessage on this machine, board line) with the options: re-home the noncoding writing-land case on `test/runner/merge-land.test.mjs` (already owns Land) or on `fgos run --writes`; OPC picks and reviews `docs/platform/git/spec.md:361,1072` and the census; the integrate case of `test/git/e2e-consumer-noncoding.test.mjs:91` goes only after the pick | P02 |
| `core/skills/_shared/coordination-driver.md` Step 6 "Retry" wording and Shape C rule | COOK | the day P05 lands, message the COOK lead with the Q4 rule text ("`resume` reruns a step that failed on infrastructure once per call; verdicts are terminal; no automatic retry beyond the Execution Core's one lost-brief retry"); COOK edits; P15 checks it landed or records it open on COOK's board row | P05, P15 |
| Doctor P09's Workflow half done by T6 | WORK (named in doctor P09; held by decision 67) | board line at plan acceptance (big lead) and again when P04 lands: "Workflow binding repair runs on the Workflow normal path and `fgos workflow status` shows the judgment; WORK owes nothing for `workflow-case-bindings`; the doctor track registers the pointer row" | P04 |
| Work step-machine residue isolated, not deleted | T7 / lead:ES | message lead:ES the normalizer names when P06 lands | P06 |
| `goal-check.mjs` `runCommand` `{ custody }` used by the gate | lead:ES (WORK+ES) | told before P04 lands; no edit to `goal-check.mjs` | P04 |
| Spec Part A, stale text, component boundary | DOC | message the DOC lead with the spec and boundary paths before P15 merges | P15 |
| `lock-registry.v1.json:52` source text; `holder-lock-checks.mjs:225` | T1 (closed, HARDEN); OPC reviews contract text | P03 one import line; P15 text | P03, P15 |
| `RunnerConfigError` sweep (45 source files incl. other lanes', 33 test files) | every open lane | board line before the window; run only when no open branch edits those files | P14 |
| Doctor readiness P04 in flight (`harden/doctor-p04-git-status-recover`: `bin/fgos.mjs`, `command-registry.mjs`, `registrations.mjs`, census) | HARDEN doctor track | P01 takes `bin/fgos.mjs` and `command-registry.mjs` by a board line and rebases onto doctor P04 if it landed first; T6 changes no doctor registration | P01, P11 |

The big lead posts the WORK line and the COOK heads-up on the board the same turn this plan is accepted (owner decision 8), and puts Q-1 to the owner in the decision-question template.

## Red-team review of this plan (planner + four reviewers, 2026-11-08)

Four hostile reviewers (assumptions, failure modes, scope, security) read the draft and the code; every finding below cites code and was re-checked by the planner. Planner findings are RT-1..RT-7, reviewer findings RT-8..RT-24.

| Id | Finding | Sev | Disposition | Applied to |
|---|---|---|---|---|
| RT-1 | Pruning other cases while the closing case still holds its `advance` nests two rank-80 holds | High | Prune runs after the closing hold is released (verb layer), each case by `tryAcquireAdvanceLock`, skipped when held; never inside `closeCaseUnderHold` | P12 |
| RT-2 | Q4 reopen could turn `resume` into retry-until-pass | High | Only `execution-failure`/`not-started` units with no settled seat verdict reopen; one rerun per `resume`; admission asked again; verdict refused by name | P05 |
| RT-3 | Prune could delete what another live record still needs | High | Protection set + re-check per case under its hold; dry run default; red test per A1 rule | P12 |
| RT-4 | Deleting the integrate step kind could delete the conductor's guide activity kind | Med | Only the Playbook step kind and `guide-schema.mjs:162-164` go; `feature.yaml:148` stays | P02 |
| RT-5 | Without integrate, worktree cleanup could change | Med | Keep "branch is an ancestor of the trunk" cleanup; proof `unit-handoff.test.mjs` | P02 |
| RT-6 | `retryTail` could hide a corrupt ledger | Med | Retry only the unterminated-tail code, only without the hold, bounded; corruption still refuses | P03 |
| RT-7 | The `RunnerConfigError` sweep collides with every open branch | Med | Last code phase, alone, announced window, OPC review | P14 |
| RT-8 | **Q4 as written reruns nothing:** failed units fold `completed` and are skipped; a writing rerun hits its own branch; worktrees settle once | Critical | Fact 7; fold marks `execution-failure`/`not-started` units rerunnable; the skip at `runner.mjs:262` reads that mark; a writing rerun reuses the recorded worktree and branch; the reopen clears `workflow.worktrees`; red test with a writing unit | P05 |
| RT-9 | Deleting the dry bind makes every Playbook unit with a run-level pin no seat takes throw at the door (`unit-run-start.mjs:192`) | High | Fact 6; the door runs a unit unpinned when the only pin is a Workflow run-level one (existing `origin: 'workflow'` marker, added to the fallback override); `fgos run --account` keeps the refusal; P08 door part lands before P05's deletion | P05, P08 |
| RT-10 | A planted round file is folded by the drain with none of the verb's checks | Critical (reviewer) / High (planner) | The drain re-validates every round under the hold with the same predicate as the verb (gate of the guide, open occurrence, round file name agrees with its content, subject digest recomputed); a failing round stays unfolded and is reported. Not a full close against a same-user unconfined process (Outcome "Limit") | P01 |
| RT-11 | "Refuse at depth > 0 through `confinedWriteRefusal`" refuses nothing when the views are writable | High | Unconditional refusal at `currentDispatchDepth() > 0`, reusing the refusal's text; red test at depth 1 with writable views; the depth-0 forge is the stated limit | P01 |
| RT-12 | R-1b: a caller still picks `--capability`, and project config picks its `verify` | High | Partly rejected: recording the approved command is A2, not taken (decision 71 6a); project config is the project's authority (spec trust line, P15). The capability choice is lead question Q-2 | P01, P15 |
| RT-13 | Ledger read follows links and blocks on a FIFO | Medium | Rejected for T6: accepted scope is the inbox (`readAgentFileSync`, arbitration §2.1 R-9); the ledger is written only under `advance`; a same-user writer of the case directory is the stated limit | — |
| RT-14 | Prune can be steered by a crafted ledger or a symlink in `assignments/` | High | Every ledger-sourced id through `assignmentDir`; `lstat`, never follow a link; delete a Unit run only when its own `unit.json` names the case; re-check just before delete; red tests for a symlink, a foreign id, a forged time | P12 |
| RT-15 | "Quiet" judged by absence of a holder frees live reservations (missing worktree, unlistable lock, read-only, nested frame) | High | Positive evidence: custody listing readable and empty, the Unit run record absent or settled through `assignmentDir`, a writing worktree; unknown, read-only (`worktree: null`) or non-dispatch reservations are never released; activation note | P04 |
| RT-16 | The release sits behind the drain's early return when no inbox directory exists | High | The release pass runs on every hold, before the inbox guard; red test with no inbox directory | P04 |
| RT-17 | B-13: a re-admitted Unit rebinds without a new `reservation` event | High | No new field: `applySettle` takes the binding from the ledger's latest `binding` event (`case-bindings.mjs:138`) for the reservation's worktree; red test admit → kill → drain → re-admit → settle leaves no binding | P04 |
| RT-18 | Normal-path repair from `readBinding` nests rank-80 holds during admission | High | `readBinding` stays pure; repair runs only in the case's own drain (under its own hold) and its close; the refusal names the owning case and the verb that settles it | P04 |
| RT-19 | Prune deletes the ledger of a closed case that still owns a binding record | High | A case named by any binding record is kept (`binding-held`) | P12 |
| RT-20 | Prune races with inherit, concurrent prunes, and a release on a deleted lock | High | Re-check under the case's hold; Unit runs first, ledger last; release tolerates a missing directory; inherit of a vanished source fails closed through the one reader's `case-not-found` | P12 |
| RT-21 | Budget baselines double-counted `ref-digests`; runner phases short of the budget; tests sum mismatch | High | Table fixed (`ref-digests` in Guide as the arbitration counts it); runner gap named, budget binds; sums recomputed | plan |
| RT-22 | Acceptance grep unsatisfiable outside `src/workflow`; `CASE_EVENT_KINDS` deletion unassigned; `reread` is a `const` | High | Scans scoped; `CASE_EVENT_KINDS` in P03; `\breread\b`; extra path sites listed (fact 3) | plan, P03 |
| RT-23 | P12 added a time budget with a `partial` result and a close-result field; failed runs counted as terminal | High | Dropped both additions; terminal = `case.closed`, or a ledger with no case events whose run folded `completed`; both close paths kept (the Playbook proposer closes through the same `closeCaseUnderHold`, `runner.mjs:145`) | P12 |
| RT-24 | P04 kept a one-release reservation-file reader (a new fence) and a cross-case repair | High | Both removed (owner decision 1: no new fence; RT-18) | P04 |
| RT-25 | P09 changes `fgos run --account` for a lone seat, which the owner did not see | High | Lead question Q-1 to the owner; P09 lands after the answer | P09 |
| RT-26 | P10 deleting the catalog's `activityUnit` breaks params, pattern source and the doctor check | High | Fact 10; the selector stays; only the deviation rule moves; `activityUnitOf` goes only if the catalog can take the activity from the port answer without an interface break, else stays with the reason recorded | P10 |
| RT-27 | Retired tests in the largest retirements are not named up front | Medium | P02 names its titles now; P07, P11, P13 write the retired → owner table before deleting, reviewed by the big lead (acceptance 6) | P02, P07, P11, P13 |
| RT-28 | Wave-2 test files not disjoint (`case-verbs.test.mjs`, `fgos-case-doors.test.mjs`) | Medium | Ownership rows added; `case-verbs.test.mjs` append-only between P04 and P05 | plan |
| RT-29 | Wrong paths in facts (command routes, assignment resolver); `invoke` string misses `prune` | Medium | Fixed (facts 11, 12); P12 edits the `invoke` string | plan, P12 |

Rejected: RT-13 (reason in row). Partly rejected: RT-12 (A2 not taken by the owner).

## Validation log (planner, 2026-11-08)

- Every `file:line` in the facts and phase contexts re-opened on `595faa273`; corrected: fact paths (RT-29), test file names in P06, P08, P15 (`run.test.mjs` and `unit-run-history.test.mjs` do not exist; registry contract test is `test/holder-lock/registry-contract.test.mjs`).
- File ownership re-derived per wave from each phase's "Files" list; wave 0 and wave 2 share no source file; shared test files are listed with their mode.
- Net size recomputed from the phase rows after the red-team changes.
- `test/scripts/check-decision-citation-drift.test.mjs` and `test/scripts/doc-health.test.mjs` run through the FR runner on the shared checkout: 41 tests, 41 pass (citations in this directory are glossed at first use).

## Questions for the HARDEN lead

1. **Q-1 (owner, before P09 lands).** Q3 (a)'s crate condition also changes `fgos run --account` for a lone seat whose first choice is in another pool: today the seat moves into the pool; after the change it runs unpinned and the door refuses "the pinned account applies to no seat" (fact 9). Options: (a) accept: the `fgos run --account` help already says it pins only seats whose chosen entry the pool serves and to pair it with `--provider`; CHANGELOG and guide name it; 0 extra code. (b) keep the move for `fgos run` only: the crate needs to know the pin's source (a second rule; Rust about +10, a new input field). Recommendation (a): one rule for every door, and the refusal names `--provider`. Scope: P09 only.
2. **Q-2 (lead; owner only if the lead wants to widen 1a).** `workflow gate --capability <cap>` still lets the caller choose which declared `verify` runs; `feature.yaml:148`'s `integrate` activity names no capability. Keep `--capability` as today (decision 71 1a covers "the verify declared for the capability"), or tie the gate to `code:implement` / a capability the guide activity declares (a guide-data change, beyond 1a)? Planner default: keep, and the spec states it.
3. **Q-3 (lead).** Prune removes only Unit runs a terminal case names (A1 "remove only"). Unit runs of plain `fgos run` (no case) stay forever. P12 step 3 measures their share of the 1.4 GB on fg-server2; if it is most of it, the lead decides whether to put a follow-up retention question to the owner (it is outside A1).
4. **Q-4 (lead).** The path leaf of fact 4 is a new file in `src/runner/execution/` (deviation from the arbitration's "in `store.mjs`", forced by the A4 guard). Confirm the home before P03 starts; the alternative (each layer keeps its own builder with the same id rule) leaves two builders.
