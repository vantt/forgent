# Unit I24b — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I24b`,
worktree `.claude/worktrees/coordination-skill-harness-i24b-locked-typed-action`,
base `main@35be2c10d` (post-I24a), integrated `main@5c63ac40d`.

Completes Phase 5 work item 4: the driver-authenticated, locked/typed-action
door for specialist authorization, built on I24a's raw-door foundation.

## Implementer (sonnet, fullstack-developer)

Built the full H1/H2/M1/M2 scope from the decomposition review: `Locked`
twins of the existing store/session-engine functions (deliberately
byte-for-byte copies rather than shared code, per the plan's explicit
"never modify the existing unlocked ones" constraint); the
`specialist-authorize` CLI subverb and `specialist` action kind end to end
(composers.mjs case, actions.mjs use case, bin/fgos.mjs + command-registry.mjs
wiring, mutating-verb classification); the `specialist` action-view case in
`actions-projector.mjs` built on `evaluateSpecialistSlots`; extended that
function (M2) with authorizable/authorized/exhausted derivation; and found +
fixed a genuine pre-existing bug (M1) where `evaluateDriverAuthorizedBindings`
dropped a `maxInvocations > 1` binding from `pending` after its first
authorization, confirmed against the real `revise-synthesis` operation
before fixing. Correctly flagged (did not silently expand or silently skip)
that `run.mjs`/`composers.mjs`/`actions-projector.mjs` exceeded the plan's
literal files list but were required by its own scope prose, and that
`fgos-architecture-panel/SKILL.md`'s "not built yet" claim was now stale
but out of this unit's declared file scope. Full suite at candidate: 7862
pass, 0 fail.

## Independent test + review (round 1, opus, parallel)

Both agents confirmed lock correctness (no self-deadlock: the Locked twins
never call `withEventsLock`/`withSessionLock` themselves), CLI/subverb
wiring (`COMMAND_REGISTRY.length` unchanged, correct mutating classification),
and that the pack gate still fully refuses `specialist-authorize` (H3
untouched). They **disagreed on the severity of one real finding**:
- **HIGH-1** (both, same finding, no severity disagreement): the action
  view's `exhausted` field disagreed with the kernel's actual authorization
  rule. review-i24b rated this HIGH ("an agent that trusts the view
  abandons a slot it could legally extend"); test-i24b rated the identical
  finding LOW ("the flag misleads a driver agent but grants nothing
  illegal"). **Lead settled this directly**: read `store.mjs`'s real cap
  check and cross-checked both agents' own live probes (both independently
  confirmed re-authorizing an already-recruited actor succeeds even when
  the view claims `exhausted:true`) — sided with HIGH per the plan's own
  requirement that the action view be accurate "mechanical legality data",
  not just non-dangerous when wrong.
- **HIGH-2** (found by review-i24b; test-i24b explicitly called the
  identical code "correct, consistent with other doors" and rated it only
  an INFO-level loose test title): `specialist` was missing the
  idempotent-retry reconstruction branch every other action kind has.
  **Lead independently settled this by grep, not just re-reading the
  disagreement**: confirmed exactly 7 kind-specific branches exist in
  `action-precondition.mjs`'s reconstruction chain (`close`,
  `dispatch-operation`, `authorize-and-dispatch`, `record-disposition`,
  `link-contribution`, `record-human-turn`, `fan-out`) and `specialist` is
  the only current kind without one — confirming review-i24b's read was
  correct and test-i24b's "consistent with other doors" framing was
  precisely backwards (it is the one inconsistency, not the norm). Also
  confirmed the two tests titled "stays idempotent on retry" literally
  assert `assert.rejects(...)` on the retry, contradicting their own names.
- **MEDIUM** (review-i24b): the M1 invocation-count fix keyed by
  `(nodeId, operationId)` where the kernel actually keys by
  `(nodeId, operationId, targetActorId)`, and the fix's own new code
  comment falsely claimed the kernel defaults an absent cap to 1 (it's
  actually unbounded).
- **MEDIUM** (both): 5 stale "not built yet" doc references, now false
  since this unit's own earlier commit landed the door.
- Both independently confirmed the deliberate Locked-twin duplication is
  an accepted, plan-forced tradeoff (not a defect), recommending only a
  future follow-up unit to collapse it to the established wrap-pattern —
  correctly not blocking this unit on it.

## Fix round 1 (88691f646)

- **HIGH-1 fixed**: added the missing `specialist` branch to
  `action-precondition.mjs`'s reconstruction chain, reusing
  `deriveSpecialistAuthorizationId` (the same deterministic id I24a
  established) to find the prior event and feed the SAME generic
  canonical-payload-compare-and-idempotent-return logic every other kind
  already shares. Fixed the 2 misleadingly-titled tests to actually assert
  idempotent-return, and added a separate payload-conflict test.
- **HIGH-2 fixed** (Lead's decision applied exactly): rewrote `exhausted`
  to `recruitExhausted && distinctCount === 0` — matching the kernel's
  real behavior that any already-recruited actor can always be
  re-authorized, so a slot is truly exhausted only when `maxBindings` is
  reached with zero actors ever recruited (only reachable when
  `maxBindings <= 0`). Kernel authorization rules themselves untouched, as
  instructed. Fixed the tests that had locked in the wrong values.
- **MEDIUM fixed**: re-keyed invocation counting to
  `(nodeId, operationId, targetActorId)` and corrected the absent-cap
  default from 1 to unbounded, matching `authorizeOperationLocked` exactly.
  This surfaced (and the fixer proactively fixed, without being asked) 2
  MORE pre-existing tests relying on the same wrong default-of-1 assumption.
- **MEDIUM fixed**: all 5 stale doc references corrected, plus the
  clarifying sentence Lead requested distinguishing "the pack gate still
  refuses this step type" from "a pack-member session can still get a
  specialist authorized through the separate typed-action door" (H3's
  actual intended design, not a bypass).
- One test failure on the fixer's first full-suite run
  (`coordination-research-fan-out.test.mjs`'s R5 concurrency timing test)
  was investigated and confirmed pre-existing/unrelated by reproducing it
  against an unmodified baseline via `git stash` — not silently dismissed.

## Lead final verification and merge

Independently re-read the fix commit's diff directly for both HIGH fixes
before accepting them (not only the fixer's self-report): confirmed the new
`specialist` branch correctly reuses the shared reconciliation logic, and
confirmed the `exhausted` formula exactly matches the decision given.
Reran the 7 key suites myself: 211/211 pass, including the 2 additional
files the fixer touched beyond the original brief. Independently reran the
flagged flaky test file in isolation: 14/14 pass, consistent with the
fixer's pre-existing-flake diagnosis. Full `env -u CLAUDE_CODE_SESSION_ID
npm test` on the worktree: 7937 pass, 0 fail, exit 0.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I24b` from the
main checkout onto post-I24a `main@35be2c10d`, `ort` strategy, clean
auto-merge. `integratedSha = 5c63ac40d78ca89e9548dd422c223215f904080c`.
Reran the 5 originally-named key suites on the merged tree (120/120 pass)
to confirm the merge introduced nothing unexpected.

## Process note

This unit is the clearest example yet in this track of Lead's independent
re-verification catching something neither red-team agent's own self-report
would have surfaced on its own: the two agents actively DISAGREED with each
other on HIGH-2's status (one called the exact same code "correct,
consistent with other doors", the other flagged it as a contract
violation), and only Lead's own direct grep across all 7 existing
`precondition.kind === '...'` branches — not re-reading either report more
carefully — settled which agent was right. Trusting either report alone,
or averaging the two, would have been wrong; only checking the actual code
resolved it.
