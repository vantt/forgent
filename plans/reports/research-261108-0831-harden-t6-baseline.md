# HARDEN T6 baseline: Workflow (guide and case)

Main SHA `0291d40ed` (`0291d40ed0ba7fed699e9c32ced3711d7a1e601e`, 2026-11-08 08:31 +07, equal to `origin/main` after a fetch). Measured 2026-11-08 08:35 to 09:00 (Asia/Saigon) on fg-server2. Load was **not** quiet: it sat at 31 to 39 (24 cores) for the first 40 minutes of the work window, from other lanes, and fell to 2 to 5 at about 08:50. Every timing below says the load it was taken under; the Node test loop was repeated at low load for the files that were inflated.

Read-only research by a subagent for lead:HARDEN. Inputs: [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) per-layer loop step 1 and owner decision 70 (2026-11-08, "HARDEN does T6" through the same loop), the [T5 closing report](closing-261106-2006-harden-t5-execution-core.md) section 11, structure of the [T5 baseline](research-261104-1755-harden-t5-baseline.md). No code, config or doc outside this file changed.

## Summary

| Item | Value |
|---|---|
| Rust | **none.** No crate is Workflow's. Rust mentions the word only as a reader: `packages/observe` (`metrics discussions` groups `unit.json` `workflow.runId`), `packages/run-result` (reads the same link), `packages/work-state` (`workflowStep`). The `advance` mutex is T1's, a registered row in `packages/holder-lock/contracts/lock-registry.v1.json` |
| Node, Workflow proper | `src/workflow` 30 files, 7 288 lines, 174 exports (190 by a name scan that also counts `export {}` lists) |
| Node, around it | doctor side `src/setup/workflow-case-checks.mjs` + `workflow-definition-files.mjs` 238 lines; Execution Core's port contract `src/runner/execution/case-admission-port.mjs` 88 lines; the `workflow` case in `bin/fgos.mjs` about 145 lines (2234-2379) |
| Data and doctrine | 7 core workflows + 2 domain workflows + slice-kinds table: 906 YAML lines; `core/skills/fgos-cook` 123 lines, `core/skills/_shared/coordination-driver.md` 114 |
| Spec | `docs/platform/workflow/spec.md`, 756 lines, 34 `RUL-WF-n` ids, "Implementation: Partial", no Node budget or size target |
| Node tests of the layer | 40 files, 420 tests, 0 fail; **686 s** of test time summed file by file (611 s in `test/workflow/`), 9 796 test lines |
| Functions over 300 lines | **2** in Workflow: `advanceWorkflowRun` 521 (`runner.mjs:77`), `validateWorkflow` 384 (`definition.mjs:131`); next is 195 |
| Routes (activated release) | read routes 0.2 to 0.3 s p50; `workflow propose` **4.6 s** p50 on a one-slice proposal |
| Doctor rows | 5 rows are Workflow's alone (+ 1 shared with T5); all pass here; `doctor --json` 134 rows, 7 fail, 48 s wall at load 2.6 |
| Open backlog rows | 16 touch the layer (1 Workflow-owned retention row, 4 `wf-*` rows, 10 `collaboration-degree-part-b` rows, 1 T5 carry) |
| Import graph | 3 kernel files, 22 infra, 5 use-case; one-way into the Execution Core; 8 production importers from outside |

Facts that matter most for the council:

1. **The layer is 100 percent Node, and the decision core is small and already shaped like a port.** Admission (`case-admission.mjs` 281, `case-admission-port.mjs` 355, `case-bindings.mjs` 197, `case-gate.mjs` 132) is the part with a settled design (spec 5.2 to 5.6): it is deliberately not Rust, and the spec says to re-evaluate only when the Execution Core door moves to Rust. T5 left that door in Node, so no Rust move is the default answer; the council decides it.
2. **Two things are called "workflow" and run through two engines.** The *Playbook* path (`runner.mjs` 642, `definition.mjs` 514, `store.mjs` 440, `unit-handoff.mjs` 478, `units-source.mjs`, `seats.mjs`) is the old DAG sequencer, still the engine behind `fgos workflow start <preset>|--units`, all seven `core/workflows/*.yaml` presets and every discussion panel. The *conductor case* path (`guide-schema.mjs`, `case-*.mjs`, `propose*.mjs`, 5 000 lines together) is the new agent-sequenced model that only `domains/coding/workflows/feature.yaml` uses (it is the only YAML with an `activities:` key; it also keeps a `steps:` list for the Work step FSM). They share `store.mjs` and `case-admission-port.mjs`. The Work-step FSM still owns coding lifecycle until the cutover (`wf-coding-cutover`, proposed). The council has to say what the layer's shape is while both exist.
3. **The test time is seat launches again, in seven files.** `workflow-runner.test.mjs` (153.8 s, 66 tests, 2 326 lines), `units-runner` (85.8), `playbook-observable-order` (78.8 s for 3 tests), `advisory-m-contracts` (78.0), `discussion-workflows` (57.6), `playbook-proposer` (52.5), `run-case-admission` (36.1) are 543 s of the 686 s (79 percent). 18 of 40 files run in under 2 s.
4. **`workflow propose` is slow for a read-only door:** 4.6 s p50 (p95 6.2 s) against 0.3 s for every other read route, at low-to-moderate load. It checks the proposal against the repository (paths exist, tests exercise changed code, capabilities registered). Cause not isolated here.
5. **The worst carry item is a resume bug with a proved cause in the code:** a step that ended `failed` is excluded from the ready set (`runner.mjs:124`) and the state fold makes it terminal (`store.mjs:384-396`), so `workflow resume` cannot rerun it (section 5).

## 1. Component inventory

Ownership: `docs/platform/workflow/spec.md` (Workflow is the one authority for guide schema, case ledger, admission and worktree bindings; it never chooses who runs a Unit, the effect gate, verify, locks, writer identity, merge or Work status). Upper boundary T7 Work: Work keeps status lifecycle, claim/return, slot, settlement and the `workflowRunId` pointer; Work callers (`fanout-batch.mjs`, `work-dispatch.mjs`, `operation-choice.mjs`) import `createCaseAdmissionPort`. Lower boundary T5: the Execution Core owns the AdmissionPort interface and calls it; no file under `src/runner/execution` or `src/runner/dispatch` imports `src/workflow` (test `test/architecture.test.mjs`). The spec has no component-level split of its own, so the table groups files by what they decide. This grouping is the baseline's, not a settled shape (Part A has to produce that).

| Component (grouping) | Decides | Node files (lines) | Manifest rank | Contracts, specs, tests |
|---|---|---|---|---|
| **Guide** (schema, loading, step vocabulary) | what a guide and a Playbook definition may say; the closed guard catalog; step ids and aliases; the pinned ref digests | `guide-schema.mjs` 359, `definition.mjs` 514, `steps.mjs` 109 (kernel); `loader.mjs` 189, `checked.mjs` 40, `ref-digests.mjs` 134 (infra); `core/workflows/*.yaml` (7, 553 lines), `domains/coding/workflows/feature.yaml` 176, `domains/marketing/workflows/content-publish.yaml` 68 | kernel + infra | spec 6 and 10; `test/workflow/guide-schema`, `workflow-loader-persona-scope`; kernel isolation `test/state/domain-registry-compiled.test.mjs` (six-file list); `domain-registry.mjs` and `replay.mjs` import `definition`/`steps` |
| **Case ledger** (store, projection, runtime files, lock, frame, close) | the append-only ledger (fsync, fail closed on a corrupt line), the pure fold to milestones, routes, frame left; runtime files (reservation, settle, gate-answer); the `advance` hold; frame counters; closing | `store.mjs` 440, `case-projection.mjs` 255, `case-runtime.mjs` 256, `case-lock.mjs` 144, `case-frame.mjs` 109, `case-close.mjs` 47 | infra | spec 5.4, 5.5, 6; lock row `advance` rank 80 (T1); `workflow-store-ledger`, `case-projection`, `case-runtime`, `stale-approval-reapproval` tests |
| **Admission** (predicate, port implementation, worktree bindings, whole-worktree gate) | may this activity run now; MUST/SHOULD/route table; reservation and settle; one binding per worktree with generation; the `workflow gate` receipt | `case-admission.mjs` 281, `case-admission-port.mjs` 355, `case-bindings.mjs` 197, `case-gate.mjs` 132 (infra); Execution Core side `src/runner/execution/case-admission-port.mjs` 88 | infra | spec 5.2, 5.3, 6 (`RUL-WF-11`, `-27`); port interface owned by T5; tests `case-admission`, `case-admission-port`, `case-bindings`, `case-authority`, `confined-nested-write`, `run-case-admission`, `work-path-case-admission`, `worker-env-case-context` |
| **Conductor entry** (propose, start, inherit, verbs) | turn slices into one proposal for owner approval; open a case under an approved frame; take over milestones of a closed case; the five case verbs | `propose.mjs` 654 (use-case), `propose-classify.mjs` 219, `propose-frame.mjs` 152, `propose-validate.mjs` 343 (infra), `case-start.mjs` 356 (use-case), `case-inherit.mjs` 58 (infra), `case-verbs.mjs` 389 (use-case), `domains/coding/slice-kinds.yaml` 109 | use-case + infra | spec 7.8 (`RUL-WF-30` to `-33`); skill `fgos-cook`; tests `propose*`, `conductor-case`, `case-verbs`, `fgos-workflow-propose`, `fgos-case-doors` |
| **Playbook runner** (DAG sequencer for presets and `--units`) | step order, parked gates, wave worktrees and integration, Unit hand-off, seat lists for panels, the `--units` file as a one-off Workflow | `runner.mjs` 642 (use-case), `unit-handoff.mjs` 478, `units-source.mjs` 100, `seats.mjs` 189, `seat-providers.mjs` 42, `dir-guard.mjs` 74 (infra), `index.mjs` 31 (use-case) | use-case + infra | runner decisions 0048/0049 as partly superseded; tests `workflow-runner`, `playbook-proposer`, `playbook-observable-order`, `units-runner`, `units-source`, `unit-handoff*`, `seats`, `seat-evidence`, `core-workflow-seats`, `discussion-workflows`, `group-cognition-debate`, `business-discussion-workflow`, `architecture-advisory-workflow`, `advisory-m-contracts` |
| **Doors** | argument parsing and detached advance for `workflow start|status|answer|resume|close|gate|propose|operations` | `bin/fgos.mjs` case `'workflow'` (2234-2379); command text in `src/cli/command-registry.mjs` | entry | `test/cli/fgos-workflow.test.mjs`, `fgos-workflow-propose`, `fgos-case-doors`, `dir-differs-from-cwd` |
| **Doctor side** | what a machine or project must have for Workflow to run | `src/setup/workflow-case-checks.mjs` 124, `workflow-definition-files.mjs` 114; rows in `registrations.mjs` (section 4) | infra + use-case | `test/setup/workflow-case-checks.test.mjs` |

Decision citations used in this report (all glossed): D-ADR0070 (workflow guide plus admission ledger; Workflow is guide and ledger, the agent picks the order), D-ADR0073 (one word per layer: workflow, case, unit, pattern, run), D-ADR0074 (pattern catalog in config), RUL104 (better, not bigger).

Not in the layer but named by it: the Playbook engine (`runner.mjs`, `definition.mjs`) is written in the spec as "code today, may change" and is where most of the 7 288 lines sit (roughly 3 000 lines across runner, definition, unit-handoff, units-source, seats and the shared store).

## 2. Lines of code and functions

| Part | Files | Lines |
|---|---|---|
| Guide | 6 | 1 345 |
| Case ledger | 6 | 1 251 |
| Admission | 4 | 965 |
| Conductor entry | 7 | 2 171 |
| Playbook runner and doors | 7 | 1 556 |
| **`src/workflow` total** | **30** | **7 288** |

`src/workflow` files of 340 lines or more (lines, exports by a name scan): `propose.mjs` 654 (14), `runner.mjs` 642 (4), `definition.mjs` 514 (3), `unit-handoff.mjs` 478, `store.mjs` 440, `case-verbs.mjs` 389, `guide-schema.mjs` 359, `case-start.mjs` 356, `case-admission-port.mjs` 355, `propose-validate.mjs` 343.

Function scan (acorn from Node internals, 697 functions in the 33 files of the layer including the setup and Execution Core port files): over 300 lines: 2; over 200: 2.

| Function | File:line | Lines |
|---|---|---|
| `advanceWorkflowRun` | `runner.mjs:77` | 521 |
| `validateWorkflow` | `definition.mjs:131` | 384 |
| `projectWorkflowState` | `store.mjs:246` | 195 |
| `projectCase` | `case-projection.mjs:71` | 168 |
| `admitProposal` | `case-admission.mjs:118` | 164 |
| `createCaseAdmissionPort` | `case-admission-port.mjs:208` | 148 |
| `validateProposal` | `propose-validate.mjs:141` | 101 |

The `'workflow'` case arm in `bin/fgos.mjs` is about 145 lines inside the file's large `main()`; not counted as a function of its own.

Exports with no outside use (name scan, approximate): `reservationQuiet` (`case-runtime.mjs:61`), `entryStep` (`steps.mjs:45`), `CASE_EVENT_KINDS` (`case-projection.mjs:16`) have no use anywhere, tests included. Another 14 names are exported but used only inside their own file, and 20 are used by tests only (for example `proposeFromSlices`, `proposeFromRequest`, `refundParentFrame`; the last matches deferred row `wf-nested-frame-refund`). The scan is name-based and misses dynamic use.

## 3. Tests

### 3.1 Rust

None own Workflow. The `advance` mutex rides T1's `holder-lock` tests.

### 3.2 Node

The set is 40 files: all 32 of `test/workflow/`, plus `test/state/workflow-multiplicity`, `test/setup/workflow-case-checks`, `test/runner/work-path-case-admission`, `test/runner/execution/run-case-admission`, `test/runner/dispatch/worker-env-case-context`, `test/cli/fgos-workflow`, `fgos-workflow-propose`, `fgos-case-doors`. By grep, 14 more files outside `test/workflow/` import or name Workflow code (architecture, release-tree, domain-registry-compiled, seat-binding-dry-bind, dir-differs-from-cwd, and others); they are not in the loop.

Method: each file alone through `node scripts/run-tests.mjs <file>` with `HERDR*`/`CLAUDE*` unset, in the shared main checkout, one at a time. The first pass ran under load 35 (first 17 files) and 2 to 5 (the rest); 13 inflated files were repeated at load 2 to 4, and the numbers below take the repeat. Runner startup adds about 1.3 s of wall to every file.

Slowest files (test time, tests):

| File | Tests | Test time |
|---|---|---|
| `workflow/workflow-runner.test.mjs` | 66 | 153.8 s |
| `workflow/units-runner.test.mjs` | 24 | 85.8 s |
| `workflow/playbook-observable-order.test.mjs` | 3 | 78.8 s |
| `workflow/advisory-m-contracts.test.mjs` | 5 | 78.0 s |
| `workflow/discussion-workflows.test.mjs` | 10 | 57.6 s |
| `workflow/playbook-proposer.test.mjs` | 11 | 52.5 s |
| `runner/execution/run-case-admission.test.mjs` | 22 | 36.1 s |
| `workflow/group-cognition-debate.test.mjs` | 2 | 20.8 s |
| `cli/fgos-workflow-propose.test.mjs` | 2 | 18.7 s |
| `workflow/architecture-advisory-workflow.test.mjs` | 1 | 15.4 s |

Totals: 420 tests, 0 fail, 686 s test time and 877 s wall summed (the wall includes the 35-load first pass). The top 5 files are 454 s (66 percent); 18 of 40 files run under 2 s and 26 under 5 s. The first-pass timings of the files not repeated were taken at load below 5.

Run findings:
- **Waits:** 11 lines in `test/workflow/` name `setTimeout`, `sleep(`, `waitFor` or `Atomics.wait` (7 in `workflow-runner.test.mjs`). The slow files are real Unit runs (fake agents through the Execution Core), not sleeps; not split further here.
- **Leak ERROR:** `run-tests: ERROR: test suite leaked unexpected files or modifications into .fgos store` appeared on 26 of 40 first-pass runs and on 7 of 13 repeats, but not on a rerun of `confined-nested-write` and `conductor-case`, and never on `workflow-multiplicity`. The lines name no Workflow file; same pattern as the T5 baseline (a cross-session write into the shared `.fgos` store by other lanes), so it is not read as a Workflow leak. The ERROR text itself was not kept.
- **Not run:** the full suite (loaded machine, told not to); the 14 outside importers; Rust tests (none).

### 3.3 Behaviours proven more than once (labels, not verdicts)

| Behaviour | Proofs | Note |
|---|---|---|
| The admission port contract | `case-admission-port.test.mjs` (13), `run-case-admission.test.mjs` (22), `work-path-case-admission.test.mjs` (2), `worker-env-case-context.test.mjs` (5) | the first is Workflow's side, the second T5's door side; the last two wiring |
| `workflow propose` | `propose*.test.mjs` (4 files, 89 tests, all under 1 s), `cli/fgos-workflow-propose.test.mjs` (2, 18.7 s) | one wiring proof over one owning proof, as design principle 8 wants |
| Playbook order and resume | `workflow-runner` (66), `playbook-proposer` (11), `playbook-observable-order` (3), `units-runner` (24) | four files drive the same `advanceWorkflowRun` loop with real Unit runs; overlap not measured |
| Discussion presets | `discussion-workflows` (10), `group-cognition-debate` (2), `business-discussion-workflow` (2), `architecture-advisory-workflow` (1), `advisory-m-contracts` (5) | each preset has its own file that runs it end to end; shape overlap not measured |

## 4. Routes and verbs

The layer's doors: `fgos workflow start|status|answer|resume|close|gate|propose|operations`. `start`, `answer` and `resume` always advance something, so none of them is timed; the first three launch a detached advance process, and `gate` runs a project check as the runner.

**Activated release latency** (`.fgos/installation/bin/fgos`, the shared main checkout as cwd, 20 runs each, p50/p95 over the 19 after the first; load during these runs 34 to 39 for the first five rows and about 39 for the last because the test loop was running). They are therefore upper bounds, the same direction as the T5 baseline's 1.1 to 2.0 load numbers.

| Route | First ms | p50 ms | p95 ms |
|---|---|---|---|
| `workflow --help` | 188 | 209 | 247 |
| `workflow operations --step discovery` | 212 | 212 | 275 |
| `workflow status <closed playbook run>` | 435 | 311 | 584 |
| `workflow status <newest run>` | 236 | 324 | 589 |
| `workflow status <missing id>` (exit 4) | 286 | 314 | 537 |
| `workflow propose --slices <one slice> --plan <this plan> --json` | 4 611 | 4 600 | 6 193 |

`propose` was rerun for the last row after a first attempt with a missing plan refused in 0.36 s (exit 1, not counted). Load for the table rows ran 34 to 39 because the Node test pass and other lanes were active; a re-measure at load 2 to 3 was not made for the routes.

- **Dev door:** `npm run fgos:dev --` was not timed; the T5 baseline put its fixed overhead at 8.9 s, which would swamp these routes.
- **`status` reads one run's `events.jsonl`** (not shown to scale with run count here). `.fgos/workflow-runs` holds 54 runs, 431 MB (all `wf-run-*`, no `case-` ids yet; D-ADR0073 plans the rename, backlog `wf-physical-rename`). `.fgos/assignments` holds 529 directories, 1.4 GB.
- **Not measured:** `workflow start` (detached process, then real agents), `answer`, `resume`, `close` (a real write), `gate` (runs a verify command). `propose` is read-only but its 4.6 s was not broken down (git read, repository checks, YAML loads are the candidates).

## 5. Doctor rows and setup steps

A clean `fgos doctor --json` on the activated release: 134 rows, 127 pass, 7 fail (the doctor plan has already cut rows since the T5 baseline's 147), 48 s wall at load 2.6. Per-row time is not in the output and the direct-import route is blocked in a checkout (`git-addon-unavailable`: the in-process door loads only from an activated release); the rows below carry status only. A first attempt to time them in-process measured nothing real and is discarded.

| Row | Status here | What it checks |
|---|---|---|
| `workflow-capabilities-configured` | pass (23 capabilities) | every capability a shipped Workflow unit names is declared with a `prefer` pool |
| `domain-workflow-operations-coverage` | pass | every step operation resolves to task-specs, roles, skills, roleGraph edges |
| `domain-registry-compiled` | pass | each domain's `compiled.json` matches its registry and workflow YAML (shared with Work) |
| `workflow-case-binding-sentinel` | pass | the binding directory carries the host sentinel |
| `workflow-case-bindings` (with `registerFix`) | pass (0 records) | every binding record matches the ledger of its case |
| `blind-steps-use-proven-pools` | pass (7 blind units) | blind Workflow units bind only proven-blind providers (counted as T5's in the T5 baseline; shared) |
| `work-step-vocabulary` (T7's) | **FAIL**: open item `tsk-5db` at retired step `clarify` | names Workflow step vocabulary but is Work state; listed for the boundary only |

Seven failing rows in the whole run; the only one near Workflow is `work-step-vocabulary`, machine state. The spec still names a doctor row `workflow-pools-satisfy-independence` (spec section 5.2, also in CHANGELOG, `distribution-baseline.md` and `test/setup/seat-binding-dry-bind.test.mjs`); no registered row has that id, so the spec text is stale or the row was merged into `blind-steps-use-proven-pools`/`seat-binding-dry-bind` (not proven here).

Setup steps: no Workflow-only step. `fgos setup`'s config merge adds one description-only capability slot per shipped `<domain>:<verb>` Workflow unit through `workflowCapabilitySlots` (`registrations.mjs:1979`), which the first row checks.

## 6. Import-graph position

From `docs/architecture-manifest.json`: 3 kernel (`definition`, `guide-schema`, `steps`), 22 infra, 5 use-case (`propose`, `case-start`, `case-verbs`, `runner`, `index`). Setup side: `workflow-definition-files` use-case, `workflow-case-checks` infra.

- **In:** production importers from outside: `src/state/domain-registry.mjs` (`definition`, `steps`; kernel), `src/state/replay.mjs` (`steps`), `src/setup/*` (3 files), `src/runner/{fanout-batch,work-dispatch,operation-choice}.mjs` (`createCaseAdmissionPort`), `src/runner/work-compat.mjs` (`steps`), `scripts/backfill-unit-summaries.mjs` (`store`), `bin/fgos.mjs`. Eight production importers outside the doctor.
- **Out:** `src/workflow` imports `src/runner/dispatch/*` (29 import lines, 17 of them `config.mjs`), `src/runner/execution/*` (24 import lines), the T0 to T3 doors (`native/door`, `holder-lock`, `git/inspect`, `git/land`, `run-supervisor/cwd-lock`), and Work-runner modules (`runner/worktree`, `repo-locks`, `goal-check`, `agent-definitions`). The A4 test forbids the reverse edge into execution and dispatch.
- Two downward reaches to look at: `src/workflow/*` pulls in `src/runner/worktree.mjs`, `repo-locks.mjs` and `goal-check.mjs`, which are runner-level (T7-adjacent) files; and `src/runner/dispatch/config.mjs` (2 105 lines at the T5 baseline) is the largest dependency (17 importer lines) of a layer that only needs a few of its readers.
- **Lock registry:** the `advance` row (`scope: run`, rank 80) names `src/workflow/runner.mjs ADVANCE_LOCK_FILE` as its v1 source; a stale pointer in a T1 contract.
- **One-door census:** `packages/git/contracts/mutation-census.v1.json` lists `case-gate.mjs:100` and `case-verbs.mjs` as spawn sites (through `runCaseGate`).

## 7. Known defects and inputs

Evidence pointers, one line each; nothing here is a fix proposal beyond the line.

| # | Item | Evidence | One line |
|---|---|---|---|
| D1 | **Resume cannot rerun a step that ended `execution-failure`, so one bad seat launch costs the whole run** (T5 closing 11, `p-d2dc4f2e`) | `runner.mjs:124` drops `failed` steps from the ready set; `store.mjs:384-396` folds the step and the run to `failed`; `runner.mjs:487` writes `execution-failure`. Debug report `debug-261106-1658-workflow-resume-after-seat-failure` was returned in session and is not on main | a failed step needs a rule for when resume re-opens it |
| D2 | `.fgos/assignments` is never pruned (`p-tslryr3buq`, Workflow's by the T5 arbitration) | 529 directories, 1.4 GB here; `.fgos/workflow-runs` 54 runs, 431 MB, no retention either | one retention rule for both trees, never a run with a held lock |
| D3 | `--account` on `workflow resume` is refused by name | `bin/fgos.mjs:2344`; `runner.mjs:61,368-393` runs a unit unpinned when no seat serves the account (`unit.account-unpinned`). The decision names "`--account` moving seats" as an input; no line of the T5 closing section 11 states it, so the exact input is unconfirmed | settle whether a resumed run may re-pin seats |
| D4 | Pattern deviation is not gated by admission (`p-zpgzqdoy4z`) | backlog row, Workflow-adjacent | admission compares requested and declared pattern |
| D5 | `fgos-cook` and the Execution Core's lost-brief retry both rerun once, so a seat that always loses its brief launches up to 4 times (T5 P10 note) | T5 closing section 11 | one retry owner |
| D6 | Open conductor-case rows from the collaboration-degree work: milestone evaluator kind not enforced on every event path (`p-djznnfrbbe`), two guards on one milestone overwrite each other's evidence (`p-3ydqquajy2`), tested-subject digest copied at settle (`p-xtwobjzl2i`), consent has no defined writer or digest rule (`p-tqbcrown4m`), no freshness check for prose subjects (`p-3u7ntmlhyz`), no reviewer-verdict primitive (`p-shtdt7wpfh`), assessor seat has no provenance (`p-lwdpukgwhd`), coding workflow lets a plan be called validated without a validation step (`p-uz3hc7gz37`) | `docs/backlog.md` rows | all proposed, none started; several touch `case-projection.mjs` and `case-admission-port.mjs` (section 8) |
| D7 | `advanceWorkflowRun` is 521 lines and `validateWorkflow` is 384; the layer has two of the repo's over-300-line functions | section 2 | the T5 rule (no function over 300) is not met here |
| D8 | Gate-answer file is hand-written with `writeFileSync` and `renameSync`, not the durable door; `store.mjs` and `case-bindings.mjs` each carry their own directory-fsync helper | `case-runtime.mjs:152-153`; `store.mjs:123`, `case-bindings.mjs:31` against `replaceDurably`/`installOnce` used 4 times in `case-bindings.mjs` and `case-runtime.mjs` | one durable-write door for the layer |
| D9 | Spec text is stale in places | `spec.md` section 18 names `integrate.mjs` and `plan-source.mjs` (neither exists in `src/workflow`); section 5.2 names a doctor row that is not registered; section 5.1 says "before cutover" while the header says the core is installed; header says "Implementation: Partial", last reviewed 2026-11-06 | refresh at Part A |
| D10 | Doctrine still teaches workers to call the door from inside a case | spec 5.4 says `core/skills/_shared/coordination-driver.md` must be rewritten to the Shape C rule; the file is still 114 lines | check at Part A |
| D11 | `workflow propose` takes 4.6 s | section 4 | profile before deciding |
| D12 | Slow tests: seven files are 79 percent of the 686 s | section 3.2 | candidates for a split or a lower layer, council decides |

Deferred rows owned by the spec's own plan, not defects: `wf-coding-cutover` (Work step FSM to case, the big one), `wf-physical-rename` (D-ADR0073 names: `wf-run-` to `case-`, `.fgos/workflow-runs/`, `fgos-runner`), `wf-reopen-watch-measurements` (counts of `playbook-case-admits-via-proposer-only`, `nested-write-from-confined-worker`, `consent-stale`, `seat-launch-ceiling` have no numbers yet), `wf-nested-frame-refund` (deferred by owner 2026-10-20 until a real nested case exhausts a frame).

Other carries named for T6 or T7 in the T5 closing: `--wait` on `take`/`pick` is T7's; `p-68be2ae3` (`doctor --fix` all-or-nothing) is the doctor plan's. TEST-lane reds that touch Workflow files were not seen in this run: 0 failures in the 40.

## 8. Board and shared files

Not read (the program board is only for starting, finishing, blocking or landing a lane, and this report does neither). Shared-file collisions to expect, from the files named above and the T5 board notes: `src/setup/registrations.mjs` (doctor plan, now free of T5), `bin/fgos.mjs` (every verb), `docs/architecture-manifest.json` and `test/architecture.test.mjs` (any file move), the area spec and `docs/platform/component-boundary.md` (DOC told before a spec merges), `packages/holder-lock/contracts/lock-registry.v1.json` (the `advance` row), and `packages/git/contracts/mutation-census.v1.json` (the two spawn sites). The `p-djznnfrbbe` family and `wf-coding-cutover` would touch `case-projection.mjs`, `case-admission*.mjs` and `feature.yaml` if they run alongside.

## 9. Things to know

- Nothing was dispatched: no workflow started, no agent, no seat, no pane, no daemon. The tests ran their own fake agents under the runner as usual.
- Side effects, all under gitignored `.fgos/`: test fixtures and the runner's leak-guard files; `doctor --json` on the activated release wrote nothing tracked. Scratch files only in the session scratchpad and `/dev/shm` (`t6-baseline-tests.log`, `t6-doctor.json`, `t6-slices.json`). No tracked file changed except this report. No private Cargo target was created (no Rust test ran).
- Not measured: `start`, `answer`, `resume`, `close`, `gate`; per-doctor-row time; the 14 outside test importers; the full suite; a quiet-load repeat of the route timings; the dev door.
- Test-selection caveat: the 40 files were chosen by directory and by name or import of Workflow code; a Workflow test under another name could be missing.
- Citations in this report are glossed on first use; the citation-drift test was run before commit.
