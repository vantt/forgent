# Units 0D, 1A, 1B independent recheck 7

Date: 2026-09-21 (Asia/Ho_Chi_Minh)
Reviewer posture: independent, review-only
Final verdict: **REQUEST CHANGES**

## 1. Current HEAD, dirty state, and fingerprint

- Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-simplification`
- Branch: `coordination-skill-harness-simplification`
- HEAD: `852171c266e7c7d4a3f6568a7f9a2b565e90246c`
- The checkout is intentionally dirty: 14 tracked files are modified and the plan, three coordination runtime modules, one coordination verb, and three focused test files are untracked.
- No staged path was observed. No `.fgos/main-checkout.lock` was present.
- A separate full-test process existed in another worktree. `lsof +D` found no foreign process holding a file in this target worktree.
- Review-start and pre-report content fingerprint were identical: `71ae60c3084339738eb3d7977cc315e0628da4651fca402a2933472a0241352b`. The status-shape hash before this additive report was `0846aa243b3c197b778299254779f829ae3edc60c7144c89077ed5f33127c72d`.
- Source/test mtimes in the repair scope remained unchanged during the review. The checkout was stable enough to conclude; this is not a `BLOCKED` verdict.

## 2. Files reviewed

The prescribed reading sequence was reviewed, including `AGENTS.md`, the coordination reading map/spec/vision, the session and flow contracts, the track plan, Phase 00 and Phase 02 plans, and the Phase 02 readiness audit. All existing Unit 0D/1A/1B implementation reports and independent rechecks through recheck 6 were retained and read. The newest implementer report was `units-0d-1b-request-composer-fix.md`.

Source and executable evidence inspected included:

- `src/runner/coordination/legality-facts.mjs`
- `src/runner/coordination/actions-projector.mjs`
- `src/runner/coordination/action-precondition.mjs`
- `src/runner/coordination/session-engine.mjs`
- `src/runner/coordination/store.mjs`
- `src/state/events.mjs`
- `src/verbs/coordination/actions.mjs`
- `src/verbs/coordination/run.mjs`
- `src/verbs/coordination/close.mjs`
- `src/verbs/coordination/schema.mjs`
- `src/verbs/coordination/show.mjs`
- the focused, repair-specific, architecture, CLI, replay, fan-out, driver-authorization, and stale-action tests named below.

## 3. Impact and blast radius

GitNexus is **stale/partial**, not current authority. It reports indexed commit `a74a265` while the checkout is at `852171c`. Only `main` is indexed; the repair branch is not. Consequently `detect_changes --scope compare --base-ref main` could not produce a branch-current comparison and no current-impact claim is made.

Upstream impact was requested for all ten required symbols. The stale index produced truncated/noisy results (including implausibly broad file-import matches), so they are evidence of broad exposure only. It reported `CRITICAL` for at least `evaluateLegalityFacts`, with 317 impacted nodes, five affected processes, and production flows including `closeCoordinationUseCase` and `executeCoordinationActionUseCase`. The affected production surface confirmed by source is coordination action projection/execution, raw run, explicit close, session replay/store, show/chain, and dispatch. Because the index is stale and output was truncated, these HIGH/CRITICAL graph labels are not treated as current precise counts and are not used to waive the source finding below.

## 4. Unit-by-unit verdict

| Unit | Verdict | Basis |
| --- | --- | --- |
| 0D | passed | Pure shared legality facts, real-kernel parity fixtures, remediation/recheck, visibility and close cases passed. No second definition loader or side effect was found in the evaluator. |
| 1A | repairing | Projection and descriptor tests pass, including fan-out, contribution, human-turn hashing and explicit close. The execution side still does not consume the composed canonical raw request through the existing validated run path, so executable-action correctness is not proven by one request surface. |
| 1B | repairing | Driver checks, held-lock stale comparison, two-process races and log-derived retry tests pass. However the production action path remains a parallel mutation dispatcher inside `run.mjs`, violating the locked composer contract and leaving two implementations that can drift. |

## 5. Finding matrix

### F-R01 — semantic actions still use a second mutation engine

ID: F-R01
Severity: CRITICAL
Category: contract / authority / architectural drift
Affected unit: 1A, 1B
Affected contract: `plan.md` locked law that semantic commands are request composers over existing use cases, never a second engine or state store; requirement that a descriptor compose a current raw request, pass `validateCoordinationRequest`, and execute through the existing mutation path.
Source evidence: `executeCoordinationActionUseCase` in `src/verbs/coordination/actions.mjs:158-175` passes only `{ coordinationId, writerId }` plus `options.actionPrecondition`; it does not compose or validate a declared-protocol raw request. `executeCoordinationRunKernel` then enters an action-only switch at `src/verbs/coordination/run.mjs:380-615` and directly calls `dispatchDeclaredOperationLocked`, `authorizeDeclaredOperationLocked`, `recordDriverDispositionLocked`, `recordHumanTurnLocked`, `linkSessionContributionLocked`, and `dispatchResearchFanOutLocked`. The existing raw request implementation is a distinct loop beginning at `src/verbs/coordination/run.mjs:616`, with operation/authorize/disposition/contribution/human-turn/fan-out handling at approximately lines 733-979. Thus the previous second engine was moved from `actions.mjs` into `run.mjs`; it was not eliminated. `validateCoordinationRequest` is imported in `actions.mjs` but is unused for non-close actions.
Test evidence: focused tests pass 130/130 and repair-specific tests pass 172/172, but `test/architecture.test.mjs:500-533` checks only that `actions.mjs` lacks a `*Locked` token and that both public doors mention `executeCoordinationRunKernel`. Its deliberate defect test cannot detect an action-only low-level-mutator branch inside that kernel. The action tests separately construct examples that pass `validateCoordinationRequest`, but the production `executeCoordinationActionUseCase` does not execute those constructed requests. Production integration tests therefore prove the parallel switch works, not that actions are composers over the existing raw request path.
Why current proof is insufficient: sharing a function name is not sharing mutation semantics. Any future validation, normalization, label resolution, actor-policy, result shaping, or dispatch change must still be implemented twice. The exact drift prohibited by the locked law remains possible, while the architectural test reports a false green.
Required fix: make each non-close action compose the canonical declared-protocol request/step shape, pass it through `validateCoordinationRequest`, and execute it through the same raw-request step implementation. Extract a single per-step executor if the stale precondition must remain under the existing session lock, but both raw run and semantic action must call that same implementation. Remove the action-only mutation switch and its direct `*Locked` orchestration. Strengthen the architecture test so relocating the second engine into `run.mjs` fails; add a mutation-sensitive equivalence test showing a composed action and the corresponding validated raw request reach the same executor seam. Preserve stale-key validation and mutation under one lock without reacquiring a non-reentrant lock.
Blocks Phase 2 implementation: yes

### T-R01 — full suite is red

ID: T-R01
Severity: HIGH
Category: verification gate
Affected unit: cross-cutting readiness gate
Affected contract: approval rule requiring the full suite to pass.
Source evidence: no repair-specific source attribution is claimed for these failures; they occurred in unrelated work/merge/return/e2e areas and may reflect the current baseline or concurrent resource pressure.
Test evidence: `npm test` exited 1. Observed failures included three Iron-Law level tests, merge-next auto-sync, branch-source return retry, pull-door and branch-source PR-gate e2e tests, and ambiguous stage-decompose. The complete runner output was larger than the capture limit, so this report does not invent a total failure count.
Why current proof is insufficient: the approval rule explicitly requires a green full suite. A failing invocation cannot be replaced by the implementer report or by a run in another worktree.
Required fix: rerun the full suite on a quiet machine/worktree, retain the complete TAP summary, and either obtain green or establish/fix a reproducible pre-existing baseline failure without changing the repair contract.
Blocks Phase 2 implementation: yes

## 6. Tests run and exact results

- Required focused command: exit 0; **130 tests, 130 pass, 0 fail, 0 skipped/cancelled/todo**; duration `305783.975367 ms`.
- Repair-specific command (`coordination-driver-authorization`, both recheck suites, research fan-out, run driver steps): exit 0; **172 tests, 172 pass, 0 fail, 0 skipped/cancelled/todo**; duration `29741.091953 ms`.
- `npm test`: exit 1; red. At least the eight failures named in T-R01 were printed. The final aggregate was truncated by the execution capture, so no unsupported aggregate is reported.
- `git diff --check`: exit 0 before this report.
- No test, source, config, or prior report was edited.

## 7. Evidence quality assessment

The source evidence for F-R01 is direct and high confidence: both complete control-flow branches are present in the same file and use distinct public versus locked mutation calls. The focused concurrency/idempotency tests are real production-door tests and include real two-OS-process races; their proof is useful for lock and retry behavior. They do not prove the locked request-composer architecture because the production door under test is precisely the parallel branch in dispute. The F-R01 static guard has low discriminating power and produces a false green for the current defect. GitNexus evidence is stale/partial and is reported only as such.

## 8. Phase 2 design ready

**Yes.** The intended design remains clear: pure authoritative facts, deterministic executable descriptors, explicit close, and a stale-action precondition wrapped around the existing request/use-case mutation path.

## 9. Phase 2 implementation ready

**No.** F-R01 is an unresolved CRITICAL contract/authority blocker, and the required full suite is red.

## 10. Exact remaining gate

There must be exactly one non-close step execution implementation used by both validated raw `coordination run` requests and semantic actions. The action door must compose and validate the canonical request shape, then enter that shared executor while the stale-action lock remains authoritative through mutation. The architecture test must fail if an action-only mutation switch or direct locked-mutator orchestration is reintroduced. After that, focused, repair-specific, and full suites must all pass from the reviewed worktree with a stable fingerprint.

## 11. Recommended next action

Do not patch the current switch case-by-case. Extract the existing raw step loop into a shared validated step executor, adapt raw run to it first, then make action execution compose one canonical step and call the same executor inside `executeUnderActionPrecondition`. Keep close on the shared close kernel. Add a deliberate-defect architecture fixture that places a `*Locked` mutation switch inside `executeCoordinationRunKernel` and requires the guard to reject it.

## 12. Final verdict

**REQUEST CHANGES — Phase 2 implementation is not ready.**
