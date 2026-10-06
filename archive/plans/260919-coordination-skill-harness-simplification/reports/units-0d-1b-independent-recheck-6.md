# Units 0D–1B Independent Recheck 6

Date: 2026-09-21
Mode: independent review-only
Final verdict: **BLOCKED**

## 1. Current HEAD, dirty state, and fingerprint

- Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-simplification`
- Branch: `coordination-skill-harness-simplification`
- HEAD: `a74a265ab0e06983e2beb565edbce4318e8537d7`
- No `.fgos/main-checkout.lock` existed at baseline.
- Repair fingerprint before and after review-owned commands: `963983dba7fca68a05bae3bb3052741540d446b6ee7a88f105dafce99e73967e`.
- Dirty paths were not staged, reset, cleaned, deleted, or committed.
- Another full repository test process started in this same worktree at 13:59 while the independent full suite was running. It created a transient plugin mirror `.tmp` file and competed for coordination locks. It exited before this report was written.

The source fingerprint stayed stable, but executable proof was not isolated. Under the review stop rule, the final verdict must be BLOCKED rather than an approval/rejection of the whole snapshot.

## 2. Files reviewed

Required coordination specs/contracts, the track plan and phase files, readiness audit, all Unit 0D/1A/1B reports/rechecks, and the repair source/tests were reviewed. The primary source evidence was:

- `src/runner/coordination/{legality-facts,actions-projector,action-precondition,session-engine,store}.mjs`
- `src/state/events.mjs`
- `src/verbs/coordination/{actions,run,close,schema,show}.mjs`
- `docs/architecture-manifest.json`
- focused and adjacent coordination test files

All earlier reports were preserved; this is a new additive report.

## 3. GitNexus impact and index freshness

GitNexus is stale/partial for this review. The registered main index is at `a74a265`, while the main checkout had moved to `f9ba99c`; the dirty worktree branch is not separately indexed. `detect-changes --scope compare --base-ref main` reported HIGH aggregate risk, 48 files, 108 symbols, and six affected flows, including multiple `closeCoordinationUseCase` flows. These results do not represent a current clean impact graph for this dirty repair snapshot.

Required upstream symbols were queried in the prior immediately preceding recheck; the dirty-worktree/new-symbol results remained truncated or absent while indexed validation/legality surfaces reported HIGH/CRITICAL blast radius into coordination close/action, setup/dispatch inspection, and recovery flows. No current-impact claim is made until the branch is indexed at its exact fingerprint.

## 4. Unit-by-unit verdict

| Unit | Verdict | Evidence |
|---|---|---|
| 0D | **passed** | Pure shared facts, real-kernel visibility/close parity fixtures, mutation-sensitive negative checks, legacy and aggregation compatibility all passed. |
| 1A | **passed** | Deterministic projection, fan-out single descriptor, contribution/human-turn/close request validation, exact identity/SHA behavior, and schema compatibility passed. |
| 1B | **repairing** | Lock timeout seen in the previous recheck was repaired in isolated focused execution, but the action execution door still owns a parallel mutation switch instead of composing into existing use cases. Full-suite concurrency proof also failed under a competing suite. |

## 5. Finding matrix

### F-R01

- ID: F-R01
- Severity: CRITICAL
- Category: architectural authority / second mutation engine
- Affected unit: 1B
- Affected contract: `plan.md` locked rule that semantic commands are request composers over existing use cases, never a second engine or state store
- Source evidence: `src/verbs/coordination/actions.mjs` imports `closeSessionByQuorumLocked`, `dispatchDeclaredOperationLocked`, `dispatchResearchFanOutLocked`, `authorizeDeclaredOperationLocked`, `linkSessionContributionLocked`, `recordDriverDispositionLocked`, and `recordHumanTurnLocked`. `executeCoordinationActionUseCase` implements its own action-kind switch and calls those mutators directly. Although it constructs and validates raw request-shaped objects for some actions, it does not call `runCoordinationUseCase` or `closeCoordinationUseCase`; it independently translates, sequences, mutates, and formats results.
- Test evidence: focused tests prove this parallel door executes successfully, but no test proves delegation to the existing use-case function identity/path. The production integration tests explicitly exercise `executeCoordinationActionUseCase`'s own mutator switch.
- Why current proof is insufficient: request validation before direct mutation does not make the caller a request composer. Authorization+dispatch sequencing, fan-out dispatch, contribution, disposition, human turn, and close remain duplicated orchestration paths whose behavior can drift from `run.mjs`/`close.mjs`.
- Required fix: factor a single lock-aware existing production use-case kernel and have both raw run/close and semantic composers invoke it, or compose validated requests into the existing use cases without nested lock acquisition. `actions.mjs` must not own a second mutation switch over low-level `*Locked` doors.
- Blocks Phase 2 implementation: yes

### F-R02

- ID: F-R02
- Severity: HIGH
- Category: full-suite concurrency proof
- Affected unit: 1B
- Affected contract: real two-OS-process stale-action proof; full suite approval gate
- Source evidence: the losing process can exhaust the lock wait budget while the winner holds the action/session lock through a slow production callback.
- Test evidence: full `npm test` failed `concurrent two-OS-process race: exactly one process succeeds and second is refused with stale-action-key`; actual loser outcome was `lock-timeout`. The same test passed in the isolated focused run, showing load/timing sensitivity rather than a deterministic stale refusal under repository-suite conditions.
- Why current proof is insufficient: approval requires the loser to reload after the winner and refuse stale before mutation. A timeout is not the required stale-action result and leaves the proof dependent on scheduling/load.
- Required fix: make the real production race deterministically reach the post-winner stale check within the supported lock contract, or establish an explicit tested retry path that converts bounded contention into the required stale refusal without duplicate mutation.
- Blocks Phase 2 implementation: yes

### B-01

- ID: B-01
- Severity: HIGH
- Category: evidence contamination
- Affected unit: 1B and repository verification gate
- Affected contract: stable, isolated executable proof
- Source evidence: a second full test process was active in the same worktree during the independent full suite.
- Test evidence: the concurrent process created `plugins/fgOS/skills/_shared/catchup-self-recovery.md.tmp-*`, causing the independent mirror test to fail; the temporary file disappeared afterward. It also increased action race durations and lock contention.
- Why current proof is insufficient: the full-suite result cannot be attributed solely to the reviewed invocation.
- Required fix: reserve the worktree for one reviewer/test process, verify no other writer, then rerun full `npm test` and compare the fingerprint afterward.
- Blocks Phase 2 implementation: yes

## 6. Tests run and exact results

- Required focused suite: **128 passed, 0 failed**, duration 228.85 s.
- Repair-specific/compatibility suite: **220 passed, 0 failed**, duration 36.79 s.
- Full `npm test`: **7,157 total; 7,146 passed; 2 failed; 9 skipped**, duration 648.77 s.
  - Real two-process stale race failed: expected `stale-action-key`, received `lock-timeout`.
  - Skill mirror failed on a transient `.tmp` file created by the concurrent external suite.
- `git diff --check`: clean before report creation.

The focused stale-action tests use real OS processes and the production action door. The negative parity tests are mutation-sensitive. Their limitation is architectural: they prove the new parallel door behaves internally, not that it delegates to the existing use cases.

## 7. Evidence quality assessment

Unit 0D and 1A evidence is strong: real fixtures, kernel comparisons, negative perturbations, request validators, and compatibility tests passed. Unit 1B evidence is mixed: authority, action-key binding, no-sidecar reconstruction, crash retry, and isolated two-process tests are substantial, but they validate a contract-forbidden parallel mutation path. The full-suite run was contaminated by another process and exposed a load-sensitive lock-timeout.

The latest discharge report's claim that all findings are closed is contradicted by current source: it explicitly describes direct `*Locked` integration as the resolution even though the plan requires composition over existing use cases.

## 8. Phase 2 design ready

**Yes.** The design contract is explicit enough to judge this implementation.

## 9. Phase 2 implementation ready

**No.** A CRITICAL architectural-authority blocker remains, full-suite proof is red, and the full run was not isolated.

## 10. Exact remaining gate

1. Remove `actions.mjs` as an independent mutation orchestrator; route semantic requests through one shared existing run/close use-case kernel.
2. Preserve one atomic lock boundary without nested non-reentrant acquisition.
3. Rerun the real two-process production proof until the loser deterministically reaches `stale-action-key`, not `lock-timeout`.
4. Rerun focused, repair-specific, and full suites in an exclusively held worktree; all must pass and the fingerprint must remain unchanged.
5. Refresh/index GitNexus for the exact branch snapshot and rerun compare/upstream impacts.

## 11. Recommended next action

Perform one architectural repair, not another timeout patch: extract/reuse the lock-aware production request execution kernel currently owned by `run.mjs`/`close.mjs`, then reduce `executeCoordinationActionUseCase` to descriptor validation plus request composition and delegation. Reserve the worktree while producing proof.

## 12. Final verdict

**BLOCKED — executable evidence was contaminated by another concurrent full-suite process. Independently, the reviewed stable source still contains CRITICAL blocker F-R01, so it could not receive APPROVE even after an isolated rerun.**
