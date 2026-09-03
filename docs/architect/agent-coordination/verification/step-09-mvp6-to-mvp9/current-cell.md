# Current Cell(s): P07.3 + P08.1 (Wave 3, parallel, ISOLATED worktrees)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch both Doers in parallel, each into its OWN isolated
worktree (established pattern since Wave 2's process-deviation lesson)

Phase 06 (P06.1-P06.3) fully closed and committed. Phase 07's evaluator
(P07.1+P07.2, `src/runner/team-cognition/`) closed. This wave: wire the
evaluator into real session/FlowDefinition integration (P07.3), and start
Phase 08's contribution-lineage model (P08.1) in its own new, isolated
paths.

## CRITICAL: working roots (TWO separate isolated worktrees this wave)

- **P07.3** works ONLY in: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9-p07.3`
  (branch `step-09-mvp6-to-mvp9-p07.3`, branched from `step-09-mvp6-to-mvp9`
  tip `487771aa`).
- **P08.1** works ONLY in: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9-p08.1`
  (branch `step-09-mvp6-to-mvp9-p08.1`, same base `487771aa`).
- Neither Doer touches `/home/vantt/projects/forgentX` (main checkout) or
  the OTHER isolated worktree. Run tests from each Doer's own worktree
  root. Coordinator integrates both branches back into
  `step-09-mvp6-to-mvp9` sequentially after both close and are reviewed.
- `test/runner/coordination-static.test.mjs` false-fails from any
  worktree-path checkout (documented in this file's history) — exclude it
  from your own glob; if you need that one file, run it from the main
  checkout.

---

## P07.3 — FlowDefinition And Session Integration (Phase 07, MVP7)

### Goal
Wire the already-proven, already-hardened aggregation evaluator
(`src/runner/team-cognition/aggregation-evaluator.mjs`'s
`classifyAggregationOutcome`, closed in P07.1/P07.2 — read it, do not
fork it) into real FlowDefinition/CoordinationSession integration:
- Add the separate aggregation declaration to FlowDefinition
  (`completion.aggregation.method`/`outputOperationRef`/
  `sourceOperationRefs[]`/`requiredDisclosures[]` — the candidate names
  frozen in `P00.2.md` §3, still non-contract until this cell proves and
  promotes them, same discipline P06.1-P06.3 already modeled).
- Add a new session event, `aggregation-validated`, recording the
  evaluator's real verdict (`aggregationId`, `method`, `assignmentId`/
  `runId`/`outputArtifactRef`, `sourceResultRefs`, `outcome`,
  `dissentRefs`/`unresolvedContributionRefs`,
  `missingActors`/`failedActors`/`artifactRevisionRefs`, `validatedBy`,
  `ts` — per phase-07.md's own Candidate Contract block).
- `completion.mode` semantics (existing, accepted) stay byte-unchanged —
  aggregation is a SEPARATE, additive declaration, never a replacement.
- Agent Coordination (this session-engine layer) may use a validated
  cognitive outcome (the `aggregation-validated` event) as terminal
  INPUT, but retains terminal transition authority itself — the
  evaluator never transitions a session, this cell's own wiring code is
  what actually calls the existing terminal-transition primitive, gated
  on (not replaced by) a real validated event.
- Replay must reject a worker-shaped or self-validated aggregate "truth"
  — i.e. a claimed `aggregation-validated`-shaped outcome that didn't
  actually go through `classifyAggregationOutcome` (or an equivalent
  real validation call) must not be trusted by replay as if it had.

### Non-Goals
No new vote/rank/weighted-scoring/convergence machinery (plan.md
Non-Negotiable Deferrals — read that list before writing any of this).
No touching `src/runner/team-cognition/*`'s existing exports (extend
call sites elsewhere, don't fork or edit the evaluator itself unless you
find and report an actual bug there — same Do-Not-Silently-Patch
discipline P06.3 used for session-engine.mjs). No touching
`src/runner/definitions/schema.mjs`'s visibility-window fields (P06,
closed). No `src/verbs/coordination/*` CLI wiring yet unless minimally
needed to prove the session-level mechanism — if you find yourself
building a large CLI surface, stop and flag it, that's likely P07.4's
job (Surface And Regression Proof).

### Must Read
- `plans/260903-2334-step09-mvp6-to-mvp9/phase-07-mvp7-evidence-preserving-aggregation.md` (P07.3 bullets + Candidate Contract + Exit bullets)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.1.md`, `P07.2.md` (the evaluator's real, final shape — both Fix Round sections in P07.1.md)
- `docs/architect/agent-coordination/contracts/coordination-session.md` (the event-shape contract you're extending — match its existing conventions exactly, same discipline as P06.3's flow-definition.md promotion)
- `docs/architect/agent-coordination/contracts/flow-definition.md` (now includes Visibility Windows — read it as the most recent example of this repo's own promotion style)
- `src/runner/coordination/session-engine.mjs` — read the session-completion / terminal-transition primitives (search for how `session-completed`/`session-partial`/`session-failed` events get written, and how quorum/fan-in already works for `evaluateSessionQuorum`/`closeSessionByQuorum`/`synthesizeResearchFanIn` — this is your closest existing precedent for "session-layer code that consumes a validated result and drives a transition")
- `src/runner/coordination/replay.mjs` — how events are reconstructed read-only; your new event needs the same treatment

### May Inspect
`src/runner/coordination/schema.mjs` (EVENT_KINDS/validateEventPayload pattern for the new event), `src/runner/coordination/store.mjs` (append-event pattern), `test/runner/coordination-recovery-and-quorum.test.mjs`, `test/runner/coordination-research-fan-out.test.mjs` (existing fan-in/quorum test-shape precedent).

### Do Not Touch
`src/runner/definitions/*` visibility-window fields (closed). `src/runner/team-cognition/*`'s existing exported functions (call them, don't edit — if a genuine bug is found, STOP and report). `core/coordination-protocols/group-cognition-framework.yaml` (non-negotiable, never touched). `src/runner/coordination/session-engine.mjs`'s visibility-window code from P06.2 (read-only reference, don't touch it while adding aggregation — keep the diff scoped to aggregation only). `index.md`/`current-cell.md`.

### Tests First
Cover: aggregation declaration validates on a `CoordinationProtocol`
definition (schema-level, mirroring P06.1's style); `aggregation-validated`
event shape enforced by `validateEventPayload`; a real evaluator call
(via `classifyAggregationOutcome`) that produces `consensus` correctly
allows/feeds a terminal transition; one that produces `no-consensus` or
hidden-dissent correctly does NOT let terminal transition proceed as
success; `completion.mode`'s existing behavior is provably unchanged
(regression test); replay independently reconstructs the same
`aggregation-validated` event and REFUSES to trust a forged/tampered
one that didn't go through real validation (this is the "replay rejects
worker-shaped/self-validated aggregate truth" Exit bullet — design a
concrete test for it, e.g. an event written directly via the raw store
door with a fabricated `outcome: consensus` but no real evaluator call
behind it, and show what invariant actually catches or rejects that,
being honest in your trace about the exact boundary — same honesty
P06.2/P06.3 used for their own raw-store-door residuals, if this too
turns out to be a raw-store-door-only guarantee rather than fully
closed).

### Acceptance
`completion.mode` byte-unchanged behavior (regression proof). Aggregation
is additive. Session-engine retains sole terminal-transition authority
(the evaluator itself never transitions anything — grep-verify, mirroring
`team-cognition-static.test.mjs`'s own forbidden-import discipline).
Replay's handling of a forged aggregate is tested and honestly
characterized in the trace, not asserted without evidence.

### Bug Taxonomy
Letting the evaluator's own return value drive a transition directly
(bypassing session-engine's authority); accepting an `aggregation-validated`
event on replay without any check that it corresponds to a real
evaluator call; silently reintroducing vote/score/convergence logic
while wiring the "outcome" field through; a `completion.mode` regression
introduced by the new code path sharing logic with the old one.

### Trace Update
Doer writes `P07.3.md` in ITS OWN worktree. Coordinator integrates after
both Wave 3 cells close and are reviewed.

---

## P08.1 — Contribution Model And Validation (Phase 08, MVP8)

### Goal
Define the CLOSED MVP8 contribution-type enum
(`proposal | objection | response | clarification | rank |
specialist-request`) and a typed lineage validator, in a NEW, isolated
module (your call on exact path — `src/runner/deliberation/` is a
reasonable sibling to `src/runner/team-cognition/`, matching this repo's
existing `src/runner/<concern>/` convention; state your choice and
reasoning in the trace, matching P00.2's own "name the minimal new
boundary" discipline for Team Cognition).
- Require immutable artifact backing and real Assignment/Run provenance
  for every contribution (no free-text body with no backing evidence).
- Reject: undeclared contribution types, dangling anchors/responses
  (a response pointing at a contribution that doesn't exist), cycles (a
  response chain that loops back on itself), foreign-session refs (a
  contribution claiming provenance from a DIFFERENT coordinationId — same
  class of check P06.2's whole 4-round saga was about, learn from that
  history), and operation/type mismatch (a contribution type not declared
  in that operation's `contributions.allowedTypes[]`).
- Explicitly do NOT add: recipient, delivery, unread, mutable status, or
  an arbitrary free-form body field — this is Exit's own "No
  AgentMessage/mailbox semantics entered core" and plan.md's
  Non-Negotiable Deferrals both saying the same thing from different
  angles. If you find yourself adding anything that smells like a
  message inbox, stop and reconsider.

### Non-Goals
No session ledger/replay/visibility wiring (P08.2, later). No
FlowDefinition integration for `contributions.allowedTypes[]` declaration
itself (that's schema-side, likely also P08.2 or a P08.1-adjacent
addition — your call whether the minimal schema surface belongs here or
is truly out of scope; if you add it, keep it minimal and say so). No
touching `src/runner/coordination/*`, `src/runner/definitions/*`,
`src/runner/team-cognition/*`, `src/verbs/coordination/*`.

### Must Read
- `plans/260903-2334-step09-mvp6-to-mvp9/phase-08-mvp8-deliberation-memory.md` (P08.1 bullets + Candidate Contract + Exit bullets — your primary spec)
- `docs/architect/proposals/component-authority-boundary-map.md` (check if it names a Deliberation Memory / contribution-ledger authority boundary, same way it named Team Cognition's — follow the same "must not own" discipline if so)
- `src/runner/team-cognition/schema.mjs` (pattern precedent for a validation module in this repo's style — `AggregationError`-equivalent, shape validators)
- `docs/architect/agent-coordination/contracts/coordination-session.md` (for provenance/artifact-ref shape conventions to reuse, not reinvent)

### May Inspect
`src/runner/coordination/schema.mjs` (read-only, for how existing events model provenance/artifact refs — mirror the SHAPE conventions, don't import the module itself).

### Do Not Touch
`src/runner/coordination/*`, `src/runner/definitions/*`,
`src/runner/team-cognition/*`, `src/verbs/coordination/*`,
`core/coordination-protocols/*`, `index.md`/`current-cell.md`.

### Tests First
One test per rejection case (undeclared type, dangling anchor, dangling
response, cycle, foreign-session ref, operation/type mismatch), plus a
positive test proving a well-formed contribution with real Assignment/Run
provenance validates. Prove immutable-artifact-backing is actually
enforced (a contribution with no backing artifact ref is rejected).

### Acceptance
Closed enum enforced (no 7th type accepted). Every named rejection case
has its own test. No recipient/delivery/unread/mutable-status/free-body
field exists anywhere in the new module (grep-verifiable). Module
boundary matches whatever authority constraints
`component-authority-boundary-map.md` names for this area, if any.

### Bug Taxonomy
A contribution type validator that's actually an open string enum in
disguise; a "response" that can target a nonexistent or foreign-session
contribution; a cycle-detection gap (A responds to B responds to A);
accidentally modeling "unread" via a mutable field even if not named
that; accepting a contribution with a fabricated (non-real) Assignment/Run
reference.

### Trace Update
Doer writes `P08.1.md` in ITS OWN worktree. Coordinator integrates after
both Wave 3 cells close and are reviewed.
