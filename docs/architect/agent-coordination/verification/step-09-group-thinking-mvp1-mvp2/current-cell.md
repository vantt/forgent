# Current Cell

Cell: P02.2
Status: done (closes Phase 02)
Owner: Coordinator
Last updated: 2026-09-03
Next action: P03.1 (Phase 03 -- see plan.md)

## Goal

Implement Phase 02 R5-R8, closing Phase 02: `invocationKey` exactly-once
session-scoped consumption, context-grant enforcement at dispatch time,
binding-cap-vs-aggregate-cap interaction with fresh on-disk counting, and
driver-authority identity pinning. P02.1 already threaded `invocationKey`
and `grantedContextRefs`/`contextGrant` end to end but deliberately did not
enforce them — that enforcement is this cell's job.

## Non-Goals

- Do not implement recheck semantics or `driver-disposition-recorded`
  (Phase 03).
- Do not touch `src/runner/coordination/cohort-planner.mjs`.
- Do not fix the three forward gaps recorded in `index.md`'s "Forward
  Notes For Later Phases" (`cohort-planner.mjs` disambiguation,
  `resolveDeclaredOperationActor` node-selection, unlocked-replay-vs-
  concurrent-commit `dangling-ref`) unless this cell's own R5-R8 work
  cannot honestly proceed without touching one of them — if so, STOP and
  report rather than silently expanding scope.
- Do not touch `group-cognition-framework.yaml`, `declared-consult.yaml`,
  or `independent-research-fan-out-fan-in.yaml`.
- Do not touch any `docs/architect/agent-coordination/contracts/*.md` file
  — the accepted text already fully specifies R5-R8 (see Must Read); if you
  find it's genuinely insufficient, STOP and report rather than extending it.

## Must Read

- `plans/260903-0004-step09-group-thinking-mvp1-mvp2/phase-02-driver-authorization-primitive.md` (full R1-R8; you implement R5-R8)
- `docs/architect/agent-coordination/contracts/coordination-session.md`'s "Driver-Authorized Optional Operations And Recheck" section — already specifies: `invocationKey` session-scoped uniqueness, context-grant enforcement (`grantedContextRefs` entries must resolve within the same `coordinationId`), and driver-authority provenance requirements. This text was Red-Team-hardened in Phase 00 — implement it exactly.
- `docs/architect/agent-coordination/contracts/flow-definition.md`'s "Activation" section — `maxInvocations` must be "counted fresh from the on-disk `operation-authorized` events for that exact binding (never from in-memory state)".
- `docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/P02.1.md` — read the FULL Gaps section (exactly what R5-R8 inherit) and the Red-Team section (HIGH-1/MEDIUM-1 and how `assertAuthorizationSpendable` works — R5's invocationKey check likely belongs in or beside this same function).
- `src/runner/coordination/store.mjs`: `authorizeOperation` (~line 749), `assertAuthorizationSpendable` (~line 389), `createSessionAssignment` (the lock-held critical section R7's binding-cap check will live in, following the exact pattern of the existing `opts.maxAssignmentsForSession`/`maxRoundsForSession`/`maxConcurrencyForSession` opt-in checks in the same function).
- `src/runner/coordination/session-engine.mjs`: `authorizeDeclaredOperation` (~line 953), `dispatchDeclaredOperation` (the R4 gate cell just added), and wherever the dispatched contract's `contextRefs` are actually built (search for where an Assignment's contract inputs/context are assembled) — this is where R6's enforcement must filter/reject context outside `grantedContextRefs`.
- `src/runner/coordination/schema.mjs`: `EVENT_SPECS['operation-authorized']`, `validateProvenanceRoot` (existing, used for `session-opened`'s `provenanceRoot` — R8 needs to compare an authorization's `authorizedBy.id` against this same session provenance root shape).
- `test/runner/coordination-driver-authorization.test.mjs` (the 20-test suite P02.1 built — extend this, do not duplicate its scaffolding).

## May Inspect

- `core/coordination-protocols/standalone-master-coordination-loop.yaml` (read-only)
- `src/runner/dispatch/execution-contract.mjs` (read-only, for how existing Assignment context/inputs are structured, to enforce R6 without inventing a parallel shape)

## Do Not Touch

- `core/coordination-protocols/group-cognition-framework.yaml`, `declared-consult.yaml`, `independent-research-fan-out-fan-in.yaml`
- `src/runner/coordination/cohort-planner.mjs`
- `src/runner/coordination/replay.mjs`'s manifest/event read ordering (the LOW-1 forward gap — do not fix incidentally while touching this file for other reasons)
- `src/runner/dispatch/**`
- Any `docs/architect/agent-coordination/contracts/*.md`

## Tests First

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/flow-definition*.test.mjs' \
  'test/runner/coordination*.test.mjs'
```

Required coverage (from the phase file's R5-R8 list):
- reused `invocationKey` rejects (both: same binding twice, AND two different bindings in the same session reusing one `invocationKey` string — the exact loophole P01's own contract Red-Team named);
- crash/resume does not duplicate an already-authorized/created Assignment (extend P02.1's existing crash-state tests to also cover invocationKey consumption, not just authorizationId consumption);
- context outside `grantedContextRefs` rejects at dispatch (construct a driver-authorized dispatch whose contract would otherwise read a sibling Assignment's output not named in the grant, and confirm it's rejected — reuse the existing sibling-isolation test pattern already used elsewhere in this codebase for `contextVisibility: isolated-until-fan-in` if one exists);
- `grantedContextRefs` entry naming a ref from a DIFFERENT `coordinationId` rejects (per the accepted contract's cross-session scope rule);
- binding `maxInvocations` rejects the N+1 dispatch, counted fresh from on-disk `operation-authorized` events (not an in-memory counter — write a test that would fail if the count were process-local);
- aggregate bounds still reject even when binding cap allows more (binding caps narrow, never widen);
- an `authorizedBy.id` that doesn't match the session's own provenance/writer identity is rejected (R8) — check exactly what identity comparison the accepted contract actually specifies before implementing; if it's underspecified for what "matching" means precisely, this may be exactly the kind of gap P02.1's own R8 Gap note anticipated ("`writerId` alone is not enough if the existing API cannot distinguish an arbitrary event writer from the driver") — read that note in P02.1.md's Gaps section before implementing, and if you hit real ambiguity, document your interpretation explicitly in this cell's trace rather than silently picking one.

Run the full suite before closing:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
```

## Acceptance

- `invocationKey` is consumed exactly once, checked against the WHOLE session's `operation-authorized` events (not per-binding) — matching the accepted contract's explicit session-scoped uniqueness rule.
- A dispatched worker for a driver-authorized operation can only read `grantedContextRefs` plus its own always-legal base inputs; anything else is rejected. Every `grantedContextRefs` entry must resolve to a ref owned by the same `coordinationId`.
- `activation.maxInvocations` is enforced, counted fresh from on-disk `operation-authorized` events for that exact binding; binding caps never widen `aggregateBounds.maxAssignments`/`maxRounds`/`maxConcurrency`, and aggregate caps always win when stricter.
- Authorization/disposition writer identity is tied to the session's own driver/provenance root, per whatever precise mechanism this cell determines the codebase can actually support (document the exact comparison implemented).
- Full test suite: no new failure beyond this track's recorded baseline (index.md).
- This cell's trace records anything genuinely deferred further (there should be little left after this cell — R1-R8 is the entirety of Phase 02).

## Bug Taxonomy

- Checking `invocationKey` uniqueness per-binding instead of session-wide (repeats the exact ambiguity P00's own Red-Team found and fixed in the CONTRACT text — do not reintroduce it in the IMPLEMENTATION).
- Implementing context-grant enforcement as an advisory filter that a caller could bypass rather than an actual gate inside the dispatch path itself.
- Implementing `maxInvocations` counting via any in-memory/process-local counter (must be fresh from disk every time, matching `aggregateBounds`'s own established pattern in this same file).
- Implementing R8's identity check in a way that's either (a) so strict it breaks P02.1's existing tests (which use synthetic `authorizedBy.id` values), or (b) so loose it doesn't actually verify anything (accepting any string) — if the existing test fixtures need updating to use a real, checkable driver identity, that's expected and fine; document it.
- Silently touching `cohort-planner.mjs`, `replay.mjs`'s read ordering, or `resolveDeclaredOperationActor`'s node selection while implementing R5-R8 "since you're already in the file" — those are named forward gaps for a REASON (each has its own blast radius/scope tradeoff already decided); leave them alone unless truly blocking.

## Trace Update

Doer writes findings/evidence into `P02.2.md` (Proof Matrix, Commands, Gaps).
Coordinator writes Review/Red-Team disposition and close verdict.
