# Current Cell(s): P07.4 + P09.1 (parallel, ISOLATED worktrees)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch both Doers in parallel, each into its OWN isolated
worktree (established pattern)

P07.4 closes Phase 07 (required for "P07 exit" before Wave 4/P08.2).
P09.1 is schema-only preparation explicitly allowed to start now
("may start after MVP6, but cannot integrate before the MVP8 product
gate" — phase-09.md) — disjoint scope from P07.4 (P07.4 touches CLI/show
+ contract docs; P09.1 touches FlowDefinition schema, sibling to P06.1's
visibilityWindows work).

## CRITICAL: working roots (TWO separate isolated worktrees this wave)

- **P07.4** works ONLY in: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9-p07.4`
  (branch `step-09-mvp6-to-mvp9-p07.4`, branched from `step-09-mvp6-to-mvp9`
  tip `7263a15c`).
- **P09.1** works ONLY in: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9-p09.1`
  (branch `step-09-mvp6-to-mvp9-p09.1`, same base `7263a15c`).
- Neither Doer touches `/home/vantt/projects/forgentX` (main checkout) or
  the OTHER isolated worktree. Run tests from each Doer's own worktree
  root. `test/runner/coordination-static.test.mjs` false-fails from any
  worktree-path checkout — exclude it from your own glob.
- Coordinator integrates both branches back into `step-09-mvp6-to-mvp9`
  sequentially after both close and are reviewed.

---

## P07.4 — Surface And Regression Proof (Phase 07, MVP7, closes Phase 07)

### Goal
- Wire `src/verbs/coordination/run.mjs`'s `closeSessionByQuorum` call to
  actually pass `aggregationId` when a caller (or a definition that
  declares `completion.aggregation`) wants aggregation-gated closure —
  closing the "opt-in gate has zero production callers" gap both Wave 3
  reviewers named (see `P07.3.md`'s Gaps: "P07.4 must make
  `closeSessionByQuorum` refuse a close when the protocol declares
  `completion.aggregation` and no validated aggregation exists" — this is
  REQUIRED scope per that gap, not optional).
- `src/verbs/coordination/show.mjs` renders aggregation state:
  method, outcome, sources, dissent (`dissentRefs`/
  `unresolvedContributionRefs`), unresolved items, failures/omissions
  (`missingActors`/`failedActors`/`unboundSourceOperationRefs`), and
  artifact revisions — reading from `replaySession`'s existing
  `aggregations`/`ignoredAggregations` (already returned, per P07.3).
- Prove aggregation never upgrades RunResult confidence (a `consensus`
  outcome must not retroactively change any Assignment's own recorded
  confidence/status — write a test asserting this explicitly).
- Run CLI/headless parity (mirror the pattern P06's own MVP5/MVP6 work
  used — same request through both the CLI door and the headless adapter,
  same result) and confirm unchanged isolation-heavy fixtures
  (`group-cognition-framework.yaml`-driven tests) stay green.
- Promote contract text: `docs/architect/agent-coordination/contracts/coordination-session.md`'s
  Event Log table gets `aggregation-validated`;
  `docs/architect/agent-coordination/contracts/flow-definition.md`'s
  `CoordinationProtocol` profile section gets `completion.aggregation` —
  same discipline P06.3 modeled (promote only what's implemented/proved,
  name known limitations plainly, including the two residuals already
  written into `P07.3.md`'s Gaps: the opt-in-gate gap you are closing
  here — describe it as CLOSED once your fix lands — and the
  definition-pinned-by-id-not-content residual, which stays a named
  limitation, not fixed here).

### Non-Goals
No new aggregation schema/runtime logic (P07.1-P07.3 closed). No touching
`src/runner/team-cognition/*`'s or `src/runner/coordination/session-engine.mjs`'s
aggregation internals — call/read them, don't edit. No P08/P09 work.

### Must Read
- `plans/260903-2334-step09-mvp6-to-mvp9/phase-07-mvp7-evidence-preserving-aggregation.md` (P07.4 bullets + Exit)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P07.3.md` IN FULL including its Fix Round and Gaps sections — this is your exact starting point, not a re-derivation
- `docs/architect/agent-coordination/contracts/coordination-session.md`, `flow-definition.md` (both — match existing promotion style, see P06.3's Visibility Windows section as the model)
- `src/verbs/coordination/run.mjs` (the `closeSessionByQuorum` call site, ~line 458), `src/verbs/coordination/show.mjs` (the render door you extend)
- `src/runner/coordination/session-engine.mjs` — `closeSessionByQuorum`'s aggregation-consuming branch (read-only reference)
- `src/runner/coordination/headless-adapter.mjs` (CLI/headless parity precedent)

### May Inspect
`test/cli/coordination.test.mjs`, `test/verbs/coordination-run-live-proof.test.mjs`, `test/runner/coordination-aggregation.test.mjs` (existing test-shape precedent).

### Do Not Touch
`src/runner/team-cognition/*`, `src/runner/coordination/session-engine.mjs`'s aggregation/visibility-window internals (call/read only), `src/runner/definitions/*`, `core/coordination-protocols/group-cognition-framework.yaml`, `index.md`/`current-cell.md`.

### Tests First
CLI wiring: a definition declaring `completion.aggregation` with no
validated aggregation refuses close; with a validated `consensus`
aggregation, close proceeds. Show renders every named field. RunResult
confidence never changes from an aggregation outcome (explicit
regression test). CLI/headless parity for at least one aggregation
scenario. Full regression sweep from your own worktree root:
`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test $(find test -name "*.test.mjs" | grep -v coordination-static.test.mjs)`.

### Acceptance
Show/replay presents method, outcome, sources, dissent, unresolved items,
failures/omissions, artifact revisions (Exit bullet, literal). Aggregation
never upgrades confidence (tested). CLI/headless parity proven. Isolation
fixtures unchanged/green. Contract text promoted accurately, limitations
named.

### Bug Taxonomy
Promoting contract text for behavior not implemented/tested; a "parity"
test that doesn't actually exercise both doors; show rendering that
silently drops a dissent/failure field; the aggregation gate becoming
mandatory in a way that breaks a definition with no `completion.aggregation`
declared (must stay opt-in at the SCHEMA level even though this cell
closes the "opt-in gate does nothing" enforcement gap).

### Trace Update
Doer writes `P07.4.md` in ITS OWN worktree. Coordinator integrates after
both cells close and are reviewed.

---

## P09.1 — Slot Schema And Static Legality (Phase 09, MVP9)

### Goal
Schema-only preparation (per phase-09.md: "may start after MVP6, but
cannot integrate before the MVP8 product gate" — do NOT wire this into
session-engine.mjs/dispatch runtime in this cell, schema validation
only, mirroring exactly how P06.1 was schema-only before P06.2 wired
runtime enforcement):
- Add `topology.specialistSlots[]` to FlowDefinition
  (`src/runner/definitions/schema.mjs`), CoordinationProtocol-only
  (restrict to that profile, same pattern as `visibilityWindows`):
  `id`, `role`, `operationRefs[]`, `requiredCapabilities[]`,
  `allowedVisibilityWindows[]`, `maxBindings`, `maxAssignments`.
- Require declared roles/operations/capabilities/visibility windows (each
  must reference something real elsewhere in the definition — dangling
  refs rejected, same discipline as P06.1's `opensAfter.operationRefs[]`).
- Require positive narrowing caps: `maxBindings`/`maxAssignments` must be
  positive integers (reject zero/negative/non-integer).
- Reject explicit runtime edges naming a slot (slots are declarative
  capacity, not a routable topology node) and reject undeclared slot
  expansion (a binding/operation referencing a slot id not declared in
  `topology.specialistSlots[]`).

### Non-Goals
No runtime binding/authorization logic (P09.2). No touching
`session-engine.mjs`, `store.mjs`, `replay.mjs`, dispatch. No
`specialist-authorized` event (P09.2's job). This cell proves legality
statically only.

### Must Read
- `plans/260903-2334-step09-mvp6-to-mvp9/phase-09-mvp9-bounded-specialist-binding.md` (P09.1 bullets + Candidate Contract + Exit)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P06.1.md` (the closest precedent in this whole track — same shape of cell: schema-only, CoordinationProtocol-only, cross-referential validation, zero runtime wiring)
- `src/runner/definitions/schema.mjs` — read `validateProtocolProfile`, the `visibilityWindows` validation block P06.1 added, and `assertVisibilityWindowsReferenceRealOperations` as your direct pattern to mirror for `specialistSlots[]`

### May Inspect
`test/runner/flow-definition-schema.test.mjs` (P06.1's own test section — mirror its structure for your new fields).

### Do Not Touch
`src/runner/coordination/*`, `src/runner/team-cognition/*`, `src/runner/deliberation/*`, `src/verbs/coordination/*`, `core/coordination-protocols/group-cognition-framework.yaml`, `index.md`/`current-cell.md`.

### Tests First
Positive: well-formed `specialistSlots[]` validates. Negative: dangling
role/operation/capability/visibility-window ref; non-positive
`maxBindings`/`maxAssignments`; Workflow-profile use rejected; a
runtime-edge or binding naming an undeclared slot rejected. Regression: a
definition with no `specialistSlots` stays byte/behavior-identical.

### Acceptance
Topology class and operation legality remain fully predeclared/static
(Exit bullet). Zero runtime code touched. All named negative cases
tested.

### Bug Taxonomy
Accepting `specialistSlots` on a Workflow profile; a dangling ref
silently accepted; zero/negative caps accepted; any code path that
resembles dispatch/binding logic sneaking into what should be pure
schema validation (this cell must not become P09.2 early).

### Trace Update
Doer writes `P09.1.md` in ITS OWN worktree. Coordinator integrates after
both cells close and are reviewed.
