# Current Cell(s): none (idle — Wave 1 closed, Wave 2 not yet dispatched)

Status: closed (Wave 1) / idle
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: prepare and dispatch Wave 2 (P06.2 + remaining P07.2 scope),
each into its OWN isolated worktree this time — see index.md's Next Action
and process-deviation note. This file's P06.1/P07.1 sections below are kept
as the historical closed-cell contract; a new "## Wave 2" section will be
added above them when Wave 2 is prepared.

## Wave 1 Disposition (post Reviewer+Red-Team parallel first pass)

Both rounds: APPROVE WITH CONCERNS, 0 HIGH. Reviewer: 2 MEDIUM + 2 LOW + 1 nit.
Red-Team: 2 MEDIUM (0 LOW). Overlap: Reviewer's "frozen at every level" finding
and Red-Team's "mutable sub-function results" finding are the same defect at
different depth — consolidated into one fix below.

**Accepted, routed to Fixer (P07.1 scope only, sequential, single Fixer):**
1. `P07.1.md` Scope line overclaims P07.2 as covered — reword; `index.md` must
   not record P07.2 as closed.
2. Immutability: `validateSourceCoverage`/`validateRequiredDisclosureCoverage`
   return mutable objects/arrays/Map despite the trace's blanket claim; even
   `evaluateAggregationCoverage`'s frozen output has an unfrozen nested array
   inside `missingDisclosuresBySource`. Freeze every exported function's
   result at every nesting level; extend "result is frozen" test to check a
   nested value too.
3. `team-cognition-static.test.mjs`'s forbidden-import guard is one-hop only
   (proven by Red-Team's synthetic PoC) — make it a real recursive resolver
   over relative imports.
4. No test proves the evaluator's inputs are left unmutated (named Bug
   Taxonomy item) — add one.

**Not accepted / no action:** Reviewer's LOW #4 (shared-worktree process
deviation — already disclosed by Coordinator, not a code defect, no further
action) and LOW #5 (current-cell.md wording nit re: "graph.nodes[]" — will
fix as a free docs-only line while the Fixer is already in this file's
neighborhood, not because it's a real requirement gap).

P06.1 has zero findings routed to it — clean.

## CRITICAL: working root

ALL edits (source, tests, and this cell's own trace file) happen inside the
dedicated worktree:
`/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9/`
(branch `step-09-mvp6-to-mvp9`). Do NOT write under
`/home/vantt/projects/forgentX/` directly — that is the main checkout, on
branch `main`, shared by unrelated concurrent work. (A prior Coordinator
slip wrote Phase 00's trace files to the main-checkout path by accident and
had to be moved before commit — do not repeat it.)

Run focused/full test commands from THAT SAME worktree root
(`cd /home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9 &&
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test '<glob>'`) — this is where
the edited code actually lives, so this is the only cwd that tests it.
Exception: `test/runner/coordination-static.test.mjs` false-fails from this
path (see index.md's Baseline note, it substring-matches "worktree" in
resolved import paths) — neither P06.1's nor P07.1's own focused glob
includes that file, so it does not apply here unless a Doer widens the
glob, in which case run that one file's check from the main checkout
instead and say so in the trace.

Phase 00 (P00.1 + P00.2) closed — see index.md Cell Log. Full-suite baseline
recorded in index.md.

## P06.1 — Visibility Definition Schema And Validation (Phase 06, MVP6)

### Goal
Add `CoordinationProtocol`-profile-only visibility-window fields to
FlowDefinition validation: `spec.profile.topology.visibilityWindows[]`
(`id`, `opensAfter.milestone: listed-results-linked`,
`opensAfter.operationRefs[]`, `permits.sourceOperationRefs[]`,
`permits.delivery: artifact-refs`) and
`graph.nodes[].operations[].contextAccess.visibilityWindowRef`. Reject
unknown windows, dangling operation refs, duplicate ids, illegal delivery
values, and any use on a `Workflow`-profile definition. A definition with no
`visibilityWindows` must stay byte/behavior compatible (no new required
field, no changed validation outcome for existing fixtures).

### Non-Goals
No runtime enforcement (window-open/closed state, grant-time legality check)
— that is P06.2, a later Wave 2 cell, not this one. No touching
`grantedContextRefs`/`contextGrant.refs` concrete-authority mechanics. No
promoting this candidate contract into
`docs/architect/agent-coordination/contracts/flow-definition.md` yet (P06.3
does that, after proof).

### Must Read
- `plans/260903-2334-step09-mvp6-to-mvp9/phase-06-mvp6-visibility-windows.md`
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md` §1.1, §4 (P06.1)
- `docs/architect/agent-coordination/contracts/flow-definition.md`
- `src/runner/definitions/schema.mjs` (existing `validateFlowDefinition`, `ACTIVATION_MODE_VALUES`-style enum pattern to mirror)
- `test/runner/flow-definition-standalone-master-coordination-loop.test.mjs` (existing test-shape precedent)

### May Inspect
`src/runner/definitions/protocol-loader.mjs` (read-only unless a new
discovery-tier behavior is genuinely needed — flag any edit here loudly),
`core/coordination-protocols/*.yaml` (all except
`group-cognition-framework.yaml`), `test/runner/coordination-schema.test.mjs`.

### Do Not Touch
`core/coordination-protocols/group-cognition-framework.yaml` (non-negotiable,
never touched). `src/runner/coordination/*` (session-runtime — P06.2's later
scope). `src/verbs/coordination/*` (public-surface). `src/runner/team-cognition/*`
(P07.1's new path — sibling cell, disjoint scope). `index.md`/`current-cell.md`.

### Tests First
Write validation tests first: a definition with no `visibilityWindows` still
validates identically to before (regression); a definition with a
well-formed `visibilityWindows[]` validates; each rejection case (unknown
window ref, dangling operationRef, duplicate id, illegal `delivery` value,
`Workflow`-profile definition carrying `visibilityWindows`) has its own
negative test. Focused command:
`cd /home/vantt/projects/forgentX && FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/flow-definition*.test.mjs' 'test/runner/coordination-schema.test.mjs'`
(run from the MAIN CHECKOUT, not this worktree — see index.md's Baseline
section for why: `test/runner/coordination-static.test.mjs` false-fails when
run from a path containing the substring "worktree").

### Acceptance
`validateFlowDefinition` accepts the new fields only under `CoordinationProtocol`
profile; every named negative case is a validation error, not a silent
pass-through or crash; zero behavior change for existing fixtures lacking
`visibilityWindows`; new tests pass; no regression in
`test/runner/flow-definition*.test.mjs`.

### Bug Taxonomy
Accepting `visibilityWindows` on a `Workflow` profile; a dangling
`operationRefs`/`sourceOperationRefs` entry silently accepted instead of
rejected; a definition with zero windows changing behavior/shape; validation
that only checks presence, not that referenced operation ids actually exist
in `spec.operations[]` (the same operation-id namespace every other
operation ref in this schema resolves against).

### Trace Update
Doer writes `P06.1.md` (Requirements/Proof Matrix/Commands/Gaps). Coordinator
integrates into index.md after both P06.1 and P07.1 return and are reviewed.

---

## P07.1 — Team Cognition Evaluator Skeleton (Phase 07, MVP7)

### Goal
Establish the minimal Team Cognition module/port boundary at
`src/runner/team-cognition/` (brand-new directory, per P00.2.md §2 — no
existing module to move). Validate structured source coverage and required
disclosures against immutable RunResult/artifact refs. The evaluator must
never rewrite evidence, alter confidence, dispatch work, or transition a
CoordinationSession — it is a pure validation function callable in isolation.

### Non-Goals
No FlowDefinition/session integration (that is P07.3, Wave 3, after P06
exits and P07.1/P07.2 land). No wiring into `run.mjs`/`session-engine.mjs`.
No fixtures/tests beyond what proves the evaluator function itself in
isolation (P07.2 is the fixtures/tests cell — if the scope is small enough,
this Doer may cover both P07.1+P07.2 in one cell; state explicitly in the
trace which phase-file cells were covered).

### Must Read
- `plans/260903-2334-step09-mvp6-to-mvp9/phase-07-mvp7-evidence-preserving-aggregation.md`
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md` §2, §3 (MVP7 candidate names), §4 (P07.1)
- `docs/architect/proposals/component-authority-boundary-map.md` §6 (Team Cognition Engine authority row — "Must not own" list)
- `src/runner/coordination/schema.mjs` (pattern precedent: how this repo shapes a validation module — `CoordinationError`, `assertNoForbiddenFieldsDeep` style)

### May Inspect
`src/runner/coordination/replay.mjs` (read-only, to understand RunResult/
artifact-ref shape the evaluator will validate against), any existing
`RunResult`/artifact-ref type definitions under `src/runner/coordination/`.

### Do Not Touch
`src/runner/coordination/*`, `src/runner/definitions/*`,
`src/verbs/coordination/*`, `core/coordination-protocols/*`,
`index.md`/`current-cell.md`. No dispatch of work, no session mutation
anywhere in this cell's code.

### Tests First
New isolated fixtures under `test/runner/team-cognition-*.test.mjs`. Cover:
structured source coverage validation, required-disclosures validation
against real (fixture) artifact refs, and a negative case proving the
evaluator refuses to validate when a required disclosure is missing.
Positive/negative for whatever surface this skeleton actually exposes (even
if outcome classification `consensus|qualified|no-consensus` is P07.2/P07.3
scope, this cell's tests must prove the skeleton's own real behavior, not a
stub). Focused command:
`cd /home/vantt/projects/forgentX && FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/team-cognition*.test.mjs'`
(run from the MAIN CHECKOUT — same worktree-path caveat as P06.1).

### Acceptance
`src/runner/team-cognition/` exists with a real, callable evaluator
function/module; zero writes to any Work/session/dispatch surface anywhere
in the new code (grep-verifiable, mirroring `coordination-static.test.mjs`'s
own forbidden-import pattern — consider adding an equivalent static check
for the new directory); tests pass; module boundary matches
`component-authority-boundary-map.md` §6's "Must not own" constraints.

### Bug Taxonomy
Evaluator silently mutating an artifact ref or RunResult; evaluator invoking
any dispatch/session-transition function even indirectly (transitive import
of `session-engine.mjs`/`store.mjs`); evaluator treating an unresolved
dissent as resolved consensus; evaluator accepting a stale artifact revision
as current.

### Trace Update
Doer writes `P07.1.md`. Coordinator integrates after both P06.1 and P07.1
return and are reviewed.
