# ADR-008: CoordinationSession As V1 Recovery Root, One-Way Assignment Membership, And Mission Deferral

Document type: ADR
Design status: Accepted
Implementation: Not started
Last reviewed: 2026-09-01
Canonical for: CoordinationSession identity/persistence boundary, session-to-Assignment membership direction, mission-lite cutover posture, and the Role/SessionActor/Persona/Stance actor-instance vocabulary
Related: [Vision V-001/V-005/V-009](../vision.md), [ADR-006 §6](ADR-006-assignment-provenance-and-contract-snapshot.md), [Intent Preservation Ledger AC-I001/AC-I002/AC-I007](../intent-preservation-ledger.md), [CoordinationSession Contract](../contracts/coordination-session.md), [Step 08 checkpoint](../proposals/step-08-standalone-coordination-protocols.md#discussion-checkpoint-step-08-recommended-decisions-and-plan-2026-09-01)

## Context

A read-only mission-lite prototype (`src/runner/dispatch/mission-lite.mjs`)
already dispatches inline Assignments under a local mission envelope, but it
stores Mission directly as the execution/recovery unit, borrows a coding Stage
to reach dispatch, and hard-codes its Assignment patterns. The Step 07 MVP
(ADR-006, ADR-007) accepted the inline-Assignment provenance class and left
the session/ledger shape, the Mission-versus-session boundary, and the
Participant/actor-instance name for later decision.

The maintainer-approved Step 08 checkpoint (2026-09-01) and the reconciled
pre-plan architecture review both lock a narrower set of answers than the
original checkpoint draft proposed: the ledger direction is already one-way by
ADR-006 §6 and Step 07's "Shape Locked" note (no ledger-adopts-Assignment API,
no `createdAt`/`writerId` heuristic); the actor-instance name is `SessionActor`,
not `Participant`, because `docs/specs/platform-foundations.md` D0014 already
defines *participant* as any process speaking the fgOS event-log contract, a
different, system-membership concept at a different layer
(finding H1, `plans/reports/reviewer-260901-1403-GH-07-step08-pre-plan-architecture-review.md`).

This ADR promotes only those locked decisions. It does not create a
CoordinationSession runtime; Phase 01 of the Step 08 plan implements the
ledger and manifest against this contract.

## Decision

1. **CoordinationSession is the V1 executable/recovery root.** One bounded
   coordination invocation — objective, aggregate bounds, status, provenance
   root, and Assignment references — is the unit that a standalone or
   Work-attached run resumes against. It owns collaboration progress only,
   never Work lifecycle (unchanged from the accepted
   [vocabulary entry](../vocabulary/canonical-concepts.md#coordinationsession)
   and [Work Integration](../architecture/work-integration.md)). The exact
   manifest/event schema is defined in the
   [CoordinationSession Contract](../contracts/coordination-session.md).
2. **One-way session-to-Assignment membership.** The session ledger is the
   authoritative membership index: it records that an Assignment belongs to a
   session **atomically at the Assignment's creation**, following the same
   write-then-reference discipline mission-lite already uses for its `wx`
   claim pattern. Assignment stays session-blind — this ADR does not add
   `sessionId`, `coordinationId`, `threadId`, or `coordinationRef` to the
   Assignment schema. That prohibition is not new; it reaffirms
   [ADR-006 §6](ADR-006-assignment-provenance-and-contract-snapshot.md)'s
   `FORBIDDEN_SESSION_FIELDS` gate (`src/runner/dispatch/execution-contract.mjs:48`),
   which this ADR does not reopen or supersede. There is no API by which a
   session "adopts" a prior, independently created Assignment.
3. **Local gitignored runtime state.** `.fgos/coordination/` holds session
   manifests, event logs, and task records as local, gitignored
   runtime/recovery state, the same posture as `.fgos/assignments/`.
   Canonical Assignment, Run, and RunResult records are never duplicated
   into this tree; the session references them. Verification evidence is
   exported deliberately into `verification/` rather than being committed by
   default from `.fgos/coordination/`.
4. **Direct mission-lite cutover, no compatibility mechanism.** The unreleased
   mission-lite prototype's code and tests are replaced directly by the
   CoordinationSession ledger. No migration reader, detector, reporter,
   compatibility writer, or stored-data migration is built for
   `.fgos/missions/` — matching `plan.md`'s Locked Product Decisions and the
   2026-09-01 maintainer checkpoint verbatim.
5. **Mission is deferred-preserved.** No V1 schema — CoordinationSession
   manifest, Assignment, Run, or RunResult — carries a `missionId` field,
   mandatory or optional. A future Mission groups completed session ids from
   above; it is not entered as a foreign key on any V1 record. This preserves
   [AC-I007](../intent-preservation-ledger.md#ac-i007-optional-multi-session-mission-grouping)
   without building Mission identity, persistence, or aggregation now.
6. **Actor-instance vocabulary: `SessionActor`, config namespace `actors:`.**
   The canonical four-way split is:
   - `Role` — a seat / responsibility position, unchanged from the existing
     [Role](../vocabulary/canonical-concepts.md#role) entry;
   - `SessionActor` — one addressable actor instance filling a Role inside a
     definition or session (config key `actors:`);
   - `Persona` — the behavioral identity a SessionActor runs with
     (`policy.preferPersona`);
   - `Stance` — a temporary viewpoint (for example argument-for /
     argument-against); **not a V1 schema field**. Stance is expressed through
     Role/operation naming in V1 (for example a `critical-reviewer` Role), and
     revisited only if a framework needs to track it independently of Role.

   `Participant` is not reused for this concept. It remains reserved for the
   existing fgOS platform-level meaning (any process that speaks the
   event-log contract, `docs/specs/platform-foundations.md` D0014); see the
   [vocabulary reservation](../vocabulary/deprecated-and-reserved.md#participant).
   An operation declares the Role it needs; a graph binding may assign that
   operation to a specific SessionActor id, because more than one SessionActor
   may fill the same Role (for example two independent critics). The
   qualified SessionActor-to-Assignment reference lives only in the one-way
   session ledger (Decision 2), never as an Assignment field.

## Consequences

- A stranger agent can reconstruct and resume a CoordinationSession from its
  manifest and event log without re-deriving membership from timestamps or
  writer identity.
- Assignment, Run, and RunResult remain the single canonical execution record
  set; nothing under `.fgos/coordination/` becomes a second source of
  execution truth.
- Mission can be introduced later purely as a grouping layer over existing
  session ids, without a schema migration on any V1 record.
- `SessionActor`/`Persona`/`Stance` can be added to canonical vocabulary and
  to `FlowDefinition` (ADR-009) without colliding with the platform-level
  `Participant` concept.
- Any future two-way reference (an Assignment learning about its session)
  requires an explicit new ADR superseding this one and ADR-006 §6; it is not
  implied by anything in this decision.

## Rejected Alternatives

- **Two-way ledger with a `createdAt`/`writerId` adoption heuristic.**
  Withdrawn during pre-plan review (finding M7): it fails when one writer runs
  two concurrent sessions, and it would require reopening ADR-006 §6's
  `FORBIDDEN_SESSION_FIELDS` gate, which Phase 00 is explicitly forbidden from
  editing in place.
- **A detect-and-report posture for legacy `.fgos/missions/` data.** The
  pre-plan review's finding M4 recommended a runtime check that reports the
  presence of a legacy `.fgos/missions/` directory (via `doctor` or session
  startup) rather than silently ignoring it, reasoning that `src/` is a
  published package and an external importer remains possible. This was a
  reviewer recommendation for the plan-writing step to weigh, not an
  explicit human decision. `plan.md`'s Locked Product Decisions
  (`plan.md:68-71`) and the 2026-09-01 maintainer checkpoint
  (`proposals/step-08-standalone-coordination-protocols.md:1495-1496`) both
  explicitly rule out any detector or reporter mechanism for mission-lite
  cutover, superseding M4's recommendation. Rejected: a runtime check that
  finds a legacy directory and reports its presence is itself a detector
  plus a reporter, which both higher-authority sources name and reject.
- **Reusing `Participant` for the actor-instance concept.** Rejected because
  it collides with the already-accepted platform-level meaning (finding H1);
  two canonical documents would otherwise define the same word at two
  different layers.
- **A `Role`/`Seat` split (Role as abstract, Seat as the fillable slot).**
  Rejected; repository history already establishes Role as the responsibility
  seat/position itself (`history/implementation-records/orchestration-vocabulary-map-2026-08-27.md:310,785-807`),
  so introducing a separate `Seat` term would duplicate that meaning.
