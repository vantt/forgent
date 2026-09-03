# CoordinationSession Persistence And Recovery Contract

Document type: Contract
Design status: Accepted
Implementation: Implemented (Phase 01 R1-R8: manifest/event store, direct
mission-lite cutover, shared engine, dynamic consult, crash-safe idempotent
resume; Phase 03: declared-protocol dispatch on the same engine; Phase 04:
research fan-out/fan-in on the same session bounds; Phase 06 R1-R4: quorum/
partial policy, retry/replacement, crash recovery, cancellation; Phase 06
R5-R8: uniform hard-budget enforcement across every dispatch path,
`coordinationId` path-traversal charset validation, write-time
foreign-evidence rejection, work-isolation static export-surface check;
Phase 07: public CLI (`fgos coordination run/show`) and headless adapter
both invoking this store through the one shared engine, capability parity
live-proved — `src/runner/coordination/{schema,store,replay,session-engine}.mjs`,
`src/verbs/coordination/{schema,run,show}.mjs`,
`src/runner/coordination/headless-adapter.mjs`. Full per-phase trace:
`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`.
Phase 00 (Step 09): driver-authorized optional operations, disposition,
recheck-vs-retry contract text accepted — implemented across
`step-09-group-thinking-mvp1-mvp2` Phases 01-03 (recheck-as-new-Assignment,
`driver-disposition-recorded`, live no-Work standalone proof) and
`step-09-mvp3-to-mvp5` Phases 00-04 (disposition ref session-ownership
enforcement, a thin CLI launcher, intentional role-tier dispatch policy,
and session resume through the same request door, with a foreign-writerId
resume-hijack path closed). Full per-phase trace:
`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`.
Dogfood handoff for MVP6+:
`docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md`.
Phase 07 (Step 09 MVP7): the `aggregation-validated` event, its write door,
its replay refusals, and `closeSessionByQuorum`'s refuse-only aggregation
input accepted and implemented —
`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P07.3),
enforced at the request door and rendered by `show` in
`src/verbs/coordination/{run,show}.mjs` (P07.4). Promoted with the named
limitations in Evidence-Preserving Aggregation below, not without them. Full
per-phase trace:
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`.)
Last reviewed: 2026-09-04
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
| `operation-authorized` | Phase 00 (Step 09) MVP2: a driver authorizes a declared `driver-authorized` optional operation binding for dispatch (see [Driver-Authorized Optional Operations And Recheck](#driver-authorized-optional-operations-and-recheck-mvp1mvp2-step-09) below). | `authorizationId`, `operationId`, `nodeId`, `targetActorId`, `invocationKey`, `authorizedBy`, `reason`, `grantedContextRefs`, `targetArtifactRef?`, `ts` |
| `driver-disposition-recorded` | Phase 00 (Step 09) MVP2: a driver records disposition on a finding/artifact; never a worker-authored result. | `targetRef`, `disposition`, `rationale`, `evidenceRefs`, `authorizedBy`, `ts` |
| `aggregation-validated` | Phase 07 (Step 09) MVP7: a driver-authored record of one evidence-preserving aggregation the engine validated over this session's own evidence (see [Evidence-Preserving Aggregation](#evidence-preserving-aggregation-mvp7-step-09) below). Never a transition of its own. | `aggregationId`, `method`, `outcome`, `sourceResultRefs`, `validatedBy`, `ts`; optional `assignmentId?`, `runId?`, `outputArtifactRef?`, `dissentRefs?`, `unresolvedContributionRefs?`, `missingActors?`, `failedActors?`, `unboundSourceOperationRefs?`, `artifactRevisionRefs?` |

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

## Driver-Authorized Optional Operations And Recheck (MVP1/MVP2, Step 09)

Accepted contract text, scoped to MVP1/MVP2 of the Step 09 group-thinking
substrate ([Step 09 Group Thinking Substrate](../../proposals/step-09-group-thinking-substrate.md#7-mvp2---driver-authorization-primitive)
remains a Discussion-status document; only the primitives below are promoted
out of it). This section does NOT accept deliberation memory, visibility
windows, richer aggregation modes, or `addSessionEdge` (Step 09 MVP6-9)
— those stay deferred/discussion. This cell treats substrate MVP2 (§7) and
MVP3 recheck/disposition (§8) as one accepted MVP1/MVP2 slice; only MVP6-9
concepts above remain deferred/discussion.

### `operation-authorized`

A binding whose [FlowDefinition](flow-definition.md#graph)
`graph.nodes[].operations[].activation.mode` is `driver-authorized` must not
materialize an Assignment without a matching `operation-authorized` session
event preceding that Assignment's `assignment-created` event. Fields, per the
Event Log row above:

| Field | Notes |
|---|---|
| `authorizationId` | Unique id for this authorization instance. |
| `operationId` | The `spec.operations[].id` being authorized. |
| `nodeId` | The graph node/binding where the operation activates. |
| `targetActorId` | The actor the authorization targets. |
| `invocationKey` | Idempotency key for this logical optional-operation invocation (see below). |
| `authorizedBy` | `{type: "driver", id: <driver-identity>}`; the driver is not a `spec.actors[]` worker. |
| `reason` | Human-readable authorization rationale. |
| `grantedContextRefs` | Refs the resulting Assignment may read (see Context-Grant Enforcement). |
| `targetArtifactRef` | Optional; the artifact ref the authorized operation is revising or rechecking (the substrate's §7 JSON example name for what §8/§9's gap tables call `artifactRevision`). |
| `ts` | ISO 8601 timestamp. |

The `assignment-created` event for a driver-authorized operation additionally
carries `operationId`, `nodeId`, `authorizationId`, `invocationKey`, and
`contextGrant: {refs: [...]}` so replay can explain why the worker ran and
which grant made its context legal.

### `driver-disposition-recorded`

Disposition (accepting or rejecting a finding, or closing a round) is a driver
event, never a worker-authored result:

| Field | Notes |
|---|---|
| `targetRef` | The finding or artifact ref the disposition applies to. |
| `disposition` | e.g. `accepted \| rejected`. |
| `rationale` | Human-readable reason. |
| `evidenceRefs` | RunResult/artifact refs supporting the disposition. |
| `authorizedBy` | Driver provenance, same shape as `operation-authorized.authorizedBy`. |
| `ts` | ISO 8601 timestamp. |

### `invocationKey` Idempotency

Each `invocationKey` is consumed exactly once per logical optional-operation
invocation. A second `operation-authorized` (or the Assignment dispatch it
would trigger) reusing an already-consumed `invocationKey` is rejected. A
crash between authorization and Assignment creation, followed by resume, must
not re-dispatch the same logical invocation twice — resume replays
`events.jsonl` (per Recovery Rule below) and treats an already-consumed
`invocationKey` as already issued.

`invocationKey` uniqueness is scoped to the CoordinationSession — checked
against that session's own `events.jsonl`; reuse of the same `invocationKey`
string across different sessions is not this contract's concern.

### Context-Grant Enforcement

A dispatched worker for a driver-authorized operation may read only the refs
listed in that authorization's `grantedContextRefs`, plus whatever base
session context is always legal for that Assignment (its own declared
inputs). A hidden sibling Assignment's output not named in
`grantedContextRefs` remains illegal to read, on the same footing as the
existing `contextVisibility: isolated-until-fan-in` rule under Topology.

Every `grantedContextRefs` entry must resolve to an artifact/ref owned by
this same `coordinationId` (this session); a ref belonging to a different
CoordinationSession is rejected. Cross-session grant authority is out of
scope — no design intent for it exists anywhere in the substrate proposal.

### Recheck Is Not Retry

`run-retried` (above) is unchanged: retry supersedes a Run for the SAME
Assignment.

Recheck is a distinct, newly-accepted concept: a recheck is a NEW Assignment
created against a new artifact/evidence revision (typically following a
`revise-candidate`-style operation), never a retry of the original reviewing
Assignment. The original Assignment's RunResult and verdict are never
superseded, rewritten, or deleted by a recheck — both the original and the
recheck RunResult remain readable, and session synthesis must be able to
present both without hiding the earlier verdict.

A recheck's idempotent-claim key (`taskKey`, the same hash key the `wx`/
idempotent-claim precedent cited in the Recovery Rule below already uses to
decide "already issued, don't recreate") MUST incorporate the new
artifact/evidence revision or the authorizing `invocationKey`/
`authorizationId`, so it can never collide with (be claim-equal to) the
original reviewing Assignment's own `taskKey`. A recheck implementation that
derives its `taskKey` the same way as the original binding (e.g. by
`nodeId`+`operationId`+`actorId` alone) would incorrectly resume the
original Assignment instead of creating a new one — this clause exists
precisely to forbid that.

## Evidence-Preserving Aggregation (MVP7, Step 09)

One cognitive aggregation over this session's own contributions, recorded as
`aggregation-validated`. The whole point of the phase is that **cognitive
aggregation and session completion are separate authorities**, so this event
never transitions anything:

- the Team Cognition evaluator decides the cognitive `outcome` from evidence
  it is handed (`consensus | qualified | no-consensus`);
- this session's engine decides what evidence is real, and owns every
  terminal transition.

**The verdict is derived, never asserted.** The engine's validation door takes
no `outcome` parameter. The caller supplies identity (`aggregationId`,
`validatedBy`) and the aggregate's own output refs; everything the verdict
rests on is derived from the session: which operations are sources comes from
the bound FlowDefinition (resolved from `definitionRef`, refused on version
drift — never accepted as a caller argument), which Assignments answer them
comes from the same reserved `protocol-operation:` stamp visibility windows
use, and each source's artifact ref, revision pin, and disclosures are read
off the linked RunResult on disk. Disclosures are engine-classified from the
filesystem, never taken from a worker's own claim. No prose is parsed for
meaning anywhere on this path, and there is no vote, rank tally, weighted
score, or convergence step.

**Terminal input is refuse-only.** `closeSessionByQuorum` accepts an optional
`aggregationId`; inside its existing lock it reads that record from the
replayed event log (never `ignoredAggregations`, never a caller-supplied
verdict) and refuses the close when the outcome is not `consensus`. It never
selects a status, never relaxes `partialPolicy`, and never closes a session
quorum would have refused. An aggregation therefore **can only narrow**: it
never upgrades a RunResult's own recorded status/confidence, and never
upgrades a close.

**When an aggregation is required.** A protocol that declares
`completion.aggregation` (see [FlowDefinition Contract](flow-definition.md))
may not close on quorum alone. The request door that drives a session
(`src/verbs/coordination/run.mjs`, shared by `fgos coordination run` and the
headless adapter) resolves the definition from the session's own
`manifest.definitionRef` and refuses version drift — the same discipline the
validation and dispatch doors use, and never the definition the current
request names. A resume request naming a different `protocolRef`, or an
in-place edit of the bound document, therefore cannot decide whether this
session's close is gated. When the bound definition declares an aggregation
the door resolves the session's most recently validated one and passes it to
the close; with none validated, the close is refused and the session stays
`active`, and the remedy is to validate one and resume the session. A
definition that declares no aggregation is unaffected — the gate is opt-in at
the schema level, and no protocol shipped under `core/` declares one today.

Two consequences of enforcing it, stated rather than discovered later:

- **A `partialPolicy`-permitted omission can make the session permanently
  unclosable.** If an omission `partialPolicy` explicitly allows belongs to a
  declared source operation, that unsatisfied binding forces `no-consensus`,
  and no re-validation can reach `consensus` while the actor stays missing. The
  gate then refuses every close, and no `cancelSession` door exists on the
  request surface — so there is no other terminal exit. The same holds for a
  permanently `qualified` outcome (unresolved dissent). This is a real product
  limitation of MVP7, not a security property: it needs a future escape door (a
  driver disposition recording why an aggregation cannot resolve, or a
  `cancelSession` request surface). Neither is built here.
- **"The latest validated aggregation supersedes" is not enforced atomically.**
  The request door selects the most recent validated record outside the
  engine's close lock, and the engine re-checks only the id it was handed. A
  `no-consensus` validated in between does not supersede the `consensus`
  already selected. Both writes need the same driver identity and an active
  session, so this is a narrow same-driver race, not a cross-actor exposure —
  named here rather than papered over by the stronger wording.

**What replay refuses.** A worker-typed validator, a `validatedBy.id` that is
not this session's own driver identity, a source result with no accepted
`result-linked` earlier in the same log, an aggregate naming its own output
Assignment among its sources, a duplicate `aggregationId`, a claimed
`consensus` that simultaneously names a missing/failed actor, an unresolved
contribution, or an unbound source operation, and a claimed `consensus` whose
`artifactRevisionRefs` are absent/empty or do not number exactly one per cited
`sourceResultRefs` entry. A post-terminal `aggregation-validated` event is
neutralized rather than trusted — reported separately, exactly as a
post-terminal authorization is.

**Named limitations, not omitted.**

1. **A careful forgery by the session's own driver identity is not detected —
   narrowed, not closed, and not structural.** A driver writing
   `aggregation-validated` straight to the store with `outcome: consensus`,
   genuinely linked source refs, and one artifact revision pin per source,
   with no evaluator call behind it, still produces an event replay accepts.
   What replay now catches is every forgery that does not mirror the shape of a
   real validation: the coverage fields must be empty and the artifact revision
   pins must be present and match the source count. What it still cannot catch
   is a forger who mirrors that shape exactly, because replay is
   definition-blind and cannot re-derive the evidence set or re-run the
   evaluator to compare verdicts. Two narrowings are known and deliberately not
   taken in MVP7, and neither is blocked by anything structural:
   `recordAggregationValidation` (`store.mjs`) accepts `outcome` as a plain
   caller parameter and could derive it instead — the same fix shape that
   removed `definition` from the validation door's parameter list; and a
   `sourceResultRefs` entry citing an Assignment for an operation that is not a
   declared source could be refused at the one door that now holds the bound
   definition (`aggregationCloseParams` / `validateSessionAggregation`), though
   never at replay. Same trust boundary as the unmediated store-door residuals
   named for visibility windows; recorded here as scheduled-but-not-done rather
   than as unfixable.
2. **The definition is pinned by `{id, version}`, never by content.** The
   validation door resolves the definition from `manifest.definitionRef` and
   refuses version drift, but nothing pins the loaded document's bytes — an
   actor with `.fgos` write access could still swap in a same-`{id, version}`
   document declaring a different cohort. At the close-gate door specifically
   (`aggregationCloseParams`), the same swap is stronger than "a different
   cohort": editing the bound document to drop `completion.aggregation`
   entirely turns the gate itself off, silently disabling the one property
   this cell exists to enforce. Every sibling definition-consuming door in
   the engine shares this exposure; it is a known boundary at parity with
   them, not a regression, and it is not closed by MVP7.
3. **`unresolvedContributionRefs` and hidden-dissent are wired but not driven
   end to end.** Both are covered at the event-schema and evaluator-unit
   layers; no session-level fixture produces the RunResult shapes that would
   exercise them through real dispatch.

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
5. Checking whether a session is still `active` and appending an
   `operation-authorized` event happen as part of the same atomic/serialized
   write path already used for `assignment-created` (point 2 above) — never
   a plain check-then-act against a concurrent `transitionSessionStatus`
   call. Regardless of write-time ordering, replay must treat any
   `operation-authorized` event appearing after a terminal event in
   `events.jsonl` as invalid/ignored.

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
- A `driver-authorized` optional-operation binding's Assignment dispatch with
  no preceding `operation-authorized` event for it is rejected (Phase 00,
  Step 09 MVP2).
- A second `operation-authorized` event (or the Assignment dispatch it would
  trigger) reusing an already-consumed `invocationKey` is rejected, including
  after a crash/resume replay of `events.jsonl` (Phase 00, Step 09 MVP2).
- An `operation-authorized` event issued after a session has left `active`
  (any terminal status) is rejected (Phase 00, Step 09 MVP2).
- An Assignment dispatched under a `contextGrant` that attempts to read a
  context ref outside its authorization's `grantedContextRefs` is rejected
  (Phase 00, Step 09 MVP2).
- A recheck creates a NEW Assignment against a new artifact/evidence revision
  without rewriting, superseding, or deleting the original Assignment's
  RunResult or verdict; both remain readable after the recheck (Phase 00,
  Step 09 MVP2/MVP3).
