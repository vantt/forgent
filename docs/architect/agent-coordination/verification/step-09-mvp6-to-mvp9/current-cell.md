# Current Cell: P09.2 (solo)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch Doer

P08.3 closed and committed (`f9c98501`, cell-log fix `409b7aa6`) — Phase 08
is done, the MVP8 gate phase-09.md named is lifted. P09.2 runs solo in this
worktree.

## P09.2 — Authorization, Binding, And Replay (Phase 09, MVP9)

### Goal (plan's own cell text, phase-09-mvp9-bounded-specialist-binding.md)
- Serialize slot authorization against terminal transition and competing
  slot claims.
- Atomically record authorization and session-scoped actor binding before
  any Assignment is issued.
- Use existing `operation-authorized` for each specialist invocation.
- Expiry prevents future Assignments but never erases actor/event history.
- Replacement requires a new driver authorization and remains within slot
  and session caps.

### Candidate Contract (authoritative field list)
```text
specialist-authorized
  specialistAuthorizationId
  slotId/specialistActorId/role/capabilities
  authorizedBy/reason/triggerEvidenceRefs/allowedContextRefs
  maxAssignments/expiresAfterRound/ts
```
This event kind and field list are already fully specified by the phase
spec — do not redesign the fields, implement exactly these.

### The central open design question this cell must resolve
P09.1 (closed, `9b81427c`) proved as a structural CLOSURE property that
**no field anywhere in the current schema resolves a graph node
operation's `actor` against a `specialistSlots[]` id** (`NODE_OPERATION_REF_FIELDS
= {ref, actor, activation, contextAccess}` in `src/runner/definitions/schema.mjs`
has no slot-referencing field; `resolveDeclaredOperationActor` in
`session-engine.mjs` only ever resolves `actor` against `spec.actors[]`).
That closure was P09.1's own Acceptance requirement (a slot must not be a
routable/expandable topology surface until this cell deliberately wires
it) — it means today there is **no path at all** for an authorized
specialist actor to be dispatched against a declared operation. This cell
must design and implement that wiring. Concretely, at minimum:
- A node operation binding needs a way to declare "this binding may be
  filled by an authorized occupant of slot X" as an ALTERNATIVE to (never
  in addition to an unrelated) a static `actor` id — most likely a new
  optional field alongside `actor` on the node-operation-ref shape (e.g.
  `specialistSlotRef`), schema-validated the same way `contextAccess` is
  today (`src/runner/definitions/schema.mjs`, `NODE_OPERATION_REF_FIELDS`
  and its validator) — a slot id, not a literal actor id.
- `authorizeDeclaredOperation`/`dispatchDeclaredOperation`/
  `resolveDeclaredOperationActor` need a resolution path that, given a
  binding naming `specialistSlotRef` instead of `actor`, finds the
  currently-bound `specialistActorId` for that `slotId` in THIS session
  (from a live, unexpired, non-superseded `specialist-authorized` record)
  and resolves through it — refusing cleanly (a named, actionable error,
  not a crash) if no specialist is currently bound to that slot.
- This wiring must preserve every closure property P09.1 already proved:
  a specialist can act ONLY on the slot's declared `operationRefs[]`, only
  with the slot's declared `role`/`requiredCapabilities`, only under the
  slot's declared `allowedVisibilityWindows[]`, and never via
  `addSharedEdge`/topology mutation/undeclared expansion.
- Document the concrete mechanism chosen (in P09.2.md's Design Notes) —
  this is a real design decision, not a mechanical wiring task; if a
  narrower or different mechanism turns out cleaner after reading the
  code, use it, but name the alternative considered and why.

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-09-mvp9-bounded-specialist-binding.md`
   — the authoritative phase spec (all three P09 cells + Exit bullets).
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P09.1.md`
   in full — the closed schema, its Proof Matrix (especially Req 7 and 8,
   the topology-mutation and actor-resolution closure properties this
   cell must not break), and its Design Notes.
3. `src/runner/definitions/schema.mjs` — `SPECIALIST_SLOT_FIELDS`,
   `validateSpecialistSlot`, `assertSpecialistSlotsReferenceRealEntities`,
   `NODE_OPERATION_REF_FIELDS`, `validateNodeOperationRef` (the binding
   shape this cell likely extends).
4. `src/runner/coordination/session-engine.mjs`:
   - `authorizeDeclaredOperation` (~1374-1460) and the `operation-authorized`
     event it writes — the reusable authorization-door PATTERN this cell's
     Candidate Contract explicitly says to reuse for "each specialist
     invocation" (the new `specialist-authorized` event is a DIFFERENT,
     new event kind for binding capacity itself — read both and keep them
     distinct: `specialist-authorized` binds an unknown actor identity to
     a slot; `operation-authorized` still gates each individual dispatch
     of a `driver-authorized` operation, same as for any other actor).
   - `resolveDeclaredOperationActor` (~857) — the function this cell must
     extend or wrap for slot-based resolution.
   - `dispatchDeclaredOperation` (~1761 onward) — the consumer this cell's
     new resolution path must integrate with.
   - `proposeConsult`/`recordConsultDisposition`/`validateConsultProposal`
     (~529-700+) — read this as a CONTRAST, not a template: it is the
     older, worker-INITIATED, single-consult-round mechanism from an
     earlier MVP track. Phase 09's own Exit bullet is explicit: "Workers
     may request but never authorize recruitment" — `specialist-authorized`
     must be a DRIVER-only door (mirroring `authorizeDeclaredOperation`'s
     own driver-only activation-mode gate), never reachable from a worker
     proposal path like `proposeConsult` is. Do not extend or fork
     `proposeConsult` for this cell's mechanism.
   - `replaceSessionActor` (~3834+) — precedent for "replace a bound actor
     under caps," relevant to this cell's "Replacement requires a new
     driver authorization and remains within slot and session caps."
5. `src/runner/coordination/schema.mjs` — event-kind registration pattern
   (`aggregation-validated`, `deliberation-contribution-linked` are the
   two most recent precedents in this track for "new session event kind,"
   both content-free/ref+revision-only where applicable — this event kind
   is NOT content-free, its own field list above includes real
   authorization data, so model it more closely on `operation-authorized`'s
   own existing schema shape instead).
6. `src/runner/coordination/store.mjs` — `recordAggregationValidation`,
   `recordContributionLink` as precedent for "new session event door";
   this cell adds `recordSpecialistAuthorization` (or equivalent name).
7. `src/runner/coordination/replay.mjs` — projection precedent
   (`aggregations`, `contributions`) for how this cell surfaces bound
   specialists / their remaining caps from replay.
8. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md`
   — file-ownership map, confirms this cell's files are its own to touch.

### May Touch
- `src/runner/definitions/schema.mjs` (the node-operation binding
  extension named above — additive, backward-compatible; every existing
  fixture/test with a plain `actor` binding must keep validating unchanged)
- `src/runner/coordination/{schema,store,replay,session-engine}.mjs`
- `src/verbs/coordination/show.mjs` (if a mirror is needed for
  disposition-ownership or read-surface parity, matching P08.2's own
  precedent of keeping write-door and read-mirror rules in sync)
- New test file(s) under `test/runner/`
- `docs/architect/agent-coordination/contracts/{coordination-session.md,flow-definition.md}`
  (contract promotion, once the mechanism is proven — may be deferred to
  P09.3 if that cell is explicitly the "closes the phase" proof/promotion
  cell per this track's established P06.3/P07.4/P08.3 pattern; Doer's
  call, name the choice)
- This track's own `docs/architect/agent-coordination/verification/
  step-09-mvp6-to-mvp9/{P09.2.md,index.md,current-cell.md}` — but per
  standing Coordinator/Doer split, do NOT edit `index.md`/`current-cell.md`
  yourself; write `P09.2.md` only

### Do Not Touch
- `src/runner/deliberation/**`, `src/runner/team-cognition/**` (closed,
  unrelated to this phase)
- `core/coordination-protocols/group-cognition-framework.yaml` (never)
- `proposeConsult`/`recordConsultDisposition`/`validateConsultProposal`
  and their event kinds — read-only precedent, not a file this cell edits
- Any already-hardened P06.2/P07.3/P08.2 window/aggregation/contribution
  logic beyond what's needed to reuse it as a caller

### Bug Taxonomy To Test Against (phase-09.md's own P09.3 list, pulled
forward as things THIS cell's mechanism must already refuse correctly —
P09.3 is the dedicated negative-proof cell, but P09.2's own Acceptance
should not ship a door with an obviously missing refusal)
- **Worker/peer authorization refused.** `specialist-authorized` must be
  driver-only, matching `authorizeDeclaredOperation`'s own gate style.
- **Unknown slot id refused.**
- **Role/capability mismatch refused** (authorization naming a role or
  capability set the slot doesn't declare).
- **Over-cap binding refused** (`maxBindings` — a slot already at its
  binding cap cannot accept a new, different specialist actor).
- **Over-cap assignment refused** (`maxAssignments` — a bound specialist
  cannot be dispatched beyond its authorization's own cap).
- **Foreign context refused** (`allowedContextRefs`/`triggerEvidenceRefs`
  must be owned-by-session, reusing `assertRefsOwnedBySession`, never a
  freshly-invented check).
- **Expired or terminal session refused**, and expiry "prevents future
  Assignments but never erases actor/event history" — an expired
  authorization must still replay correctly, never be deleted/rewritten.
- **The caller-supplied-definition bug class (shipped 4x already this
  track: P06.2, P07.3, P07.4, and P08.2's near-miss closed from the
  start).** Every new function this cell adds MUST resolve `definition`
  internally via `manifest.definitionRef`, never accept it as a parameter.
  Write a static signature test proving this, matching P08.2/P08.3's own
  precedent.
- **Atomicity**: "record authorization and session-scoped actor binding
  before any Assignment is issued" — a crash between authorization and
  actor-binding, or between actor-binding and the first Assignment, must
  resume cleanly with no duplicate actor entries and no orphaned
  Assignment (full crash-recovery proof is P09.3's job, but this cell's
  own mechanism must not have an obvious non-atomic window — name any
  residual ordering risk honestly in Gaps if one remains).

### Acceptance
- `specialist-authorized` event lands with exactly the Candidate
  Contract's field list, written by a new store door, driver-only,
  validated against real slot/session state (not caller-trusted).
- A previously-unknown `specialistActorId` becomes a legitimate dispatch
  target for the slot's declared `operationRefs[]` ONLY, through a real,
  documented resolution mechanism — proven by at least one end-to-end
  test that dispatches a declared operation to a freshly-authorized
  specialist actor via the real `dispatchDeclaredOperation` door.
- Every refusal in the Bug Taxonomy above has a real, mediated-door test
  (not a hand-built context).
- Replacement is proven: a new driver authorization for the same slot,
  after the prior specialist's authorization is superseded/expired,
  succeeds and remains within slot/session caps; the prior authorization's
  event history is never erased or rewritten.
- Focused suite for touched files green; combined focused regression
  across defs/coordination/verbs test directories green; full sweep
  re-run from the MAIN CHECKOUT (never this worktree —
  `coordination-static.test.mjs` false-fails on the substring "worktree")
  shows no new failures beyond the standing baseline
  (`fgos-intake-4.test.mjs:318`) and known load-induced flakes (verify any
  suspicious full-suite-only failure by re-running that file alone first).
- `docs/architecture-manifest.json` updated if any new `.mjs` module is
  created (unlikely — check before assuming none needed).
- Write `P09.2.md` in this track's established Design Notes / Proof
  Matrix / Gaps format (P08.3.md is the most recent example of the shape;
  don't copy its content). Name the slot-to-actor wiring mechanism chosen
  and why, explicitly, in Design Notes — this is the cell's central
  contribution and must be legible to a stranger with no chat history.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
