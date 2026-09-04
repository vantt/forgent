# Current Cell: P10-KERNEL-FIX (solo — user-authorized kernel change)

Status: in-progress
Owner: Coordinator (this session)
Last updated: 2026-09-04
Next action: dispatch Doer

**User-authorized scope extension, 2026-09-04.** P10.6/P10.7/P10.8's own
independent Reviewer+Red-Team rounds converged on the SAME kernel-level
finding across three different protocols, escalated to CRITICAL by
P10.7's own Red-Team live-reproducing it against the already-CLOSED
P10.6/RFC-Review-Lite protocol under entirely normal, documented usage.
The user was shown the evidence and explicitly chose to fix it now
rather than defer it. This cell is that fix. It touches
`src/runner/coordination/session-engine.mjs`, previously Do-Not-Touch
for every Phase 10 cell — that restriction is lifted for THIS cell only,
by explicit user authorization, not a Coordinator judgment call.

## The finding, precisely (read the three source reports before designing anything)

1. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.6.md`
   — original discovery (RFC-Review-Lite), Design Notes + Disposition
   (the Disposition section is the CORRECTED, escalated framing — read
   it, not just the original Design Notes, which understated it).
2. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.7.md`
   — second, independent discovery (Nominal-Group-Lite) plus the
   Red-Team's live reproduction against P10.6's own closed protocol —
   read the Disposition section in full, it is the single most important
   piece of evidence for this cell.
3. `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.8.md`
   — third, independent discovery (Delphi-Feedback-Lite), the sharpest
   concrete instance (a whole protocol phase, `aggregate`, becomes
   permanently unreachable, not just "resume is harder") — read Gap 2
   and the Disposition section.

**The mechanism, read directly before touching anything:**
`src/runner/coordination/session-engine.mjs`'s `classifySessionQuorum`
(~line 3104) determines whether a required actor is "complete" by
finding that actor's FIRST `assignment-created` event and checking only
THAT one assignment's settlement — it has no concept of an actor being
declared for MULTIPLE operations across a multi-phase graph.
`closeSessionByQuorum` (~line 3199) is called UNCONDITIONALLY at the end
of every single `runCoordinationUseCase` request
(`src/verbs/coordination/run.mjs:526`) and transitions the session to
terminal `'completed'` the instant every required actor has one
completed assignment — regardless of how many more phases that actor
(or the protocol as a whole) still has declared. Once terminal,
`authorizeOperation`/`createSessionAssignment` (store.mjs) hard-refuse
any further mutation (`"is not active (status: ...)"`) — this is a real,
hard block, not cosmetic.

**Why this was NOT caught by this track's own extensive earlier test
coverage (Phases 06-09)**: every mechanism built before Phase 10
(declared-consult, standalone sessions, research fan-out/fan-in, MVP7
aggregation-close) binds each required actor to EXACTLY ONE operation.
`classifySessionQuorum`'s "first assignment for this actor = done"
semantics is CORRECT for that shape — this is a genuinely new failure
mode that only Phase 10's group-thinking protocols exposed, because they
are this track's first mechanism to bind one actor to MULTIPLE
operations across MULTIPLE graph nodes/phases.

## The real design question this cell must resolve

**Do not assume the fix is "count all of an actor's assignments instead
of just the first."** Trace through why that alone is insufficient: for
RFC-Review-Lite, the actor that blocks (`proposer-actor`) is bound to
`propose` (`required`) AND `respond` (`driver-authorized`, gated behind
the `reveal` visibility window and the DRIVER's own choice to authorize
it). If quorum required ALL of an actor's graph-declared operations
(required AND driver-authorized) to be complete before closing, the
session could NEVER close automatically for any protocol with a
driver-authorized operation the driver legitimately chooses not to
invoke — a different, equally real regression (this track's whole
"driver decides, engine enforces" philosophy, and the pre-existing,
CORRECT distinction between `required` and `driver-authorized`
activation modes elsewhere in this same file, e.g.
`authorizeDeclaredOperation`).

You must design a quorum-completion rule that:
- Requires ALL of an actor's REQUIRED graph-node-operation bindings
  (not just the first one encountered) to be complete before that actor
  counts as "complete" — this closes P10.6/P10.7/P10.8's own concrete
  bug cases where the blocked operation... **read each of the three
  cells' own protocols carefully**: is the ACTUAL blocked operation in
  each case `required` or `driver-authorized`? (Re-read RFC-Review-Lite's,
  Nominal-Group-Lite's, and Delphi-Feedback-Lite's own YAML `activation`
  fields for the specific bindings each cell's own test hit — do not
  assume; the correct fix design depends on getting this exactly right
  for all three, not just one.)
- Does NOT require a driver-authorized binding the driver has not yet
  (and may never) authorize to block automatic completion — unless you
  find, by re-reading the three reports, that this is actually wrong for
  at least one of the three real bug cases, in which case the design
  question is more subtle than this framing and you must resolve it
  honestly, not force-fit this rule.
- Preserves EXACT, byte-identical existing behavior for every
  single-required-operation-per-actor protocol this mechanism has always
  correctly served (declared-consult, standalone sessions, research
  fan-out/fan-in, MVP7 aggregation-close, and the group-cognition-framework
  fixture) — the full existing regression suite for
  `closeSessionByQuorum`/`evaluateSessionQuorum`/every caller of either
  must stay green, unchanged.
- Reuses the existing graph-traversal idiom already used 3 times in this
  same file (`for (const node of definition.spec.graph.nodes)`,
  ~lines 869, 988, 1302) rather than inventing a new pattern.

## Must Read (in order)
1. The three cell reports named above, in full — do not skip the
   Disposition sections, they carry the corrected, final understanding.
2. `src/runner/coordination/session-engine.mjs:3076-3310` (`evaluateSessionQuorum`,
   `classifySessionQuorum`, `closeSessionByQuorum`) — the real, current
   code, read completely before designing anything.
3. `src/runner/coordination/session-engine.mjs:1290-1330`
   (`declaredOperationBindingActors`) — the closest existing precedent
   for "resolve real graph-declared bindings from a definition," read it
   for the pattern even though it answers a different question
   (operation → actors, not actor → operations).
4. `src/runner/coordination/session-engine.mjs` — search for every
   existing use of `activation.mode`/`activationModeOf`/`'required'`/
   `'driver-authorized'` to understand the existing, correct distinction
   this fix must respect, not reinvent.
5. `test/runner/coordination-recovery-and-quorum.test.mjs` — the
   EXISTING quorum test suite this fix must not regress; read it in full
   to understand what correct behavior already looks like for the
   single-op-per-actor shape.
6. `core/coordination-protocols/group-thinking-{rfc-review,nominal-group,delphi-feedback}-lite.yaml`
   — the three real protocol definitions, read their `activation` fields
   directly for the specific bindings each cell's own bug case hit.
7. `test/verbs/coordination-group-thinking-{rfc-review-lite,nominal-group-lite,delphi-feedback-lite}-pack-conformance.test.mjs`
   — the three tests that currently PROVE the bug is blocked
   (`"is refused"`/`"structurally impossible"`/etc.) — these tests
   currently assert the BROKEN behavior as expected. Your fix will need
   to invert what these specific assertions expect (a previously-refused
   resume should now succeed) — identify exactly which tests these are
   before starting, so you know precisely what "fixed" looks like.

## May Touch
- `src/runner/coordination/session-engine.mjs` (`classifySessionQuorum`
  and, if genuinely needed, a new small helper following the existing
  graph-traversal idiom — keep the change as narrow as the real fix
  requires, do not restructure anything else in this file)
- The three existing conformance test files named above (updating the
  specific assertions that currently expect the bug's blocked behavior,
  now that it's fixed — do not delete the tests, invert/extend them to
  prove the fix)
- `test/runner/coordination-recovery-and-quorum.test.mjs` (add a new
  test proving the multi-operation-per-actor case directly, at the
  quorum-mechanism level, not just through a protocol-specific
  conformance test)
- `docs/architect/agent-coordination/contracts/coordination-session.md`
  (if `classifySessionQuorum`'s documented semantics need updating to
  reflect the corrected behavior — check whether this file documents the
  old semantics before assuming it needs a change)
- `docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/P10-KERNEL-FIX.md`
  — your own durable record, do NOT edit `current-cell.md`/`index.md`
  yourself (Coordinator-owned)

## Do Not Touch
- `core/coordination-protocols/group-cognition-framework.yaml` (never,
  under any circumstances, no exception for this cell either)
- `core/coordination-protocols/group-thinking-*.yaml` (the three
  protocol definitions themselves — this is a kernel semantics fix, not
  a protocol redesign; if you find you genuinely need to change one of
  these YAMLs, STOP and report why, don't do it silently)
- `core/protocol-packs/group-thinking.json`,
  `src/verbs/coordination/group-thinking-pack.mjs`,
  `core/skills/fgos-group-thinking/` — unrelated to this fix
- Anything else under `src/runner/coordination/**` beyond
  `classifySessionQuorum` and its own narrow, necessary helper — this is
  a scoped correctness fix, not a refactor

## Acceptance
- The exact three bug scenarios P10.6/P10.7/P10.8 each proved as
  "refused"/"blocked"/"structurally impossible" now succeed instead —
  re-run and update those specific tests to prove the fix, with real,
  live evidence (not just narration): a session opened, an actor's
  first required operation settled, a genuinely SEPARATE later call
  reaching that actor's remaining declared operation(s) successfully.
- A driver-authorized operation the driver legitimately never authorizes
  must NOT block the session from closing when every REQUIRED operation
  is otherwise done — prove this explicitly with a real test (the exact
  regression the naive "wait for everything" fix would introduce).
- Zero regression in `test/runner/coordination-recovery-and-quorum.test.mjs`
  and every other existing test touching
  `classifySessionQuorum`/`evaluateSessionQuorum`/`closeSessionByQuorum`
  (grep for all three, run every file that references them).
- Full combined regression across `coordination-*`/`flow-definition*`/
  `verbs/coordination-*` green.
- Full-repo sweep (run from the MAIN CHECKOUT if convenient, or from
  this worktree with the known `coordination-static.test.mjs`
  false-fail named explicitly) shows no new failures beyond the standing
  baseline (`fgos-intake-4.test.mjs:318`).
- Write `P10-KERNEL-FIX.md` in this track's established Design Notes /
  Proof Matrix / Gaps format. Design Notes must explain, precisely, the
  completion rule you designed, why it correctly distinguishes required
  from driver-authorized bindings for all three real bug cases (not
  just one), and what you rejected along the way (the naive "wait for
  every declared operation" alternative, and why current-cell.md itself
  already shows that's wrong — confirm or correct that reasoning with
  your own real investigation, don't just repeat it if you find it's
  actually not quite right).

### Reports Path
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/`
