# HARDEN T6 arbitration: Workflow (guide and case)

- **Big lead:** lead:HARDEN, 2026-11-08 09:20 (Asia/Saigon), fg-server2, main `44b9ca7cf`. No file under `src/workflow`, `bin/fgos.mjs`, `src/setup/workflow-*.mjs` or `src/runner/execution/case-admission-port.mjs` differs from the baseline's `0291d40ed` (`git diff --stat` empty), so every seat read the code that runs.
- **Inputs:** [baseline](research-261108-0831-harden-t6-baseline.md); seats [correctness](council-261108-0900-harden-t6-seat-correctness.md), [red-team](council-261108-0900-harden-t6-seat-redteam.md), [speed](council-261108-0900-harden-t6-seat-speed.md), [simplicity](council-261108-0900-harden-t6-seat-simplicity.md); [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) per-layer loop step 3, size rule, owner decisions 59, 61, 62, 65, 67, 69, 70; [doctor readiness plan](../261106-1216-doctor-readiness-only/plan.md) phases 08 and 09; `docs/platform/workflow/spec.md`.
- **Citations (glossed once):** RUL104 (D-ADR0062, "better, not bigger": hardening makes what exists better and adds no feature, layer or mechanism; a contract change moves every caller and deletes the old path); L10 (platform law: extend through the door, never beside it); L3 (platform law: the JSONL is the truth, anything else is a view); D-ADR0070 (Workflow is a guide plus an admission ledger; the agent picks the order, the harness admits); D-ADR0073 (one word per layer: workflow, case, unit, pattern, run); D-ADR0030 (product order: ship faster, release the human, DoD, polish); spec N14 (spec 5.6: admission, projection and the Playbook proposer stay Node; re-evaluate only when the Execution Core door moves to Rust); spec N13, N17, RUL-WF-18 (a playbook is a guide with no second scheduler; the harness's own proposer holds `advance` for its life); RUL-WF-14 (consent comes only from a gate answer; a worker's claim is not a receipt); design principles 1 (one door), 2 (bottom-up layering), 6 (KISS/DRY, no file you do not need), 7 (one source of truth), 8 (one proof per behaviour).
- **Status:** arbitration done; owner ask 1 in section 6.
- **In flight, urgent, not re-planned here:** red-team R-2 (shipped workflows "not found" in any project with a root `package.json`) on `harden/workflow-loader` (worktree `forgent-worktrees/harden-workflow-loader`, no commit yet at `74dfda090`). Mission #1 is broken on every JavaScript project until it lands.
- **Recommended to start now, no owner answer needed:** R-1 = B-1 (an answer achieves milestones of any activity, delivery milestones included). It is a missing check inside RUL104, live on every conductor case, and its files (`case-verbs.mjs`, `case-runtime.mjs`, `case-projection.mjs`) do not overlap R-2's `loader.mjs`. Sub-plan phase P01 below; the lead may start it before the owner answers.
- **Runs alongside on its own track:** the doctor readiness plan (decision 65; paused by decision 67 until T5 closed). It shares `src/setup/registrations.mjs` and `bin/fgos.mjs` with T6; collisions and the order are in section 5.

## Verdict in one paragraph

The layer's authority split is right and stays in Node: no seat found a reason, and spec N14 names none, to move admission, the fold or the Playbook proposer to Rust; every cost the speed seat measured is bytes read twice or copied, and every defect the red-team and correctness seats reproduced is a missing check, which a language port would carry over unchanged. The Playbook engine is not a second door: it is the Playbook proposer inside the one case model (it opens the case on the ledger, admits every Unit through the same port and closes through the same function, `runner.mjs:89-145`), as spec N13/N17/RUL-WF-18 settle. What is wrong is narrower: an owner answer can be forged by any unconfined process for any milestone, a gate receipt can come from a caller-chosen command, shipped workflows are invisible to JavaScript projects (in flight), a dead controller's reservation blocks a case for good, resume cannot rerun a step that failed on infrastructure, `propose` spends 83 percent of its 2.1 s re-reading finished runs, and the ledger stores a 97 percent unread copy of every seat result (110 MB of 110 MB of ledgers; 326 MB more in `advance.log`). The size problem is two giant functions and the same mechanism written several times (one case reader in four copies, three durable-write idioms, nine run-directory builders, three slice checks, two glob engines). Every accepted fix reuses a door that exists. Net: Node about −380 to −480, Rust 0, tests about −220 to −370 (section 5); no unreproduced High.

## 1. Part A: target shapes (for owner approval)

Rust/Node boundary for every component: **Node, no move.** Sources: spec 5.6 (N14) keeps admission, projection and the Playbook proposer in Node until the Execution Core door moves to Rust; T5 closed with that door in Node (T5 arbitration section 2, "Flow, not a decision: no Rust move"); the speed seat's profile (Node cpu of `propose` is 731 ms parsing result files, 563 ms `readFileSync`, 338 ms parsing ledger lines, all of it copies that the fixes delete); the red-team seat ("every finding is a wrong input or a missing check"). What is already Rust below the layer stays Rust: the `advance` mutex (holder-lock, T1), process facts, custody (Run Supervisor), the durable-file door.

**Two engines, one model (settled, not an owner question).** The Playbook runner is the Playbook proposer of spec N17; `fgos workflow start <preset>|--units` is the planned-work door AGENTS.md names beside `fgos run`. The Work step-machine residue in `definition.mjs`/`steps.mjs` (`phase`, `skill`, `operations`, `transitions`, `aliases`, `statusSkills`, about 200 lines) and the `steps:` list of `feature.yaml` are T7's and go at `wf-coding-cutover`; T6 isolates them into named normalizers so T7 can delete them whole, and does not count them in the budgets.

**Guide** (`guide-schema`, `definition`, `steps`, `loader`, `checked`, `ref-digests` is the Case ledger's, see below).
- **Authority:** what a guide and a Playbook definition may say; the closed guard catalog; the one vocabulary (rigor order, gate modes, step and guide kinds); step ids and aliases; where a definition is found.
- **Contract and ports:** `validateWorkflow(raw)` returns one frozen definition with its guide; `normalizeGuide`; `loadWorkflow(id, { packageRoot })` scans the project tier first, then the running payload's own root (`OWN_PAYLOAD_ROOT`, the root the native door already resolves), never "the nearest `package.json`" (R-2). Kernel files import nothing above them; the vocabulary is defined once in `guide-schema.mjs` (the lowest file) and imported by `definition.mjs`, `case-projection.mjs`, `case-admission.mjs`, `propose*.mjs` (simplicity 2). A `dependsOn` cycle is refused at validation, by the loop `orderSlices` already has, moved down into the kernel (R-8).
- **Node budget:** ≤ 1 290 lines (from 1 345). `validateWorkflow` ≤ 80 lines as a composition of `normalizeStep`, `normalizeUnit`, `normalizeGate`, `checkStepRefs` and the three Work-machine normalizers; no helper over 110; no file over 500.
- **Delete:** five copies of the G2 infrastructure-field loop (one `rejectInfraFields`), `VALID_RIGORS`, `RIGORS`, the second gate-mode set, `entryStep`, `resolvePackageRoot` (R-2, in flight), the doctor's second tier walk (`workflow-definition-files.mjs` reuses `workflowDirs`/`parseWorkflowFile` from `loader.mjs`, simplicity 15).
- **Doctor rows:** `workflow-capabilities-configured` (kept, T5 handles its registration per doctor plan line 82); `domain-workflow-operations-coverage` and `domain-registry-compiled` follow doctor plan P08 (release tiers become an `npm test` case with the same function; the row keeps only project tiers, or leaves doctor when there is none). T6 changes neither registration.

**Case ledger** (`store`, `case-projection`, `case-runtime`, `case-lock`, `case-frame`, `case-close`, `ref-digests`).
- **Authority:** the append-only ledger (fsync, fail closed on a corrupt or unterminated line), its one fold to milestones, routes and frame left; the inbox beside it; the `advance` hold; closing; which evaluator may achieve which milestone.
- **Contract and ports:** `appendWorkflowEvent` only under `advance`; one reader `readCaseProjection(mainRoot, id, { retryTail })` in `case-projection.mjs` (the four copies in `runner.mjs`, `case-admission-port.mjs`, `case-close.mjs`, `case-verbs.mjs` go; `projectCase` takes the folded state instead of folding twice; `playbookSubjectDigests` moves to `ref-digests.mjs`) (simplicity 4, red-team R-9 reader); one `runDirOf`/`runsRoot` in `store.mjs` that refuses an id that is not one path segment of the case-id pattern `caseEnvOf` already uses (simplicity 8, B-15, R-9); durable writes only through `replaceDurably`/`installOnce` plus one exported `fsyncDirectory` in `store.mjs`, and a short `writeSync` is retried or refused (simplicity 7, B-10, B-11, B-12); `drainCaseInbox` is the one place that folds runtime files in and releases a quiet, never-linked writing reservation through `applySettle` with `reservationQuiet` (B-2); a `gate.answer` never achieves a delivery milestone (R-1); two receipts on one milestone are merged, not replaced (`p-3ydqquajy2`); `unit.complete` stores each seat result without `runResult.evidence` (W-2); a reservation event carries its `binding` and the reservation files go (B-13).
- **Node budget:** ≤ 1 200 lines (from 1 251, after absorbing the reader and the drain release). `projectWorkflowState` ≤ 150, `projectCase` ≤ 120.
- **Delete:** three of four case readers and the double fold; `case-runtime.mjs:152-153` hand-rolled write-rename; `fsyncDir` in `case-bindings.mjs`; eight of nine run-directory builders; the four reservation-file functions; `CASE_EVENT_KINDS`; the `case-lock.mjs` holder-list twin. `reservationQuiet` is **kept** (B-2 gives it its caller; it loses its export).
- **Doctor rows:** none of its own.

**Admission** (`case-admission`, `case-admission-port`, `case-bindings`, `case-gate`).
- **Authority:** may this activity run now; route kind; reservation and settle; one binding per worktree with generation; the whole-worktree gate receipt.
- **Contract and ports:** the Execution Core's `CaseAdmissionPort` (T5-owned interface, unchanged; Work callers `fanout-batch`, `work-dispatch`, `operation-choice` unaffected). `admitProposal` stays pure and compares the selected pattern with `activity.unit?.pattern`, classifying a swap as `unlisted` (reason required, deviation charged, refused at a listed-routes-only point) (B-4). A writing reservation's liveness is the worktree custody lease `runUnit` already holds, taken before `port.admit` (T5 file, reorder only) and held by `runCaseGate` around its command (`runCommand` already takes `{ custody }`, `goal-check.mjs:51`) (B-2). The gate runs the capability's declared check (owner Q1). Crash-left binding records (pending without a `binding` event, B-7; committed after `unbound`, B-8) are settled on the Workflow normal path under the case's `advance`, not by `doctor --fix` (doctor plan P09, decision 65 3a).
- **Node budget:** ≤ 930 lines (from 965). `admitProposal` ≤ 110 as six pure guards; `createCaseAdmissionPort` ≤ 110.
- **Delete:** the unread `bindings` output of `admitProposal`; the duplicate bind-and-reserve block (one `bindIfWriting`); the double `bindingsDir` import and the `'.root'` literal; the `refusal(...).refused` wrap; `activityUnitOf` and its read in `bin/fgos.mjs` once the catalog takes the pattern from the admission answer (B-4); `--verify` on `workflow gate` if Q1 (a).
- **Doctor rows:** `workflow-case-binding-sentinel` stays a readiness row (doctor plan P09 line 27: the sentinel is readiness and is also written on the normal path). `workflow-case-bindings` becomes the Workflow pointer row (P09 step 6: warn, no fix, cost cap), its check becomes a read section of `fgos workflow status`, its settle/rebuild fix moves to the normal path (above). Every condition of both rows is kept (doctor table in this section).

**Conductor entry** (`propose`, `propose-classify`, `propose-frame`, `propose-validate`, `case-start`, `case-inherit`, `case-verbs`).
- **Authority:** turning slices into one proposal for owner approval; opening a case under an approved frame; taking over milestones of a closed case; the case verbs.
- **Contract and ports:** `checkManifest` is the one slice-shape authority (`proposeFrame` and `validateProposal` trust it, their re-checks and the codes `slice-invalid`/`slice-duplicate` go, simplicity 11). One glob engine and one write-path normalizer, in `write-scope.mjs` (T5 leaf; `globsMeet` moves there, `globMatches` calls it; one shared escape set checked by both test files first, simplicity 10). `findInherit` reads each ledger once, skips non-case directories, and computes digests only for a case that passes the four events-only checks (W-1). `answer` records an owner answer only to a step that is a gate of the guide (a Playbook gate, or the activity of a decision point carrying `gate:`), only while that gate is open (parked, and the last park is later than the last settling answer), and is refused at `FGOS_DISPATCH_DEPTH > 0` through the existing `confinedWriteRefusal` text (R-1, B-1). The verbs `start`, `answer`, `resume` each take `{ detached }` instead of paired functions (simplicity 12, B-14). Resume follows owner Q4. The detached advance writes progress lines only to `advance.log`; the ledger is the record (R-3).
- **Node budget:** ≤ 2 050 lines (from 2 171; about 2 040 with Q1 (a)). `propose.mjs` ≤ 640 (from 654); no function over 120. The simplicity seat's new `propose-render.mjs` is not taken (design principle 6: no file made only to move lines).
- **Delete:** the guard `readCaseProjection` at `propose.mjs:606`; two slice-shape re-checks; the second glob engine and path normalizer; three paired detached verbs; 14 test-only facade names of `index.mjs`; the slice list's `gate` key if Q1 (a); the JSON result dump of the detached child.
- **Doctor rows:** none.

**Playbook runner** (`runner`, `unit-handoff`, `units-source`, `seats`, `seat-providers`, `dir-guard`, `index`).
- **Authority:** step order of a Playbook case, parked gates, Unit hand-off of earlier reports, seat lists for panels, the `--units` one-off; never a merge if Q2 (a).
- **Contract and ports:** `advanceWorkflowRun` under the proposer's lifelong hold, a cycle loop over named steps: `isReady(step, state)`, `parkGate` (to `unit-handoff.mjs` beside `renderGateQuestion`), `prepareUnitWorktree` (beside `writeBaseOf`), `runUnitWithRecovery`, `admissionRefusalOutcome`, `foldUnitOutcome` (beside `outOfScopeWrites`), one `emit(type, payload)` and one `failStep` (simplicity 1). Units through `runUnit` with the port. Throws that escape the loop today fold into the unit's failure (B-16). A writing Unit reruns in its recorded worktree when it exists, whatever the run id (R-5 crash window). The per-unit account dry bind goes; the seat binding provenance is the one record of the pin, and `seatProviders` shows `account` (value or skip reason) per seat (B-5).
- **Node budget:** ≤ 1 430 lines (from 1 556); ≤ 1 300 with Q2 (a). `advanceWorkflowRun` ≤ 150 (from 521); no helper over 80.
- **Delete:** 14 hand-built event wrappers, three `step.fail`+`workflow.fail` pairs, `reread`, `runner.mjs:367-404` dry bind, the second `ADVANCE_DETACHED_ENV` (`dir-guard.mjs:11`); if Q2 (a): `kind: integrate`, `mergeWorkflowBranch`, `acknowledgeWorkflowLand`, the merge use of `resolveIntegrationTarget`, the integration branch of `settleUnitWorktrees`.
- **Doctor rows:** `blind-steps-use-proven-pools` (T5's, shared; unchanged).

**Doors** (`workflow` arm of `bin/fgos.mjs`, 2234-2379).
- **Authority:** argument parsing and hand-over only.
- **Contract:** `{ detached: !foreground }` into one verb each; ids checked by `runDirOf` before any path is built; no `--verify` if Q1 (a); `resume --account` keeps its named refusal.
- **Node budget:** ≤ 120 lines (from about 145).

**Doctor side** (`src/setup/workflow-case-checks.mjs`, `workflow-definition-files.mjs`).
- **Authority:** readiness only (decision 65: "can fgOS run correctly on this machine and in this project").
- **Node budget:** ≤ 180 lines (from 238): the settle/rebuild half of `fixWorkflowCaseBindings` moves to `src/workflow` (counted in the Case ledger/Admission budgets), the tier walk is reused from the loader.
- **Doctor rows kept (gate 8, no condition lost):**

| Condition | Row today | Row or proof that keeps it |
|---|---|---|
| bindings directory without `.root` sentinel (fail; fix writes it) | `workflow-case-binding-sentinel` | same row, readiness fix stays (P09 line 27) |
| a binding record unparseable, pending, not bound on its ledger, of a closed case; an open case bound on its ledger with no record; a ledger unreadable | `workflow-case-bindings` (+fix) | `fgos workflow status` read section (judgment) + normal-path repair under `advance` (B-7, B-8 included); `workflow-case-bindings` kept as pointer row, id unchanged (P09 step 6). A ledger read in flight is retried before it counts (R-9) |
| a Workflow unit names a capability with no `runner.capabilities` entry (fail), no `prefer` pool (warn), a definition does not parse (fail) | `workflow-capabilities-configured` | same (not merged into `seat-binding-dry-bind`, which treats "no pool" as info: `seat-binding-checks.mjs:17-18`) |
| a step operation resolves to nothing | `domain-workflow-operations-coverage` | `npm test` release-tier case (doctor plan P08); Work-FSM row, retires at `wf-coding-cutover` |
| a domain's `compiled.json` differs from its YAML | `domain-registry-compiled` (shared with Work) | release tiers by `npm test`, project tiers by the row (P08) |
| a blind unit can bind an unproven pair | `blind-steps-use-proven-pools` | same (T5's) |

No new row. The spec's `workflow-pools-satisfy-independence` is stale text and is deleted, not replaced (`test/setup/seat-binding-dry-bind.test.mjs:110` already asserts it stays gone).

**Whole layer:** `src/workflow` 7 288 → about 6 880 lines (about 6 740 with Q2 (a)); 0 functions over 300 (from 2); no Rust.

**Received items, settled:**
- **D1 resume (`p-d2dc4f2e`):** B-3, owner Q4 for the semantics.
- **D2 retention (`p-tslryr3buq`):** a new mechanism, so a proposed addition (owner Q5), with the ledger-keyed safety rules of section 4.
- **D3 `--account`:** B-5 = R-6; both reports are one crate rule (`rank.rs:488-541`) seen from two sides; layer part accepted, crate rule owner Q3.
- **D5 two retry owners:** already resolved on main: `b75259cbd` (2026-11-06, "leave the never-started seat retry to the execution core") removed the `fgos-cook` rerun; `core/skills/fgos-cook/SKILL.md:74-76` now says "do not rerun it yourself". The Execution Core's one lost-brief retry (`MAX_BRIEF_RETRIES = 1`, `run.mjs:240`) is the only automatic one; Workflow adds none. Residue: `core/skills/_shared/coordination-driver.md` Step 6 still says "dispatch retry ... within protocol limits"; routed to COOK with the Shape C rewrite (D10).
- **D4, D6-D12:** in section 2.

## 2. Part B: findings, merged

Checked on current main by the arbiter (file:line opened): R-1/B-1 (`case-verbs.mjs:168-185` takes any `stepId`, falls back to `gate?.question ?? ''`; `case-projection.mjs:113-121` achieves `p.milestones ?? produces` with no `isDeliveryMilestone`, while the settle branch at `:131-136` checks it); R-1b (`case-gate.mjs:68-70`, a given command wins over `verifyCommandOf`); R-2 (`loader.mjs:12-28` stops at the first `package.json`); B-3 (`runner.mjs:124` drops `failed`); W-1 (`propose.mjs:606` discards a full `readCaseProjection`, then `inheritFrom` repeats it); W-2 (`runner.mjs:505-520` copies `results` whole; `grep evidence|attribution src/workflow` finds only guide text at `guide-schema.mjs:134`); R-8 (`definition.mjs:412-422` checks existence and self-reference, no cycle); B-2 (`reservationQuiet` has no caller; `unit-run-start.mjs:387` takes custody after `port.admit`); B-5 (`rank.rs` comment "a seat the pool does not serve runs unpinned" and `account-pin-other-pool`; help text `command-registry.mjs:2403`); simplicity 3 (`grep "kind: integrate" core domains` finds only `feature.yaml:148`, a guide activity, not a Playbook step); simplicity 9 (`RunnerConfigError` declared at `config.mjs:204`, imported by 45 files, 16 of them in `src/workflow`); D5 (`b75259cbd` on main).

Severity counts after merging: **High 9** (all reproduced or measured), **Medium 17**, **Low 9**, plus 10 rejected and 4 closed or routed.

### 2.1 Accepted

| Id(s) | Sev | Repro | Fix (reused door) | Owner of file |
|---|---|---|---|---|
| R-2 | High | yes, through the activated `fgos` | **In flight, urgent** (`harden/workflow-loader`): fallback scans `OWN_PAYLOAD_ROOT`, `resolvePackageRoot` goes; one case in `workflow-loader-persona-scope.test.mjs`; CHANGELOG line | T6 |
| R-1 = B-1 (+ R-9 "pre-answer skips a final gate") | High | yes (red-team: `child-verified` achieved by an answer from depth 1, `integrate` admitted; correctness: `g2` approved before asked, never parked) | `recordAnswer` refuses a step that is no gate (`gate-unknown`) and a gate not open (`gate-not-parked`), drops the `?? ''` fallback, refuses at dispatch depth > 0 (existing `confinedWriteRefusal`); the fold's `gate.answer` branch skips delivery milestones (`isDeliveryMilestone` exists). One case each in `case-runtime.test.mjs` and `case-projection.test.mjs`. **Start now (P01)** | T6 |
| R-1b | High | yes (`check.sh` exits 1, `command: 'true'` gave `integrated: achieved/harness-verify`) | Shape is owner Q1; whichever option, `isValidReceipt` binds a `harness-verify` receipt to the command the case approved | T6 |
| B-2 | High | yes (killed gate's reservation blocks `src/**` forever; its `sleep 30` outlived it) | Custody before `port.admit` (T5 reorder, section 3); `runCaseGate` holds the custody lease through `runCommand`'s existing `{ custody }`, and its child dies with it; `drainCaseInbox` settles a quiet, never-linked writing reservation as `not-started` through `applySettle` using `reservationQuiet`; a cancelled resumable `fgos run --case` keeps its reservation (T5 rule kept). One case in `case-runtime.test.mjs` | T6 + T5 file |
| B-3 = D1 = R-5 = `p-d2dc4f2e` | High | yes (`d1/`: 7 events, `failed`, unchanged after the cause was fixed) | Semantics owner Q4. In every option: `resume` never returns silently on a failed run (named refusal `nothing-to-resume: step <id> ended <outcome>`); a crash between `unit.scheduled` and `unit.started` reuses `uState.worktreePath` (R-5 crash window, reasoned) | T6 |
| W-1 = simplicity 5 = D11 | High | yes (cpu profile: `findInherit` 1 836 of 2 223 ms, load 4) | Delete the guard at `propose.mjs:606`; skip `.bindings` and non-ledger directories; `inheritFrom` runs the four events-only checks before digests. Expected `propose` 2.14 s → about 0.3 s (arithmetic, floor 0.21 s) | T6 |
| W-2 (copy part of B-9 and simplicity 6) | High | measured (107 of 110 MB of ledgers are 86 `unit.complete` lines; offline rewrite 110 → 3.1 MB) | The one writer omits `runResult.evidence` from each stored result (+3 lines); every field a reader uses stays; old ledgers stay readable (the new shape is a subset). Shrinks `status` (W-4), `advance.log` (W-5) and the doctor read (W-8) with it | T6 |
| Simplicity 1 (+ B-16) | High | measured (521 lines, `runner.mjs:77`) | Cut as in section 1; B-16's two escaping throws fold into the unit failure | T6 |
| Simplicity 2 | High | measured (384 lines, `definition.mjs:131`) | Cut as in section 1; vocabulary to `guide-schema.mjs`; nine definition tests move out of `workflow-runner.test.mjs` into a new `test/workflow/definition.test.mjs` (the module has no test file) | T6 |
| R-3 (= W-5) | Med | yes (341 of 431 MB of `workflow-runs` is `advance.log`; `status` `lastLines` shows closing braces) | The detached child's result goes nowhere; only `progressLine` reaches the log. Spec 5.4 says `lastLines` is progress. W-5's "keep printing" is overruled: even after W-2 the tail would still be JSON, not progress | T6 |
| B-4 = `p-zpgzqdoy4z` = D4 | Med | code read | The core sends the selected pattern; `admitProposal` compares it with the declared one (`unlisted`); `activityUnitOf` and its `bin/fgos.mjs` read go. Two cases in `case-admission.test.mjs` | T6 + T5 file |
| B-5 = R-6 (layer part) = D3 | Med | yes (two real ledgers with `panelist-2` unpinned and no `unit.account-unpinned`) | Delete the dry bind; `seatProviders` adds `account` per seat; retire the `unit.account-unpinned` assertions (owner: T5's binding provenance test plus one `seatProviders` case). Crate rule: owner Q3 | T6 |
| B-7 | Med | yes (`bind-probe.mjs`) | Repair iterates the records, not the cases with a `binding` event; moves to the normal path with P09 | T6 |
| B-8 | Med | **no** (needs the staged addon for a hold) | `repairCaseBindings` removes a committed record whose ledger's last event for its key is `unbound` at its generation; sub-plan reproduces first (red test) | T6 |
| W-3 | Med | yes (16 result files parsed to digest 4 reports) | `resolveUnitRunRef` reads only the wanted seat's directory (`readSeatDirectory` exported) | T5 files |
| Simplicity 4 (+ R-9 reader race) | Med | read; race **not** reproduced | One reader with `retryTail` (section 1) | T6 |
| Simplicity 7 = B-10 = B-11 = D8 (+ B-12) | Med | read | `replaceDurably` for the answer file; `installOnce` for the first ledger line; one `fsyncDirectory`; short write looped or refused | T6 |
| Simplicity 8 = B-15 = R-9 (ids) | Med | read (`.fgos/workflow-runs/.bindings/advance.lock` exists in the real tree) | One `runDirOf` refusing a non-segment id; the three outside builders (`handoff-refs.mjs:91`, `workflow-case-checks.mjs:34`, `holder-lock-checks.mjs:225`) move in the same change | T6 + T5/T1 one line each |
| Simplicity 9 | Med | read | `RunnerConfigError` moves to an import-free leaf beside `config.mjs`; all 45 importers move in one mechanical commit (L10), no re-export | T5 file, 45 importers |
| Simplicity 10 | Med | read | One glob engine in `write-scope.mjs`; escape-set difference (`u` flag; `$ { }`) settled by both test files before the move | T5 file |
| Simplicity 11 | Med | read | `checkManifest` the one shape authority; two re-checks and their refusal groups go (owner proof `propose.test.mjs`) | T6 |
| Simplicity 12 (+ B-14) | Med | read | One verb each with `{ detached }`; facade cut to production names; B-14's discarded hold goes with the pair | T6 |
| W-10 + the four tests tables | Med | measured (7 files are 543 of 686 s) | Each behaviour moves to its owning pure function (`buildUnitHandoff` gets its own tests; seat expansion to `seats.test.mjs`; options to `unit-handoff-raise-door.test.mjs`); one real-seat wiring proof per engine path; the pure fold leaves the 154 s file for `workflow-store-ledger.test.mjs`; fixed waits become waits on the ledger event; `workflow-runner.test.mjs` split by fixture cluster (HARDEN does it: TEST is closed, as decision 69 did for H-T5a). Each retired test names its new owner | T6 |
| `p-3ydqquajy2` (correctness D6) | Med | read (`case-projection.mjs:81-84` replaces the whole milestone entry) | `achieve` merges receipts of a second guard instead of replacing them; one fold case. The other D6 rows (`p-djznnfrbbe`, `p-xtwobjzl2i`, `p-tqbcrown4m`, `p-3u7ntmlhyz`, `p-shtdt7wpfh`, `p-lwdpukgwhd`, `p-uz3hc7gz37`) stay backlog: they ask for new primitives | T6 |
| R-8 | Low | yes (`a`↔`b` accepted, run stays `running`) | Refuse the cycle in `validateWorkflow` with `orderSlices`' loop moved into the kernel (propose imports it back) | T6 |
| B-13 | Low | read | `binding` on the `reservation` event; four reservation-file functions go; their assertions move to the event payload | T6 |
| B-17 | Low | read | Codes for "already being advanced" (aligned with the port's `case-admission-busy`), "not found", and an unreadable `settle-pending` file reported | T6 |
| R-9 (inbox) | Low | read | A `settle` with no `reservation` is refused; a round's `stepId` comes from its directory; inbox files read through `readAgentFileSync` (the T5 rule for host reads of files another process can write) | T6 |
| Simplicity 13 | Low | read | Dead and over-exported names, dead `bindings` output, aliases, duplicate env constant, `ref-digests.mjs:5` comment; `reservationQuiet` stays (B-2) | T6 |
| Simplicity 14 | Low | read | One `bindIfWriting`; one `refusal` wrap | T6 |
| Simplicity 15 | Low | read | Doctor reader reuses the loader's tier walk | T6 |
| W-8 | Low | yes (345 ms with 0 records) | Falls out of W-2 and the P09 move | T6 |
| Stale text: simplicity 17 = D9 + red-team spec table | Low | read | Spec: drop `integrate.mjs`, `plan-source.mjs`, `workflow-pools-satisfy-independence`, the section 9 rework table, "before cutover"; `consent-before-merge` row is named as enforced by the approve door (no activity produces `approved`); one trust line: a project YAML's unit `verify` runs on the host like `capabilities.*.verify`; `lock-registry.v1.json:52` source becomes `case-lock.mjs`; help text `command-registry.mjs:2403` follows Q3. DOC told before merge | T6 + T1 contract text |

### 2.2 For the owner

| Id(s) | Sev | Repro | Question |
|---|---|---|---|
| Simplicity 3 = R-4 = B-6 (Playbook `integrate`) | Med (High as a size item for simplicity) | mechanism proven by its own test (`case-verbs.test.mjs:52`); half-landing **not** reproduced | Q2. If kept, B-6 applies (acknowledge `landed` on every exit, `landed` on `step.fail`) and the sub-plan reproduces the half-landing first |
| W-9 = R-7 = D2 (retention) | Med | measured (1.4 GB, 529 dirs; 435 MB, 54 runs; 1 312 MB older than 7 days) | Q5 (proposed addition A1) |

### 2.3 Rejected (with source)

- **B-9 reference-only `unit.complete` and simplicity P1 (per-seat summaries):** not now. W-2 removes 97 percent of the bytes with no reader changed; B-9 would send the hand-off, gate question and `seatProviders` to `readUnitRunHistory`, the path W-3 measured as the expensive one (67 ms per full pass, 640 ms inside `propose`). Listed as A8.
- **Simplicity 6 part 1 (number an append from the ledger tail):** W-6 measured the runner's own overhead at 0 spawns and 16 fsyncs, about 0.15 s per step boundary; after W-2 a whole-ledger read is milliseconds. A second read path for no measured gain.
- **Sentinel row merged into `workflow-case-bindings`** (correctness, red-team, simplicity): doctor plan P09 (owner decision 65 2b/3a) keeps the sentinel as readiness and turns the bindings row into a pointer; merging a readiness row into a pointer row would put a readiness fix behind a warn-only row.
- **W-4 `status` prints seat rows only:** a contract change for an output W-2 already bounds (23.3 MB → about 0.7 MB). Listed as A3.
- **W-7 `loadTests` reads every test file:** bounded by the checkout, 0.25 s on a code slice, not growing with use (the speed seat's own verdict).
- **Speed question 4 (inherit reads only the N newest ledgers):** changes behaviour (an old matching case is no longer found); W-1 plus retention bound the cost without it. Listed as A6.
- **Simplicity P2 `syncDirectory` verb on the durable door:** the seat recommends against it; one exported helper removes the duplicate at no cost.
- **New file `propose-render.mjs`:** design principle 6 (no file only to move lines); `propose.mjs` gets a budget of 640 instead.
- **Simplicity 16 (split `unit-handoff.mjs`):** no function over 100; the seat proposes no action.
- **W-6 (runner overhead):** confirms no change is needed.

### 2.4 Closed or routed

- **D5 `fgos-cook` retry:** closed by `b75259cbd` on main (section 1, received items).
- **D10 `coordination-driver.md`** (Shape C rule, Step 6 "Retry"): COOK, the doctrine owner named in spec risk R8 (`spec.md:605`).
- **Red-team P-3 run-output size cap:** T5 confinement; addition A5.
- **Remaining D6 rows:** stay backlog (section 2.1).

### 2.5 Unreproduced

- **Highs: none.** Simplicity 1 and 2 are measured sizes (function scan), the other seven Highs were reproduced on the activated release.
- **Mediums and Lows not reproduced** (the sub-plan writes the red test first, or records why it cannot): B-8 (needs the staged addon), the R-9 reader race on a multi-megabyte append, R-4/B-6 half-landing (only if Q2 keeps the step), the R-5 crash window, B-4 (code read), `p-3ydqquajy2` (code read).

## 3. Cross-lane asks

| File or item | Owner | What T6 needs | Who must agree |
|---|---|---|---|
| `src/runner/execution/unit-run-start.mjs` (custody before `port.admit`, B-2; send the selected pattern, B-4), `patterns/catalog.mjs` (B-4), `handoff-refs.mjs`, `unit-run-history.mjs` (W-3, `runDirOf`), `src/runner/dispatch/write-scope.mjs` (simplicity 10), `config.mjs` + 45 importers (simplicity 9) | T5, closed (HARDEN) | Small edits inside the approved T5 shapes, no interface change; the `CaseAdmissionPort` interface stays | lead:HARDEN (own closed layer, decision 48 rule for drift fixes inside RUL104); board line before the 45-file sweep, which every open branch will feel |
| `packages/seat-binding/rust/src/rank.rs:488-541` and the golden vectors (Q3 (a)) | Seat Binding (T5 component; SEAT lane closed) | One condition: a pin never moves a seat across pools | **Owner** (Q3); land gate per Rust rules (msvc check, clippy `-D warnings`, `cargo fmt --check`) |
| `src/runner/goal-check.mjs` `runCommand` (gate child dies with the gate, B-2) | runner infra used by Work | Use the existing `{ custody }` path; no new spawn door | lead:ES (WORK+ES) told before merge |
| `docs/platform/git/spec.md:361,1073`, `test/git/e2e-consumer-noncoding.test.mjs:91`, `packages/git/contracts/mutation-census.v1.json` (`case-gate.mjs:100`, `case-verbs.mjs` spawn sites) | Git | If Q2 (a): Land consumer proof re-homed (`test/runner/merge-land.test.mjs` already owns Land); census lines follow moved spawn sites | OPC (Git reviewer) |
| `packages/holder-lock/contracts/lock-registry.v1.json:52`, `src/setup/holder-lock-checks.mjs:225` | T1, closed (HARDEN) | Source pointer text; one import line | OPC review of the contract text |
| Doctor readiness plan P08, P09 (`registrations.mjs`, `workflow-case-checks.mjs`) | HARDEN doctor track | T6 does the Workflow half of P09 (judgment as a `workflow status` read section, settle/rebuild on the normal path, B-7/B-8 in it); P09 then registers the pointer row; T6 touches no registration | lead:HARDEN; WORK told (P09 named WORK, which is held: decision 67, "foundation first, Work later") |
| `definition.mjs`/`steps.mjs` Work-machine residue, `feature.yaml` `steps:` | T7 (`wf-coding-cutover`) | T6 isolates, does not delete | lead:ES confirms (simplicity question 3) |
| `core/skills/_shared/coordination-driver.md` | COOK | Shape C rule and Step 6 retry wording | COOK lead |
| `docs/platform/workflow/spec.md`, `component-boundary.md` | DOC | Part A shapes and stale text | DOC lead messaged before merge (plan rule) |
| `docs/architecture-manifest.json`, `test/architecture.test.mjs` | shared | The new `RunnerConfigError` leaf and `definition.test.mjs`; vocabulary stays in a kernel file | none beyond the board line |

## 4. Proposed additions (RUL104: not accepted; owner picks; none counted in section 5's accepted total)

| # | Addition | Problem and evidence | Benefit | Cost |
|---|---|---|---|---|
| A1 | Retention of finished runs (`p-tslryr3buq`) | 1 405 MB in 529 `.fgos/assignments` dirs (one unit run 31 MB, 29 MB of it the worker's outbox), 435 MB in 54 runs; 1 312 MB and 356 MB older than 7 days; never pruned; `propose`, doctor and `dispatch inspect` walk these trees. After W-2 and R-3 the ledger tree grows about 97 percent slower; the assignments tree does not | Bounded disk and walk time; releases the operator from manual cleanup | Node +100 to +160, tests +60 to +80 (estimate; options in Q5). Safety rules from three seats: remove only a terminal case's ledger and its Unit runs older than N days; never a Unit run an open case names (`unit.started`, `unit.complete`, `reservation`, `settle`, a `unit-run:` ref), one whose custody, attempt or `advance` lock is held, one that is resumable (unsettled `unit.json`), or a report an approval digest still stands behind; a ledger only with or after its Unit runs |
| A2 | Record the approved gate command on `case.opened` | R-1b if the owner keeps ad hoc gates | Receipt bound to what the owner approved | +5 Node, +20 test; only with Q1 (b) |
| A3 | `status` prints one row per seat, not the results | Up to 23.3 MB per call before W-2 | Bounded document | contract change; not recommended (W-2 bounds it) |
| A4 | Order guard on an injected Unit runner (speed P3) | 62 real seat runs, 78.8 s, to prove an order | That file about 4 s | +3 Node + a test helper; not recommended: decision 62 declined the analogous injectable port A2, and W-10's moves to pure owners take most of the time |
| A5 | Size cap on the run-output grant (red-team P-3) | A confined worker can fill the project disk (31 MB per unit today, unbounded) | Bounded worst case | T5 confinement; backlog row, not T6 |
| A6 | `propose` inherit reads only the N newest ledgers | History-dependent cost | Cost independent of history | behaviour change; not recommended (W-1 + A1) |
| A7 | `syncDirectory` verb on the durable door | Two local fsync helpers | No durability code in Workflow | Rust +6; not recommended (simplicity's own advice) |
| A8 | `unit.complete` keeps references only (B-9, simplicity P1) | Remaining 3 percent copy | Ledger in kilobytes | ledger contract change, readers move to the slower unit-run read (W-3); not recommended now |

## 5. Net size forecast and phase order

### 5.1 Net size (HARDEN commits, estimate)

| | Node | Rust | Tests |
|---|---|---|---|
| Giant cuts, `emit`/`failStep`, one reader and one fold (simplicity 1, 2, 4) | about −160 | 0 | about 0 (definition tests moved) |
| Durable writes, path door with id check (simplicity 7, 8, B-10..B-12, B-15) | about −35 | 0 | +10 |
| Slice checks, glob engine, verb pairs, facade, dead names, bind block, doctor tier walk (simplicity 10-15, B-14) | about −200 | 0 | about −90 |
| Dry bind, reservation files, `activityUnitOf` (B-5, B-13, B-4) | about −80 | 0 | about −60 |
| Fixes added (R-1, B-2, B-7, B-8, R-8, R-9, B-16, B-17, `p-3ydqquajy2`, W-1, W-2, W-3, R-3, `seatProviders` account, P09 Workflow half) | about +75 | 0 | about +160 |
| Seat-launching duplicates to pure owners, `workflow-runner` split (W-10) | 0 | 0 | −250 to −400 |
| **Accepted total** | **about −380 to −480** | **0** | **about −220 to −370** |
| R-2 (in flight, outside the sub-plan) | about −15 | 0 | +15 |
| Q1 (a) declared check only / (b) bind ad hoc (A2) / (c) as today | −10 / +5 / 0 | 0 | ±0 / +20 / 0 |
| Q2 (a) delete integrate / (b) keep and fix | −110 to −150 / +20 | 0 | about −250 / +20 |
| Q3 (a) pin never moves a seat / (b) keep, fix text | 0 / 0 | +5 (golden JSON +10) / 0 | +10 / 0 |
| Q4 (a) infra failure reopens / (b) terminal, named refusal | +6 / +3 | 0 | +30 / +10 |
| Q5 (a) prune verb / (b) verb + at case close / (c) one manual cleanup | +100 to +140 / +120 to +160 / 0 | 0 | +60 / +80 / 0 |

Layer total ≤ 0 in every combination (worst: −380 +5 +20 +6 +160 = −189 Node; tests worst about −60). Time: `propose` 2.14 s → about 0.3 s (arithmetic, load 4); new ledgers about 97 percent smaller; `advance.log` stops growing with results; Workflow test time about −70 to −100 s of the 543 s the seven slow files take (arithmetic from per-test sums, not measured after).

### 5.2 Phase order sketch (for the sub-plan)

Lanes own files, not findings, so every lane in a wave is file-disjoint. A new door lands with all its callers in one commit (L10); a one-line import change in another lane's file is allowed in that commit and the other lane rebases.

- **P00 (in flight):** R-2, `loader.mjs` + one test.
- **P01 (start now):** R-1/B-1 + `p-3ydqquajy2`: `case-verbs.mjs` (`recordAnswer` only), `case-runtime.mjs` (`recordGateAnswerRound` only), `case-projection.mjs` (`gate.answer` branch, `achieve`). Serial before α because α owns those files next.
- **Wave 1, five lanes in parallel after P01:**
  - **α Case core:** `store`, `case-projection`, `case-runtime`, `case-lock`, `case-bindings`, `case-close`, `case-frame`, `case-admission-port`, `case-gate`, `case-start`, `case-verbs`, `ref-digests`, `src/setup/workflow-case-checks.mjs`. In order: one reader + `runDirOf` (first, others rebase onto it) → durable writes, B-13, B-2 drain and gate lease, P09 Workflow half with B-7/B-8, R-9 → W-2's readers check, R-3, verb fold (simplicity 12, B-14, B-17), Q1.
  - **β Playbook runner:** `runner`, `unit-handoff`, `units-source`, `seats`, `seat-providers`, `dir-guard`, `index`. Cut of `advanceWorkflowRun`, W-2 writer, B-5, B-16, R-5, Q4, Q2; its `reread` swap lands after α's reader.
  - **γ Guide:** `definition`, `guide-schema`, `steps`, `loader` (after P00), `checked`, `src/setup/workflow-definition-files.mjs`. Cut of `validateWorkflow`, vocabulary (with the import swaps in α/δ/ε files), R-8, simplicity 15, Work-machine normalizers isolated.
  - **δ Conductor entry:** `propose*`, `case-inherit`, `src/runner/dispatch/write-scope.mjs`. W-1, simplicity 10, 11, Q1's slice `gate` key.
  - **ε T5-side files:** `unit-run-start.mjs`, `patterns/catalog.mjs`, `case-admission.mjs`, `handoff-refs.mjs`, `unit-run-history.mjs`; `packages/seat-binding` if Q3 (a). B-2 custody reorder, B-4, W-3, the Q3 crate condition.
- **Wave 2, serial:** **P08 Doors** (`bin/fgos.mjs` `workflow` arm: `{ detached }`, `--verify` per Q1, `activityUnitOf` read) after α, δ, ε; **P09 `RunnerConfigError` leaf** (45 files, one mechanical commit, announced on the board, when no lane has an open branch on those files); **P10 tests** (W-10 moves and the `workflow-runner.test.mjs` split) after β; Q5 (A1) as its own lane if taken, files disjoint from all others (new code in `src/workflow` plus the verb in P08's arm, so its verb line joins P08).
- **P11 close:** spec Part A and stale text, help text, CHANGELOG (R-2, R-1, Q1, Q2, R-3, the per-seat account in `status`, Q4, Q5), DOC told, re-measure on the activated release, closing report.

**Collisions with the doctor readiness plan:** `src/setup/registrations.mjs`: T6 makes no registration change, so none; P09's pointer registration follows T6's α phase. `src/setup/workflow-case-checks.mjs`: α first, then doctor P09. `bin/fgos.mjs`: doctor P04/P05 add the `git` and knowledge verbs in other arms; T6's P08 is one arm, landed in its own window with a board line, rebased on whatever doctor landed. `src/setup/workflow-definition-files.mjs` (γ) is read by the `workflow-capabilities-configured` row only; doctor P08 does not edit it.

## 6. Owner ask 1 (gửi anh)

Em gom bảy câu, mỗi câu theo mẫu câu hỏi quyết định; anh trả lời một lần, ví dụ "1a 2a 3a 4a 5b 6a 7a". Ba việc không cần anh trả lời: R-2 (workflow có sẵn "not found" trong mọi project có `package.json` ở gốc) đang sửa gấp; R-1 (lệnh `workflow answer --approve` đánh dấu đạt được cả milestone giao hàng mà không có verify) em bắt đầu ngay sau R-2 vì chỉ là thêm kiểm tra còn thiếu; retry lại seat của `fgos-cook` đã bỏ trên main từ `b75259cbd` (06-11).

**Q1. `fgos workflow gate --verify` nhận lệnh tuỳ ý.**
- **Chuyện gì đang xảy ra:** `workflow gate` chạy bất kỳ lệnh nào người gọi truyền vào và ghi biên nhận `harness-verify` cho milestone `integrated`. Red-team cho project có check thật thất bại, truyền `--verify true`: gate ra `pass`, `integrated` đạt.
- **Nguyên nhân:** em đã mở `case-gate.mjs:68-70`: lệnh truyền vào thắng lệnh `verify` khai cho capability; `propose.mjs` còn in trường `gate` do agent viết trong danh sách slice; `isValidReceipt` không so lệnh với thứ gì, và proposal đã duyệt không nằm trên ledger.
- **Các lựa chọn:** (a) gate chỉ chạy `verify` đã khai cho capability; bỏ `--verify` và trường `gate` của slice; Node −10; project phải khai `capabilities.<cap>.verify` (propose đã từ chối khi thiếu). (b) giữ lệnh tự do nhưng ghi lệnh đã duyệt vào `case.opened`, admission của `integrate` từ chối lệnh khác (addition A2); Node +5, test +20. (c) để nguyên; 0 dòng, lỗ vẫn mở.
- **Khuyến nghị:** (a): một nguồn lệnh, biên nhận không giả được, không thêm trường mới.
- **Phạm vi:** "có (a)" cho phép đổi `case-gate.mjs`, `propose.mjs`, nhánh `workflow` của `bin/fgos.mjs`, test của chúng và một dòng CHANGELOG; không đổi cách `capabilities.*.verify` được cấu hình.

**Q2. Xoá bước `integrate` của Playbook.**
- **Chuyện gì đang xảy ra:** một bước `kind: integrate` trong Playbook merge nhánh của từng unit thẳng vào trunk qua Git Land, không chạy verify; khi unit thứ hai bị từ chối thì unit đầu đã nằm trên trunk mà báo cáo đọc như "chưa merge gì", và operation Land đầu không được acknowledge.
- **Nguyên nhân:** em đã grep `kind: integrate` trong `core` và `domains`: chỉ có `feature.yaml:148`, mà đó là activity của guide (conductor dùng `fgos workflow gate`), không phải bước Playbook; không preset nào, `units` file cũng không tạo được bước này. Nó là cửa merge thứ hai bên cạnh approve door (trái L10, spec "merge ở approve door"). Spec Git (`git/spec.md:361`) còn ghi nó là một consumer của Land có proof.
- **Các lựa chọn:** (a) xoá kind, `mergeWorkflowBranch`, `acknowledgeWorkflowLand` và nhánh integrate; Node −110 đến −150, test khoảng −250; OPC chọn chỗ đặt lại proof consumer của Land (`merge-land.test.mjs` vốn là proof chính). (b) giữ, sửa: chuẩn bị mọi merge rồi mới publish, acknowledge ở mọi lối ra; Node +20, test +20; project nào tự khai bước này vẫn dùng được.
- **Khuyến nghị:** (a): không ai trong hệ thống dùng, và nó là cửa merge thứ hai không verify.
- **Phạm vi:** "có (a)" cho phép xoá trong `src/workflow`, sửa `git/spec.md` và test consumer của Git sau khi OPC đồng ý; ghi CHANGELOG (project tự khai `kind: integrate` sẽ bị từ chối theo tên).

**Q3. `--account` của một run đi xa đến đâu.**
- **Chuyện gì đang xảy ra:** `fgos workflow start --account gemini/tetnu` đã dời seat framing vốn là openai sang gemini (DOCOS); trên panel, pin có thể đẩy mọi seat về một family, làm mất độ đa dạng mà panel cần; seat nào pool không phục vụ thì chạy unpinned mà status không nói. Help text lại ghi "seat có model thuộc pool khác chạy unpinned".
- **Nguyên nhân:** em đã mở `rank.rs:488-541`: một luật phục vụ cả "login nào trả tiền" lẫn "provider nào chạy": khi pool phục vụ được seat thì chỉ giữ ứng viên của pool đó. Phía Workflow, `runner.mjs:367-404` dry-bind rồi gán pin cho mọi seat, kể cả qua override không scope.
- **Các lựa chọn:** (a) pin không bao giờ dời seat sang pool khác: chỉ áp cho seat mà lựa chọn đầu đã thuộc pool đó, seat khác chạy unpinned và hiện rõ trong status; một điều kiện trong crate, golden vectors đổi; Rust +5, test +10; ai muốn cả panel chạy một provider thì dùng `prefer` hoặc `--seats`. (b) giữ "pin dời seat", chỉ sửa help text và spec cho đúng; 0 code.
- **Khuyến nghị:** (a): account là lựa chọn trả tiền, không phải lựa chọn provider, và đúng điều help text đang hứa.
- **Phạm vi:** "có (a)" cho phép đổi một điều kiện trong `packages/seat-binding` (layer T5 đã đóng) và golden vectors. Với cả hai lựa chọn em vẫn xoá dry bind ở runner và cho `workflow status` hiện account từng seat; `resume --account` vẫn bị từ chối theo tên.

**Q4. `workflow resume` sau khi một bước hỏng.**
- **Chuyện gì đang xảy ra:** một lần launch seat hỏng (ví dụ repo chưa có commit) làm bước và cả run thành `failed`; sửa xong nguyên nhân rồi `resume` cũng không chạy lại, và không báo gì.
- **Nguyên nhân:** đã tái hiện: `runner.mjs:124` bỏ bước `failed` khỏi tập sẵn sàng, `store.mjs:382-397` gập bước và run thành `failed`, không event nào mở lại.
- **Các lựa chọn:** (a) lỗi hạ tầng (`execution-failure`, `not-started`, unit không có verdict seat đã settle) được `resume` mở lại: chạy Unit mới, admit lại (tính vào khung và trần seat), giữ nguyên mọi thứ đã xong, unit ghi chạy lại trong worktree cũ; verdict (`findings`, `refused`, ghi ra ngoài phạm vi) thì terminal và `resume` từ chối có tên; không thêm retry tự động nào (chỉ còn một lần retry mất brief của Execution Core); Node +6, test +30. (b) giữ terminal; `resume` chỉ báo từ chối có tên, muốn chạy lại thì `start` run mới; Node +3, test +10.
- **Khuyến nghị:** (a): một lần launch hỏng không còn làm mất cả run, mà `resume` không thành cửa "chạy tới khi pass".
- **Phạm vi:** "có (a)" cho phép đổi `runner.mjs`, `store.mjs`, `case-verbs.mjs` và test; ghi luật vào spec Workflow; báo COOK sửa câu "Retry" ở Step 6 của `coordination-driver.md`.

**Q5. Dọn `.fgos/assignments` và `.fgos/workflow-runs` (addition A1, `p-tslryr3buq`).**
- **Chuyện gì đang xảy ra:** trên fg-server2 có 1,4 GB trong 529 thư mục assignments và 435 MB trong 54 run, không bao giờ được dọn; 1,3 GB đã quá 7 ngày. `propose`, doctor và `dispatch inspect` chậm dần theo số thư mục.
- **Nguyên nhân:** không có cơ chế nào dọn; sau khi sửa W-2 và R-3 thì ledger mới nhỏ đi khoảng 97%, nhưng assignments (31 MB mỗi unit run, chủ yếu outbox của worker) vẫn lớn mãi.
- **Các lựa chọn:** (a) một lệnh `fgos workflow prune --older-than <N>d` (mặc định 14 ngày, chạy thử là mặc định, `--apply` mới xoá) với luật an toàn ở mục 4 A1; Node +100 đến +140, test +60. (b) như (a) và tự chạy ở cửa đóng case cho các case đã kết thúc quá N ngày; Node +120 đến +160, test +80. (c) chỉ dọn tay một lần trên fg-server2 như quyết định 59 câu 2; 0 code, sẽ đầy lại.
- **Khuyến nghị:** (b): không ai phải nhớ đi dọn (ưu tiên 2, giải phóng con người), và luật an toàn không bao giờ xoá run còn được case mở nhắc tới, đang giữ lock hay còn resume được.
- **Phạm vi:** "có" cho phép thêm một verb trong nhánh `workflow` và code dọn trong `src/workflow`, một dòng CHANGELOG; không đổi schema `~/.fgos/config.json` (N là flag, không phải config).

**Q6. Duyệt hình dạng mục 1 và các addition mục 4.**
- **Chuyện gì đang xảy ra:** bốn seat đồng ý: cả layer ở lại Node (spec 5.6), Playbook runner là Playbook proposer trong cùng một mô hình case chứ không phải cửa thứ hai; mỗi thành phần có ngân sách Node, `src/workflow` từ 7 288 xuống khoảng 6 880 dòng, không còn hàm nào trên 300 dòng.
- **Nguyên nhân:** số dòng lấy từ baseline và seat simplicity; bảng doctor theo kế hoạch doctor (quyết định 65): row sentinel giữ làm readiness, `workflow-case-bindings` thành row trỏ, phần sửa chạy trên đường bình thường của Workflow.
- **Các lựa chọn:** (a) duyệt mục 1 như viết, không lấy addition nào ngoài câu Q5; (b) duyệt và lấy thêm addition anh chọn (A2-A8, chi phí ở bảng mục 4); (c) sửa mục 1 ở điểm anh chỉ ra.
- **Khuyến nghị:** (a): A2 chỉ cần nếu Q1 chọn (b), A5 nên thành row backlog của T5, các addition khác em không đề nghị.
- **Phạm vi:** "có (a)" ghi hình dạng vào spec Workflow (báo DOC trước khi merge) và cho sub-plan T6 làm mục 2.1; addition không được chọn vẫn nằm trong danh sách RUL104 của plan.

**Q7. Giờ land.**
- **Chuyện gì đang xảy ra:** T6 sẽ land theo từng sub-phase như T4 và T5.
- **Nguyên nhân:** quyết định 59 (6a) và 61 (5a) chỉ áp cho T4 và T5. T6 không đổi schema `~/.fgos/config.json`.
- **Các lựa chọn:** (a) fg-server2 tự land từng sub-phase khi gate của phase đó qua, trong khung yên đã báo trên board; máy anh và fg-server làm theo guide tiếng Việt vào giờ anh chọn. (b) chờ anh đặt giờ cho từng lần land.
- **Khuyến nghị:** (a).
- **Phạm vi:** chỉ giờ land của T6 (gồm R-2 và R-1 đang làm trước); không gồm kế hoạch doctor, vốn có giờ land riêng.
