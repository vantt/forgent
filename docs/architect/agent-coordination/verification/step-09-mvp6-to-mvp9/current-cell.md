# Current Cell(s): P06.2 + P07.2-remainder (Wave 2, parallel, ISOLATED worktrees)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch both Doers in parallel, each into its OWN isolated
worktree (lesson from Wave 1's process deviation)

Wave 1 (P06.1 + P07.1) closed and committed (`8d2fa7d8`) — see index.md's
"Wave 1 Status" section and `P06.1.md`/`P07.1.md` for full history.

## CRITICAL: working roots (TWO separate isolated worktrees this wave)

- **P06.2** works ONLY in: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9-p06.2`
  (branch `step-09-mvp6-to-mvp9-p06.2`, branched from `step-09-mvp6-to-mvp9`
  tip `8d2fa7d8`).
- **P07.2-remainder** works ONLY in: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9-p07.2`
  (branch `step-09-mvp6-to-mvp9-p07.2`, same base `8d2fa7d8`).
- Neither Doer touches `/home/vantt/projects/forgentX` (main checkout,
  branch `main`) or the OTHER isolated worktree.
- Run test commands from each Doer's OWN worktree root.
- The Coordinator integrates both branches back into `step-09-mvp6-to-mvp9`
  sequentially after both close, reviews the combined diff, and reruns gate
  tests — per `plan.md`'s Shared-File Lease Rule (isolated workspaces
  required for concurrent non-read-only leaf cells).

---

## P06.2 — Visibility Runtime, Grant Enforcement, And Replay (Phase 06, MVP6)

### Goal
Wire real runtime enforcement of visibility windows into the existing
context-grant mechanism (`authorizeDeclaredOperation`/`dispatchDeclaredOperation`
in `src/runner/coordination/session-engine.mjs`), on top of P06.1's schema:
- Derive milestone state (window open/closed) from listed `result-linked`
  events already in the session's event log — no new stored "window state"
  field, computed at read time.
- A window stays closed while any of its `opensAfter.operationRefs[]` has no
  matching `result-linked` event, or that event records a failed/late
  result (exact failure semantics: read how `result-linked` already
  represents failure — do not invent a second vocabulary).
- An accepted `actor-replaced` lineage may satisfy the original source
  obligation without rewriting history (the replacement's own `result-linked`
  counts toward the window; the original failed/missing attempt's event
  stays in the log, untouched).
- At BOTH authorization time (`authorizeDeclaredOperation`) and dispatch time
  (`dispatchDeclaredOperation`), every granted context ref must satisfy BOTH
  existing same-session ownership (`assertRefsOwnedBySession`, unchanged)
  AND active-window legality (new) before being granted/legal.
- "Persist no duplicate `visibility-window-applied` truth" — do not add a new
  event type or a redundant stored flag for window-open state; it must be a
  pure derivation from existing events (`result-linked`, `actor-replaced`),
  recomputed identically by `replay.mjs`.

### Non-Goals
No changes to P06.1's schema shape (already shipped). No promoting the
candidate contract into `flow-definition.md`/`coordination-session.md` yet
(P06.3's job, after proof). No touching `src/runner/team-cognition/*`,
`src/verbs/coordination/*`, or `core/coordination-protocols/group-cognition-framework.yaml`.

### Must Read
- `plans/260903-2334-step09-mvp6-to-mvp9/phase-06-mvp6-visibility-windows.md` (P06.2 cell + Exit bullets)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.1.md` "Existing visibility / context-grant primitives" section (exact file+line citations for the mechanism you're extending)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P06.1.md` (the schema shape you're now enforcing at runtime — `visibilityWindows[]`/`contextAccess.visibilityWindowRef`)
- `src/runner/coordination/session-engine.mjs` — read `authorizeDeclaredOperation` (~line 1047-1116) and `dispatchDeclaredOperation` (~line 1368-1841) IN FULL, especially the `assertRefsOwnedBySession` call sites (~line 1087, ~line 1609) and `legalContextRefs` construction (~line 1639) — this is exactly where the new window-legality check is added, alongside the existing ownership check, not replacing it
- `src/runner/coordination/schema.mjs` — `EVENT_KINDS`/`validateEventPayload` (how `result-linked`/`actor-replaced` events are shaped today)
- `src/runner/coordination/replay.mjs` — how state is reconstructed read-only; your window-state derivation function must be callable identically from both the live dispatch path and replay, so replay independently reaches the same legality decision (Phase 06 Exit bullet)

### May Inspect
`test/runner/coordination-session-engine.test.mjs`, `test/runner/coordination-replay.test.mjs`, `test/runner/coordination-driver-authorization.test.mjs` (existing test-shape precedent for authorization/dispatch tests).

### Do Not Touch
`src/runner/definitions/*` (P06.1's already-closed scope — read-only reference only). `src/runner/team-cognition/*`. `src/verbs/coordination/*`. `core/coordination-protocols/group-cognition-framework.yaml` (non-negotiable). `index.md`/`current-cell.md`.

### Tests First
Cover, each with its own test: window stays closed with zero source
`result-linked` events; window stays closed with a partial subset of
required source events; window opens once ALL `opensAfter.operationRefs[]`
have a qualifying `result-linked`; a failed/late result does NOT open the
window; an `actor-replaced` lineage satisfies the original obligation
without the original failed event disappearing from the log; authorization
is refused when a granted ref's window is not yet open even though
same-session ownership passes; dispatch is refused (not just authorization)
under the same condition (defense in depth — test both gates independently,
not just one); replay independently reconstructs the same window-open/closed
decision as the live path for at least one non-trivial scenario. Focused
command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-session-engine.test.mjs' 'test/runner/coordination-replay.test.mjs' 'test/runner/coordination-driver-authorization.test.mjs' 'test/runner/flow-definition*.test.mjs'`
(run from `.claude/worktrees/step-09-mvp6-to-mvp9-p06.2`, the ONLY worktree
that has your changes; do not include `coordination-static.test.mjs` in
your own glob — false-fails from a worktree path, out of scope here too).

### Acceptance
No anonymization/aggregate-transformation/partial-window-exception
introduced (plan.md Non-Negotiable Deferrals). `grantedContextRefs`'s
existing same-session-ownership gate is unchanged/still enforced (regression
tests for the pre-existing behavior must still pass). Window legality is a
genuinely separate, additive gate — never a replacement for ownership.
Replay reaches the identical decision as live dispatch for every new test
scenario. Zero new stored/duplicated "window state" field.

### Bug Taxonomy
A partial-window bypass (accepting a ref because SOME but not all sources
are linked); a window that silently stays permanently open once any single
source links (should re-check per-request, not cache/latch); an
`actor-replaced` path that lets a NEW unrelated operation ref piggyback on
someone else's satisfied obligation; authorization passing but dispatch
independently re-deriving a DIFFERENT (looser) legality decision than
authorization did (two gates disagreeing is itself a bug even if both
individually look plausible); replay reconstructing a different verdict
than the live path recorded (non-determinism); any change that weakens the
existing `assertRefsOwnedBySession` check as a side effect of adding the new
one.

### Trace Update
Doer writes `P06.2.md` in ITS OWN worktree
(`.claude/worktrees/step-09-mvp6-to-mvp9-p06.2/docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P06.2.md`).
Coordinator integrates the branch and the trace file into the main track
worktree after both Wave 2 cells close and are reviewed.

---

## P07.2-remainder — Aggregation Outcome Classification And Adversarial Fixtures (Phase 07, MVP7)

P07.1 already closed the source-coverage/disclosure-presence slice of this
phase-file cell (see `P07.1.md`). This cell covers what's left, named
explicitly in `phase-07-mvp7-evidence-preserving-aggregation.md`'s own P07.2
bullets and confirmed still-open by the Wave 1 Reviewer's finding.

### Goal
Still isolated from shared session files (do NOT integrate with
`src/runner/coordination/*`/`src/verbs/coordination/*` yet — that's P07.3,
a later wave). Add to `src/runner/team-cognition/`:
- Outcome classification: `consensus | qualified | no-consensus`, built on
  top of P07.1's existing `evaluateAggregationCoverage` (extend, do not
  fork — read it first).
- Hidden-dissent rejection: reject a claimed `consensus` outcome when a
  disclosed dissent/objection exists that the aggregation input doesn't
  surface (i.e. the evaluator must not let a caller claim "consensus" while
  quietly omitting a `dissentRefs`/`unresolvedContributionRefs`-shaped
  entry — see the candidate contract names frozen in `P00.2.md` §3 for the
  MVP7 field vocabulary, still non-contract but useful as your own internal
  parameter naming).
- Stale artifact-revision-provenance rejection: build on P07.1's existing
  `revision`-presence check — this cell adds the "is it CURRENT" half P07.1
  explicitly left open (P07.1.md's own Gaps section: "cannot check the pin
  is current, no store access"). Since this cell still has no store access
  (integration is P07.3), implement this as: given a caller-supplied
  "current revision" reference map alongside the sources (a pure-function
  input, not a store read), reject any source whose `revision` doesn't match
  the corresponding current-revision entry. Document this input-shape choice
  explicitly in your trace.
- Malformed-disclosure rejection: expand beyond P07.1's presence-only check
  — validate disclosure VALUE shape is at least well-typed per whatever
  minimal shape you define (document the shape you chose; P07.1's Gaps
  section explicitly left this open for "a later cell that defines
  disclosure semantics").
- Reject a claimed `consensus` outcome that coexists with any unresolved
  dissent reference.

### Non-Goals
No FlowDefinition/session integration (P07.3). No wiring into
`run.mjs`/`session-engine.mjs`. No touching `src/runner/coordination/*`,
`src/runner/definitions/*`, `src/verbs/coordination/*`.

### Must Read
- `plans/260903-2334-step09-mvp6-to-mvp9/phase-07-mvp7-evidence-preserving-aggregation.md` (P07.2 bullets + Candidate Contract block)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.1.md` IN FULL, including both Fix Round sections — this is the exact module/shape you're extending, not forking
- `src/runner/team-cognition/aggregation-evaluator.mjs`, `src/runner/team-cognition/schema.mjs` (the real current code)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md` §3 (frozen MVP7 candidate names — `outcome`, `dissentRefs`/`unresolvedContributionRefs`, `artifactRevisionRefs` — still non-contract, but the naming precedent to follow for internal consistency)

### May Inspect
`test/runner/team-cognition-*.test.mjs` (existing tests you're extending, not replacing).

### Do Not Touch
`src/runner/definitions/*`, `src/runner/coordination/*`, `src/verbs/coordination/*`, `core/coordination-protocols/*`, `index.md`/`current-cell.md`.

### Tests First
One test per outcome (`consensus`/`qualified`/`no-consensus`) with a
deterministic, documented rule for which is which. Negative: hidden dissent
with a claimed-consensus input rejected; a stale-revision source rejected;
a malformed disclosure value rejected; consensus-with-unresolved-dissent
rejected. Focused command:
`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/team-cognition*.test.mjs'`
(run from `.claude/worktrees/step-09-mvp6-to-mvp9-p07.2`).

### Acceptance
Every P07.2 bullet above has its own passing positive+negative test. No
vote/rank-tally/weighted-scoring/convergence-engine/prose-parsing
introduced anywhere (plan.md Non-Negotiable Deferrals — this is the exact
phase where that temptation is highest; read the Deferrals list before
writing the outcome-classification logic). P07.1's existing tests/behavior
unchanged (extend, verify old tests still pass).

### Bug Taxonomy
Classifying `consensus` from source-coverage alone without actually
checking for dissent; a `qualified`/`no-consensus` boundary that's
arbitrary/undocumented rather than a named rule; accepting a stale revision
because the "current revision" input itself wasn't validated against
anything (garbage-in-garbage-out silently accepted); any hidden numeric
scoring/weighting that is actually a vote in disguise.

### Trace Update
Doer writes `P07.2.md` in ITS OWN worktree
(`.claude/worktrees/step-09-mvp6-to-mvp9-p07.2/docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.2.md`).
Coordinator integrates after both Wave 2 cells close and are reviewed.
