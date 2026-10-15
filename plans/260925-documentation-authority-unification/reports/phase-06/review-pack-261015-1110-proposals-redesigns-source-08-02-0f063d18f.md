# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-08-component-authority-boundary-map.json
Original shard SHA256: 525813264701c46fee63401a8ca02f638be1c39e4a413fd0000ef0cff7eff073
Source file: docs/architect/proposals/component-authority-boundary-map.md
Part 2/2; entries: **19**. Source-file group 8/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (0): none.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (0): none.

Weak-exact/Judgment population: 2; reviewer chooses and records seed and IDs for at least 2 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_b44496172b32af832302994458122866

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-65, lines 551–560.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-68.
Source digest: 50ff81b5ea1585c44661ad94bab3976749b980cf8f1e1762576bc903d3f243b1
Target digest: 50ff81b5ea1585c44661ad94bab3976749b980cf8f1e1762576bc903d3f243b1
Shown source SHA256: 50ff81b5ea1585c44661ad94bab3976749b980cf8f1e1762576bc903d3f243b1
Shown target SHA256: 50ff81b5ea1585c44661ad94bab3976749b980cf8f1e1762576bc903d3f243b1

### Proposed decision

```json
{
  "claimId": "claim_b44496172b32af832302994458122866",
  "sourceUnitDigest": "50ff81b5ea1585c44661ad94bab3976749b980cf8f1e1762576bc903d3f243b1",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-68",
  "targetUnitDigest": "50ff81b5ea1585c44661ad94bab3976749b980cf8f1e1762576bc903d3f243b1",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "15. Code Scan Findings For Boundary Drafting"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-65 (lines 551–560) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-68 (lines 575–584); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Finding | Evidence | Architecture read | Recommendation |
|---|---|---|---|
| A. `operation-choice.mjs` is the highest-risk boundary knot. | `chooseStageOperation()` line 649, `interpretAssignmentRunResult()` line 1671, `executeDriverOperationChoice()` line 2144 in a 2,260-line file. GitNexus shows callers from `dispatchClaimedItem()`, `runOnce()`, and tests. | The file spans Work Driver, Assignment/Dispatch invocation, and RunResult interpretation. It is a compatibility join point, not the long-term component home. | Treat `executeDriverOperationChoice()` as the temporary adapter seam for Step 10 slice 2. The accepted boundary should target `WorkDriverPort.chooseOperation() -> AssignmentBuilderPort.freezeDeclaredOperation() -> DispatchRuntimePort.runAssignment() -> RunResultEvaluatorPort.evaluate() -> WorkDriverPort.consumeRunResult()`. |
| B. Secondary operations use Assignment/RunResult; primary executing still uses `spawnWorker`. | `src/runner/loop.mjs` chooses operations and calls `executeDriverOperationChoice()` for assignment dispatch, but still falls through to `spawnWorker()` around executing/research paths. `assignment-runner.mjs` persists Run, dispatch plan, result, evidence, dirty-before state, and hashes. | The repo has two execution cores: `Assignment -> DispatchPlan -> Run -> RunResult` and legacy `spawnWorker -> goal-check -> settleClaim`. | Keep Step 2 narrow on read-only `validate-plan`. Mark `spawnWorker` primary execution as a legacy path to retire behind `DispatchRuntimePort`; goal-check becomes a coding evidence adapter. |
| C. CoordinationSession bounds and worker slots are separate caps. | Coordination defaults `aggregateBounds.maxConcurrency` and enforces session assignment creation; worker slots are computed from Work claims and optional ceiling. | Both caps are legitimate but currently have no shared port. Work-attached fan-out or mutation could create conflicting answers to "is there room?" | Step 2 should use concurrency 1 and borrow the host Work claim. Before fan-out/mutation, accept an `OccupancyPort` rule that clamps session materialization against Work runtime slots and coding resource claims. |
| D. CoordinationSession is correctly lifecycle-blind today. | `openSession()` accepts `workRef`; session engine builds read-only inline contracts; inline mutating contracts are rejected. | Session can reference Work but does not own lifecycle/isolation/merge and cannot run mutating inline Assignments. | Do not extend CoordinationSession into a Work/Stage resolver. Add declared Assignment handoff from Work Driver + Assignment Builder into session membership. |
| E. Coding harness is pure and read-only, but too narrow for mutation proof. | `domains/coding/harness/enrich-and-validate-contract.mjs` validates declared stage operation and appends context/policy hints without filesystem, store, network, dispatch, or executor choice. | This is a good ADR-007 seam. It lacks footprint/resource/isolation advice and opaque workspace refs needed for mutating proof. | Extend harness I/O only after the boundary and Step 10 readiness gates: enriched contract + policy + evidencePolicy + resourceClaims + isolationAdvice + `workspaceRef?`. |
| F. Domain workflow declarations already contain legal operation truth. | `domains/coding/workflows/feature.yaml` declares `validate-plan`, `implement-item`, `review-item`, `fix-verify-red`, `scoped-subtask`, `scout-blast-radius`, and `resolve-question`; `assignment.mjs` rejects unknown declared operations. | Step 10 does not need a new place to decide legal operations. It needs a clean path for declared operation truth to enter a Work-attached session. | For Step 10 slice 2: Work Driver selects `planning.validate-plan`; Assignment Builder freezes; Session store appends membership; Dispatch executes; Run Result Evaluator evaluates; Work Driver consumes verdict and calls lifecycle verbs if allowed. |
| G. Coding Repository Integration Core is scattered but authority is clear. | `src/runner/worktree.mjs`, `src/runner/merge.mjs`, `src/verbs/merge/**`, readiness/cleanup/drift state files. | These concerns are coding-specific because they depend on Git branches, worktrees, repo deltas, verification, merge readiness, and technical approval. | Do not move files in the boundary draft or Step 10 slice 2. The accepted boundary should mark them as Coding Domain Core and require a `CodingRepositoryPort` facade before layout moves. |
| H. Setup/Doctor is already a real platform boundary. | `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `src/setup/config-merge.mjs`, shared config helpers. | Clean architecture on paper is not enough if new files/config/executors/services are undiscoverable in real projects. | Make setup/doctor registration part of implementation gates for Step 09/Step 10 changes that introduce new config, files, services, or directories. |
```

### Full target shown text

```text
| Finding | Evidence | Architecture read | Recommendation |
|---|---|---|---|
| A. `operation-choice.mjs` is the highest-risk boundary knot. | `chooseStageOperation()` line 649, `interpretAssignmentRunResult()` line 1671, `executeDriverOperationChoice()` line 2144 in a 2,260-line file. GitNexus shows callers from `dispatchClaimedItem()`, `runOnce()`, and tests. | The file spans Work Driver, Assignment/Dispatch invocation, and RunResult interpretation. It is a compatibility join point, not the long-term component home. | Treat `executeDriverOperationChoice()` as the temporary adapter seam for Step 10 slice 2. The accepted boundary should target `WorkDriverPort.chooseOperation() -> AssignmentBuilderPort.freezeDeclaredOperation() -> DispatchRuntimePort.runAssignment() -> RunResultEvaluatorPort.evaluate() -> WorkDriverPort.consumeRunResult()`. |
| B. Secondary operations use Assignment/RunResult; primary executing still uses `spawnWorker`. | `src/runner/loop.mjs` chooses operations and calls `executeDriverOperationChoice()` for assignment dispatch, but still falls through to `spawnWorker()` around executing/research paths. `assignment-runner.mjs` persists Run, dispatch plan, result, evidence, dirty-before state, and hashes. | The repo has two execution cores: `Assignment -> DispatchPlan -> Run -> RunResult` and legacy `spawnWorker -> goal-check -> settleClaim`. | Keep Step 2 narrow on read-only `validate-plan`. Mark `spawnWorker` primary execution as a legacy path to retire behind `DispatchRuntimePort`; goal-check becomes a coding evidence adapter. |
| C. CoordinationSession bounds and worker slots are separate caps. | Coordination defaults `aggregateBounds.maxConcurrency` and enforces session assignment creation; worker slots are computed from Work claims and optional ceiling. | Both caps are legitimate but currently have no shared port. Work-attached fan-out or mutation could create conflicting answers to "is there room?" | Step 2 should use concurrency 1 and borrow the host Work claim. Before fan-out/mutation, accept an `OccupancyPort` rule that clamps session materialization against Work runtime slots and coding resource claims. |
| D. CoordinationSession is correctly lifecycle-blind today. | `openSession()` accepts `workRef`; session engine builds read-only inline contracts; inline mutating contracts are rejected. | Session can reference Work but does not own lifecycle/isolation/merge and cannot run mutating inline Assignments. | Do not extend CoordinationSession into a Work/Stage resolver. Add declared Assignment handoff from Work Driver + Assignment Builder into session membership. |
| E. Coding harness is pure and read-only, but too narrow for mutation proof. | `domains/coding/harness/enrich-and-validate-contract.mjs` validates declared stage operation and appends context/policy hints without filesystem, store, network, dispatch, or executor choice. | This is a good ADR-007 seam. It lacks footprint/resource/isolation advice and opaque workspace refs needed for mutating proof. | Extend harness I/O only after the boundary and Step 10 readiness gates: enriched contract + policy + evidencePolicy + resourceClaims + isolationAdvice + `workspaceRef?`. |
| F. Domain workflow declarations already contain legal operation truth. | `domains/coding/workflows/feature.yaml` declares `validate-plan`, `implement-item`, `review-item`, `fix-verify-red`, `scoped-subtask`, `scout-blast-radius`, and `resolve-question`; `assignment.mjs` rejects unknown declared operations. | Step 10 does not need a new place to decide legal operations. It needs a clean path for declared operation truth to enter a Work-attached session. | For Step 10 slice 2: Work Driver selects `planning.validate-plan`; Assignment Builder freezes; Session store appends membership; Dispatch executes; Run Result Evaluator evaluates; Work Driver consumes verdict and calls lifecycle verbs if allowed. |
| G. Coding Repository Integration Core is scattered but authority is clear. | `src/runner/worktree.mjs`, `src/runner/merge.mjs`, `src/verbs/merge/**`, readiness/cleanup/drift state files. | These concerns are coding-specific because they depend on Git branches, worktrees, repo deltas, verification, merge readiness, and technical approval. | Do not move files in the boundary draft or Step 10 slice 2. The accepted boundary should mark them as Coding Domain Core and require a `CodingRepositoryPort` facade before layout moves. |
| H. Setup/Doctor is already a real platform boundary. | `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `src/setup/config-merge.mjs`, shared config helpers. | Clean architecture on paper is not enough if new files/config/executors/services are undiscoverable in real projects. | Make setup/doctor registration part of implementation gates for Step 09/Step 10 changes that introduce new config, files, services, or directories. |
```

## claim_794efb2411951275029b69ee60894cce

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#16-boundary-promotion-checklist, lines 562–562.
Target: docs/platform/proposals/component-authority-boundary-map.md#16-boundary-promotion-checklist.
Source digest: cc381b14070aec64610a731918997312d4ce13b650590507a6daae1e79211f67
Target digest: cc381b14070aec64610a731918997312d4ce13b650590507a6daae1e79211f67
Shown source SHA256: 85d8dca83b62a1f5b5922ce91a53e497a1035e681521210e5126fc2431aeaf6d
Shown target SHA256: 85d8dca83b62a1f5b5922ce91a53e497a1035e681521210e5126fc2431aeaf6d

### Proposed decision

```json
{
  "claimId": "claim_794efb2411951275029b69ee60894cce",
  "sourceUnitDigest": "cc381b14070aec64610a731918997312d4ce13b650590507a6daae1e79211f67",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "16-boundary-promotion-checklist",
  "targetUnitDigest": "cc381b14070aec64610a731918997312d4ce13b650590507a6daae1e79211f67",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#16-boundary-promotion-checklist (lines 562–562) is carried at docs/platform/proposals/component-authority-boundary-map.md#16-boundary-promotion-checklist (lines 586–586); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 16. Boundary Promotion Checklist

Before this draft can become accepted architecture:

1. Reconcile against Step 08 P07.2 final Deferral Audit and any changed
   CoordinationSession, FlowDefinition, dispatch, evidence, recovery, or
   headless-parity contracts.
2. Confirm Work Driver / Domain Workflow Interpreter as a child responsibility
   under Work Core, and decide its explicit contract boundary with Work
   Lifecycle Engine and Runtime Occupancy Support.
3. Decide first read-only concurrency posture: inherit host Work slot at
   concurrency 1, clamp session bounds through `OccupancyPort`, or another
   explicit rule.
4. Decide the `fgos handoff` relationship: Work event holder truth versus
   session collaboration evidence/projection.
5. Decide the minimal in-process Run record shape before executing-stage
   primary work moves onto Assignment.
6. Choose whether Node repo-layout overlay is accepted now, deferred as
   migration-only guidance, or split into a separate distribution/component
   document.
7. Add accepted-source links from Step 09 and Step 10 before any coding
   adoption implementation plan claims readiness.
```

### Full target shown text

```text
## 16. Boundary Promotion Checklist

Before this draft can become accepted architecture:

1. Reconcile against Step 08 P07.2 final Deferral Audit and any changed
   CoordinationSession, FlowDefinition, dispatch, evidence, recovery, or
   headless-parity contracts.
2. Confirm Work Driver / Domain Workflow Interpreter as a child responsibility
   under Work Core, and decide its explicit contract boundary with Work
   Lifecycle Engine and Runtime Occupancy Support.
3. Decide first read-only concurrency posture: inherit host Work slot at
   concurrency 1, clamp session bounds through `OccupancyPort`, or another
   explicit rule.
4. Decide the `fgos handoff` relationship: Work event holder truth versus
   session collaboration evidence/projection.
5. Decide the minimal in-process Run record shape before executing-stage
   primary work moves onto Assignment.
6. Choose whether Node repo-layout overlay is accepted now, deferred as
   migration-only guidance, or split into a separate distribution/component
   document.
7. Add accepted-source links from Step 09 and Step 10 before any coding
   adoption implementation plan claims readiness.
```

## claim_4a5585355351f33c2a4300d502cb90b7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-66, lines 564–564.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-69.
Source digest: 523e870d8cc2b79d3e8d9ec1e11adf55ef012019d7592c8d28e77cb1ac4b6b05
Target digest: 523e870d8cc2b79d3e8d9ec1e11adf55ef012019d7592c8d28e77cb1ac4b6b05
Shown source SHA256: 523e870d8cc2b79d3e8d9ec1e11adf55ef012019d7592c8d28e77cb1ac4b6b05
Shown target SHA256: 523e870d8cc2b79d3e8d9ec1e11adf55ef012019d7592c8d28e77cb1ac4b6b05

### Proposed decision

```json
{
  "claimId": "claim_4a5585355351f33c2a4300d502cb90b7",
  "sourceUnitDigest": "523e870d8cc2b79d3e8d9ec1e11adf55ef012019d7592c8d28e77cb1ac4b6b05",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-69",
  "targetUnitDigest": "523e870d8cc2b79d3e8d9ec1e11adf55ef012019d7592c8d28e77cb1ac4b6b05",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "16. Boundary Promotion Checklist"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-66 (lines 564–564) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-69 (lines 588–588); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Before this draft can become accepted architecture:
```

### Full target shown text

```text
Before this draft can become accepted architecture:
```

## claim_7dbf2e267742b5ca6e5e77602492fa1d

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-67, lines 566–583.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-70.
Source digest: 275bf893b448e2929d1f59c0241a0cc04831b631dcf9599d6c68ee090be398e2
Target digest: 275bf893b448e2929d1f59c0241a0cc04831b631dcf9599d6c68ee090be398e2
Shown source SHA256: 275bf893b448e2929d1f59c0241a0cc04831b631dcf9599d6c68ee090be398e2
Shown target SHA256: 275bf893b448e2929d1f59c0241a0cc04831b631dcf9599d6c68ee090be398e2

### Proposed decision

```json
{
  "claimId": "claim_7dbf2e267742b5ca6e5e77602492fa1d",
  "sourceUnitDigest": "275bf893b448e2929d1f59c0241a0cc04831b631dcf9599d6c68ee090be398e2",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-70",
  "targetUnitDigest": "275bf893b448e2929d1f59c0241a0cc04831b631dcf9599d6c68ee090be398e2",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "16. Boundary Promotion Checklist"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-67 (lines 566–583) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-70 (lines 590–607); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. Reconcile against Step 08 P07.2 final Deferral Audit and any changed
   CoordinationSession, FlowDefinition, dispatch, evidence, recovery, or
   headless-parity contracts.
2. Confirm Work Driver / Domain Workflow Interpreter as a child responsibility
   under Work Core, and decide its explicit contract boundary with Work
   Lifecycle Engine and Runtime Occupancy Support.
3. Decide first read-only concurrency posture: inherit host Work slot at
   concurrency 1, clamp session bounds through `OccupancyPort`, or another
   explicit rule.
4. Decide the `fgos handoff` relationship: Work event holder truth versus
   session collaboration evidence/projection.
5. Decide the minimal in-process Run record shape before executing-stage
   primary work moves onto Assignment.
6. Choose whether Node repo-layout overlay is accepted now, deferred as
   migration-only guidance, or split into a separate distribution/component
   document.
7. Add accepted-source links from Step 09 and Step 10 before any coding
   adoption implementation plan claims readiness.
```

### Full target shown text

```text
1. Reconcile against Step 08 P07.2 final Deferral Audit and any changed
   CoordinationSession, FlowDefinition, dispatch, evidence, recovery, or
   headless-parity contracts.
2. Confirm Work Driver / Domain Workflow Interpreter as a child responsibility
   under Work Core, and decide its explicit contract boundary with Work
   Lifecycle Engine and Runtime Occupancy Support.
3. Decide first read-only concurrency posture: inherit host Work slot at
   concurrency 1, clamp session bounds through `OccupancyPort`, or another
   explicit rule.
4. Decide the `fgos handoff` relationship: Work event holder truth versus
   session collaboration evidence/projection.
5. Decide the minimal in-process Run record shape before executing-stage
   primary work moves onto Assignment.
6. Choose whether Node repo-layout overlay is accepted now, deferred as
   migration-only guidance, or split into a separate distribution/component
   document.
7. Add accepted-source links from Step 09 and Step 10 before any coding
   adoption implementation plan claims readiness.
```

## claim_5408114e37ad45d35209d92515044a31

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#17-recommended-next-architecture-moves, lines 585–585.
Target: docs/platform/proposals/component-authority-boundary-map.md#17-recommended-next-architecture-moves.
Source digest: 9227058b0772e036a147e2602b2735855ec5e0944e525c3ed11bba62bae7aff4
Target digest: 9227058b0772e036a147e2602b2735855ec5e0944e525c3ed11bba62bae7aff4
Shown source SHA256: 79ffe212f379208a6a3596d8107b4efabce84714f1364f02c55bff86872d5704
Shown target SHA256: 79ffe212f379208a6a3596d8107b4efabce84714f1364f02c55bff86872d5704

### Proposed decision

```json
{
  "claimId": "claim_5408114e37ad45d35209d92515044a31",
  "sourceUnitDigest": "9227058b0772e036a147e2602b2735855ec5e0944e525c3ed11bba62bae7aff4",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "17-recommended-next-architecture-moves",
  "targetUnitDigest": "9227058b0772e036a147e2602b2735855ec5e0944e525c3ed11bba62bae7aff4",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#17-recommended-next-architecture-moves (lines 585–585) is carried at docs/platform/proposals/component-authority-boundary-map.md#17-recommended-next-architecture-moves (lines 609–609); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
## 17. Recommended Next Architecture Moves

1. Keep this draft as architect-level discussion input until promoted.
2. Run one focused review against Step 08's final audit and the Step 09
   substrate direction before accepting boundary rules.
3. Decide three gates explicitly: `OccupancyPort`, `fgos handoff`
   truth/projection, and in-process Run minimum record.
4. For Step 10 slice 2, implement only Work-attached read-only `validate-plan`
   session after the relevant Step 09 substrate primitive and boundary
   guardrails are accepted. Keep session concurrency at 1 and do not introduce
   fan-out.
5. For Step 10 slice 3, extract coding-specific result interpretation toward a
   coding evidence adapter feeding Run Result Evaluator.
6. For Step 10 mutating proof, lift the mutation gate only through a new ADR
   with live proof; do not edit ADR-010 in place.
```

### Full target shown text

```text
## 17. Recommended Next Architecture Moves

1. Keep this draft as architect-level discussion input until promoted.
2. Run one focused review against Step 08's final audit and the Step 09
   substrate direction before accepting boundary rules.
3. Decide three gates explicitly: `OccupancyPort`, `fgos handoff`
   truth/projection, and in-process Run minimum record.
4. For Step 10 slice 2, implement only Work-attached read-only `validate-plan`
   session after the relevant Step 09 substrate primitive and boundary
   guardrails are accepted. Keep session concurrency at 1 and do not introduce
   fan-out.
5. For Step 10 slice 3, extract coding-specific result interpretation toward a
   coding evidence adapter feeding Run Result Evaluator.
6. For Step 10 mutating proof, lift the mutation gate only through a new ADR
   with live proof; do not edit ADR-010 in place.
```

## claim_ae765ac53a3113834d1792c7f970d000

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-68, lines 587–599.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-71.
Source digest: 6a40352d221307f2ce3729befbd7ac58f1856f41aeab34f393d77f101592d01b
Target digest: 6a40352d221307f2ce3729befbd7ac58f1856f41aeab34f393d77f101592d01b
Shown source SHA256: 6a40352d221307f2ce3729befbd7ac58f1856f41aeab34f393d77f101592d01b
Shown target SHA256: 6a40352d221307f2ce3729befbd7ac58f1856f41aeab34f393d77f101592d01b

### Proposed decision

```json
{
  "claimId": "claim_ae765ac53a3113834d1792c7f970d000",
  "sourceUnitDigest": "6a40352d221307f2ce3729befbd7ac58f1856f41aeab34f393d77f101592d01b",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-71",
  "targetUnitDigest": "6a40352d221307f2ce3729befbd7ac58f1856f41aeab34f393d77f101592d01b",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "17. Recommended Next Architecture Moves"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-68 (lines 587–599) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-71 (lines 611–623); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. Keep this draft as architect-level discussion input until promoted.
2. Run one focused review against Step 08's final audit and the Step 09
   substrate direction before accepting boundary rules.
3. Decide three gates explicitly: `OccupancyPort`, `fgos handoff`
   truth/projection, and in-process Run minimum record.
4. For Step 10 slice 2, implement only Work-attached read-only `validate-plan`
   session after the relevant Step 09 substrate primitive and boundary
   guardrails are accepted. Keep session concurrency at 1 and do not introduce
   fan-out.
5. For Step 10 slice 3, extract coding-specific result interpretation toward a
   coding evidence adapter feeding Run Result Evaluator.
6. For Step 10 mutating proof, lift the mutation gate only through a new ADR
   with live proof; do not edit ADR-010 in place.
```

### Full target shown text

```text
1. Keep this draft as architect-level discussion input until promoted.
2. Run one focused review against Step 08's final audit and the Step 09
   substrate direction before accepting boundary rules.
3. Decide three gates explicitly: `OccupancyPort`, `fgos handoff`
   truth/projection, and in-process Run minimum record.
4. For Step 10 slice 2, implement only Work-attached read-only `validate-plan`
   session after the relevant Step 09 substrate primitive and boundary
   guardrails are accepted. Keep session concurrency at 1 and do not introduce
   fan-out.
5. For Step 10 slice 3, extract coding-specific result interpretation toward a
   coding evidence adapter feeding Run Result Evaluator.
6. For Step 10 mutating proof, lift the mutation gate only through a new ADR
   with live proof; do not edit ADR-010 in place.
```

## claim_e6a1b1d03ef558e8136324c67aeb332f

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#18-agent-coordination-documentation-organization-pressure, lines 601–601.
Target: docs/platform/proposals/component-authority-boundary-map.md#18-agent-coordination-documentation-organization-pressure.
Source digest: aacfe2480740e3606c4bdb2470a695cca725d947bc611b0f87d0f83fd727feae
Target digest: aacfe2480740e3606c4bdb2470a695cca725d947bc611b0f87d0f83fd727feae
Shown source SHA256: 14f40d50bbadd48a379ea24efa1c460e8a664bdeaf721d0ac2ba3821a29224d9
Shown target SHA256: 14f40d50bbadd48a379ea24efa1c460e8a664bdeaf721d0ac2ba3821a29224d9

### Proposed decision

```json
{
  "claimId": "claim_e6a1b1d03ef558e8136324c67aeb332f",
  "sourceUnitDigest": "aacfe2480740e3606c4bdb2470a695cca725d947bc611b0f87d0f83fd727feae",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "18-agent-coordination-documentation-organization-pressure",
  "targetUnitDigest": "aacfe2480740e3606c4bdb2470a695cca725d947bc611b0f87d0f83fd727feae",
  "targetAncestry": [
    "Component Authority Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source heading docs/architect/proposals/component-authority-boundary-map.md#18-agent-coordination-documentation-organization-pressure (lines 601–601) is carried at docs/platform/proposals/component-authority-boundary-map.md#18-agent-coordination-documentation-organization-pressure (lines 625–625); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
## 18. Agent Coordination Documentation Organization Pressure

The current `docs/architect/agent-coordination/` tree is organized mostly by
document authority:

```txt
vision/
vocabulary/
architecture/
contracts/
decisions/
proposals/
roadmap/
verification/
playbooks/
history/
```

That is good for governance, but weak for internal boundary reading. The same
tree discusses CoordinationSession runtime, FlowDefinition/protocol model,
Assignment construction, Dispatch, Run/RunResult/evidence, Work integration,
Herdr/visibility, Team Cognition, Work/domain driver boundaries, and
orchestration rings.

Without a component-boundary view, two wrong readings become likely:

1. everything under this tree belongs inside the Agent Coordination Engine;
2. everything named driver/router/launcher is owned by Agent Coordination.

Both are false. Some documents under this tree describe adjacent platform
components because Agent Coordination interacts with them. A third reading is
partly true but needs precision: Dispatch and Run Result Evaluation belong
inside the **Agent Coordination** umbrella, but they are not submodules of the
narrower **Agent Coordination Engine**.

Recommended documentation overlay for boundary promotion:

```txt
docs/architect/agent-coordination/
  README.md
  vision.md
  intent-preservation-ledger.md

  boundaries/
    README.md
    orchestration-rings.md
    work-driver-integration.md
    component-authority-map.md

  architecture/
    system-context.md
    protocol-model.md
    runtime-model.md
    work-integration.md
    dispatch-control-plane.md
    evidence-and-results.md
    visibility-and-herdr.md

  contracts/
  decisions/
  proposals/
  roadmap/
  verification/
  playbooks/
  history/
```

This is an overlay direction, not a file-move request. The first move should be
an index-style `boundaries/README.md` or accepted
`architecture/component-boundary.md` that maps existing docs by component. Only
after Step 08 closes should any physical reorganization happen.

Draft component-to-doc reading map:

| Component concern | Current docs | Proposed boundary view |
|---|---|---|
| Agent Coordination Engine | `architecture/{system-context,protocol-model,runtime-model}.md`, `contracts/coordination-session.md`, `contracts/flow-definition.md` | Core Agent Coordination-owned docs. |
| Dispatch And Execution Engine | `architecture/dispatch-control-plane.md`, Run section of `contracts/assignment-run-runresult.md`, dispatch proposals | Adjacent platform-core engine under the foundation umbrella, not a submodule owned by session runtime. |
| Run Result Evaluator | `architecture/evidence-and-results.md`, RunResult/confidence section of `contracts/assignment-run-runresult.md` | Split from dispatch even if source files are still together. |
| Work Lifecycle / Work Driver integration | `architecture/work-integration.md`, Team Dispatch roadmap, Step 10 proposal | Work Driver is a platform-core integration engine that uses Agent Coordination, not an Agent Coordination subcomponent. |
| Host/visibility | `architecture/visibility-and-herdr.md`, gateway docs | Visibility stays out of runtime truth and evidence authority. |
| Rings / router / launcher / driver vocabulary | `vocabulary/concept-relationships.md`, roadmap Team Dispatch docs | Ring vocabulary becomes a component-neutral map. |

Do not reorganize the whole tree now. Add the boundary overlay first. If Step
1B accepts it, then move or split docs only where the accepted authority map
proves that navigation by document authority is no longer enough.
````

### Full target shown text

````text
## 18. Agent Coordination Documentation Organization Pressure

The current `docs/architect/agent-coordination/` tree is organized mostly by
document authority:

```txt
vision/
vocabulary/
architecture/
contracts/
decisions/
proposals/
roadmap/
verification/
playbooks/
history/
```

That is good for governance, but weak for internal boundary reading. The same
tree discusses CoordinationSession runtime, FlowDefinition/protocol model,
Assignment construction, Dispatch, Run/RunResult/evidence, Work integration,
Herdr/visibility, Team Cognition, Work/domain driver boundaries, and
orchestration rings.

Without a component-boundary view, two wrong readings become likely:

1. everything under this tree belongs inside the Agent Coordination Engine;
2. everything named driver/router/launcher is owned by Agent Coordination.

Both are false. Some documents under this tree describe adjacent platform
components because Agent Coordination interacts with them. A third reading is
partly true but needs precision: Dispatch and Run Result Evaluation belong
inside the **Agent Coordination** umbrella, but they are not submodules of the
narrower **Agent Coordination Engine**.

Recommended documentation overlay for boundary promotion:

```txt
docs/architect/agent-coordination/
  README.md
  vision.md
  intent-preservation-ledger.md

  boundaries/
    README.md
    orchestration-rings.md
    work-driver-integration.md
    component-authority-map.md

  architecture/
    system-context.md
    protocol-model.md
    runtime-model.md
    work-integration.md
    dispatch-control-plane.md
    evidence-and-results.md
    visibility-and-herdr.md

  contracts/
  decisions/
  proposals/
  roadmap/
  verification/
  playbooks/
  history/
```

This is an overlay direction, not a file-move request. The first move should be
an index-style `boundaries/README.md` or accepted
`architecture/component-boundary.md` that maps existing docs by component. Only
after Step 08 closes should any physical reorganization happen.

Draft component-to-doc reading map:

| Component concern | Current docs | Proposed boundary view |
|---|---|---|
| Agent Coordination Engine | `architecture/{system-context,protocol-model,runtime-model}.md`, `contracts/coordination-session.md`, `contracts/flow-definition.md` | Core Agent Coordination-owned docs. |
| Dispatch And Execution Engine | `architecture/dispatch-control-plane.md`, Run section of `contracts/assignment-run-runresult.md`, dispatch proposals | Adjacent platform-core engine under the foundation umbrella, not a submodule owned by session runtime. |
| Run Result Evaluator | `architecture/evidence-and-results.md`, RunResult/confidence section of `contracts/assignment-run-runresult.md` | Split from dispatch even if source files are still together. |
| Work Lifecycle / Work Driver integration | `architecture/work-integration.md`, Team Dispatch roadmap, Step 10 proposal | Work Driver is a platform-core integration engine that uses Agent Coordination, not an Agent Coordination subcomponent. |
| Host/visibility | `architecture/visibility-and-herdr.md`, gateway docs | Visibility stays out of runtime truth and evidence authority. |
| Rings / router / launcher / driver vocabulary | `vocabulary/concept-relationships.md`, roadmap Team Dispatch docs | Ring vocabulary becomes a component-neutral map. |

Do not reorganize the whole tree now. Add the boundary overlay first. If Step
1B accepts it, then move or split docs only where the accepted authority map
proves that navigation by document authority is no longer enough.
````

## claim_d32b81a56c19db6b1d8d8c340d75f76b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-69, lines 603–604.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-72.
Source digest: e3523ea84219a004ecef1691597eea2f28170235aac948ad616bf90be1d80c18
Target digest: e3523ea84219a004ecef1691597eea2f28170235aac948ad616bf90be1d80c18
Shown source SHA256: e3523ea84219a004ecef1691597eea2f28170235aac948ad616bf90be1d80c18
Shown target SHA256: e3523ea84219a004ecef1691597eea2f28170235aac948ad616bf90be1d80c18

### Proposed decision

```json
{
  "claimId": "claim_d32b81a56c19db6b1d8d8c340d75f76b",
  "sourceUnitDigest": "e3523ea84219a004ecef1691597eea2f28170235aac948ad616bf90be1d80c18",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-72",
  "targetUnitDigest": "e3523ea84219a004ecef1691597eea2f28170235aac948ad616bf90be1d80c18",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-69 (lines 603–604) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-72 (lines 627–628); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
The current `docs/architect/agent-coordination/` tree is organized mostly by
document authority:
```

### Full target shown text

```text
The current `docs/architect/agent-coordination/` tree is organized mostly by
document authority:
```

## claim_71c6c5f3de38834f343e4fd700e17e0b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-70, lines 606–617.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-73.
Source digest: a35fea8383c769b8423fdb0efcd8599d2f34ec6d46118fdce17c9c294919b75a
Target digest: a35fea8383c769b8423fdb0efcd8599d2f34ec6d46118fdce17c9c294919b75a
Shown source SHA256: a35fea8383c769b8423fdb0efcd8599d2f34ec6d46118fdce17c9c294919b75a
Shown target SHA256: a35fea8383c769b8423fdb0efcd8599d2f34ec6d46118fdce17c9c294919b75a

### Proposed decision

```json
{
  "claimId": "claim_71c6c5f3de38834f343e4fd700e17e0b",
  "sourceUnitDigest": "a35fea8383c769b8423fdb0efcd8599d2f34ec6d46118fdce17c9c294919b75a",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-73",
  "targetUnitDigest": "a35fea8383c769b8423fdb0efcd8599d2f34ec6d46118fdce17c9c294919b75a",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-70 (lines 606–617) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-73 (lines 630–641); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
vision/
vocabulary/
architecture/
contracts/
decisions/
proposals/
roadmap/
verification/
playbooks/
history/
```
````

### Full target shown text

````text
```txt
vision/
vocabulary/
architecture/
contracts/
decisions/
proposals/
roadmap/
verification/
playbooks/
history/
```
````

## claim_1abd0088d916d47bfbfbf1811f1da678

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-71, lines 619–623.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-74.
Source digest: 403a859cd96d4fcc0e9b586b90fad139279bc7a96aaf68c8e41fcfa2cc84fd82
Target digest: 403a859cd96d4fcc0e9b586b90fad139279bc7a96aaf68c8e41fcfa2cc84fd82
Shown source SHA256: 403a859cd96d4fcc0e9b586b90fad139279bc7a96aaf68c8e41fcfa2cc84fd82
Shown target SHA256: 403a859cd96d4fcc0e9b586b90fad139279bc7a96aaf68c8e41fcfa2cc84fd82

### Proposed decision

```json
{
  "claimId": "claim_1abd0088d916d47bfbfbf1811f1da678",
  "sourceUnitDigest": "403a859cd96d4fcc0e9b586b90fad139279bc7a96aaf68c8e41fcfa2cc84fd82",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-74",
  "targetUnitDigest": "403a859cd96d4fcc0e9b586b90fad139279bc7a96aaf68c8e41fcfa2cc84fd82",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-71 (lines 619–623) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-74 (lines 643–647); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
That is good for governance, but weak for internal boundary reading. The same
tree discusses CoordinationSession runtime, FlowDefinition/protocol model,
Assignment construction, Dispatch, Run/RunResult/evidence, Work integration,
Herdr/visibility, Team Cognition, Work/domain driver boundaries, and
orchestration rings.
```

### Full target shown text

```text
That is good for governance, but weak for internal boundary reading. The same
tree discusses CoordinationSession runtime, FlowDefinition/protocol model,
Assignment construction, Dispatch, Run/RunResult/evidence, Work integration,
Herdr/visibility, Team Cognition, Work/domain driver boundaries, and
orchestration rings.
```

## claim_4e8c4ba5327b732a995d10400ae8cc48

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-72, lines 625–625.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-75.
Source digest: 6e896eaec46ff99cb0ae5ff13658617e5d8b616fb5ba4d7771d7ee4be653d516
Target digest: 6e896eaec46ff99cb0ae5ff13658617e5d8b616fb5ba4d7771d7ee4be653d516
Shown source SHA256: 6e896eaec46ff99cb0ae5ff13658617e5d8b616fb5ba4d7771d7ee4be653d516
Shown target SHA256: 6e896eaec46ff99cb0ae5ff13658617e5d8b616fb5ba4d7771d7ee4be653d516

### Proposed decision

```json
{
  "claimId": "claim_4e8c4ba5327b732a995d10400ae8cc48",
  "sourceUnitDigest": "6e896eaec46ff99cb0ae5ff13658617e5d8b616fb5ba4d7771d7ee4be653d516",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-75",
  "targetUnitDigest": "6e896eaec46ff99cb0ae5ff13658617e5d8b616fb5ba4d7771d7ee4be653d516",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-72 (lines 625–625) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-75 (lines 649–649); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Without a component-boundary view, two wrong readings become likely:
```

### Full target shown text

```text
Without a component-boundary view, two wrong readings become likely:
```

## claim_756646a4b2b204d3532c536099835c1a

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-73, lines 627–628.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-76.
Source digest: ca57e0a46996629e8d89c17fcfe2e860084a4f5b44ce54bb0f229241a05dfe85
Target digest: ca57e0a46996629e8d89c17fcfe2e860084a4f5b44ce54bb0f229241a05dfe85
Shown source SHA256: ca57e0a46996629e8d89c17fcfe2e860084a4f5b44ce54bb0f229241a05dfe85
Shown target SHA256: ca57e0a46996629e8d89c17fcfe2e860084a4f5b44ce54bb0f229241a05dfe85

### Proposed decision

```json
{
  "claimId": "claim_756646a4b2b204d3532c536099835c1a",
  "sourceUnitDigest": "ca57e0a46996629e8d89c17fcfe2e860084a4f5b44ce54bb0f229241a05dfe85",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-76",
  "targetUnitDigest": "ca57e0a46996629e8d89c17fcfe2e860084a4f5b44ce54bb0f229241a05dfe85",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-73 (lines 627–628) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-76 (lines 651–652); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
1. everything under this tree belongs inside the Agent Coordination Engine;
2. everything named driver/router/launcher is owned by Agent Coordination.
```

### Full target shown text

```text
1. everything under this tree belongs inside the Agent Coordination Engine;
2. everything named driver/router/launcher is owned by Agent Coordination.
```

## claim_01a0b5f640cc32182e8fa2f3cb877919

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-74, lines 630–634.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-77.
Source digest: 60b00873b9eb6461ae62558524111bd4dfc2a73224d75fec214464ace07f530d
Target digest: 60b00873b9eb6461ae62558524111bd4dfc2a73224d75fec214464ace07f530d
Shown source SHA256: 60b00873b9eb6461ae62558524111bd4dfc2a73224d75fec214464ace07f530d
Shown target SHA256: 60b00873b9eb6461ae62558524111bd4dfc2a73224d75fec214464ace07f530d

### Proposed decision

```json
{
  "claimId": "claim_01a0b5f640cc32182e8fa2f3cb877919",
  "sourceUnitDigest": "60b00873b9eb6461ae62558524111bd4dfc2a73224d75fec214464ace07f530d",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-77",
  "targetUnitDigest": "60b00873b9eb6461ae62558524111bd4dfc2a73224d75fec214464ace07f530d",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-74 (lines 630–634) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-77 (lines 654–658); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Both are false. Some documents under this tree describe adjacent platform
components because Agent Coordination interacts with them. A third reading is
partly true but needs precision: Dispatch and Run Result Evaluation belong
inside the **Agent Coordination** umbrella, but they are not submodules of the
narrower **Agent Coordination Engine**.
```

### Full target shown text

```text
Both are false. Some documents under this tree describe adjacent platform
components because Agent Coordination interacts with them. A third reading is
partly true but needs precision: Dispatch and Run Result Evaluation belong
inside the **Agent Coordination** umbrella, but they are not submodules of the
narrower **Agent Coordination Engine**.
```

## claim_28f8d68e81ad3e1c7656f3b624c00d54

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-75, lines 636–636.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-78.
Source digest: cd8d3eb7b69fc582782e530b81e1ceca11080676455448c20643d9c0ebfe66e0
Target digest: cd8d3eb7b69fc582782e530b81e1ceca11080676455448c20643d9c0ebfe66e0
Shown source SHA256: cd8d3eb7b69fc582782e530b81e1ceca11080676455448c20643d9c0ebfe66e0
Shown target SHA256: cd8d3eb7b69fc582782e530b81e1ceca11080676455448c20643d9c0ebfe66e0

### Proposed decision

```json
{
  "claimId": "claim_28f8d68e81ad3e1c7656f3b624c00d54",
  "sourceUnitDigest": "cd8d3eb7b69fc582782e530b81e1ceca11080676455448c20643d9c0ebfe66e0",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-78",
  "targetUnitDigest": "cd8d3eb7b69fc582782e530b81e1ceca11080676455448c20643d9c0ebfe66e0",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-75 (lines 636–636) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-78 (lines 660–660); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Recommended documentation overlay for boundary promotion:
```

### Full target shown text

```text
Recommended documentation overlay for boundary promotion:
```

## claim_6a92002895ce7ee7f9bbd09149d7a4c7

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-76, lines 638–666.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-79.
Source digest: 202005aa814173124f2b433fb1ec900ae4eaec1d69a59d158bb3890f7a364cac
Target digest: 202005aa814173124f2b433fb1ec900ae4eaec1d69a59d158bb3890f7a364cac
Shown source SHA256: 202005aa814173124f2b433fb1ec900ae4eaec1d69a59d158bb3890f7a364cac
Shown target SHA256: 202005aa814173124f2b433fb1ec900ae4eaec1d69a59d158bb3890f7a364cac

### Proposed decision

```json
{
  "claimId": "claim_6a92002895ce7ee7f9bbd09149d7a4c7",
  "sourceUnitDigest": "202005aa814173124f2b433fb1ec900ae4eaec1d69a59d158bb3890f7a364cac",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-79",
  "targetUnitDigest": "202005aa814173124f2b433fb1ec900ae4eaec1d69a59d158bb3890f7a364cac",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-76 (lines 638–666) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-79 (lines 662–690); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

````text
```txt
docs/architect/agent-coordination/
  README.md
  vision.md
  intent-preservation-ledger.md

  boundaries/
    README.md
    orchestration-rings.md
    work-driver-integration.md
    component-authority-map.md

  architecture/
    system-context.md
    protocol-model.md
    runtime-model.md
    work-integration.md
    dispatch-control-plane.md
    evidence-and-results.md
    visibility-and-herdr.md

  contracts/
  decisions/
  proposals/
  roadmap/
  verification/
  playbooks/
  history/
```
````

### Full target shown text

````text
```txt
docs/architect/agent-coordination/
  README.md
  vision.md
  intent-preservation-ledger.md

  boundaries/
    README.md
    orchestration-rings.md
    work-driver-integration.md
    component-authority-map.md

  architecture/
    system-context.md
    protocol-model.md
    runtime-model.md
    work-integration.md
    dispatch-control-plane.md
    evidence-and-results.md
    visibility-and-herdr.md

  contracts/
  decisions/
  proposals/
  roadmap/
  verification/
  playbooks/
  history/
```
````

## claim_03068241c6f2be23bea6def64ba93760

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-77, lines 668–671.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-80.
Source digest: 0241d8818eac63d8dc710702f12cd7c2000b08d533083cc4b41eeae0831d6897
Target digest: 0241d8818eac63d8dc710702f12cd7c2000b08d533083cc4b41eeae0831d6897
Shown source SHA256: 0241d8818eac63d8dc710702f12cd7c2000b08d533083cc4b41eeae0831d6897
Shown target SHA256: 0241d8818eac63d8dc710702f12cd7c2000b08d533083cc4b41eeae0831d6897

### Proposed decision

```json
{
  "claimId": "claim_03068241c6f2be23bea6def64ba93760",
  "sourceUnitDigest": "0241d8818eac63d8dc710702f12cd7c2000b08d533083cc4b41eeae0831d6897",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-80",
  "targetUnitDigest": "0241d8818eac63d8dc710702f12cd7c2000b08d533083cc4b41eeae0831d6897",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-77 (lines 668–671) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-80 (lines 692–695); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
This is an overlay direction, not a file-move request. The first move should be
an index-style `boundaries/README.md` or accepted
`architecture/component-boundary.md` that maps existing docs by component. Only
after Step 08 closes should any physical reorganization happen.
```

### Full target shown text

```text
This is an overlay direction, not a file-move request. The first move should be
an index-style `boundaries/README.md` or accepted
`architecture/component-boundary.md` that maps existing docs by component. Only
after Step 08 closes should any physical reorganization happen.
```

## claim_f9a2a272e1abb58e0f4da106993eef9b

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Weak-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-78, lines 673–673.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-81.
Source digest: f0211dddfd48a732a0e3af0f5c19343340ff920934f2442863cb6269312b9dc2
Target digest: f0211dddfd48a732a0e3af0f5c19343340ff920934f2442863cb6269312b9dc2
Shown source SHA256: f0211dddfd48a732a0e3af0f5c19343340ff920934f2442863cb6269312b9dc2
Shown target SHA256: f0211dddfd48a732a0e3af0f5c19343340ff920934f2442863cb6269312b9dc2

### Proposed decision

```json
{
  "claimId": "claim_f9a2a272e1abb58e0f4da106993eef9b",
  "sourceUnitDigest": "f0211dddfd48a732a0e3af0f5c19343340ff920934f2442863cb6269312b9dc2",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-81",
  "targetUnitDigest": "f0211dddfd48a732a0e3af0f5c19343340ff920934f2442863cb6269312b9dc2",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-78 (lines 673–673) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-81 (lines 697–697); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Draft component-to-doc reading map:
```

### Full target shown text

```text
Draft component-to-doc reading map:
```

## claim_4864462f86f8e1bb2cdd04ced2b51034

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-79, lines 675–682.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-82.
Source digest: c4ab26a04a969da0d7e177ffff9cff18f9a881f5f5e49589709d2b4f69595937
Target digest: c4ab26a04a969da0d7e177ffff9cff18f9a881f5f5e49589709d2b4f69595937
Shown source SHA256: c4ab26a04a969da0d7e177ffff9cff18f9a881f5f5e49589709d2b4f69595937
Shown target SHA256: c4ab26a04a969da0d7e177ffff9cff18f9a881f5f5e49589709d2b4f69595937

### Proposed decision

```json
{
  "claimId": "claim_4864462f86f8e1bb2cdd04ced2b51034",
  "sourceUnitDigest": "c4ab26a04a969da0d7e177ffff9cff18f9a881f5f5e49589709d2b4f69595937",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-82",
  "targetUnitDigest": "c4ab26a04a969da0d7e177ffff9cff18f9a881f5f5e49589709d2b4f69595937",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-79 (lines 675–682) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-82 (lines 699–706); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
| Component concern | Current docs | Proposed boundary view |
|---|---|---|
| Agent Coordination Engine | `architecture/{system-context,protocol-model,runtime-model}.md`, `contracts/coordination-session.md`, `contracts/flow-definition.md` | Core Agent Coordination-owned docs. |
| Dispatch And Execution Engine | `architecture/dispatch-control-plane.md`, Run section of `contracts/assignment-run-runresult.md`, dispatch proposals | Adjacent platform-core engine under the foundation umbrella, not a submodule owned by session runtime. |
| Run Result Evaluator | `architecture/evidence-and-results.md`, RunResult/confidence section of `contracts/assignment-run-runresult.md` | Split from dispatch even if source files are still together. |
| Work Lifecycle / Work Driver integration | `architecture/work-integration.md`, Team Dispatch roadmap, Step 10 proposal | Work Driver is a platform-core integration engine that uses Agent Coordination, not an Agent Coordination subcomponent. |
| Host/visibility | `architecture/visibility-and-herdr.md`, gateway docs | Visibility stays out of runtime truth and evidence authority. |
| Rings / router / launcher / driver vocabulary | `vocabulary/concept-relationships.md`, roadmap Team Dispatch docs | Ring vocabulary becomes a component-neutral map. |
```

### Full target shown text

```text
| Component concern | Current docs | Proposed boundary view |
|---|---|---|
| Agent Coordination Engine | `architecture/{system-context,protocol-model,runtime-model}.md`, `contracts/coordination-session.md`, `contracts/flow-definition.md` | Core Agent Coordination-owned docs. |
| Dispatch And Execution Engine | `architecture/dispatch-control-plane.md`, Run section of `contracts/assignment-run-runresult.md`, dispatch proposals | Adjacent platform-core engine under the foundation umbrella, not a submodule owned by session runtime. |
| Run Result Evaluator | `architecture/evidence-and-results.md`, RunResult/confidence section of `contracts/assignment-run-runresult.md` | Split from dispatch even if source files are still together. |
| Work Lifecycle / Work Driver integration | `architecture/work-integration.md`, Team Dispatch roadmap, Step 10 proposal | Work Driver is a platform-core integration engine that uses Agent Coordination, not an Agent Coordination subcomponent. |
| Host/visibility | `architecture/visibility-and-herdr.md`, gateway docs | Visibility stays out of runtime truth and evidence authority. |
| Rings / router / launcher / driver vocabulary | `vocabulary/concept-relationships.md`, roadmap Team Dispatch docs | Ring vocabulary becomes a component-neutral map. |
```

## claim_05786c7a35d0974018885dc34cc3d3c8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **no**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-80, lines 684–686.
Target: docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-83.
Source digest: 50f79727f901685a9405795aab0bddc4e159cf900117b9c406e8bc85b08414e5
Target digest: 50f79727f901685a9405795aab0bddc4e159cf900117b9c406e8bc85b08414e5
Shown source SHA256: 50f79727f901685a9405795aab0bddc4e159cf900117b9c406e8bc85b08414e5
Shown target SHA256: 50f79727f901685a9405795aab0bddc4e159cf900117b9c406e8bc85b08414e5

### Proposed decision

```json
{
  "claimId": "claim_05786c7a35d0974018885dc34cc3d3c8",
  "sourceUnitDigest": "50f79727f901685a9405795aab0bddc4e159cf900117b9c406e8bc85b08414e5",
  "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
  "targetAnchor": "unheaded-block-83",
  "targetUnitDigest": "50f79727f901685a9405795aab0bddc4e159cf900117b9c406e8bc85b08414e5",
  "targetAncestry": [
    "Component Authority Boundary Map",
    "18. Agent Coordination Documentation Organization Pressure"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. place verbatim: Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Evidence: docs/platform/component-boundary.md:40,90,511 directly cites the draft; docs/platform/system-architecture/architecture/roadmap.md:55 still schedules component-boundary work. Source lines 3–18 explicitly withholds accepted authority. Complete source unheaded-block docs/architect/proposals/component-authority-boundary-map.md#unheaded-block-80 (lines 684–686) is carried at docs/platform/proposals/component-authority-boundary-map.md#unheaded-block-83 (lines 708–710); Frozen map target and kind retained. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement."
}
```

### Full source shown text

```text
Do not reorganize the whole tree now. Add the boundary overlay first. If Step
1B accepts it, then move or split docs only where the accepted authority map
proves that navigation by document authority is no longer enough.
```

### Full target shown text

```text
Do not reorganize the whole tree now. Add the boundary overlay first. If Step
1B accepts it, then move or split docs only where the accepted authority map
proves that navigation by document authority is no longer enough.
```
