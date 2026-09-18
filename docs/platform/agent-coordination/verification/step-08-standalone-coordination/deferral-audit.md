# Step 08 Final Deferral Audit

Track: `step-08-standalone-coordination`
Plan: `plans/260901-1542-step08-standalone-coordination/plan.md`
Cell: P07.2 (Phase 07 R8 -- closes Phase 07 and the whole 8-phase plan)
Template: `docs/architect/agent-coordination/intent-preservation-ledger.md`'s own
"Deferral Audit Template"

Scope: every entry AC-I001 through AC-I009 in the
[Intent Preservation Ledger](../../intent-preservation-ledger.md), audited
against real, checked evidence -- not claimed without verification. Every row
below was cross-checked directly against the cited trace file, test command,
or live-proof artifact before being written; no status here is asserted from
narrative alone. Per this ledger's own governing rule: *"Only an explicit
human decision may mark an original intention `superseded` or `rejected`."*
No entry below is marked `superseded` or `rejected` -- every non-`implemented`
entry stays `deferred-preserved`, exactly as before, with its revisit trigger
intact.

## Deferral Audit

| Intent ID | Before (2026-09-01, Phase 00 close) | Evidence produced (Phases 01-07) | After | Must-not-preclude check |
|---|---|---|---|---|
| AC-I001 | `deferred-preserved` beyond the inline-Assignment slice | Persistent standalone CoordinationSession (P01.1 store/schema/events, P01.2 session-engine + live proof); re-exercised with `workId: null`, no protocol id, in P07.2's own R5/R6 live runs | `implemented` | Pass -- no universal Work/Stage/Workflow/TaskSpec requirement anywhere in `src/runner/coordination/**` (static architecture check + every live proof in this track ran with `workId: null`) |
| AC-I002 | `deferred-preserved` | `openStandaloneSession`/`dispatchPrimaryTask`/`proposeConsult` (P01.2), live-proved for `claude` and `glm-cli`; re-exercised live at P07.2 R5/R6 with `kind: "agent-led"`, no `protocolRef` | `implemented` for the accepted V1 shape (one primary actor plus dynamic consult); `deferred-preserved` for richer dynamic task graphs beyond that | Pass -- `protocolRef` remains schema-optional (`kind: "agent-led"` requests never carry it, `src/verbs/coordination/schema.mjs` rejects `protocolRef` when `kind` is `"agent-led"`) |
| AC-I003 | `deferred-preserved` | Shared `FlowDefinition` kernel (P02.1/P02.2); declared consult (P03), research fan-out/fan-in (P04), Group Cognition (P05), all statically proven to reach `executeAssignment` with no direct spawn (`test/runner/coordination-static.test.mjs` and this track's own recurring static-import precedent); discoverable from a real external consuming project (P07.2 R6, `fgos doctor`'s `coordination-protocol-fixtures-valid` check from mdview's own cwd against the installed package: "3 CoordinationProtocol definition(s) discovered") | `implemented`; `deferred-preserved` for broad protocol catalog/marketplace/unrestricted peer chat | Pass -- protocols remain optional (`kind: "declared-protocol"` is one of exactly two request kinds, never mandatory) and create no second execution core (static proof above) |
| AC-I004 | `deferred-preserved` | Deterministic Cohort Planner, zero scoring/ranking (P04.1); isolated concurrent fan-out, fan-in never upgrades evidence (P04.2); one real 6-phase Group Cognition framework declared and live-run against a real external question (P05.1/P05.2) | `implemented` at the mechanism level (structural must-not-preclude proofs pass); real-world quality gain over a single agent remains an open empirical question -- P05.2's own live run returned an honest null result (8 of 9 real dispatches failed for infrastructure/dispatch-layer reasons, not reasons traceable to the framework's cognitive design), which Phase 05's own accepted exit criterion explicitly treats as a valid, non-blocking close | Pass (mechanism) -- independent branches cannot read sibling outputs before fan-in (P04.2, static context-isolation proof); synthesis never upgrades `reported`/failed/stale/foreign evidence (P04.2, code-reviewed and live-observed at P05.2: the evidence-reviewer caught a real critic error rather than silently trusting it). Not evaluable (value) -- the framework's own critical-challenge gate never ran against real content in P05.2's live run |
| AC-I005 | `deferred-preserved` | Project/domain/core discovery seam (P02.2, `discoverCoordinationProtocols`/`loadCoordinationProtocol`), zero foundation fork (`src/runner/dispatch/**` and `src/runner/coordination/**` stayed at zero diff for all of Phase 02); reachable from a REAL external consuming project's own cwd via the installed package, not source checkout (P07.2 R6) | `implemented` for the discovery seam; `deferred-preserved` for organization overlay syntax/general extension SDK | Pass -- project/domain-owned definitions and policy enrichment flow through the same validated kernel (`validateFlowDefinition`, one function, no fork) |
| AC-I006 | `implemented` for individual Assignment execution with a known provenance defect (finding H2) | H2 fixed at P00.2/P00.4 (`deriveProviderFamily` call-site disagreement, confirmed affecting 3 of 12 registered executors); Cohort Planner emits inputs to the existing resolver, never spawns directly (P04.1, statically confirmed); 7-scope PolicyPatch precedence chain (P03.1); adversarially tested clean at P06.2 (5 real bugs found+fixed across recovery/budget/evidence-laundering attacks) and again at P07.1's R2 request/schema trust boundary (12 distinct adversarial constructions, no bypass found on first attempt) | `implemented` | Pass -- governance remains final (traced end to end at P04.2b: tier only selects a model for an already-fixed, governance-gated provider); no profile/role/Skill/protocol/coordinator has a private executor path (every dispatch call site in this track routes through `resolveAssignmentDispatchPolicy`/`executeAssignment`) |
| AC-I007 | `deferred-preserved`, not replaced or rejected | Direct mission-lite cutover (P01.1) dropped `missionId` from Assignment construction entirely; P07.1's request/schema trust boundary recursively rejects `missionId` (and every other Work-lifecycle key) at any nesting depth, adversarially tested clean | `deferred-preserved` -- unchanged, by design (Mission identity/persistence/aggregation is explicitly Out Of Scope for the whole of Step 08, plan.md's own words) | Pass -- `missionId` is structurally unreachable from any coordination request or Assignment (schema rejection + zero live field), so a future Mission can reference N session ids without rewriting any of them |
| AC-I008 | `deferred-preserved` | Headless adapter (P07.1, `runCoordinationHeadless`, proven by reference identity to call the exact same `runCoordinationUseCase` the CLI calls); P07.2's own R5 proof: the same deterministic `declared-consult` fixture through both doors, full persisted-state diff (manifest, Assignments, policy provenance, Runs/RunResults, evidence, quorum, budgets, final status) -- zero unexplained differences after normalizing only named, justified volatile fields; matching negative-case parity confirmed (identical `StoreError` message + category on both doors) | `implemented`; `deferred-preserved` for telemetry only (explicitly out of V1 scope, never built) | Pass -- no interactive-only or headless-only engine/contract/protocol-semantics/recovery/evidence model exists (one shared `runCoordinationUseCase`, R5's own diff is the executable proof) |
| AC-I009 | `deferred-preserved` | P06.2 added a static export-surface check confirming zero merge/Work-transition capability anywhere under `src/runner/coordination/**`; P07.1's R2 trust boundary additionally rejects `mutation` unless the literal string `"read-only"`, at every step/branch/task nesting level, adversarially tested clean | `deferred-preserved` -- unchanged, by design (Work-attached mutating coordination is an explicit stop gate for the whole of Step 08, plan.md's own Locked Product Decisions) | Pass, currently vacuously for the concurrency-refusal half (V1 has no mutating-actor capability at all yet, so "two mutating actors never run concurrently" cannot yet be violated); Pass structurally for the no-private-authority half (static export-surface check + schema-level `mutation` rejection, both above) |

No ledger intention was removed or reinterpreted by omission. Every
`deferred-preserved` row above (AC-I004's residual scope, AC-I007, AC-I009,
plus AC-I002/AC-I003/AC-I005's residual sub-scopes) keeps its original
revisit trigger from the ledger, unedited.

## Explicitly preserved as `deferred-preserved` (per this cell's own scope)

Named here verbatim, per this cell's own Do-Not list, so none of these is
ever silently dropped:

- **Mission** (identity, persistence, aggregation, migration compatibility) --
  AC-I007. Revisit when one objective demonstrably needs multiple
  independently executable sessions, or Step 8.Final (this cell) evaluates a
  second consumer -- evaluated here: no second consumer has appeared: still
  deferred.
- **More Group Cognition frameworks** (beyond the one built at P05.1) --
  AC-I004's own "complete framework library" deferred item. Revisit when a
  second framework needs a missing primitive, or after a repeat live quality
  proof outside P05.2's observed infrastructure friction.
- **Organization overlays** (overlay syntax, general extension SDK) --
  AC-I005. Revisit when two real consumers prove a common seam; mdview
  (P07.2 R6) is the first real external consumer of the DISCOVERY seam only,
  not yet of an organization overlay -- trigger not met.
- **First-class AgentMessage** and **general AdhocTask storage** -- named in
  plan.md's Out Of Scope list; not built, not referenced by any accepted
  ADR/contract as implemented. No ledger entry names these as their own
  AC-I00x; they remain proposal-stage discussion only, per
  `docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md`.
- **Provider scoring/router** (autonomous provider routing, cost
  optimization, learned/weighted scoring) -- AC-I006's own "Deferred" bullet
  (`purpose` cross-definition routing dropped from FlowDefinition V1 per
  ADR-009 finding M8). Revisit trigger: two real definitions need shared
  task-category routing -- not met.
- **Telemetry** -- AC-I008's own "Deferred" bullet, explicit Locked Product
  Decision ("Interactive ships first for explicit observation... telemetry
  is deferred"). Never built in any phase.
- **herdr** (as an evidence/execution mechanism beyond visibility) -- P07's
  own R4 requirement text: "Do not use herdr in this phase," confirmed by
  `headless-adapter.mjs`'s own header comment ("It does not use herdr").
  ADR-005 ("Herdr Is Visibility, Not Evidence") remains the governing
  decision; unchanged by Step 08.
- **Work-attached mutation** -- AC-I009. Revisit when any mutating
  Assignment, coding-domain protocol, or Work-attached session enters a
  future plan; a coding-domain live proof must cover resource conflict,
  worktree allocation, serialization, merge ownership, recovery, and Work
  transition authority first. Not attempted in Step 08.

## Test-suite verification backing this audit

Focused suite (P07.2, this cell, independent run):

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/cli/fgos-manifest.test.mjs 'test/cli/*coordination*.test.mjs' \
  'test/runner/coordination-*.test.mjs' test/install-packaging.test.mjs \
  'test/setup/*.test.mjs'
```

Full suite (P07.2, this cell, independent run): see this cell's own trace
file (`P07.2.md`, Coordinator-owned, written after independent review closes)
for the exact pass/fail counts and baseline-match confirmation, matching the
discipline every prior cell in this track's `index.md` already follows.

## Disposition

Phase 07 R8 (this audit): closed. Every AC-I001-I009 row carries an explicit
status and a real, checked proof link. Combined with R5 (capability-parity
live proof), R6 (external-adoption live proof), and R7 (canonical closure --
ADR-008/ADR-009/ADR-010/`coordination-session.md`/`flow-definition.md`
Implementation-status metadata updated, `decisions/README.md` and the
proposal's own pointers corrected), Phase 07 -- and per plan.md's own Phase
table, the entire `step-08-standalone-coordination` plan -- closes.
