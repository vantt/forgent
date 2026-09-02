# CoordinationSession Persistence And Recovery Contract

Document type: Contract
Design status: Accepted
Implementation: In progress (Phase 06 R1-R4 landed: quorum/partial policy,
retry/replacement, crash recovery, cancellation; R5-R7 landed: uniform
hard-budget enforcement across every dispatch path, `coordinationId`
path-traversal charset validation, write-time foreign-evidence rejection,
work-isolation static export-surface check — `src/runner/coordination/
{schema,store,replay,session-engine}.mjs`)
Last reviewed: 2026-09-02
Canonical for: CoordinationSession manifest/event schema, storage layout, session-to-Assignment membership, and recovery rules
Related: [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md), [Assignment, Run, And RunResult Contract](assignment-run-runresult.md), [Runtime Model](../architecture/runtime-model.md), [Work Integration](../architecture/work-integration.md)

## Scope

This contract defines the local, gitignored persistence and recovery shape
for one CoordinationSession. It does not define protocol/definition schema
(see [FlowDefinition Contract](flow-definition.md)) and does not add any field
to Assignment, Run, or RunResult. Per [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md),
Assignment stays session-blind.

## Storage Layout

```txt
.fgos/coordination/                  # gitignored, like .fgos/assignments/
  sessions/<session-id>/
    session.json                     # manifest (Decision below)
    events.jsonl                     # append-only session event log
    synthesis.md                     # optional synthesis artifact
    tasks/<hash>.json                # internal idempotent-claim record, one per taskKey (hash of the raw taskKey)
```

`<session-id>` (`coordinationId`) is restricted to a safe filesystem charset
(letters, digits, underscore, hyphen only — the exact shape `openSession`'s
own auto-generated id produces) and rejected before it is ever used to build
a path; this closes off path traversal (Phase 06 R6) through a `coordinationId`
crafted with `../` segments or path separators.

Assignments, Runs, and RunResults are referenced by id from
`session.json`/`events.jsonl`; they are never copied or re-serialized into
`.fgos/coordination/`. Durable verification evidence is exported deliberately
into `verification/` by the proof/review process; `.fgos/coordination/` itself
is not committed truth.

## Manifest (`session.json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `schemaVersion` | string | yes | Versioned per this contract; a mismatch fails recovery clearly rather than guessing a shape. |
| `coordinationId` | string | yes | Stable session id; also the `<session-id>` directory segment. |
| `objective` | string | yes | Human-readable objective the session was opened for. |
| `status` | enum | yes | One of `active \| completed \| partial \| failed`. See Status Vocabulary. |
| `createdAt` | ISO 8601 timestamp | yes | Session creation time. |
| `provenanceRoot` | object | yes | Caller identity that opened the session (writer identity; optional parent Assignment reference), same shape ADR-006 uses for Assignment caller provenance. |
| `definitionRef` | object \| null | no | `{id, version}` reference to a `CoordinationProtocol` FlowDefinition when the session is declared-protocol-led; `null` for agent-led sessions with no predeclared protocol (Vision V-009; must remain legal). |
| `workRef` | string \| null | no | Optional, read-only Work id the session references for context. Referencing Work never grants lifecycle authority (see Work Boundary below). |
| `actors` | array | no | `[{id, role, persona?, policy?}]`; present only when the session declares stable SessionActor identities (topology, cohort allocation). Absent for a trivial one-shot session. |
| `aggregateBounds` | object | yes | Hard session-wide limits: `{wallTimeMs, maxAssignments, maxConcurrency, maxRounds, maxTaskDepth}`. Any bound omitted at open time defaults to the foundation's configured ceiling; it is never unbounded by omission. Enforced uniformly (Phase 06 R5) at every dispatch entry point — the agent-led (`dispatchPrimaryTask`/`proposeConsult`) and declared-protocol (`dispatchDeclaredOperation`/`recordConsultDisposition`) paths alike — never bypassable by which entry point a caller uses, and never bypassable by process restart (every bound is recomputed fresh from the on-disk manifest/event log on every call, never from in-memory state). |
| `assignmentRefs` | array of string | yes | Assignment ids belonging to this session. This array, appended atomically at each Assignment's creation, **is** the one-way membership index (ADR-008 Decision 2). No other store may claim membership authority. |
| `completedAt` | ISO 8601 timestamp \| null | no | Set when `status` leaves `active`. |
| `partialPolicy` | `{minimumActors?: number, allowedOmissions?: string[]} \| null` | no | Phase 06 R1: declared at session-open time, before any Assignment is dispatched; immutable thereafter. `null` (default) means no partial close is ever legal for this session — default completion requires every required SessionActor. |

**Forbidden fields:** `missionId` (mandatory or optional) must not appear on
this manifest, at any nesting level (ADR-008 Decision 5). A field named
`sessionId`, `coordinationId`, `threadId`, or `coordinationRef` must never be
added to an Assignment record to satisfy this contract; membership is read
from this manifest's `assignmentRefs`, never written onto Assignment
(`FORBIDDEN_SESSION_FIELDS`, `src/runner/dispatch/execution-contract.mjs:48`,
reaffirmed by ADR-006 §6 and ADR-008 §2).

## Status Vocabulary

| Status | Meaning |
|---|---|
| `active` | Session is open; further Assignments may be created under it. |
| `completed` | All required SessionActors/branches finished; synthesis, if any, is final. |
| `partial` | Session closed under an explicit partial-completion policy with named missing actors/branches (never silently). |
| `failed` | Session could not reach a valid completion state; failure reason is recorded in the event log. |
| `cancelled` | Session was explicitly cancelled (Phase 06 R4): new materialization stops, in-flight Assignments at the moment of cancellation are recorded, and no Run/RunResult is deleted or mutated. |

No other status value is legal in V1. A session must not represent "waiting
on a human" or "recovering" as a manifest `status` value; those are transient
runtime states inferred from the event log, not persisted lifecycle states of
the manifest itself. "Planned" and "running" are likewise inferred sub-phases
of `active` (zero vs. at least one `assignmentRefs` entry), never a separate
persisted status (`session-engine.mjs`'s `deriveSessionPhase`).

Every status other than `active` is terminal and absorbing: once
`transitionSessionStatus` moves a session out of `active`, no further
transition to any status (including a different terminal one) is ever legal
— exactly one transition per session, `active -> {completed | partial |
failed | cancelled}`.

## Event Log (`events.jsonl`)

Append-only, one JSON object per line, written through the same write-then-
reference discipline as `assignmentRefs`. Minimum event kinds:

| Event | Meaning | Required fields |
|---|---|---|
| `session-opened` | Manifest created. | `coordinationId`, `ts`, `provenanceRoot` |
| `actor-bound` | A SessionActor id is bound to a Role (and optionally a Persona/policy). | `actorId`, `role`, `ts` |
| `assignment-created` | An Assignment was created under this session; written atomically with the corresponding `assignmentRefs` append. | `assignmentId`, `actorId?`, `ts` |
| `result-linked` | A RunResult became available for a session Assignment. | `assignmentId`, `runId`, `ts` |
| `run-retried` | Phase 06 R2: a retry was declared for an existing Assignment, BEFORE its new Run dispatches. | `assignmentId`, `reason`, `ts`, `previousRunId?` |
| `actor-replaced` | Phase 06 R2: `oldActorId` was replaced by `replacementActorId` (already `actor-bound` separately); provenance-only, never rewrites the old actor's own `assignment-created` events. | `oldActorId`, `replacementActorId`, `reason`, `ts`, `allocationProvenance?` |
| `session-completed` | Terminal `completed` transition. | `ts`, `replacedActors?`, `dissentingActors?` |
| `session-partial` | Terminal `partial` transition. | `ts`, `missingActors` (named, non-empty), `failedActors?`, `lateActors?`, `replacedActors?`, `dissentingActors?` |
| `session-failed` | Terminal `failed` transition. | `ts`, `reason` |
| `session-cancelled` | Phase 06 R4: terminal `cancelled` transition. | `ts`, `reason`, `inFlightAssignmentIds?` |

Additional event kinds may be added by a future phase without breaking this
contract as long as they do not change the meaning of the kinds above.

**Retry supersession (Phase 06 R2).** A `result-linked` event for an
`assignmentId` that already has one is legal ONLY when a `run-retried` event
for that same `assignmentId` appears strictly between the previous link and
this one — i.e. the supersession was properly declared first
(`linkResult({allowSupersede: true})`, `store.mjs`; enforced identically at
read time by `replay.mjs`). The earlier `result-linked` event and its
RunResult are never rewritten or deleted; the LATEST `result-linked` event
for an `assignmentId` is always the current authoritative view. A second
`result-linked` for the same `assignmentId` with no intervening
`run-retried` is rejected as `duplicate-ref`, at both write time and replay
time.

## Recovery Rule

A resumed session must not duplicate a completed Assignment. This requires
(the "atomic-ref rule", pre-plan review finding M6):

1. The manifest records the intended actor/edge set (via `actors` when
   present) **before** the first Assignment for that actor is created.
2. Each `assignment-created` event and its corresponding `assignmentRefs`
   append happen as one atomic write, following mission-lite's existing `wx`
   claim precedent (`src/runner/dispatch/mission-lite.mjs:~330-380`).
3. On resume, a session reconstructs its state by replaying `events.jsonl`
   against the manifest; any Assignment already present in `assignmentRefs`
   is treated as already issued and is never re-created.
4. A schema/version mismatch between a session's persisted `schemaVersion`
   and the running contract version fails recovery with a named reason; it
   never silently reinterprets the old shape.

## Topology

Present only when a session declares stable SessionActor identities:

```yaml
actors:
  - id: primary
    role: researcher
  - id: specialist
    role: reviewer
topology:
  contextVisibility: mediated | isolated-until-fan-in | broadcast
  edges:
    - from: primary
      to: specialist
      intents: [consult]
      maxRounds: 1
```

`contextVisibility` governs whether a SessionActor's Assignment context may
reference another SessionActor's in-flight or completed results before
fan-in. Independent fan-out branches (no `edges` between them) must not read
sibling state before the declared fan-in point.

## PolicyPatch Provenance

Where session-level or actor-level policy inputs are persisted (for cohort
allocation, actor policy, or human/CLI overrides recorded against this
session), they use the same provenance shape as
[FlowDefinition](flow-definition.md#policypatch): every resolved field is
`{value, source: {scope, id}}`, where `scope` names the layer that supplied
the value (for example `runner`, `definition`, `role`, `actor`, `assignment`,
`cli`, `governance`) and `id` names the specific source within that scope.

## Work Boundary

A session's `workRef` is read-only context. Per
[Work Integration](../architecture/work-integration.md) and
[ADR-001](../decisions/ADR-001-work-lifecycle-authority.md), no field, event,
or verb defined by this contract may move Work status/stage, accept, approve,
claim, return, or merge. A session cannot duplicate Work stage/status/
approval/merge state in `.fgos/coordination/`.

## Required Negative Tests

- Two concurrent sessions from the same writer identity do not merge into one
  membership record (one-way ledger holds under concurrency).
- A resumed session with a `schemaVersion` mismatch fails clearly instead of
  reinterpreting the manifest.
- Replaying `events.jsonl` after an interrupted `assignment-created` write
  (crash between event append and `assignmentRefs` append) does not fabricate
  a completed Assignment reference, and does not duplicate the Assignment on
  retry.
- A manifest or event payload containing `missionId`, `sessionId` on an
  Assignment-shaped record, `coordinationId` on an Assignment record,
  `threadId`, or `coordinationRef` is rejected at validation.
- A session declaring `contextVisibility: isolated-until-fan-in` rejects a
  read of a sibling actor's result before the declared fan-in event.
- A session cannot reach `completed` while `aggregateBounds` required actors
  are missing, unless an explicit `session-partial` transition names them.
- A second `result-linked` event for one `assignmentId` with no intervening
  `run-retried` event is rejected as `duplicate-ref` (Phase 06 R2), both at
  `linkResult` write time and at `replaySession` read time.
- A session cannot close `partial` without a `partialPolicy` declared at
  open time, and a `partialPolicy` that does not name every missing/failed/
  late actor in `allowedOmissions` refuses the close (Phase 06 R1) —
  `closeSessionByQuorum` never accepts an undeclared partial close.
- Once a session leaves `active` (any of `completed|partial|failed|
  cancelled`), every further `transitionSessionStatus` call is refused
  (Phase 06 R4: terminal statuses are absorbing).
- A `coordinationId` containing a `..` traversal segment or any character
  outside the safe filesystem charset is rejected before any path is built
  from it, at every entry point (`openSession` and every other store.mjs
  door via `resolveSessionPaths`) — never creates a directory outside
  `.fgos/coordination/sessions/` (Phase 06 R6).
- `linkResult` rejects a `runId` whose FULL shape does not exactly match
  `run_<assignmentId>_<digits>` for the `assignmentId` it is being linked to
  — a prefix-only check is not enough, since a same-prefix, malicious-suffix
  runId (e.g. `run_<assignmentId>_../../../../tmp/evil`) genuinely starts
  with the expected prefix — at write time, never accepting a genuine
  sibling Assignment's own runId, or a traversal-shaped suffix, as if it
  belonged to a different Assignment. `readLinkedRunResultFromDisk`
  (`session-engine.mjs`) enforces the identical full-shape check at read
  time too, so a hand-crafted/corrupt event log carrying such a runId still
  fails closed even if it never went through `linkResult` (Phase 06 R6,
  foreign evidence).
- `aggregateBounds.wallTimeMs`/`maxAssignments`/`maxConcurrency`/`maxRounds`/
  `maxTaskDepth` are enforced identically whether a session was opened
  agent-led (`openStandaloneSession`) or declared-protocol-led
  (`openDeclaredProtocolSession`) — boundary-equal (the Nth Assignment under
  a cap of N succeeds, the N+1th is rejected), never bypassable by a fresh
  process/restart (Phase 06 R5).
