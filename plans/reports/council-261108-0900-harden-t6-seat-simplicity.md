# HARDEN T6 council: SIMPLICITY seat (axes C, D, E: one door, dead code, size)

Read-only review of `src/workflow/**` at main `0291d40ed` plus `833da4b4a`, fg-server2, 2026-11-08 (Asia/Saigon). Lens: the two giant functions, duplicated mechanisms, the playbook engine against the conductor path, dead exports and stale names, the Workflow doctor rows, duplicated tests, and a Node budget per component. Citations are glossed where they first appear: RUL104 (D-ADR0062, "better, not bigger": every change makes what exists better, adds no feature, layer or mechanism); L10 (platform law: extend through the door, never beside it); L3 (platform law: the JSONL is the truth, a database is a view); design principles 1 (one door), 2 (strict bottom-up layering), 6 (KISS and DRY), 7 (one authority, one source of truth), 8 (one proof per behaviour); RUL-WF-18, N13, N17 (rules and owner decisions in `docs/platform/workflow/spec.md`: a playbook is a guide with no second scheduler; the harness's own proposer is called "Playbook proposer"; that proposer holds `advance` for its whole life).

## What I read and what I ran

- Read every line of all 30 files of `src/workflow/` (7 288 lines), the doctor side (`src/setup/workflow-case-checks.mjs`, `workflow-definition-files.mjs`, the 5 row registrations in `registrations.mjs`), the `workflow` arm of `bin/fgos.mjs` (2234-2379), `src/runner/dispatch/write-scope.mjs`, and the spec sections that decide the shape (2.1, 5.4 to 5.6, 9, 18).
- Measured (read-only, no process left running): `node` scripts in the session scratchpad that import `store.mjs`, `case-projection.mjs`, `propose.mjs`, `propose-validate.mjs` directly; load average 3.6 at the time. No test run, no cargo, no daemon.
- Not read: the bodies of `src/runner/execution/*` and `src/runner/dispatch/config.mjs` (only the names the workflow files import).

## Part A. Target shape per component

Plain verdict first. The layer is not bloated by its two engines; it is bloated by four things: (1) two functions that hold a whole flow, (2) the same mechanism written several times (one case reader in four copies, durable writes three ways, the run-directory path nine times, the slice shape check three times, two glob engines), (3) one engine feature no shipped definition uses, (4) a facade and helper surface wider than anyone calls. A cut at real boundaries moves lines; the saving comes from deleting the repeats, so the budgets below are built from the delete list, not from the cuts.

**Playbook against conductor: neither is dead, and neither is a second door.** The Playbook runner is the Playbook proposer inside the one case model: it takes the case's `advance` for its life, opens the case on the ledger (`runner.mjs:97`, `legacy: true`), admits every Unit through the same admission port (`runner.mjs:89`, `case-admission-port.mjs:264`) and closes by the same function as the verb (`runner.mjs:145`). That is exactly spec N13/N17/RUL-WF-18 and the section 9 plan ("rewrite into a proposer, split `runner.mjs` by role"). `fgos workflow start <preset>|--units` is the planned-work door that AGENTS.md names beside `fgos run`. Seven presets, `content-publish`, and the `steps:` list of `feature.yaml` still need it. What the two paths do share twice is the reading of one ledger (finding 4) and the two folds of it (`projectWorkflowState` and `projectCase`); those are the duplicates to remove, not an engine.

| Component | Authority for | Contract and ports | Rust/Node boundary and Node budget | Delete list (details in section 3) | Doctor rows kept | Size target |
|---|---|---|---|---|---|---|
| **Guide** (`guide-schema`, `definition`, `steps`, `loader`, `checked`, `ref-digests`) | what a guide and a playbook definition may say; the closed guard catalog; the one rigor, gate-mode, step-phase and effect vocabulary | in: raw YAML object; out: one frozen definition with its guide. Kernel files import nothing above them. Vocabulary tables live in `guide-schema.mjs` (lowest file) and every other file imports them | Node, no move (spec 5.6; `state/domain-registry` and `state/replay` import the kernel). 1 345 to about 1 300 | five copies of the G2 field loop; `VALID_RIGORS`, `RIGORS`, gate-mode and kind sets written twice; `entryStep`; the loader/doctor duplicate tier walk | `workflow-capabilities-configured`; `domain-registry-compiled` (shared with Work) | `validateWorkflow` at most 70 lines plus helpers of at most 110; no file over 500 |
| **Case ledger** (`store`, `case-projection`, `case-runtime`, `case-lock`, `case-frame`, `case-close`) | the append-only ledger (fsync, fail closed), the pure fold, runtime files beside it, the `advance` hold, frame counters, closing | one `readCaseProjection` door for "events + state + projection"; one `runDirOf` for every path under `.fgos/workflow-runs/<id>`; durable writes only through `replaceDurably`/`installOnce` (the shared durable-file door) | Node. The ledger stays here (spec 5.6; Event Store only if its option F10 is chosen). The `advance` mutex is already Rust (T1). 1 251 to about 1 210 | hand-rolled write-rename (`case-runtime.mjs:152`), two directory-fsync helpers, nine path builders, `reservationQuiet`, `CASE_EVENT_KINDS`, unexport 14 names | none of its own (rides `workflow-case-bindings`) | `projectWorkflowState` at most 150, `projectCase` at most 120 |
| **Admission** (`case-admission`, `case-admission-port`, `case-bindings`, `case-gate`) | may this activity run now; reservation and settle; one binding per worktree; the whole-worktree gate | port interface stays T5's (`src/runner/execution/case-admission-port.mjs`); this side only implements it | Node, no move (spec 5.6: predicate and port stay Node until the Execution Core door moves; T5 left it in Node). 965 to about 917 | the `bindings` output of `admitProposal` (no caller reads it), the duplicate bind-and-reserve block in `admit`, the double `bindingsDir` import, the `refusal(...).refused` wrap | `workflow-case-bindings` (absorbs the sentinel row) | `admitProposal` at most 110 lines by six pure guards, `createCaseAdmissionPort` at most 110 |
| **Conductor entry** (`propose*`, `case-start`, `case-inherit`, `case-verbs`) | turning slices into one proposal; opening a case under a frame; the case verbs | verbs take one `detached` option instead of paired functions; `propose-frame` and `propose-validate` trust the shape `checkManifest` and the classifier produced | Node, no move. 2 171 to about 2 036 | three-times repeated slice shape check, second glob engine and second path normalizer, `foreground`/`detached` pairs, the redundant `readCaseProjection` before `inheritFrom` (propose.mjs:606) | none | `propose.mjs` at most 520 (question text moves to `propose-render.mjs`, same lines), no function over 120 |
| **Playbook proposer and doors** (`runner`, `unit-handoff`, `units-source`, `seats`, `seat-providers`, `dir-guard`, `index`) | the DAG order of a playbook case, hand-off of earlier reports, seat lists for panels, the `--units` one-off | `advanceWorkflowRun` becomes a cycle loop over named steps; unit preparation, outcome folding and refusal handling live next to the helpers that already own them (`unit-handoff.mjs`) | Node, no move. 1 556 to about 1 432 (about 1 300 if finding 3 is taken) | 14 hand-built event wrappers, three `step.fail`+`workflow.fail` pairs, the `reread` copy, a duplicate env constant, 9 facade names nobody in production imports | none | `advanceWorkflowRun` at most 130 lines; no helper over 80 |
| **Doors and doctor side** (`bin/fgos.mjs` arm, `workflow-case-checks.mjs`, `workflow-definition-files.mjs`) | argument parsing; what a machine must have | the arm picks `{ detached }` from `--foreground`; doctor reads definitions through the loader's tier walk | Node. bin arm about 145 to about 120; doctor side 238 to about 208 | sentinel row merged into the bindings row | 3 rows (was 4 of its own) | n/a |

Whole layer Node: **7 288 to about 6 900 (minus 5.4 percent)** without finding 3; **about 6 750** if the owner deletes the unused integrate step. Work-FSM residue (about 200 lines of `definition.mjs`/`steps.mjs` that serve the Work step machine, not a case) is T7's and goes at `wf-coding-cutover`; it is not in these budgets (section 3, row W).

## Part B. Findings

Severity follows the plan's meaning: High = a rule of the loop is broken or a defect is reproduced; Medium = real duplication or measured cost; Low = tidy. Every fix below makes the code smaller or removes a path; additions are only in section 5.

### 1. `advanceWorkflowRun` holds the whole playbook in one 521-line closure (High)

`runner.mjs:77-597`. One function does: open a legacy case (93-98), re-read state (102-110), pick ready steps (122-128), park human gates (165-189), run an integrate step (204-254), prepare a unit's worktree and base (284-317), pin an account by a dry bind (367-404), run the Unit (420), retry on a custody-unknown predecessor (421-451), turn an admission refusal into a re-park or a step failure (453-483), fold out-of-scope writes (497-503), write `unit.complete` (505-520), fail the step (534-560), settle worktrees at the end (584-594).

Evidence that the size hides repeats: 14 sites build `recordEvent({ repoRoot: mainRoot, workflowRunId, event: { type, payload } })` (about 4 lines each); the pair `step.fail` + `workflow.fail` is written three times (212-216, 243-245, 543-558) with the same `failedAt`; `reread()` repeats the three-fold read that also lives in `case-close.mjs:14` and `case-admission-port.mjs:45` (finding 4).

Cut at real boundaries, each into the file that already owns the concept:

| New function | Current lines | Lands in | Why there |
|---|---|---|---|
| `emit(type, payload)` closure and `failStep(step, outcome, reason)` | 80-85, 212-216, 243-245, 543-558 | `runner.mjs` | 14 wrappers and three pairs become one-liners (about -80) |
| `parkGate(step, state)` | 165-189 | `unit-handoff.mjs` beside `renderGateQuestion` (141) | the question text and its parking are one concept |
| `prepareUnitWorktree({ workflow, step, unit, state })` | 284-317 | `unit-handoff.mjs` beside `writeBaseOf`/`createWorkflowWorktree` | they own the write chain |
| `unitOverridesWithAccount(...)` | 367-404 | `unit-handoff.mjs` beside `unitOverridesOf` (180) | the second half of one projection; also removes the 38-line IIFE inside an object literal |
| `runUnitWithRecovery(options)` | 419-451 | `runner.mjs` | only the proposer recovers a custody-unknown predecessor |
| `admissionRefusalOutcome(err, ...)` | 453-483 | `runner.mjs` next to `APPROVAL_REFUSALS` (71) | |
| `foldUnitOutcome(...)` | 493-531 | `unit-handoff.mjs` beside `outOfScopeWrites` (265) | |
| `readCaseProjection` instead of `reread` | 102-110 | already in `case-close.mjs:14` | one door (finding 4) |

Result: the loop is the ready-set, the gate park, the unit loop calling five named functions, `completeStep`, and the end. About -100 lines in `runner.mjs`, about +30 moved into `unit-handoff.mjs`.

Why this also matters for the open defect D1 (resume cannot rerun a failed step): the exclusion is one expression at `runner.mjs:124` (`stepState.status === 'failed'`) and the fold at `store.mjs:382-388`. Once "is this step ready" is a named predicate (`isReady(step, state)`), the resume rule is one line and one test instead of a change inside a 521-line closure. I did not reproduce D1; the baseline already holds the cause.

### 2. `validateWorkflow` holds the whole definition contract in one 384-line function (High)

`definition.mjs:131-514`. It validates top level, steps, gates, kinds, targets, operations, units (a 135-line inner loop, 258-393), input references, transitions, aliases and status skills, then builds the guide.

Repeats inside it: the G2 "disallowed infrastructure field" loop is written five times (138-144, 170-176, 269-273, 276-281 and `normalizeOperation` 81-85 and 98-102); the rigor set exists three times (`definition.mjs:29`, `guide-schema.mjs:48`, `case-projection.mjs:21`); the gate-mode set twice (`definition.mjs:222`, `guide-schema.mjs:47`); the step-kind and guide-kind checks beside each other. The vocabulary is the same fact in several files (design principle 7).

Cut: `rejectInfraFields(object, label, { allow })` (one helper, about -22); `normalizeStep` (about 100), `normalizeUnit` (about 105, the inner loop), `normalizeGate` (17), `checkStepRefs` (412-450, 38), and three small normalizers for `transitions`, `aliases`, `statusSkills` (452-494, 43 lines; these three, with `phase`, `skill`, `operations`, are Work-step-machine data, row W below). `validateWorkflow` itself becomes a 60-line composition.

Layering fix that goes with it (design principle 2, a lower layer defines its own conventions): `RIGOR_ORDER` is exported from `case-projection.mjs` (an infra file) while the two kernel files that need the same list cannot import it, so they copy it. Move the one definition to `guide-schema.mjs` (the lowest file, imports nothing); `case-projection.mjs`, `case-admission.mjs`, `propose*.mjs` import it from there. Delete `VALID_RIGORS`, `RIGORS`, and one of the two gate-mode sets.

### 3. The integrate step has no shipped user (High as a size item, owner decision)

`step.kind: 'integrate'` (`definition.mjs:30,197-213`; `guide-schema.mjs:162-164`; `runner.mjs:204-254`; `mergeWorkflowBranch` and `acknowledgeWorkflowLand` `runner.mjs:599-642`; `resolveIntegrationTarget` `unit-handoff.mjs:324-336`; the `deliveredTo` and integration-target branch of `settleUnitWorktrees` 340-398; the `index.mjs` exports of three of them) costs about 150 lines of source. Evidence that no shipped definition declares it: `grep -rn "kind: integrate" core domains` finds only `feature.yaml:148`, which is a guide activity `unit: { kind: integrate }` that the conductor never runs through this engine (it uses `fgos workflow gate`); no preset, no `content-publish` step declares it; `units-source.mjs` only builds `standard` steps. Production importers of `mergeWorkflowBranch`, `resolveIntegrationTarget`, `cleanupWorkflowWorktree`, `createWorkflowWorktree` outside `src/workflow`: none (grep over `src bin scripts`). Tests that drive it: 5 files (`units-runner`, `case-admission-port`, `case-verbs`, `workflow-runner`, `test/git/e2e-consumer-noncoding.test.mjs`); the last one labels its integrate-step fixture "never a production caller".

This is not mine to delete silently: `docs/platform/git/spec.md:361` and `:1073` name Workflow's `mergeWorkflowBranch` as a Land consumer with a labelled fixture, so the Git lane holds a proof on it, and a consumer project may declare the step in its own workflow files. Options for the owner: (a) keep it as it is (cost: about 150 source lines and about 9 tests stay); (b) delete the step kind, its Land consumer and the target field, and re-home the Git lane's noncoding consumer proof on the `fgos workflow gate` path (about -150 source, about -250 test lines); (c) keep the Land consumer proof but move it to `fgos run` with `--writes` (the door that already commits and lands). My recommendation is (b) or (c) once the Git lane agrees; the code has no production caller and the spec calls it a fixture. Needs: the owner's answer, then the Git lane's name for the replacement proof.

### 4. One case reader written in four copies, each folding the ledger three times (Medium)

Same mechanism, four places: `runner.mjs:102-109` (`reread`), `case-admission-port.mjs:45-51` (`readCase`, with a retry on an unterminated tail), `case-close.mjs:14-19` (`readCaseProjection`), `case-verbs.mjs:43-47` (`readCase`, a wrapper over the third). Each does `readWorkflowEvents`, `projectWorkflowState`, then `projectCase` (which calls `projectWorkflowState` again, `case-projection.mjs:72`), then `projectCase` a second time with `currentDigests` (so the guide is derived twice and the step fold runs three times). `case-close.mjs` is the wrong home for the reader (it is imported by `case-inherit.mjs` and `propose.mjs` for reading, not for closing).

Fix: one `readCaseProjection(mainRoot, id, { retryTail })` in `case-projection.mjs` (move `playbookSubjectDigests` to `ref-digests.mjs`, which already owns digests, so projection does not import `unit-handoff`), `projectCase` accepts the already-folded `state` instead of re-folding, and the four sites call it. About -30 lines and two fewer folds per cycle. Callers move in the same change (L10); the old names are deleted.

### 5. `workflow propose` is 4.6 s; measured part of it is a redundant read of every ledger (Medium, measured)

`propose.mjs:603-611` `findInherit` walks `closedCaseIds()` (despite the name it returns every directory of `.fgos/workflow-runs`, open cases and the `.bindings` directory included, newest first), and for each calls `readCaseProjection(mainRoot, caseId)` at line 606 and then `inheritFrom`, whose first act is the same `readCaseProjection` (`case-inherit.mjs:39`). The first call's result is discarded. Measured with the real functions on this checkout (54 case directories, up to 10.2 MB per ledger): **`findInherit` took 1 865 ms**; `findTests` (walk plus read of every test file) took 204 ms cold and 12 ms warm, so that is not the cost. The remaining about 2.7 s of the 4.6 s (process start, config and workflow YAML loads through the native door) I did not isolate.

Fix, smallest first: delete line 606 (about half of 1.9 s, one line); pass `.bindings` and non-ledger directories out in `closedCaseIds`; stop after the first match (already true) and check the cheap guards first: `case.opened` is the first event after `workflow.start`, so a reader that parses only the head of the file can reject "another request or base" without parsing a 10 MB ledger. I measured only the first fix's premise (two reads per case), not the head-read.

### 6. Ledger lines carry whole run results; every append re-parses the ledger (Medium)

`store.mjs:155` `appendWorkflowEvent` calls `readWorkflowEvents` (parse every line) only to number the new line (`existing.length + 1`); `unit.complete` (`runner.mjs:505-520`) stores `results`, the full per-seat run results. In `.fgos/workflow-runs/wf-run-1792246479016-19b58eab` (33 events) five `unit.complete` lines are 0.64, 2.55, 2.55, 3.83 and 0.64 MB; three runs are 10.2 MB; the tree is 431 MB for 54 runs. One parse of the 10.2 MB ledger costs 45 ms, so a run of 20 appends pays about 0.9 s of pure re-reading, and every `status`, admission and `reread` pays 45 ms more.

Fix that deletes: number the line from the last line only (tail read, the same function that already detects an unterminated tail), and keep per-seat summaries plus the unit-run id in `unit.complete` while the full result stays in the unit-run record that already holds it. The second part changes a ledger contract (a reader of `results` is `seat-providers.mjs:21`, `unit-handoff.mjs:67,147,427`, `case-admission-port.mjs:90-106`), so it is a proposal in section 5, not a finding with a one-line fix. The first part is mine and is about -6 lines. This is also the cause of the retention row `p-tslryr3buq` growing without bound.

### 7. Three durable-write idioms beside the one door (Medium)

- `case-runtime.mjs:150-153` writes a temp file and `renameSync` over the answer file with no fsync (a view of the rounds, rebuilt on demand, so the failure is mild; the point is the second idiom in a file that already imports `installOnce`/`replaceDurably`). Fix: `replaceDurably(dir, name, text, 0o644)` (-4 lines, `uniqueTmpTag` import goes).
- `store.mjs:109-130` `writeDurably` and `fsyncDirectory`, and `case-bindings.mjs:31-38` `fsyncDir`: two byte-identical directory-fsync helpers. For the first write of a ledger the door already has the exact semantics: `installOnce(runDir, 'events.jsonl', line, 0o644)` is exclusive-create plus fsync of file and directory (`createWorkflowRun`, 99-101 becomes one call). For the unlink at `case-bindings.mjs:163-164` keep one exported `fsyncDirectory` in `store.mjs`. About -17 lines. (A new door verb for "remove durably" is the optional addition P2.)
- Lock mechanisms: none duplicated. The `advance` mutex is the holder-lock door; `case-lock.mjs:28-43` has two small variants of "list the holder" (`advanceHolderPid`, `liveAdvanceHolder`) that call the same `lockHolders`; merge them (-6).

### 8. The run directory path is built nine times (Medium)

`path.join(mainRoot, '.fgos', 'workflow-runs', id)` at `store.mjs:43` (private), `case-lock.mjs:20` (exported `workflowRunDirOf`), `case-runtime.mjs:20` (private `caseDir`), `case-admission-port.mjs:29` (`caseDirOf`) and `:140`, `case-bindings.mjs:26` (`.bindings` under it), `propose.mjs:590,592`, and outside the layer `handoff-refs.mjs:91`, `workflow-case-checks.mjs:34`, `holder-lock-checks.mjs:225`. Fix: `store.mjs` (the ledger, lowest file) exports one `runDirOf` and `runsRoot`; the six in-layer sites import it; the three outside sites follow in the same change (T5's `handoff-refs.mjs` and T1's `holder-lock-checks.mjs` are one line each; announce on the board). About -12 lines and one place that knows the layout when D-ADR0073's physical rename (`wf-run-` to `case-`, `wf-physical-rename`) happens.

### 9. The ledger imports the 2 105-line dispatch config for one error class (Medium)

`store.mjs:7`, `case-lock.mjs:7`, `case-runtime.mjs:12` and eight more files import `RunnerConfigError` from `src/runner/dispatch/config.mjs` (2 105 lines at the T5 baseline). The class is declared at `config.mjs:204`. The ledger, the lowest file of the layer, therefore depends on the largest dispatch module (design principle 2, bottom-up layering), and every `status` read loads it (`workflow status` is 0.2 to 0.3 s p50 in the baseline). Fix: move the class to a leaf file (the T5 council is already cutting `config.mjs`; ask it for the leaf name) and change the 12 import lines here in the same change. 0 net lines. Needs T5's answer.

### 10. Two glob engines and two path normalizers (Medium)

`propose-classify.mjs:31-62` (`globsMeet`, `segmentsMeet`, `segmentRegex`) and `write-scope.mjs:102-122` (`segmentRegex`, `globMatches`) both decide "can this pattern name this path". A literal path is a degenerate glob, so `globMatches(pattern, path)` is `globsMeet(pattern, path)` with no wildcard on the right. Likewise `normalizeWrite` (`propose-classify.mjs:119`) and `canonicalizeWriteEntry` (`write-scope.mjs:25`) both canonicalize a write path, and `propose-validate.mjs:72-73` calls both in sequence on one string. Fix: `globsMeet` moves into `write-scope.mjs` (the one door for scopes; `propose-validate` and `propose-classify` already import it), `globMatches` becomes a call to it, `normalizeWrite` becomes the thin `{ path, segments, glob, scopeLike }` view over `canonicalizeWriteEntry`. About -24 net, one engine. `write-scope.mjs` is a T5 dispatch file (import-free leaf, also imported by `definition.mjs`); announce the move. Risk to check before moving: `globMatches` uses a `u`-flag regex and `globsMeet` does not escape `$`, `{`, `}` in the same set; the two call sites need one shared escape set (the propose tests and `write-scope` tests own that).

### 11. The slice shape is checked three times (Medium)

`propose.mjs:73-122` `checkManifest` validates id, writes, verify, dependsOn, duplicates. Then `propose-frame.mjs:43-59` `checkSlice` and `:109-115` re-check id, writes (with a sparse-array guard, 48), pattern, rigor and duplicates on the object `checkManifest` and the classifier just produced; `propose-validate.mjs:103-111` `checkSliceShape` and `:144-149` check id, writes, rigor and duplicates again. Both later modules are only called from `propose.mjs` with a trusted shape; their own tests (`propose-frame.test.mjs`, `propose-validate.test.mjs`) check that malformed input is refused by name. Fix: keep `checkManifest` as the one shape authority, delete the two re-checks (frame about -22, validate about -16) and the `ProposeFrameError`/`ProposeValidateError` codes `slice-invalid` and `slice-duplicate` with their tests. This changes the contract of two exported functions (`proposeFrame`, `validateProposal`) whose only production caller is `propose.mjs`; both move together.

### 12. Paired foreground/detached verbs and a facade wider than its callers (Medium)

`case-verbs.mjs`: `startWorkflow` (125) and `startWorkflowDetached` (87), `answerWorkflow` (223) and `answerWorkflowDetached` (244), `resumeWorkflow` (294) and `resumeWorkflowDetached` (319) differ only in the last step (advance here, or spawn). Each pair repeats the roots, the hold, the conductor check and the result building (about 60 lines of repeat). the `workflow` arm of `bin/fgos.mjs` (2234-2379) picks one with `foreground ? await f() : fDetached()`. Fix: three verbs taking `{ detached }`; the door passes `detached: !foreground`. Also `index.mjs` exports 24 names; production imports (`bin/fgos.mjs`) use: `startWorkflow`, `startWorkflowDetached`, `preflightWorkflowSeats`, `statusWorkflow`, `answerWorkflow`, `answerWorkflowDetached`, `closeWorkflow`, `gateWorkflow`, `resumeWorkflow`, `resumeWorkflowDetached`. The other 14 names (`createWorkflowRun`, `appendWorkflowEvent`, `recoverWorkflowLedgerTail`, `projectWorkflowState`, `createWorkflowWorktree`, `resolveIntegrationTarget`, `cleanupWorkflowWorktree`, `mergeWorkflowBranch`, `translateUnitsToWorkflow`, `discoverWorkflows`, and so on) have test importers only; tests import from the owning file. About -55 in `case-verbs.mjs`, -11 in `index.mjs`, +about 30 changed test import lines.

### 13. Dead and over-exported names (Low)

No production caller and no test: `reservationQuiet` (`case-runtime.mjs:61`, 7 lines), `CASE_EVENT_KINDS` (`case-projection.mjs:16`), `entryStep` (`steps.mjs:45`). Exported but used by their own file only and by no test: `caseEnvOf`, `nextGeneration`, `GATE_ACTIVITY`, `inheritableMilestones`, `RECEIPT_EVALUATORS`, `isValidReceipt`, `removeReservationFile`, `readReservationFile`, `assertWorkflowAcceptOutcomes`, `SET_AT_APPROVAL`, `DEFAULT_GUIDE`, `SEAT_MIN_ENTRIES`, `SEAT_MIN_CHARS`, `SEAT_MAX_CHARS` (drop `export`). Exported for one test only: `readReservationFiles`, `unconsumedGateRounds`, `loadSliceTable`, `FRAME_ALLOWANCE`, `planCaseSlug`, `CASE_PLACEHOLDER`, `readPassRigor`, `createProposePorts`, `FORBIDDEN_WRITE_ROOTS`, `TEST_SCAN_LIMITS`, `seatTask`, `GUARD_PRIMITIVES`, `PLATFORM_GUARDS` (stay only if their test is the owning proof; otherwise drop `export`).

Dead outputs: `admitProposal` builds a `bindings` array (`case-admission.mjs:196-207`, returned at 263) that `createCaseAdmissionPort.admit` never reads (it re-derives the binding at `case-admission-port.mjs:280,311`). Aliases and double imports: `worktreeFacts = workflowCheckout` (`case-admission-port.mjs:31`), `defaultTable = defaultSliceTable` (`propose-classify.mjs:113`), `liveConfig = runnerConfig` (`case-start.mjs:305`), `bindingsDir` imported twice (`case-admission-port.mjs:23,27`), the literal `'.root'` at `:142` beside the exported `SENTINEL_NAME`. Duplicated constant: `ADVANCE_DETACHED_ENV` is defined at `case-lock.mjs:14` and again at `dir-guard.mjs:11`. Stale text: `ref-digests.mjs:5` names `case-inbox.mjs` (it is `case-runtime.mjs`).

### 14. `admit` writes the bind-and-reserve block twice (Low)

`case-admission-port.mjs:278-287` (a Unit asked again keeps its reservation) and `:310-318` (a fresh one) both bind the worktree, build `binding`, and `writeReservationFile`. One `bindIfWriting(...)` helper (-12). `refusal(code, text)` returns `{ refused }` and four callers immediately take `.refused` (`:149,151,169,174,181,196`); return the inner object from one function and wrap once (-5).

### 15. Two readers of the workflow directories (Low)

`loader.mjs:81-118` walks `core/workflows` then `domains/*/workflows` and parses (`parseFile`, 30-36); `workflow-definition-files.mjs:11-34,47-55` walks the same two tiers with the same `workflowFilesIn` and parses the same way for the doctor. `workflowPersonaScope` (loader 181) and `loadWorkflowWithSource` (146-166) rescan and re-validate every definition for each call, twice when the id is not found under `packageRoot`, and the runner calls the first once per advance and per start. Fix: export `workflowDirs(root)` and `parseWorkflowFile(path)` from `loader.mjs`; the doctor reader uses them (about -10 here, -18 in the setup file). The YAML door itself (`util/yaml.mjs`) is already single.

### 16. `unit-handoff.mjs` mixes five concepts, 478 lines (Low)

Hand-off text (34-108), the gate question (110-157), pattern and overrides (159-208), the write chain (210-259), out-of-scope and git facts (261-336), worktree create, cleanup, settle (338-407), resume probe and digests (410-478). No function is over 100 lines, so I do not propose a split by itself; findings 1 and 3 move code in and out of it. If finding 3 is taken, the git/worktree third (about 130 lines) has one remaining consumer (`runner.mjs`) and can sit next to it. Not needed otherwise.

### 17. Stale names in the spec (Low)

`docs/platform/workflow/spec.md:422` and `:755` name `plan-source.mjs` and `integrate.mjs`, neither of which exists in `src/workflow`; `:206` names the doctor row `workflow-pools-satisfy-independence`, which is unregistered (`test/setup/seat-binding-dry-bind.test.mjs:110` asserts it stays gone). The section 9 table ("Kích thước rework") describes a rewrite plan that has happened. Refresh when Part A is written into the spec (one edit, no new row).

## 3. Delete list (with sizes)

| # | What goes | Where | Node lines | Status |
|---|---|---|---|---|
| 1 | 14 event-wrapper blocks, three step.fail+workflow.fail pairs, `reread` | `runner.mjs` | about -100 | finding 1 |
| 2 | five G2 loops; `VALID_RIGORS`, `RIGORS`, one gate-mode set | `definition.mjs`, `guide-schema.mjs` | about -30 | finding 2 |
| 3 | three duplicate case readers, double fold | `case-admission-port.mjs`, `case-close.mjs`, `case-verbs.mjs`, `runner.mjs` | about -30 | finding 4 |
| 4 | redundant `readCaseProjection` in `findInherit`, non-case directories in the scan | `propose.mjs:606,588-598` | about -3 (and about -0.9 s) | finding 5 |
| 5 | numbering an append by parsing the whole ledger | `store.mjs:155` | about -6 | finding 6 |
| 6 | hand-rolled write-rename; two dir-fsync helpers; first-write helper | `case-runtime.mjs`, `store.mjs`, `case-bindings.mjs` | about -27 | finding 7 |
| 7 | eight of nine run-directory path builders | six files in the layer, three outside | about -12 | finding 8 |
| 8 | second glob engine, second path normalizer | `write-scope.mjs`, `propose-classify.mjs`, `propose-validate.mjs` | about -24 | finding 10 |
| 9 | two slice-shape re-checks and their error codes | `propose-frame.mjs`, `propose-validate.mjs` | about -38 | finding 11 |
| 10 | paired detached verbs, 14 test-only facade names | `case-verbs.mjs`, `index.mjs`, `bin/fgos.mjs` | about -66 | finding 12 |
| 11 | dead functions and constants, dead `bindings` output, aliases, duplicate env constant, duplicate bind block | nine files | about -45 | findings 13, 14 |
| 12 | second tier walk in the doctor reader | `workflow-definition-files.mjs`, `loader.mjs` | about -28 | finding 15 |
| 13 | sentinel doctor row merged into the bindings row | `registrations.mjs`, `workflow-case-checks.mjs` | about -20 (setup side) | doctor table |
| 14 | **Owner decision:** the integrate step, its Land consumer, the target field | `runner.mjs`, `unit-handoff.mjs`, `definition.mjs`, `guide-schema.mjs`, `index.mjs` | about -150 src, about -250 test | finding 3 |
| W | Work-step-machine residue (`phase`, `skill`, `operations`, `transitions`, `aliases`, `statusSkills` in `definition.mjs`; `steps.mjs` except `unitFieldsOfTemplate`) | `definition.mjs`, `steps.mjs`, `feature.yaml` | about -200 | **T7's, at `wf-coding-cutover`**; not in budgets |

Total without 14 and W: about -430 lines of source and about 30 import lines in tests; the three giant-function cuts add no lines. With 14: about -580.

## 4. HARDEN tables

### Migration table

| Node part | What it decides | Move to Rust? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| Guide (6 files) | definition contract, guide model, vocabulary | no | kernel imported by `state/domain-registry` and `state/replay`; spec 5.6 | 3 (after the reader and vocabulary moves) | 1 300 lines; `validateWorkflow` at most 70 |
| Case ledger (6 files) | append, fold, runtime files, hold | no | L3 ledger is Node today; Event Store joins only if F10 is chosen; the mutex is already Rust (T1) | 1 | 1 210; `runDirOf` single |
| Admission (4 files) | may this run now | no | spec 5.6; the port interface is T5's and left in Node | 4 | 917 |
| Conductor entry (7 files) | proposal, start, verbs | no | judgment is the agent's, the rest is arithmetic over repo reads; no second implementation exists | 5 | 2 036 |
| Playbook proposer and doors (7 files) | playbook order, hand-off | no | the loop calls `runUnit` (Node); a Rust port would add a language seam per call (spec 5.6, RUL104) | 2 (cut after the reader and `emit` exist) | 1 432 (1 300 with finding 3) |
| Doctor side | machine prerequisites | no | row bodies are Node by design | 6 | about 208 |

Reader first (finding 4), because the four sites it replaces are in four components; vocabulary and path doors next; then the two giant cuts.

### Doctor table

| Condition | Row now | Row that keeps it | Lost? |
|---|---|---|---|
| bindings directory exists but has no `.root` sentinel (fail; fix writes it) | `workflow-case-binding-sentinel` | `workflow-case-bindings` (one more problem line; its fix already writes the sentinel at `workflow-case-checks.mjs:116`) | no |
| no bindings directory yet (info, pass) | `workflow-case-binding-sentinel` | `workflow-case-bindings` (already passes with zero records) | no |
| a record does not parse, is not `committed`, names a ledger that does not show it, or belongs to a closed case; a ledger cannot be read | `workflow-case-bindings` | same | no |
| an open case is bound on its ledger with no record (fail; fix rebuilds) | `workflow-case-bindings` | same | no |
| a Workflow unit names a capability with no `runner.capabilities` entry (fail); no `prefer` pool (warn); a definition file does not parse (fail) | `workflow-capabilities-configured` | same. Not merged into `seat-binding-dry-bind`: that row treats "no pool" as information (`seat-binding-checks.mjs:17-18`), so the fail condition would be lost | no |
| a step operation does not resolve to a task-spec, role, skill or legal roleGraph edge | `domain-workflow-operations-coverage` | same; Work-FSM row, retires with `wf-coding-cutover` (T7) | no |
| compiled registry differs from YAML | `domain-registry-compiled` (shared with Work) | same | no |
| blind unit binds an unproven provider | `blind-steps-use-proven-pools` | same (T5's) | no |

Result: Workflow's own rows 4 to 3. No new row. Spec text `workflow-pools-satisfy-independence` (spec.md:206) is deleted, not replaced.

### Tests table

All counts below are by test title and file size; I did not diff the assertions of the overlapping files (the TEST lane owns that diff), so "overlap" is a pointer, not a verdict.

| Behaviour | Owning proof (keep) | Duplicate or problem | Action |
|---|---|---|---|
| Definition schema: G2 fields, writes form, inputs, stanceOptions, persona and params, anonymize/blind flags, step target | none: `definition.mjs` has no test file. Nine of its tests sit in `workflow-runner.test.mjs` (lines 119, 147, 1115, 1271, 1279, 1292, 1299, 1497, 1603); the guide half is `guide-schema.test.mjs` | the owning module has no owning file | move the nine to a new `test/workflow/definition.test.mjs` (allowed: the module has none); net 0 lines, the runner file shrinks by about 190 |
| Vocabulary moved to one table | `guide-schema.test.mjs` | the two copies are tested only through behaviour | add no test; the existing rigor and gate-mode cases cover the one table |
| Slice shape (id, writes, rigor, duplicates) | `propose.test.mjs` (`checkManifest`) | `propose-frame.test.mjs` and `propose-validate.test.mjs` each re-prove malformed-slice refusals | retire the two refusal groups with the re-checks (finding 11); the behaviour is owned by `propose.test.mjs`; about -60 lines |
| Playbook order, park, resume, hand-off | `workflow-runner.test.mjs` (runner tests), `units-runner.test.mjs` | `playbook-observable-order` (3 tests, 78.8 s), `playbook-proposer` (11, 52.5 s), `discussion-workflows` (10, 57.6 s) each run the discussion presets end to end with real Unit runs | TEST lane: diff the golden order of `playbook-observable-order` against `discussion-workflows` first; keep one owner of "same order as the stored runs" (spec section 11, item 12) |
| Detached verbs at the door | `case-verbs.test.mjs` (13) | five `CLI:` tests in `workflow-runner.test.mjs` (367, 400, 447, 466, 767) and `test/cli/fgos-workflow.test.mjs`, `fgos-case-doors` | one wiring proof per verb at the CLI; keep the three that observe the detached child; after finding 12 each verb is one function with one option, so the paired-function cases collapse |
| Advance lock liveness | T1 holder-lock proofs for the kernel lock; `case-verbs.test.mjs` for the verb | six lock and status tests in `workflow-runner.test.mjs` (517 to 660) | keep one per observable (second advance refused, killed holder frees, deleted run dir, status reads no lock); the rest by diff |
| Integration, worktree cleanup | `unit-handoff*.test.mjs`, `workflow-runner.test.mjs` integration group (206, 1205-1271, 2218-2294, 9 tests) | owned by finding 3 | retire with the integrate step if the owner takes (b) or (c); otherwise keep |
| `--seats` | `seats.test.mjs` (274), `core-workflow-seats.test.mjs` | nine `--seats` tests in `workflow-runner.test.mjs` (1899 to 2209), two through the real CLI | keep the two real-CLI tests as the wiring proof; move the rest into `seats.test.mjs` if not already covered there |
| Propose | `propose*.test.mjs` (89 tests, each under 1 s) | `cli/fgos-workflow-propose.test.mjs` 2 tests, 18.7 s | keep as the one wiring proof; after the `findInherit` fix the CLI test gets faster |
| Admission port | `case-admission-port.test.mjs` (13) | `run-case-admission` (T5, 22), `work-path-case-admission` (2), `worker-env-case-context` (5) | wiring proofs, leave |
| Time-based waits | n/a | 11 lines in `test/workflow/` (7 in `workflow-runner.test.mjs`) name `setTimeout`, `sleep(`, `waitFor` or `Atomics.wait` | replace each with the event it waits for in the same change that touches the file; not measured further |
| Tests of names removed in section 3 | none | `readReservationFiles` (3 test files), `unconsumedGateRounds`, `reserveParentFrame`/`refundParentFrame` | they stay as long as their function stays; the un-exports of finding 13 keep them only where the test is the owning proof |

Net test expectation (estimate, not measured): about -350 lines retired with the re-checks and duplicated CLI cases, about -250 more only if finding 3 option (b) is taken; about +30 changed import lines.

## 5. Proposed additions (only here, each names what it replaces)

- **P1. Ledger line summaries** (replaces the full `results` copy in `unit.complete`, `runner.mjs:515`). Problem and evidence: finding 6 (0.6 to 3.8 MB per line, 10.2 MB ledgers, 431 MB for 54 runs, every read parses all of it). Benefit: the ledger shrinks to kilobytes, every status read, admission and append gets faster, the retention row `p-tslryr3buq` loses its main weight. Cost: a ledger contract change (readers at `seat-providers.mjs:21`, `unit-handoff.mjs:67,147,427`, `case-admission-port.mjs:90-106`) and a rule for old ledgers (readers keep the old shape; no rewrite of stored runs). Only after the owner chooses.
- **P2. A `syncDirectory` verb on the Node durable-file door** (replaces the two local directory-fsync helpers, `store.mjs:123` and `case-bindings.mjs:31`, and the unlink at `case-bindings.mjs:163`). The Rust crate already has `sync_directory` (`packages/durable-file/rust/src/lib.rs:404`); `src/native/door.mjs:105-107` exposes only `replaceDurably` and `installOnce`. Benefit: no filesystem-durability code left in the Workflow layer. Cost: about 6 Rust lines plus one door export. My recommendation is not to add it: exporting one helper from `store.mjs` removes the duplicate at no cost (finding 7).

## 6. Questions that need an answer

1. Owner: finding 3, delete the integrate step (b), move its Land consumer proof to `fgos run --writes` (c), or keep (a)? Recommendation: (b) or (c) after the Git lane names the replacement proof.
2. T5 council: the leaf file for `RunnerConfigError` (finding 9) and the announcement for the `write-scope.mjs` glob move (finding 10) and the `handoff-refs.mjs` run-directory line (finding 8).
3. T7: confirm the Work-step-machine residue (row W) leaves `definition.mjs` and `steps.mjs` at `wf-coding-cutover`, not before.
