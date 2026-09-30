# Reviewer report — cell P02.1 (driver authorization: schema + event + gate)

Track: `step-09-group-thinking-mvp1-mvp2`
Reviewer: `reviewer-p02-1` (independent; did not see the Doer's reasoning
beyond the written trace)
Date: 2026-09-03
Full review written into
`docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/P02.1.md`
§ Review.

## Verdict

**APPROVE WITH CONCERNS.** R1-R4 implement the accepted contract text
exactly — no unaccepted superset behavior, no silently dropped requirement.
Two MEDIUM findings, both evidence/reachability rather than defects; no HIGH.

## Findings

| ID | Severity | Summary |
|---|---|---|
| MED-1 | MEDIUM | The `(nodeId, operationId, targetActorId)` triple is under-tested. Mutation sweep: dropping ANY single component of the match key leaves all 16 new tests green; only the degenerate actor-only shape is caught (15/16). The R4 Proof Matrix's "Proven by" claim is not supported. Implementation is correct; evidence is not. |
| MED-2 | MEDIUM | `nodeId` validates but never selects. `resolveDeclaredOperationActor` returns the first graph-order match for an actor, so the contract-blessed "same operation id, `required` at one graph position and `driver-authorized` at another" case is unreachable at runtime when both positions bind the same actor — the second binding's activation is dead and `authorizeDeclaredOperation({nodeId})` throws a misleading error. Pre-dates this cell (Phase 04 R5), not a gate bypass. |
| LOW-1 | LOW | `replaySession` does not fail closed on two `assignment-created` events consuming one `authorizationId` (demonstrated empirically). Asymmetric with the lock-held write-time invariant and with every other cross-event check in replay. Not reachable via the normal dispatch path — the pre-lock gate already refuses. |
| LOW-2 | LOW | The gate's refusal message does not surface `ignoredAuthorizations`, the only observability cost of the endorsed "ignored" reading. |
| LOW-3 | LOW (note) | `store.mjs`'s `authorizeOperation` has no binding-existence check by design; documented in-code, inert if misused. No action. |

## Ruling on the flagged interpretation call

**"Ignored" is correct — endorsed, no change requested.** The contract says
"invalid/ignored" and requires only that such a record can never authorize a
dispatch; `replay.mjs` guarantees that by construction (excluded from
`authorizations`, the only list the gate reads) while keeping it observable on
`ignoredAuthorizations`. A throw would render an already-terminal session
permanently unreadable via a function on every dispatch/resume/inspection read
path. The genuinely dangerous combination — an `assignment-created` naming a
post-terminal authorization — already throws `dangling-ref`, so nothing unsafe
is masked. Residual is observability only (LOW-2).

## What was verified independently, not accepted from the trace

- **Atomicity (Recovery Rule point 5) — genuine, same on-disk mutex.**
  `withEventsLock` derives its lock from `path.dirname(eventsPath)`, so
  `authorizeOperation` (`store.mjs:722`), `createSessionAssignment`
  (`:510`) and `transitionSessionStatus` (`:1047`) all serialize on
  `<sessionDir>/events.lock`. The check-then-act race was re-derived from
  source; the discriminating test at
  `coordination-driver-authorization.test.mjs:425` does discriminate.
- **R3 byte-identity — by code path, not test outcome.** All three
  pre-existing callers of `createAndExecuteSessionTask`
  (`session-engine.mjs:450`, `:684`, `:1649`) pass no
  `authorizationProvenance`, so `store.mjs:359` spreads `{}`.
- **Non-regression — structural, not empirical.** The gate sits behind a
  single `if (activationModeOf(binding) === 'driver-authorized')`; no shipped
  fixture declares `activation`.
- **Scope — clean.** Empty `git diff --stat` on `core/**`,
  `src/runner/dispatch/**`, `cohort-planner.mjs`, and the contract docs.
- **Flaky-test claim — re-run, not trusted.** `dispatch.test.mjs`
  "idleTimeoutMs kills a worker that has gone silent" → 3/3 pass in isolation;
  that file imports nothing from `src/runner/coordination/**` and shares no
  lock path.
- **Suites.** Focused 316/316. Full suite run twice: 5069 pass / 8 fail, then
  5070 pass / **7 fail** — and the seven are baseline #1-#7 exactly, by name
  (baseline #8, the live herdr-spawn timeout, passed that run). The failure set
  is a strict subset of the recorded baseline; no new failure.

All probing (two empirical probes, one four-way mutation sweep) ran in
isolated copies under the scratchpad. `git diff --stat` on
`session-engine.mjs` re-verified at 180 insertions / 6 deletions afterwards;
no file under review was modified.

## Recommendation

Close the cell after MED-1 (two fixture additions plus two assertions — small,
and it is the cell's headline safety property). Record MED-2 and LOW-1 in
Gaps for P02.2 / Phase 03 rather than fixing here, since MED-2's fix touches
`dispatchDeclaredOperation`'s shared signature.
