# Current Cell: P08.3 (solo — closes Phase 08)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch Doer

P08.2 closed and committed (`a24c250a`, cell-log fix `3e8cad72`). P08.3 runs
solo in this worktree — P09.2/P09.3 stay blocked on the MVP8 product gate
(phase-09.md), so nothing else is ready to pair with it this round.

## P08.3 — Method-Shaped Proofs (Phase 08, MVP8) — closes Phase 08

### Goal (plan's own cell text, phase-08-mvp8-deliberation-memory.md)
- RFC chain: proposal -> objection -> response -> driver disposition.
- Nominal-Group chain: private proposal -> controlled reveal -> clarification
  -> private rank contribution.
- Delphi chain: private proposal -> mediated aggregate artifact -> next-round
  proposal.
- Prove replay works without chat history or hidden driver prose.

### Folded-in prerequisite: close the `contributions.allowedTypes[]` schema gap

P08.1 and P08.2 both independently found and documented the same gap and
both assigned it explicitly to "whichever cell owns `src/runner/definitions/*`
next (P08.3 or P09.2)" (P08.2.md lines 345-355, echoed by P08.1.md's own
Gap #: search "allowedTypes"). It is folded into this cell, not split into
a separate one, because:
- Phase 08's own Exit bullet — "Contribution lineage is durable, bounded by
  declared operation types, and visibility-controlled" — is not true until
  this lands, and P08.3 is the cell that closes Phase 08 (same role P06.3
  played for Phase 06, P07.4 for Phase 07).
- The three method-shaped proof fixtures this cell builds should exercise
  a REAL per-operation `allowedTypes[]` declaration (e.g. an RFC "objection"
  node that may not receive a `rank` contribution) to be genuine proofs,
  not proofs against a synthesized always-allow-everything context.
- It is small: P08.2.md is explicit that "the wiring is already in place
  and pointed at the right place; only the schema field is missing" — one
  field on `spec.operations[]` in `src/runner/definitions/schema.mjs`
  (current whitelist: `OPERATION_FIELDS = {id, role, capabilities, task,
  policy, result}`, no `contributions` key) plus a one-line change to how
  `session-engine.mjs:linkSessionContribution` builds its `declaredOperations`
  map (currently ~line 3550-3558: it synthesizes
  `{allowedTypes: [...CONTRIBUTION_TYPES]}` for every operation — replace
  that synthesis with a real read of the new field, defaulting missing/absent
  to "no types declared" per P08.1's own documented semantics at
  `src/runner/deliberation/schema.mjs:177-192`, NOT to all-types-allowed).

### Must Read (in order)
1. `plans/260903-2334-step09-mvp6-to-mvp9/phase-08-mvp8-deliberation-memory.md`
   — the authoritative cell text quoted above.
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P08.1.md`
   and `.../P08.2.md` — full disposition history, the closed contribution
   model, the ledger/replay/visibility mechanism this cell proves against,
   and both files' own Gaps sections (the allowedTypes gap plus P08.2's other
   two named residuals — definition-content-pinning and unrendered derived
   views/unpromoted contract text, both explicitly OUT of this cell's scope).
3. `src/runner/deliberation/schema.mjs` — `CONTRIBUTION_TYPES`,
   `validateContributionLineage`, `assertOperationAllowsType` (~line 177-192)
   — closed, call it, never fork it.
4. `src/runner/coordination/session-engine.mjs:linkSessionContribution`
   (~line 3410-3585) — the mediated door this cell's fixtures dispatch
   through; the exact synthesis line to replace is ~3557-3558.
5. `src/runner/definitions/schema.mjs` around `spec.operations[]`
   (~line 678-700, `OPERATION_FIELDS`) — closed whitelist to extend by
   exactly one optional field.
6. `core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml`
   — the P06.3 precedent for a committed opt-in fixture proving a Phase's
   mechanism end-to-end; model the new protocol fixture(s) on this shape.
7. `docs/architect/agent-coordination/contracts/coordination-session.md` and
   `flow-definition.md` — the promoted-contract docs P06.3/P07.4 already
   extended for visibility windows and aggregation; this cell adds the
   `deliberation-contribution-linked` event kind's contract row (P08.2 built
   the mechanism but explicitly deferred contract promotion, per its Gaps)
   plus the new `contributions.allowedTypes[]` schema field.
8. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P00.2.md`
   — file-ownership map; confirms `src/runner/definitions/schema.mjs` and
   `src/runner/coordination/session-engine.mjs` are both this cell's to touch.

### May Touch
- `src/runner/definitions/schema.mjs` (add the `contributions.allowedTypes[]`
  field to `spec.operations[]`; keep it optional/backward-compatible — every
  existing fixture and test with no `contributions` key must keep validating)
- `src/runner/coordination/session-engine.mjs` (the `declaredOperations`
  synthesis line in `linkSessionContribution` only — do not reopen any other
  P08.2-hardened logic in this file without a documented reason)
- `docs/architect/agent-coordination/contracts/coordination-session.md`,
  `flow-definition.md` (contract promotion)
- `core/coordination-protocols/*.yaml` (new fixture(s) for the three chains
  — one combined fixture or three small ones, Doer's call, document which)
- New test file(s) under `test/runner/` and/or `test/verbs/` (method-shaped
  proof + replay-without-chat-history proof + the new schema field's own
  validation tests)
- This track's own `docs/architect/agent-coordination/verification/
  step-09-mvp6-to-mvp9/{P08.3.md,index.md,current-cell.md}`

### Do Not Touch
- `src/runner/deliberation/**` (P08.1, closed — call, don't fork)
- `src/runner/team-cognition/**` (P07.1/P07.2, closed)
- `core/coordination-protocols/group-cognition-framework.yaml` (never, per
  the standing coordinator constraint)
- Any P06.2-hardened window-legality logic beyond what's needed to read the
  new field — `deriveVisibilityWindowState`/`resolveOperationOutcome` stay
  as P06.2 Fix Round 4 left them
- `src/runner/coordination/{store,replay}.mjs`,
  `src/verbs/coordination/show.mjs` (P08.2, closed this session — no known
  reason this cell needs to touch them; if one turns up, name it explicitly
  rather than editing silently)

### Bug Taxonomy To Test Against (in addition to positive-path proofs)
- **Caller-supplied-definition bypass (shipped 3x already this track):**
  the new `declaredOperations` derivation MUST read the field from the
  session's own resolved `definition` (via `manifest.definitionRef`,
  already how `linkSessionContribution` resolves `definition` today) —
  never accept it as a parameter. Write a static signature/behavior test
  proving this, matching P08.2's own precedent.
- **Vacuous-gate regression:** a test proving an operation that declares
  `allowedTypes: ['proposal']` genuinely REJECTS a `rank` contribution
  through the real mediated `linkSessionContribution` door (not just
  through the pure validator with a hand-built context) — this is the
  exact property P08.2.md named as currently untested/untrue.
- **Missing-field default direction:** an operation with no `contributions`
  key at all must default to "declares no allowed types" (reject
  everything), matching `assertOperationAllowsType`'s existing documented
  semantics — NOT silently default to all-types-allowed (that would just
  re-create the vacuous gate under a different name). Test both an
  operation with an empty `allowedTypes: []` and one with the key entirely
  absent; both must reject.
- **Chat-history-free replay:** for each of the three chains, a test that
  reconstructs the full lineage (who proposed what, what was objected to,
  what responded to it, what the driver disposed) from `replay.mjs`'s
  projection alone, with no reference to any out-of-band prose — matching
  the Exit bullet "Prove replay works without chat history or hidden
  driver prose."
- **Nominal-Group privacy shape:** the "private proposal -> controlled
  reveal" step must actually exercise a visibility-window gate (reuse
  MVP6 mechanism, don't reimplement) — a proposal contribution linked
  before the reveal window opens must be rejected or provably not visible
  to other participants' context, matching this cell's own "visibility-
  controlled" Exit criterion.
- **Backward compatibility:** every existing fixture/test with no
  `contributions` key on any operation must still validate unchanged
  (the new field is additive) — run the full `flow-definition-schema.test.mjs`
  and `coordination-static.test.mjs` suites, not just new tests.

### Acceptance
- New `contributions.allowedTypes[]` field lands in
  `src/runner/definitions/schema.mjs`'s operation whitelist, optional,
  backward-compatible, with schema-level validation tests (each entry a
  real `CONTRIBUTION_TYPES` member, no duplicates — mirror
  `deliberation/schema.mjs`'s own enum-membership check style).
- `linkSessionContribution`'s `declaredOperations` synthesis reads the
  real field instead of `[...CONTRIBUTION_TYPES]`; the vacuous-gate
  regression test above passes; the missing-field-defaults-to-reject test
  passes.
- Three fixture(s) proving RFC / Nominal-Group / Delphi chains exist under
  `core/coordination-protocols/`, each exercising the shapes named above,
  with a passing end-to-end test per chain plus a chat-history-free replay
  test per chain.
- Full focused suite for touched files green; full sweep re-run from the
  MAIN CHECKOUT (never this worktree — `coordination-static.test.mjs`
  false-fails on the substring "worktree") shows no new failures beyond
  the standing baseline (`fgos-intake-4.test.mjs:318`) and known
  load-induced flakes (verify any suspicious full-suite-only failure by
  re-running that file alone before concluding it's a regression).
- `docs/architecture-manifest.json` has a row for any new `.mjs` module
  (unlikely for this cell — check before assuming none needed).
- Contract docs (`coordination-session.md`, `flow-definition.md`) promoted
  for the new field and, if not already promoted by a residual carried
  from P08.2, the `deliberation-contribution-linked` event kind.
- Write `P08.3.md` following this track's established Design Notes / Proof
  Matrix / Gaps format (see P08.2.md as the most recent example) — name any
  deferred residual honestly rather than silently dropping it.

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
(P08.3.md is the durable record; P08.3-review.md / P08.3-red-team.md for
the independent first-pass rounds, matching P08.2's naming).
