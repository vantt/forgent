# Current Cell: P09.3 (solo — closes Phase 09)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch Doer

P09.2 closed and committed (`efe1bc68`, cell-log fix `adbe8b86`) — 1 HIGH
fixed, independently rechecked clean. P09.3 runs solo in this worktree.

## P09.3 — Negative And Recovery Proof (Phase 09, MVP9) — closes Phase 09

### Goal (plan's own cell text, phase-09-mvp9-bounded-specialist-binding.md)
- Reject worker/peer authorization, unknown slot, role/capability
  mismatch, second or over-cap binding, foreign context, over-cap
  Assignment, expired or terminal session, and slot use in isolation
  fixtures.
- Crash between authorization, actor binding, and Assignment creation
  resumes without duplicate actors or Assignments.
- Prove no `addSessionEdge`, topology overlay, Work, git, or coding
  mutation path is reachable.

### What's already covered — read this before writing new tests
P09.2's own Bug Taxonomy work (plus its Fix Round 1) already built REAL,
mediated-door tests for most of this cell's negative-proof list, in
`test/runner/coordination-specialist-binding.test.mjs`: non-driver
authorization refused, unknown slotId refused, role mismatch refused,
capability mismatch refused, over-cap `maxBindings` refused (new,
different specialist), over-cap `maxAssignments` refused, foreign
`triggerEvidenceRefs`/`allowedContextRefs` refused, terminal-session
authorization refused, expired authorization refused (with the
round-derivation fix), specialistActorId/static-actor-id collision
refused. **Do not re-derive these from scratch.** Read that file first,
confirm each of these is genuinely present and passes, and treat this
cell's job for that portion as making the coverage DELIBERATE and
COMPLETE against the phase's own list (naming any item you find still
missing) — not starting over.

### What is NOT yet covered — this cell's real new work
1. **Crash recovery.** Nothing today proves that a crash between
   authorization, actor binding, and Assignment creation resumes cleanly
   with no duplicate actors or Assignments. Model this on
   `test/runner/coordination-recovery-and-quorum.test.mjs`'s own
   `retrySessionTask` "crash point ..." test naming convention (e.g.
   "crash point ... resumes without minting a second specialist-authorized
   event", "crash point ... resumes without a duplicate Assignment").
   Since this cell's own authorization+binding write is a SINGLE
   `appendEventLocked` call (P09.2's own atomicity property, already
   Reviewer-verified — see P09.2.md), the crash points to actually test
   are: (a) before vs. after that one write commits (idempotent retry
   with the same `specialistAuthorizationId` — a test for this already
   exists, "a repeated call with the same specialistAuthorizationId is
   idempotent," in `coordination-specialist-binding.test.mjs:490` — read
   it, and extend/mirror it into a proper crash-shaped test here if it
   isn't already framed that way); (b) between a successful
   `specialist-authorized` write and the FIRST Assignment for that
   specialist being created — resuming (retrying the same dispatch
   request) must not double-authorize or double-dispatch.
2. **No `addSessionEdge`/topology-overlay/Work/git/coding mutation path
   reachable.** `addSessionEdge`/`addSharedEdge` does not exist anywhere
   in `src/` (grepped, confirmed absent) — this is a proof of ABSENCE,
   not a runtime refusal. Model this on P09.1's own Req 7/8 structural
   closure methodology and on `test/runner/coordination-r7-work-isolation.test.mjs`'s
   existing static-source-scan tests (e.g. "no exported function/const/
   class name anywhere in src/runner/coordination/** is shaped like a
   branch/worktree/merge/approve/Work-transition operation" — read that
   file's exact pattern). Extend or add a sibling static-scan test
   confirming: no new function this track's MVP9 cells added
   (`authorizeSpecialistSlot`, `recordSpecialistAuthorization`,
   `resolveLiveSpecialistBindings`, etc.) accepts a caller-suppliable
   "mutation"/edge/topology-overlay parameter, and no exported name in
   `src/runner/coordination/**`/`src/runner/definitions/**` is
   git/Work/coding-lifecycle-shaped. This is a structural/static proof,
   cheap to build correctly, not a live-exploit hunt.
3. **"Slot use in isolation fixtures."** Read
   `test/runner/coordination-r7-work-isolation.test.mjs` in full — this
   is almost certainly the "isolation fixtures" the phase spec means
   (R7 = read-only isolation from Work/git/coding mutation, the same R7
   this file's own tests are named for). Confirm the specialist-slot
   mechanism doesn't weaken any existing R7 guarantee (e.g. that
   `dispatchDeclaredOperation`'s hardcoded `mutation: 'read-only'`
   contract still applies uniformly to a specialist-dispatched Assignment,
   not just a statically-`actor`-bound one) — add a targeted test if a
   gap is found, otherwise state explicitly that the existing R7 tests
   already cover the specialist path (with reasoning, not assertion).
4. **Contract-doc promotion**, deferred by P09.2 per the established
   P06.3/P07.4/P08.3 "closes-the-phase" pattern:
   `docs/architect/agent-coordination/contracts/coordination-session.md`
   gets a `specialist-authorized` Event Log row + a short mechanism
   section (mirroring P08.3's "Deliberation Contribution Ledger" section
   as the shape precedent); `flow-definition.md` gets the
   `specialistSlotRef` node-operation-binding field row (P09.1 already
   promoted `specialistSlots[]` itself — check, don't re-promote it).

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-09-mvp9-bounded-specialist-binding.md`
   — authoritative phase spec, all three P09 cells + Exit bullets.
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P09.2.md`
   in full, including its Fix Round 1 and Recheck sections — the
   mechanism this cell proves negative/recovery properties against.
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P09.1.md`
   — Req 7/8's structural closure methodology, the precedent for item 2
   above.
4. `test/runner/coordination-specialist-binding.test.mjs` — full read,
   confirms what's already covered (§ above).
5. `test/runner/coordination-recovery-and-quorum.test.mjs` — the
   "crash point ..." test naming/shape precedent for item 1 above.
6. `test/runner/coordination-r7-work-isolation.test.mjs` — the isolation
   fixture precedent for items 2 and 3 above.
7. `docs/architect/agent-coordination/contracts/coordination-session.md`
   and `flow-definition.md` — read the existing structure before adding
   to it; P08.3.md's own promoted-text diff is the shape precedent
   (Design Notes / Named limitations pattern).
8. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md`
   — file-ownership map.

### May Touch
- `test/runner/coordination-specialist-binding.test.mjs` (extend, don't
  fork — add crash-recovery tests here or in a clearly-named sibling file,
  your call, name the choice)
- `test/runner/coordination-r7-work-isolation.test.mjs` (extend with the
  specialist-slot static-scan coverage, matching its existing pattern)
- `docs/architect/agent-coordination/contracts/{coordination-session.md,flow-definition.md}`
  (contract promotion)
- `src/runner/coordination/session-engine.mjs` ONLY if a genuine crash-
  recovery gap is found requiring a real fix (not expected — P09.2's
  mechanism was built atomic and Reviewer/Red-Team both verified this;
  if you find you need to change runtime code here, treat it as a real
  finding requiring the same rigor as a Fix Round, and name it loudly in
  P09.3.md rather than quietly patching)
- This track's own `docs/architect/agent-coordination/verification/
  step-09-mvp6-to-mvp9/P09.3.md` — do NOT edit `current-cell.md`/`index.md`
  yourself (Coordinator-owned)

### Do Not Touch
- `src/runner/deliberation/**`, `src/runner/team-cognition/**`
- `core/coordination-protocols/group-cognition-framework.yaml` (never)
- `src/runner/definitions/schema.mjs`, `src/runner/coordination/{schema,store,replay}.mjs`,
  `src/verbs/coordination/show.mjs` — this is a PROOF cell, not an
  implementation cell; no schema/runtime changes expected. If Must-Read
  reveals a genuine need, stop and name it explicitly in your report
  rather than editing silently.

### Acceptance
- Every item in phase-09.md's own P09.3 negative-proof list has a real,
  mediated-door test, either already-existing (confirmed and cited) or
  newly added — a single Proof Matrix row per item in P09.3.md, same
  format P09.1/P09.2 used.
- Crash-recovery is proven with at least the two crash points named
  above, real tests, no mocked I/O (matching
  `coordination-recovery-and-quorum.test.mjs`'s own "real cross-process
  race, no mocked I/O" discipline where applicable).
- The addSessionEdge/topology-overlay/mutation-path absence is proven
  structurally (static scan), matching P09.1 Req 7/8's and
  `coordination-r7-work-isolation.test.mjs`'s existing methodology.
- Contract docs promoted for `specialist-authorized` and
  `specialistSlotRef`, matching the established Design Notes / Named
  limitations shape.
- Focused suite for touched files green; combined focused regression
  green; full sweep re-run from the MAIN CHECKOUT (never this worktree)
  shows no new failures beyond the standing baseline
  (`fgos-intake-4.test.mjs:318`) and known load-induced flakes.
- Write `P09.3.md` in this track's established format. This cell CLOSES
  Phase 09 — its own Exit bullets ("Unknown specialist identity can fill
  a known bounded cognitive need," "Topology class and operation legality
  remain predeclared," "Workers may request but never authorize
  recruitment") must be checked off explicitly, each against real
  evidence, the same way P06.3/P07.4/P08.3 closed their own phases.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
