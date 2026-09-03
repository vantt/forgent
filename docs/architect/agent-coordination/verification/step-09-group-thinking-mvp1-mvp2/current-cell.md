# Current Cell

Cell: P03.1
Status: done (Phase 03 R1-R4)
Owner: Coordinator
Last updated: 2026-09-03
Next action: P03.2 (Phase 03 R5-R7 -- see plan.md)

## Goal

Implement Phase 03 R1-R4, the mechanism half of the phase: persist/expose
artifact refs through the existing RunResult/evidence path (R1); make
recheck create a genuinely NEW Assignment against a new artifact revision
without ever superseding the original Assignment's RunResult/verdict (R2);
add the `driver-disposition-recorded` event as driver-authored ledger state,
never a worker result (R3); and make session replay reconstruct
authorization, assignment provenance, result links, recheck lineage, and
dispositions without chat history (R4). R5-R7 (the live CLI/no-Work proof,
the negative-proof battery, and surface-readiness docs) are P03.2's job —
this cell proves the mechanism with focused tests, not the live end-to-end
run.

## Non-Goals

- Do not implement or touch the live CLI/no-Work proof (R5) — no `fgos
  coordination run` invocation, no request-file helper, no launcher surface.
  That is P03.2.
- Do not write the phase's negative-proof battery (R6) as its own deliverable
  — individual negative tests for THIS cell's own R1-R4 surfaces are
  expected and required (Tests First below), but the phase's consolidated
  negative-proof pass is P03.2's.
- Do not implement R7 (surface-readiness documentation) — no new skill/slash
  surface, no thin-launcher design doc.
- Do not touch `core/coordination-protocols/group-cognition-framework.yaml`,
  `declared-consult.yaml`, or `independent-research-fan-out-fan-in.yaml`.
- Do not touch `src/runner/dispatch/**`.
- Do not touch any `docs/architect/agent-coordination/contracts/*.md` file
  — the accepted text (see Must Read) already fully specifies R1-R4; if you
  find it genuinely insufficient, STOP and report rather than extending it.
- Do not fix the shipped-fixture fan-out taskKey collision recorded in
  `index.md`'s forward notes (the `required`-mode/topology-edge branch) —
  named there for a reason (out of every current cell's Files list); leave
  it alone unless truly blocking.
- Do not touch the four pre-existing session-wide caps' self-heal gap
  (`maxAssignmentsForSession`/`maxRoundsForSession`/`maxConcurrencyForSession`/
  `maxRoundsForActor`) — also a recorded forward gap, not this cell's.

## Must Read

- `plans/260903-0004-step09-group-thinking-mvp1-mvp2/phase-03-recheck-disposition-live-proof.md`
  (full R1-R7; you implement R1-R4).
- `docs/architect/agent-coordination/contracts/coordination-session.md`'s
  full "Driver-Authorized Optional Operations And Recheck" section —
  already specifies: the `assignment-created` event's additive
  `contextGrant`/`invocationKey`/`authorizationId` fields (already
  implemented, P02.1/P02.2), the `driver-disposition-recorded` event shape
  (`targetRef`, `disposition`, `rationale`, `evidenceRefs`, `authorizedBy`,
  `ts` — NOT YET in `schema.mjs`'s `EVENT_SPECS`, confirmed by grep before
  this cell started), and the full "Recheck Is Not Retry" clause (a
  recheck's `taskKey` MUST incorporate the new artifact/evidence revision or
  the authorizing `invocationKey`/`authorizationId`, so it can never
  taskKey-collide with the original reviewing Assignment — this is the
  REAL fix for the taskKey-derivation forward gap P02.2 left open; read that
  gap note in `index.md` before starting).
- `docs/architect/agent-coordination/contracts/coordination-session.md`'s
  "Recovery Rule" and "Required Negative Tests" sections — R4's replay
  reconstruction and this cell's own negative tests are graded against
  these literally.
- `docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md`
  — read the WHOLE file: Phase 02 Status (what R1-R8 already built,
  directly underneath this cell), and every entry in "Forward Notes For
  Later Phases" (the sibling-cap gap, the P02.2 taskKey-derivation note —
  THIS is the recheck taskKey work, R8's driver-handoff narrowing, and the
  shipped-fixture HIGH — know what is already tracked so you do not
  re-report it as new).
- `docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/P02.2.md`
  — R5-R8's Proof Matrix and Gaps, for the exact shape `authorizationProvenance`/
  `assignment-created` already carries (R2's recheck Assignment and R3's
  disposition event both build on this, not a parallel shape).
- `src/runner/coordination/schema.mjs`: `EVENT_SPECS` (add
  `driver-disposition-recorded` following the exact pattern
  `operation-authorized`/`assignment-created` already use — required vs.
  accepted fields, `OPTIONAL_STRING_ARRAY_FIELDS` if `evidenceRefs` fits
  that bucket), `validateAuthorizedBy` (reuse for
  `driver-disposition-recorded.authorizedBy`, do not invent a second
  identity check).
- `src/runner/coordination/store.mjs`: `createSessionAssignment` (R2's
  recheck Assignment is created through this SAME door, not a new one —
  read the full function, including this session's own R5-R8 additions:
  `assertAuthorizationSpendable`, `assertWithinBindingInvocationCap`),
  `authorizeOperation` (the pattern a new `recordDriverDisposition`-style
  door should follow: lock-held, fresh-read, driver-identity-pinned, exactly
  as `authorizeOperation` already is).
- `src/runner/coordination/session-engine.mjs`: `dispatchDeclaredOperation`
  (R2: where a recheck's `taskKey` must be derived so it cannot collide with
  the original reviewing Assignment's default taskKey — read the "Minimal
  safety guard" comment block this session's own P02.2 work just added,
  understand exactly why the default taskKey collides today, then fix the
  ROOT CAUSE for the recheck case specifically, per the contract's explicit
  instruction to incorporate the new artifact/evidence revision or
  `invocationKey`/`authorizationId`).
- `src/runner/coordination/replay.mjs`: `replaySession` (R4: what it already
  reconstructs — `assignmentRefs`, `authorizations`, `ignoredAuthorizations`
  — and where `driver-disposition-recorded` events need to be folded into
  its return shape so a caller can read disposition state without replaying
  chat history).
- `test/runner/coordination-driver-authorization.test.mjs` and
  `test/runner/coordination-store.test.mjs` (this session's own P02.2 work —
  extend the existing scaffolding for R1/R2/R4, do not duplicate it).

## May Inspect

- `src/verbs/coordination/{run,show}.mjs` (read-only — R5's CLI door, next
  cell's job, but understand its current shape so R1-R4's implementation
  does not paint P03.2 into a corner).
- `src/runner/dispatch/assignment.mjs` (read-only, for how RunResult/evidence
  refs already flow, so R1 threads artifact refs through the EXISTING path
  rather than inventing a parallel one).

## Do Not Touch

- `core/coordination-protocols/group-cognition-framework.yaml`,
  `declared-consult.yaml`, `independent-research-fan-out-fan-in.yaml`
- `src/runner/dispatch/**`
- Any `docs/architect/agent-coordination/contracts/*.md`
- `src/verbs/coordination/**` (P03.2's door to open, not this cell's)

## Tests First

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/flow-definition*.test.mjs' 'test/runner/coordination*.test.mjs'
```

Required coverage (from the phase file's Tests First list, scoped to R1-R4):

- recheck creates a new Assignment and leaves the prior verdict/RunResult
  immutable (both readable afterward, per the contract's explicit
  requirement that neither is superseded/rewritten/deleted);
- a recheck's `taskKey` cannot collide with the original reviewing
  Assignment's `taskKey` — construct the exact shape the contract calls out
  by name (deriving it the same way as the original binding) and confirm it
  is REJECTED or structurally impossible, not merely discouraged;
- `driver-disposition-recorded` is event-log state, appended through a
  driver-identity-pinned door (reuse the R8 `authorizedBy.id ===
  manifest.provenanceRoot.writerId` pattern), never writable as a worker
  RunResult field;
- replay preserves accepted/rejected disposition and recheck lineage
  (original Assignment id, recheck Assignment id, which artifact/evidence
  revision each is against) without needing anything outside
  `events.jsonl`/`session.json`;
- artifact refs survive the existing RunResult/evidence path and are
  readable from a recheck's own grant/context the same way P02.2's R6
  already enforces for `grantedContextRefs`.

Run the full suite before closing:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
```

Known baseline: 7 failures by name (see `index.md`'s Baseline table), plus
occasionally ONE extra load-induced live-subprocess timing flake (differs
run to run: `herdr-spawn-adapter`'s live timeout, or
`dispatch.test.mjs`'s maxBuffer-kill stdout-capture test) — re-run any
extra failure in isolation before treating it as new; P02.2 confirmed this
pattern twice.

## Acceptance

- R1: artifact refs are persisted/exposed through the existing
  RunResult/evidence path; CoordinationSession links refs but is not a
  second artifact authority (no new artifact storage invented).
- R2: a recheck materializes as a genuinely new `assignment-created` event
  and Assignment id; the original Assignment's `result-linked`
  event/RunResult is never superseded, rewritten, or deleted by the
  recheck. The recheck's `taskKey` provably cannot collide with the
  original's.
- R3: `driver-disposition-recorded` is appended through a
  driver-identity-pinned, lock-held door, following `authorizeOperation`'s
  established pattern; `EVENT_SPECS` validates its shape;
  `authorizedBy.id` is checked against `manifest.provenanceRoot.writerId`
  exactly as R8 already does.
- R4: `replaySession` (or a caller reading its return shape) can answer
  "what was authorized, what was dispatched, what results linked, which
  recheck followed which original, and what disposition was recorded" from
  `events.jsonl`/`session.json` alone.
- Full test suite: no new failure beyond this track's recorded baseline
  (index.md), accounting for the known load-induced-flake pattern above.
- This cell's trace records anything genuinely deferred to P03.2 (R5-R7,
  by design) or further (there should be little else).

## Bug Taxonomy

- Deriving a recheck's `taskKey` in a way that still collides with the
  original binding's default derivation "since it's convenient" — this is
  the EXACT shape the contract's "Recheck Is Not Retry" clause names by
  name as forbidden; do not reintroduce it while claiming to fix it.
- Implementing disposition as a worker-authored RunResult field instead of
  a driver-authored ledger event — the contract is explicit that
  disposition is "never a worker-authored result."
- Letting a recheck rewrite, supersede, or delete the original Assignment's
  RunResult/verdict, even implicitly (e.g. via `linkResult`'s existing
  `allowSupersede` retry-supersession path) — recheck is NOT retry;
  reusing the retry-supersession mechanism for recheck would be exactly the
  conflation the contract distinguishes.
- Inventing a second artifact-storage mechanism instead of threading refs
  through the existing RunResult/evidence path (R1's own stated risk in the
  phase file: "treating artifact production as repo mutation").
- Adding `driver-disposition-recorded` without reusing `validateAuthorizedBy`
  / the R8 identity-pinning pattern — inventing a second, divergent identity
  check here would repeat this session's own L1 finding (duplicated rather
  than shared validation logic).

## Trace Update

Doer writes findings/evidence into `P03.1.md` (Proof Matrix, Commands,
Gaps). Coordinator writes Review/Red-Team disposition and close verdict.
