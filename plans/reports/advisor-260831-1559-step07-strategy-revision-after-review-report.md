# Step 07 Strategy — Revision After Peer Review

Date: 2026-08-31 | Supersedes: /home/vantt/projects/plans/reports/advisor-260831-1541-agent-coordination-step07-strategy-report.md (v1)
Status: advisor recommendation, not accepted architecture.

## Disposition of review points

| # | Review claim | Verdict | Evidence / reasoning |
|---|---|---|---|
| 1 | Phase 1+2 does not falsify V-012 | **Accept** | v1 MVP proved consumer #1 only. V-012 needs coding consumer on same core. Reorder: Proof 1 + Proof 2 (both one-shot, read-only) = MVP. |
| 2 | Don't compile TaskSpec markdown into universal contract | **Accept mechanism, hold principle** | Mapping already exists in code, not markdown: mutation = `KNOWN_MUTATING_OPS`/`READ_ONLY_ROLES` (assignment.mjs:352,367); evidence requirement = per-op branches (operation-choice.mjs:1760,1859,1924-1933). Change = lift these into fields stamped on the normalized Assignment snapshot at build time (`mutation`, `evidence.required`), ladder reads from Assignment. No TaskSpec migration. Declared path: existing Stage/TaskSpec validation -> stamp -> declared provenance. Inline path: inline validator -> stamp -> inline provenance. Convergence at snapshot, as reviewer proposes. |
| 3 | Lazy session at 2nd Assignment = provenance/budget hole | **Accept; simpler fix than adoption** | No adoption at all in MVP. `coordinationId` is caller-supplied at Assignment build; if present, manifest must already exist (create-before-first, fail closed otherwise). A one-shot that grows: start a new coordination, reference prior assignmentId in contextRefs. Provenance by reference, no ownership transfer, no atomicity rule needed. |
| 4 | dependsOn != AdhocTask | **Accept wording** | MVP graph = one logical unit per Assignment; retry = Run-level; follow-up/reviewer = new Assignments; satisfaction ownership = coordinator via synthesis Assignment (recorded in ledger). AdhocTask necessity stays **open**, not answered. |
| 5 | D3 vs D7 contradict; don't flip children->cells before mutating slice proven | **Accept** | Cells are scoped-subtask-shaped => mutating => outside read-only MVP. Slices: A standalone inline read-only; B coding inline read-only with harness; C (later) inherited mutating cells/serialization/worktree/integration. Default-flip recorded as **product hypothesis to test at C**, not a change now. |
| 6 | Don't remove nested topology from Step 07 | **Accept wording** | Keep as explicit open boundary in Step 07 (approve -> resolved root, frontier.resolveRoot; sync-root -> immediate parent, sync-root.mjs:58). Defer from MVP; split implementation item. Not on MVP critical path. |
| 7 | ">=3 repeats" arbitrary | **Accept** | Trigger for declared protocol graph = quality criterion: legal transitions, communication edges, budgets, or auditability no longer safely expressible as inline contracts + dependencies. Repetition is only a signal to re-check. |
| 8 | Phase 0 ADR extraction violates governance | **Accept** | ADR only after user locks decisions. Commit-doc-diff moved out of roadmap to hygiene note (25 files, +820 lines uncommitted; user's call). |

Not disputed by review, kept: D1 inline provenance discriminator; D3 mutating inline fail-closed; D6 TaskCandidate never persisted; D11 no AgentMessage; D12 bounds on manifest; D13 `.fgos/assignments/` canonical, mission-lite copies -> refs; D14 driver reads RunResult refs.

## Revised MVP

Proof 1 — standalone, one-shot, inline, read-only. No Session/Task/Work/Stage.
  buildAssignment({provenance:{kind:'inline', contract, caller}}) -> executeAssignment -> RunResult.
  Case: one design-review question to a reviewer role. Assert: no coding stage referenced anywhere in Assignment/Run/DispatchPlan.

Proof 2 — coding-domain, one-shot or bounded consult, inline, read-only, workId set.
  Same buildAssignment/executeAssignment/ladder code paths. Harness seam = ONE pure function
  `enrichAndValidateContract(contract, {domain, work})` in domains/coding: adds contextRefs (CONTEXT.md/plan.md),
  allowed-scope constraint, coding evidence rule (read-only -> `reported` needs agent-report artifact), role->tier policy.
  Research consumer runs generic validator only. Assert: identical runtime records shape; harness can reject; harness cannot bypass dispatch.
  Case: validate-plan-equivalent reviewer consult expressed inline against a real Work.

Exit for MVP: both proofs recorded in verification/ with Assignment/Run/RunResult files; mission-lite migrated off `stage:'planning'`;
negative tests: inline mutating rejected; missing evidence.required rejected; undeclared declared-op still rejected; coordinationId without manifest rejected.

## After MVP, in order
1. Multi-step: ledger (`coordinationId` manifest + events.jsonl, create-before-first) for budget/bounds/recovery/synthesis. Consumer: fgOS design-review fan-out (3 reviewers + synthesis).
2. Assignment dependency graph vs AdhocTask — decide with multi-step evidence.
3. Slice C: inherited mutating cells, serialization, ephemeral worktree, integration; then children->cells default hypothesis; then child-Work materialization + nested topology boundary.
4. Step 08 protocols as skills emitting inline contracts; declared graph only on quality-criterion trigger.

## Decisions for user to lock (dependency order)
1. Assignment provenance discriminator declared|inline; stamped `mutation` + `evidence.required` on snapshot.
2. Inline mutating fail-closed in MVP.
3. Harness seam = single pure enrich/validate function; no plugin SDK.
4. coordinationId create-before-first; no adoption.
5. Scope: nested topology + promotion + cells deferred but listed open in Step 07.
Then: extract to ADR per documentation-governance.md.

## Hygiene note (outside roadmap)
Working tree has 25 modified doc files (+820/-144), uncommitted. Risk of loss; user decides commit granularity.

## Unresolved
- Budget enforceable in MVP likely only timeoutMs + maxRuns; token accounting per executor unknown.
- CLI door for inline: new verb vs flag on existing dispatch CLI.
- `assignment.workId === null` currently implies read-only (assignment.mjs:367) — inline path must stamp mutation explicitly rather than inherit this heuristic.

## Appendix — Decisions restated (Chốt gì / Hiện tại / Sau khi chốt / Vì sao / Không bao gồm)

Q1 Provenance + stamp. Chốt: Assignment.provenance.kind = declared|inline; stamp `mutation`, `evidence.required` at build.
  Hiện tại: no provenance; mutation derived from op/role Set (assignment.mjs:352,367); evidence req = per-op branches (operation-choice.mjs:1760,1859,1924-1933).
  Sau: declared path validates as before then stamps; inline validates contract then stamps; ladder reads assignment.evidence.required. No TaskSpec parsing.
  Vì sao: the single gap; ladder keyed by op cannot serve op-less inline. Không bao gồm: full inline schema; any change to declared behavior.
Q2 Inline read-only only. Chốt: inline mutation:'mutating' or missing -> reject at build.
  Hiện tại: workId===null implies read-only (assignment.mjs:367) — inline must not inherit this.
  Vì sao: smallest slice detaching Stage from dispatch without Git/worktree risk. Không bao gồm: cells, inline scoped-subtask, promotion.
Q3 Harness = one pure function. Chốt: enrichAndValidateContract(contract,{domain,work}) in domains/coding, called after generic validator, before build; may reject, may not dispatch.
  Vì sao: smallest testable seam proving V-012 on two consumers; matches repo PURE convention. Không bao gồm: harness registry, lifecycle hooks, research harness.
Q4 Ledger create-before-first, no adoption. Chốt: caller-supplied coordinationId; manifest must pre-exist else reject; one-shot needs none; growth = new coordination referencing prior assignmentId via contextRefs.
  Hiện tại: mission-lite copies Assignments into .fgos/missions/ (second truth).
  Sau: manifest holds aggregate bounds + provenance root only; refs into .fgos/assignments/; recovery = replay. Not implemented in MVP; shape locked so proofs don't build against it.
Q5 Scope cuts kept open in Step 07: nested topology (defer until child-Work/isolated mutation), promotion (after mutating cells), cells + default flip (slice C; flip = hypothesis). Step 08: AgentMessage no; declared graph only on quality-criterion trigger.
Order: Q1 -> Q2 -> Q3 -> Q4 -> Q5. MVP = Proof 1 + Proof 2 (Q1–Q3 implemented, Q4 shape locked, Q5 recorded). ADR extraction only after user locks.

## Revision 2 — after second review round (all 4 points accepted)

R1 Inline must not bypass declared ops. Accept + sharpen into mechanical invariant:
  - Proof 2 renamed: "read-only coding consult supporting a planning Work" (not "validate-plan-equivalent").
  - Rule: when Work has declared Workflow/Stage, inline only for bounded supporting consult/review; if semantic action is a declared Stage Operation, declared path is mandatory.
  - Enforcement (not prose): RunResult of an inline Assignment attached to a Work is NON-DRIVING evidence — operation-choice never interprets it as a stage verdict; only declared-op RunResults feed driver decisions. Inline-on-Work contract must carry `supports: <declared operation id>`; harness rejects if that op is not legal in the Work's current stage.
R2 coordinationId out of MVP entirely. Accept: MVP inline schema has no coordinationId; unknown fields rejected (free negative test). Multi-step slice adds: if coordinationId present, manifest must pre-exist; no adoption; no ownership change of prior Assignments.
R3 "never" -> "not in MVP". Accept: TaskCandidate = ephemeral planning IR in MVP; persistence revisited only if recovery/provenance proves Assignment/Session records cannot express a needed invariant. AgentMessage: no first-class record in MVP, not permanent negation.
R4 Stamp authority. Accept: provenance carries {kind, contractPolicyVersion, normalizerVersion, validator provenance (generic + harness id/version)}.
  declared: Stage Operation legality (as today) -> normalizer stamps mutation/evidence snapshot -> immutable Assignment.
  inline:   generic validator -> optional coding enrichAndValidateContract -> normalizer stamps -> immutable Assignment.
  role->tier from harness = policy hint written into existing `policy` field (same as op.policy + caller override today); compileDispatchPlan remains the sole chooser of executor/provider/tier.

## Final decision list to lock (dependency order)
Q1 Provenance {kind, versions, validator} + normalizer-stamped `mutation`/`evidence.required`; ladder reads Assignment fields. Declared behavior unchanged.
Q2 Inline mutating or missing mutation -> reject. Inline schema in MVP has no coordinationId; unknown fields rejected.
Q3 Harness = one pure enrichAndValidateContract; writes only contextRefs/constraints/evidence rule/policy hints; may reject; cannot dispatch. Inline-on-Work: `supports` declared op, must be legal in current stage, result is non-driving evidence.
Q4 (shape only, post-MVP) Ledger create-before-first, references canonical `.fgos/assignments/`, no adoption.
Q5 Deferred but open in Step 07: nested topology, promotion, cells/default-flip hypothesis, AdhocTask necessity, TaskCandidate persistence, AgentMessage, declared protocol graph (quality-criterion trigger).
MVP = Proof 1 (standalone inline read-only) + Proof 2 (read-only coding consult supporting a planning Work). Then ADR extraction per governance.

## Revision 3 — budget, evidence vocabulary, read-only heuristic, mission-lite

Q4 Budget in MVP. Accept with tighter wording: MVP can enforce `timeoutMs` and `maxRuns` only if enforcement happens before a Run starts and treats `maxRuns` as a hard per-Assignment cap including the first run. `maxTokens` is telemetry when an executor reports it; it is not a hard budget in MVP and must not be used for pass/fail, retry, or policy decisions. If an inline contract supplies unsupported hard budget fields, the MVP validator should reject them or mark them explicitly advisory, not silently pretend to enforce them.

Q5 `evidence.required` vocabulary. Accept: MVP requirement vocabulary is `reported | verified`. `reported` means the worker must return the expected structured report/artifact and claim-to-evidence links required by the contract; it is not "exit zero" and not bare self-attestation. `verified` means independently checkable evidence appropriate to the domain rule. `inferred`, `no-evidence`, weak support, or failed verification are outcomes/classifications, not requested requirement levels.

Q6 `workId === null => read-only` heuristic. Keep it for legacy declared path only for backward compatibility with current mission-lite/tests. Inline must ignore the heuristic and require an explicit stamped `mutation`; missing mutation fails closed. Desired implementation rule:
  inline provenance -> `assignment.mutation === 'read-only'` is required in MVP;
  declared provenance -> current op/role/workId/missionId heuristic remains until declared normalizer migration.
After mission-lite and declared callers can all rely on stamped mutation, remove the heuristic as a separate cleanup.

Q7 mission-lite in MVP. Direction accepted, but "only change one place" is too narrow. The exit criterion is still `mission-lite` off `stage:'planning'`, but the implementation likely touches:
  createMissionAssignment: create an inline read-only contract instead of a fake planning-stage declared Assignment;
  buildAssignment: support inline provenance without declared Stage/TaskSpec lookup;
  executeAssignment/legality validation: branch on declared vs inline provenance and reject inline mutation;
  read-only classification: use explicit inline mutation, not `workId:null`;
  result/assignment lookup: avoid treating mission-local copies as a second source of truth where the canonical `.fgos/assignments/` record exists;
  tests: assert no Stage/TaskSpec in standalone inline records, existing mission storage remains compatibility/index data, and Run/RunResult evidence remains canonical.

Recommendation: keep `.fgos/missions/` storage during MVP only as mission/thread/index compatibility, but make canonical Assignment/Run/RunResult authority live under `.fgos/assignments/`. If that is too invasive for the first proof, prove standalone inline through a narrow one-shot CLI/API first, then migrate mission-lite as the explicit MVP exit criterion rather than claiming it is a one-line change.

## Revision 3 — user decisions + gap scan (2026-08-31 16:20)

User locked: A1 flag on dispatch CLI (`--contract`); A2 Proof 2 on throwaway Work; A3 commit doc diff; B4 budget = timeoutMs+maxRuns (tokens recorded, not enforced); B5 `reported|verified`.
Mission-lite verified: unit tests only (6), no CLI exposure, no `.fgos/missions` on disk, defer/revert history. Heuristic `missionId || workId===null => read-only` leaks at assignment.mjs:367 and assignment-runner.mjs:480.
  B6' delete heuristic; explicit `mutation` stamp checked once before executeAssignment.
  B7' default DELETE mission-lite + missionId plumbing; port 4 one-shot tests as Proof 1 exit tests; keep 2 multi-step tests as pending spec. Reversible via git. User veto pending.
Cell 6.7 gaps: 7 real (doc's "9" = test-fail count). Intersection with Q1 refactor:
  BEFORE (same PR, first commits): G1 layering import in executeAssignment; G6 gitBefore/gitAfter post-crash timing.
  MERGE into Q1: G3 hasDirtyBeforeMutation hardcoded false (findLatestAssignmentRunResult); G5 validate-plan verdictPayload special-case -> recommend "intentional", encode as contract `resultKind` instead of op-id switch.
  SEPARATE: G4 branchHeadAtReturn verify-skip on merge (security-relevant, 2 e2e fails) — own item, prioritize before/alongside MVP; G2 = 4 plan.test failures, own item before slice C; G7 flake ignore.
Remaining questions: (1) confirm G5 intentional + declarative encoding; (2) confirm mission-lite deletion.
Next: commit doc diff -> ADR-006/007/008 for Q1–Q3 -> Step 07 checkpoint for Q4/Q5/G4 -> plan `step07-inline-assignment-mvp` (P1 G1+G6; P2 Q1+G3+G5+delete mission-lite; P3 Q2/Q3 harness + Proof 1/2 + verification).

## Revision 4 — RETRACTION: mission-lite is KEPT (2026-08-31 16:30)
User clarified "no backward compat" meant "make it correct", not delete. Mission-lite = brainstorm/debate capability = natural standalone consumer for V-012. B7' (delete) withdrawn.
Mission-lite migration scope (reviewer correct, not "one change"): (1) createMissionAssignment -> inline contract, no stage; (2) read-only classification -> explicit mutation stamp; (3) storage stops copying assignment/result JSON into .fgos/missions/, holds refs to canonical .fgos/assignments/; (4) tests: 4 one-shot -> Proof 1 exit tests; 2 debate/synthesis -> first consumer of multi-step slice. `.fgos/missions/<id>/{mission.json,thread.jsonl}` = prototype of Q4 ledger; becomes the ledger in multi-step slice (no missionId rename in MVP).
Heuristic `missionId || workId===null => read-only` (assignment.mjs:367, assignment-runner.mjs:480): only caller with workId:null is mission-lite; after migration the clause is dead on declared path. Advisor: remove in same PR, keep READ_ONLY_ROLES/KNOWN_MUTATING_OPS as declared mapping, add negative test (declared op, workId:null, mutating -> rejected by stamp). Reviewer prefers keeping clause for declared legacy; difference is only whether a dead loosening clause remains.
Agreed with reviewer verbatim: budget timeoutMs+maxRuns (maxTokens telemetry only); evidence.required reported|verified; inline mutation mandatory, missing/mutating -> reject.
Remaining: G5 confirmation only.

## G5 analysis (2026-08-31 16:35) — reframed from "intentional?" to real gap
Observed: reviewer READY -> canAdvanceEdge (operation-choice:1640) -> verdictPayload=undefined (2068) -> loop.mjs:1530 reads item.verdictPayload/callerVerdict (no writer in src) -> resolvePlan(runner, undefined) -> tiny/small skip-advance OK; split-children plan -> "MISSING BOTH" runner no-op, item stuck at planning. Cell 6.3 smoke used tiny-mode plan, so gap not exposed. Compat-mode skill passes plan.md JSON block via `fgos plan --verdict decompose --children` (validating SKILL.md:165); Assignment path has no driver-side equivalent.
Two verdict kinds conflated: gate verdict (READY vocab, reviewer-owned) vs plan verdict (pass-through/decompose/need-human, plan.md-owned).
Options: (a) reviewer returns planVerdict — rejected (mixes authority, reviewer could alter children, violates team-comm "verdict artifacts only"); (b) driver derives deterministically from plan.md via pure `planVerdictFromPlanMd()` in intake/ on READY — RECOMMENDED; (c) status quo — rejected.
Q1 encoding: op-table/contract `resultKind: 'gate-verdict'` + `onAdvance: 'derive-plan-verdict-from-plan-md'`; inline advisory consult has resultKind 'advisory', no onAdvance (= Q3 non-driving rule).
Cleanup: remove dead reads loop.mjs:1530/1539. Required new test: READY + split-children plan on Assignment path materializes children and moves root to executing.
Schedule: derive function in P1 (independent, next to G2); resultKind encoding in P2 with Q1.
