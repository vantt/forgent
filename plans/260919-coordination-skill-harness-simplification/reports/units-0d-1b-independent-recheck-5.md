# Units 0D–1B Independent Recheck 5

Date: 2026-09-21
Reviewer mode: independent, review-only
Final verdict: **BLOCKED**

## 1. Current HEAD, dirty state, and fingerprint

- Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-simplification`
- Branch: `coordination-skill-harness-simplification`
- HEAD: `a74a265ab0e06983e2beb565edbce4318e8537d7`
- No `.fgos/main-checkout.lock` existed at baseline.
- The tree contained the expected tracked repair edits plus untracked plan, source, and test files. Nothing was staged, reset, cleaned, deleted, or committed by this review.
- Baseline repair fingerprint after the pre-existing test process exited: `fcfbe5e8e53194f45028f59b1cf5ee589a111908aee11ed1b8b317c940c560c3`.
- Final repair fingerprint: `6e6621884e3c83fa4f14e3e0dedd5b206a4e0ab3b61e37552beba456a6ec436f`.
- During review, another process changed `src/state/events.mjs` at 13:14, `src/runner/coordination/store.mjs` at 13:17, and `src/runner/coordination/session-engine.mjs` at 13:18. A separate `npm test` then ran in this worktree from 13:19. The final fingerprint became stable only after that process exited.

This violates the required stable-snapshot condition. The implementation proposed for review cannot be identified as one immutable source/test state, so this recheck fails closed.

## 2. Files reviewed

The required reading set was consulted, including the coordination portal/spec/vision, CoordinationSession and FlowDefinition contracts, track plan, Phase 00/02 files, readiness audit, and Units 0D/1A/1B reports/rechecks.

Source and tests inspected before snapshot invalidation included:

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
- focused Unit 0D/1A/1B and compatibility test sources

Existing reviewer reports, including rechecks 3 and 4, were preserved. This report is additive.

## 3. Impact and blast radius

GitNexus reported its main index current at commit `a74a265`, but only branch `main` was indexed. The dirty worktree branch was not indexed, and `detect-changes --scope compare --base-ref main --branch coordination-skill-harness-simplification` refused because that branch index does not exist. Therefore current repair impact is **stale/partial**, not a current clean impact result.

Upstream queries were attempted for all required symbols. Indexed queries reported CRITICAL surfaces for shared legality and validation paths, including affected production flows through `executeCoordinationActionUseCase`, `closeCoordinationUseCase`, setup/dispatch inspection, and recovery. Output was truncated/ambiguous for several new dirty-worktree symbols, so no zero-impact conclusion is claimed. This is especially material because the touched validation and coordination surfaces fan into many production flows.

## 4. Unit-by-unit verdict

| Unit | Verdict | Reason |
|---|---|---|
| 0D | **blocked** | Some parity tests passed before invalidation, but kernel/store/events source changed during the same review. |
| 1A | **blocked** | Fan-out/SHA/identity repairs were observed, but the reviewed source was superseded while the review was running. |
| 1B | **blocked** | The pre-invalidation source still used a mutation switch calling `*Locked` mutators directly, and focused execution exposed nested `events.lock` timeouts; the relevant engine/store/events files then changed, preventing a stable conclusion. |

## 5. Finding matrix

### B-01

- ID: B-01
- Severity: CRITICAL
- Category: checkout/evidence stability
- Affected unit: 0D, 1A, 1B
- Affected contract: stable review baseline; source and executable proof authority
- Source evidence: fingerprint changed from `fcfbe5e8...60c3` to `6e662188...436f`; mtimes show in-review writes to `events.mjs`, `store.mjs`, and `session-engine.mjs`.
- Test evidence: an external `npm test` ran concurrently in the same worktree; the reviewer focused suite was consequently not an isolated execution.
- Why current proof is insufficient: source, lock implementation, and kernel behavior changed after inspection and while tests were running, so source observations and test outcomes do not describe one implementation snapshot.
- Required fix: freeze the worktree, ensure no writer/test process is active, publish one final fingerprint, and rerun the complete independent review against that exact fingerprint.
- Blocks Phase 2 implementation: yes

### P-01 (provisional observation, not adjudicated against the final fingerprint)

- ID: P-01
- Severity: CRITICAL
- Category: request-composer architecture / nested-lock risk
- Affected unit: 1B
- Affected contract: semantic commands compose requests over existing use cases; atomic mutation uses one lock-aware production seam
- Source evidence: before snapshot invalidation, `src/verbs/coordination/actions.mjs` imported and directly called `closeSessionByQuorumLocked`, `dispatchDeclaredOperationLocked`, `dispatchResearchFanOutLocked`, `authorizeDeclaredOperationLocked`, `linkSessionContributionLocked`, `recordDriverDispositionLocked`, and `recordHumanTurnLocked` from its own action-kind switch. It validated composed objects but did not delegate mutation to `runCoordinationUseCase`/`closeCoordinationUseCase`.
- Test evidence: the focused run reported repeated `appendEvent: timed out acquiring events.lock` failures from `dispatchDeclaredOperationLocked -> createAndExecuteSessionTask -> linkResult -> withEventsLock`; the real two-process stale-action test also produced `lock-timeout` instead of one successful writer.
- Why current proof is insufficient: these observations strongly reproduce the earlier second-engine/nested-lock blocker, but the exact engine/store/events files changed immediately afterward. They cannot be promoted to a final semantic finding against the final fingerprint without a fresh stable run.
- Required fix: on a frozen snapshot, prove that semantic actions delegate to the existing validated production use cases through a genuinely lock-aware shared kernel, with no direct parallel mutation engine and no nested non-reentrant lock.
- Blocks Phase 2 implementation: yes

## 6. Tests run and exact results

Focused command was started exactly as required. It was interrupted after the snapshot became invalid and the stale-action test remained pending.

- Reported totals at interruption: 121 tests; 111 passed; 9 failed; 1 cancelled.
- Failures included:
  - architecture manifest missing the four new `.mjs` files;
  - upward layer import violation;
  - three coordination CLI flows timing out on `events.lock`;
  - one two-OS-process stale-action proof returning `lock-timeout` rather than a winner;
  - three chain tests timing out on `events.lock`;
  - stale-action test file left with a pending promise.
- The legality/action focused assertions that completed included real parity fixtures, fan-out single-action/request validation, human-turn SHA path, close identity shape, schema 1/2/3 checks, and several idempotency/authority checks.
- Repair-specific suites were not run separately because the focused gate did not pass and the checkout was changing.
- `npm test` was not run by this reviewer because the focused gate did not pass. A different process ran it concurrently, but its output is not accepted as independent evidence.
- `git diff --check` completed with no whitespace errors before report creation.

## 7. Evidence quality assessment

Evidence quality is insufficient for approval. Source inspection found meaningful repairs, and several focused tests were mutation-sensitive and used real OS processes/production doors. However, concurrent source writes destroyed traceability between inspected code and executed proof. The external full-suite run also contaminated timing and lock evidence. No implementer or earlier reviewer narration is treated as authoritative over this state.

## 8. Phase 2 design ready

**Yes**, unchanged from the prior audit. The design contract is sufficiently explicit.

## 9. Phase 2 implementation ready

**No.** Stable evidence is absent, focused tests are red/incomplete, and the provisional Unit 1B architecture/lock observation remains unresolved on the last fully inspected snapshot.

## 10. Exact remaining gate

Provide one frozen worktree fingerprint with no active writer, then rerun:

1. source review of Units 0D/1A/1B against that fingerprint;
2. GitNexus branch-aware compare and all required upstream impacts;
3. focused and repair-specific suites with zero failures/timeouts;
4. full `npm test` only after those gates pass;
5. post-test fingerprint equality;
6. proof that action execution is a request composer over the existing use cases and does not nest a non-reentrant event lock.

## 11. Recommended next action

Stop all implementer/reviewer test and edit processes in this worktree, declare a final immutable fingerprint, and request a new independent recheck. Do not treat this BLOCKED report as a request to patch individual timeout symptoms; first settle the one production mutation architecture.

## 12. Final verdict

**BLOCKED — the checkout changed during review, so Units 0D/1A/1B cannot be conclusively accepted or rejected as one implementation snapshot. Phase 2 implementation is not ready.**
