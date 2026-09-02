# Track: step-09-group-thinking-mvp1-mvp2

Plan: `plans/260903-0004-step09-group-thinking-mvp1-mvp2/plan.md`
Branch: `step-09-group-thinking-mvp1-mvp2`
Base ref: `cd5ddeb9` (recorded after two preservation commits landed
pre-existing uncommitted prep work found in the working tree at track start —
see "Preservation Commits" below — not the literal commit the branch was cut
from, `cf63f28c`; this keeps every cell's `BASE_REF..HEAD` diff clean going
forward instead of always including the large pre-existing docs rewrite)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Preservation Commits

Before any cell work, `git status` on the inherited branch
(`step-08-standalone-coordination`, already closed) showed a dirty tree: a
prior architect-docs restructuring session had rewritten
`architecture-intent.md`, split the old step-09 proposal into
`step-09-group-thinking-substrate.md` (this track's own scope doc) and
`step-10-coding-domain-adoption.md`, added `component-authority-boundary-map.md`,
and updated cross-linking READMEs/AGENTS.md/CLAUDE.md/reading-map.md, plus this
plan's own `plan.md`/phase files — none of it committed yet. All of it is
directly this track's own prerequisite material (exactly the SCOPE_DOCS this
plan cites), not unrelated work, so it was preserved via two commits on the
new branch rather than discarded or left dangling:

- `b52e0165` — docs(architect): split step-09 into group-thinking substrate
  and step-10 coding-domain adoption
- `cd5ddeb9` — docs(plans): add step-09 group-thinking substrate MVP1/MVP2 plan

Left untouched (pre-existing, unrelated, not committed): `.agentkit/`,
`.claude/agents/*.md`, `.fgos/events/*.jsonl` (AgentKit installation/runtime
artifacts), `docs/architect/component-boundary/tmp/{CONTEXT,DISCUSSION}.md`
(scratch/working draft, not accepted content), leftover `plans/*/reports/*`
untracked report files from the already-closed step-07/step-08 plans.

## Baseline

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` run at
BASE_REF, exit code 1. Full log: `proofs/baseline-full-test-run.log`. 8 known
baseline failures, none touching this track's surfaces
(`src/runner/coordination/**`, `src/runner/definitions/**`,
`core/coordination-protocols/**`, `src/verbs/coordination/**`):

| # | Test | File | Cause class |
|---|---|---|---|
| 1 | ask/answer round-trip on a genuinely legacy durable-doing item (no claim) | `test/cli/fgos-intake-4.test.mjs:318` | assertion, unrelated (fgos ask/answer) |
| 2 | e2e pr-gate (a) runner item full loop | `test/e2e/pr-gate.test.mjs:226` | assertion, unrelated (PR-gate e2e verify-skip wording) |
| 3 | e2e self-improve loop full contract (D1-D17) | `test/e2e/self-improve-loop.test.mjs:174` | assertion, unrelated (self-improve loop verify-skip wording) |
| 4 | resolvePlan skips the risk-heavy gate (tsk-wve D1) | `test/intake/plan.test.mjs:953` | assertion, unrelated (intake plan) |
| 5 | resolvePlan skips requiring a verdict, mode "tiny" | `test/intake/plan.test.mjs:1198` | assertion, unrelated (intake plan) |
| 6 | resolvePlan skips for mode "small" | `test/intake/plan.test.mjs:1215` | assertion, unrelated (intake plan) |
| 7 | resolvePlan caller-supplied decompose verdict (D1) | `test/intake/plan.test.mjs:1588` | assertion, unrelated (intake plan) |
| 8 | herdr-spawn adapter (LIVE) real agy-herdr binaries | `test/runner/herdr-spawn-adapter.test.mjs:562` | live-executor timeout (60s), environment-dependent |

This list may only shrink; any new failure beyond it blocks cell close.
5037 tests, 5024 pass, 8 fail, 5 skipped, duration ~184s.

## Phase / Requirement Matrix

| Phase | Requirements | Status |
|---|---|---|
| 00 | R1-R4 | done |
| 01 | R1-R6 | done |
| 02 | R1-R8 | missing |
| 03 | R1-R7 | missing |

## Active Cell

None — P02.1 closed (Phase 02 R1-R4 only; R5-R8 open as P02.2).

## Next Action

prepare P02.2 (Phase 02 R5-R8)

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 (closes Phase 00) | done | `e579fc6a` |
| P01.1 | Phase 01 R1, R2, R3, R4, R5, R6 (closes Phase 01) | done | `bec5e7f8` |
| P02.1 | Phase 02 R1, R2, R3, R4 | done | (pending commit) |

## Phase 00 Status

**CLOSED.** R1-R4 via P00.1. Promoted the MVP1/MVP2 slice of the
discussion-status Step 09 substrate proposal into the two Accepted contracts
(`coordination-session.md`: `operation-authorized`/`driver-disposition-recorded`
events, `invocationKey` idempotency, context-grant enforcement, recheck-vs-
retry; `flow-definition.md`: binding-scoped `activation.mode`/
`maxInvocations`), plus a one-sentence prompt-boundary cross-reference in
`coordination-foundation-baseline.md` and a confirmed-correct (no-edit-needed)
read of `component-authority-boundary-map.md`.

Went through 1 Reviewer round (1 MEDIUM + 2 LOW — a self-contradictory MVP3+
scope disclaimer against the substrate's own MVP numbering, a silent
`targetArtifactRef`/`artifactRevision` naming divergence, a paraphrased
cross-reference — all fixed, re-confirmed resolved by the same Reviewer)
followed by 1 Red-Team round (1 HIGH + 3 MEDIUM + 2 LOW — most notably a
genuine recheck/taskKey-collision loophole: nothing required a recheck's
idempotent-claim key to differ from the original reviewing Assignment's own
key, so a future implementer faithfully reusing this contract's own cited
`wx`/taskKey precedent could have a "recheck" silently collapse into a retry
of the original Assignment — closed with a hard "MUST incorporate the new
revision/invocationKey" requirement; the 3 MEDIUMs were the same pattern,
outcome guarantees stated without the durability/scope qualifier already
modeled elsewhere in the same contracts, `invocationKey` scope,
`operation-authorized`-vs-terminal-transition atomicity, `maxInvocations`
resume counting — all fixed, re-confirmed resolved by the same Red-Team
re-attempting each named exploit against the post-fix text). No HIGH/MEDIUM
remains open. Docs-only cell throughout — `group-cognition-framework.yaml`
and `assignment-run-runresult.md` confirmed at zero diff by Doer, Reviewer,
Red-Team, and Coordinator independently.

## Phase 01 Status

**CLOSED.** R1-R6 via P01.1. Added
`core/coordination-protocols/standalone-master-coordination-loop.yaml` — a
static `CoordinationProtocol` FlowDefinition fixture: worker-only actors
(doer/reviewer/red-team/fixer, no coordinator), six operations, graph
`phase-produce -> phase-first-pass (review+red-team required) ->
phase-revision (revise-candidate) -> phase-recheck (reviewer-recheck +
red-team-recheck)`, no topology, no Work fields. Zero `src/` diff — the
existing unmodified schema/loader was already sufficient for the static
skeleton. `revise-candidate`/`reviewer-recheck`/`red-team-recheck`
currently materialize identically to the required first-pass operations
(schema has no `activation` field yet — that's Phase 02's job); this is the
honest, undecorated R4 state, documented in the fixture's own header
comment and this cell's Gaps section, not faked.

Went through 1 Reviewer round (CLEAN — 2 non-actionable LOW notes: an
actor-id naming style divergence that correctly matches the authoritative
substrate spec over sibling-fixture convention, and a wider-than-phase-file
protected-fixture list, both non-issues) followed by 1 Red-Team round (1
HIGH + 1 MEDIUM + 1 LOW). The HIGH was a genuine, independently-confirmed
forward-looking finding, not a defect in this cell's own deliverable: this
fixture is the first in the repo to bind one actor to two different
operations at two graph positions, and `src/runner/coordination/
cohort-planner.mjs:307`'s `resolveActorOperation` (already live, wired into
`dispatchResearchFanOut`) resolves by first-match-on-actorId with no
operation/node disambiguation — meaning it can never correctly resolve the
second binding once cohort allocation is ever pointed at this fixture.
Correctly kept out of scope to fix in this docs/fixture-only phase (see
"Forward Notes For Later Phases" below); recorded as a Gap instead. The
MEDIUM + LOW (missing actor-binding and graph-shape test assertions) were
fixed and Red-Team-recheck-confirmed resolved. Full suite not required for
this cell (docs/fixture+test only, zero shared loader/schema diff); focused
suite 49/49 pass throughout.

## Phase 02 Status (in progress)

**P02.1 CLOSED** (Phase 02 R1-R4; R5-R8 open as P02.2): implemented the
`activation` schema field (`src/runner/definitions/schema.mjs`), the
`operation-authorized` event with lock-shared Recovery-Rule-point-5
atomicity (`src/runner/coordination/{schema,store,replay}.mjs`), extended
`assignment-created` provenance (additive, agent-led path byte-identical),
and the R4 dispatch gate in `session-engine.mjs`'s `dispatchDeclaredOperation`,
matched on the full `(nodeId, operationId, targetActorId)` triple —
explicitly avoiding the `cohort-planner.mjs`-class under-disambiguation bug
Phase 01's Red-Team found.

Reviewer round (opus): APPROVE WITH CONCERNS, 2 MEDIUM + 3 LOW. MED-1 (the
disambiguation triple's own test coverage was weaker than the Proof Matrix
claimed — mutation-tested, only the degenerate actor-only shape was caught)
and LOW-1/LOW-2 (replay double-consumption guard parity; refusal message
observability) fixed and confirmed. MED-2 (a pre-existing, Phase-04-R5-era
reachability gap where `nodeId` validates but never selects) correctly
deferred as a forward gap, not fixed here.

Red-Team round (opus): **BLOCK, 1 HIGH + 1 MEDIUM**, both found and
confirmed by real multi-process/SIGKILL empirical reproduction, not code
reading. HIGH-1: `createSessionAssignment`'s self-heal path (crash-recovery
branch) skipped the lock-held authorization-consumption check that the
genuinely-new-taskKey path had — a real crash (24 real `SIGKILL`s, 3 hit
the window) raced against a real concurrent second dispatcher let ONE
`operation-authorized` authorization materialize TWO Assignments (10/11/7
double-consumptions out of 20/20/12 trials), after which the session's
event log threw `duplicate-ref` on every future read, permanently. This is
exactly the class of concurrency bug this track's step-08 history
(P01.2/P03.1/P03.2) established requires real multi-process reproduction to
find — invisible to the cell's own 320/320-passing sequential suite.
MEDIUM-1 (companion finding): the same write path accepted a fabricated
`authorizationId` (bricking the session later, at replay time, instead of
refusing at write time) and accepted `assignment-created` provenance
fields with no `authorizationId` at all (an unverifiable context grant).
Both fixed: a single shared `assertAuthorizationSpendable` helper now gates
both the self-heal and genuinely-new-taskKey branches identically (checking
both "does the authorization event really exist" and "is it already
consumed by a DIFFERENT Assignment"), plus a schema-level rule that the
provenance field group travels together or not at all. Red-Team recheck
(opus): **CONFIRMED-RESOLVED** — 0 double-consumptions in 46 real
multi-process trials against the fix (vs. 10-11/20 before), with the
previously-fatal lock-ordering hit 18 times and refused cleanly every time;
genuine idempotent resume independently re-verified still works. Cell
safe to close.

Full suite: 5090 tests, 5078 pass, 7 fail — all match this track's recorded
baseline by name (the herdr-spawn live-timeout item, environment-dependent,
was simply absent that run); no new failure. Focused glob 324/324 pass.

## Forward Notes For Later Phases

**cohort-planner.mjs actor disambiguation (from Phase 01's Red-Team).**
`resolveActorOperation` (`src/runner/coordination/cohort-planner.mjs:307-316`)
resolves an actor's wired operation by first-match scan keyed on `actorId`
alone, with no `operationId`/`nodeId` disambiguation. `standalone-master-
coordination-loop.yaml` is the first fixture where one actor (`reviewer`,
`red-team`) is bound to two different operation ids at two different graph
nodes — `resolveActorOperation` structurally can never return the second
binding (`reviewer-recheck`/`red-team-recheck`), always the first
(`review-candidate`/`red-team-candidate`). Currently masked because the
paired operations share identical `role`/no `policy`/`capabilities`; breaks
silently (wrong-value substitution, not a crash) the moment a future cell
gives a recheck operation its own `policy`/`capabilities`. **Before any
future phase points `planCohort`/`resolveActorOperation` at this fixture,
re-key that function by `(nodeId, operationId, actorId)`, mirroring
`session-engine.mjs`'s already-correct `resolveDeclaredOperationActor`
(keyed by `operationId`).** Full detail: `P01.1.md`'s Red-Team HIGH-1 and
Gaps section. Not a blocker for Phase 01/02/03 as currently scoped (no
phase's Files list touches `cohort-planner.mjs`), but must be checked
before any phase introduces cohort allocation for this fixture.

**`resolveDeclaredOperationActor` node selection (from P02.1's Review
MED-2).** The same function family, a related but distinct gap:
`resolveDeclaredOperationActor` (`session-engine.mjs`, pre-existing Phase 04
R5) resolves an actor to the FIRST graph-order match with no `nodeId`-based
SELECTION (its `nodeId` parameter only validates a match already found) —
so the accepted contract's explicitly-blessed "same operation id, `required`
at one graph position and `driver-authorized` at another" pattern is
unreachable at runtime whenever both positions bind the SAME actor
(confirmed empirically: such a definition validates but the second
position's activation can never gate anything). Not a gate bypass, not
currently exploitable (no shipped fixture uses this shape). Before any
future phase relies on this pattern being reachable, thread `nodeId` into
`resolveDeclaredOperationActor` as a real third selector, or reject the
ambiguous shape at `validateGraph` time instead. Full detail: `P02.1.md`'s
Review MED-2 and Gaps section.

**Unlocked-replay-vs-concurrent-commit spurious `dangling-ref` (from P02.1's
Red-Team LOW-1, pre-existing, not this cell's defect).** `replaySession`
reads `session.json` before `events.jsonl` (`replay.mjs`) while
`completeAssignmentRegistration` appends the event before writing the
manifest — an unlocked reader straddling a concurrent commit can throw a
spurious `dangling-ref` (measured 4-12 per 3-second window against 2
concurrent dispatchers in 18/20 trials; final replay always clean). Predates
this track entirely; P02.1's R4 gate just adds one more unlocked
`replaySession` consumer onto an already-existing pattern, so a legal
driver-authorized dispatch can now also transiently abort for this
pre-existing reason under concurrency. Not fixed in P02.1 (out of scope —
would mean re-ordering a pre-existing write/read sequence this track didn't
introduce). Worth a real fix (likely: read events before manifest, or hold
a shared/read lock) before Phase 03's live proof, which will run real
concurrent dispatches. Full detail: `P02.1.md`'s Red-Team LOW-1.

Next: P02.2 (Phase 02 R5-R8 — idempotency, context-grant enforcement,
bounds interaction, driver authority pinning).

## Phase 00 Audit Notes

- `coordination-session.md` and `flow-definition.md` are both `Design status:
  Accepted` today but contain zero MVP1/MVP2 vocabulary (`activation`,
  `operation-authorized`, `driver-disposition-recorded`, `invocationKey`,
  `grantedContextRefs`, recheck-vs-retry) — confirmed via full read, this is
  the real R1 gap.
- `architecture-intent.md` and `step-09-group-thinking-substrate.md` are both
  `Design status: Discussion` and already fully spell out the candidate MVP1/
  MVP2 shapes (substrate proposal §6-9). Phase 00's job is narrowing +
  promoting exactly the MVP1/MVP2 slice of that discussion text into the two
  accepted contracts above — not inventing new shape.
- `coordination-foundation-baseline.md` (Accepted) already points to Step 09
  for the group-thinking expansion (preservation commit `b52e0165`); no
  further edit required for R1 unless the Doer finds a gap.
- R2 (prompt boundary) is already satisfied by `master-coordinator.md`'s own
  pre-existing "Runtime Boundary" section (top of file) plus
  `architecture-intent.md` §18.4 — both state the playbook is manual-only and
  must not become runtime authority. No accepted-doc currently states this
  as canonical text; Doer should add one sentence to
  `coordination-foundation-baseline.md`'s "Deliberately Not Promoted" section
  cross-referencing the playbook's own boundary statement, rather than
  duplicating the prose.
- R3 (component authority) needs a read of `component-authority-boundary-map.md`
  against the placement claims in phase-00's R3 text; expected to already be
  correct (it was authored in the same prep session as this plan) — Doer
  confirms rather than assumes.
- R4 (no invariant reopening) is a negative constraint: Doer must not touch
  `group-cognition-framework.yaml`, `assignment-run-runresult.md`, or any
  budget/mutation-exclusivity language while writing R1-R3.
