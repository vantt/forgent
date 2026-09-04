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
limitations in Evidence-Preserving Aggregation below, not without them.
Phase 08 (Step 09 MVP8): the `deliberation-contribution-linked` event, its
raw and mediated write doors, its replay reconstruction and refusals, the
derived open/resolved contribution views, and the `contribution:` ref
namespace on `driver-disposition-recorded` accepted and implemented —
`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P08.2),
`src/runner/deliberation/schema.mjs` (P08.1, called never forked), method-
shaped proof against three real fixtures under `core/coordination-protocols/`
(P08.3). Promoted with the named limitations in Deliberation Contribution
Ledger below, not without them.
Phase 09 (Step 09 MVP9): the `specialist-authorized` event, its atomic
authorize-and-bind write door, its replay reconstruction, and the
`specialistSlotRef` node-operation binding resolution against currently-live
specialist bindings accepted and implemented —
`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P09.2,
1 HIGH fixed: authorization expiry was gated on a caller-suppliable `round`
that the one real production caller never forwarded, closed by deriving the
session's current round internally from replayed `assignment-created`
events), `src/runner/definitions/schema.mjs` (P09.1, the
`topology.specialistSlots[]` schema — see the
[FlowDefinition Contract](flow-definition.md#specialist-slots-phase-09-step-09-mvp9)),
negative/crash-recovery/structural-absence proof
(`test/runner/{coordination-specialist-binding,coordination-r7-work-isolation}.test.mjs`,
P09.3, closing Phase 09). Promoted with the named limitations in Specialist
Slot Binding below, not without them.
Phase 10 (Step 09 external acceptance, closing Step 09): the multi-operation
quorum-completion rule (`classifySessionQuorum`/`closeSessionByQuorum`,
`session-engine.mjs`, P10-KERNEL-FIX, user-authorized) and the
Group-Thinking Protocol Pack (`core/protocol-packs/group-thinking.json`,
`src/verbs/coordination/group-thinking-pack.mjs`, three registered
protocols, P10.1-P10.9) accepted and implemented, including the pack
request door's fifth step kind (`contribution`, forwarding into
`linkSessionContribution`) and two resolution-failure crash fixes in
`src/verbs/coordination/run.mjs` (P10.10, closing the track). Promoted with
the named limitations in Multi-Operation Quorum Completion and
Group-Thinking Protocol Pack below, not without them. Full per-phase trace:
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
| `deliberation-contribution-linked` | Phase 08 (Step 09) MVP8: a driver-authored, immutable lineage record linking ONE typed deliberation contribution — ref and revision pin only, never artifact content — into this session's ledger (see [Deliberation Contribution Ledger](#deliberation-contribution-ledger-mvp8-step-09) below). Never a transition of its own. | `contributionId`, `operationRef`, `type`, `assignmentId`, `runId`, `artifactRef`, `revision`, `roundKey`, `visibilityWindowRef`, `linkedBy`, `ts`; optional `anchors?`, `respondsTo?` |
| `specialist-authorized` | Phase 09 (Step 09) MVP9: a driver-authored event that atomically authorizes AND session-scoped-binds a previously-unknown specialist actor identity to a declared `topology.specialistSlots[]` slot, in one write (see [Specialist Slot Binding](#specialist-slot-binding-mvp9-step-09) below). Never a transition of its own. | `specialistAuthorizationId`, `slotId`, `specialistActorId`, `role`, `capabilities`, `authorizedBy`, `reason`, `triggerEvidenceRefs`, `allowedContextRefs`, `maxAssignments`, `expiresAfterRound`, `ts` |

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

## Deliberation Contribution Ledger (MVP8, Step 09)

Typed reasoning lineage across rounds — proposal, objection, response,
clarification, rank, specialist-request — persisted as immutable
`deliberation-contribution-linked` links, never a general message/thread/
mailbox subsystem. The closed contribution-type enum, the shape validator,
and the lineage rules (dangling anchor/response, cycle, foreign-session ref,
operation/type mismatch) are owned by
[`src/runner/deliberation/schema.mjs`](../../../../src/runner/deliberation/schema.mjs)
(P08.1) — this session engine calls that validator, never forks it. A
contribution carries `artifactRef` + `revision` only; no content ever
reaches the log.

**Two doors, the same split Evidence-Preserving Aggregation above already
uses.** `store.mjs`'s `recordContributionLink` has no FlowDefinition and
answers only what the manifest and log alone can: driver identity, session
membership, runId shape, contribution-id shape/uniqueness, and lineage
resolution. `session-engine.mjs`'s `linkSessionContribution` is the mediated
door that derives everything definition-dependent — which declared operation
backed the contribution (the same reserved `protocol-operation:` stamp
window derivation uses), which window gates it, whether that window is open,
and the immutable artifact pin — and accepts no definition, window, or
revision as a caller parameter.

**`contributions.allowedTypes[]` (Phase 08 MVP8) narrows the operation/type
gate for real.** Declared per operation in the bound
[FlowDefinition](flow-definition.md#operation-primitive), `session-engine.mjs`
reads the real declaration off `definition.spec.operations[]` — an operation
with no `contributions` key, or an explicit `allowedTypes: []`, both mean
"declares no allowed types" (reject every type), never "all types allowed".
An operation that never declares a type can back no contribution of that
type, even through the mediated door.

**Window/context legality is the EXISTING MVP6 mechanism, reused, never
reimplemented.** A contribution's binding must declare
`contextAccess.visibilityWindowRef`; linking is refused while that window is
shut. Beyond "shut right now", the window claim is a REASONING-time claim,
not a link-time one: the backing Run must have been AUTHORIZED (dispatched)
strictly after the window opened, not merely settled or linked after — a Run
that executed while the window was shut carries no legitimate provenance for
it, however long the driver waits to link it. One structural consequence: an
operation's own contribution can never be gated by a window that opens only
after that SAME operation's own cohort settles (its authorization always
precedes such a window's opening) — a protocol that wants "private, then
revealed to the group" must gate the CONSUMING operation's context grant
(the pre-existing MVP6 mechanism) rather than the producing operation's own
link. See `core/coordination-protocols/deliberation-nominal-group-chain.yaml`
(P08.3) for a worked fixture.

**The `contribution:` ref namespace on `driver-disposition-recorded`.** A
disposition's `targetRef`/`evidenceRefs` entries may name a contribution of
THIS session using the reserved prefix `contribution:<contributionId>`; an
unknown id, a bare (unprefixed) id that happens to match one of this
session's own linked contributions, or a ref naming another session's
contribution are all refused (a bare near-miss is refused rather than
silently accepted-and-resolving-nothing). `src/verbs/coordination/show.mjs`'s
read-side ownership mirror agrees with this write-door rule.

**Open/resolved are DERIVED, never a stored mutable status.**
`replaySession` returns `contributions` (accepted links) and
`ignoredContributions` (post-terminal, neutralized) — records with no status
field of any kind — plus `openContributionIds`/`resolvedContributionIds`,
computed at replay time as the partition against pre-terminal dispositions
naming a `contribution:` ref. A disposition naming a contribution this
session never linked resolves nothing.

**Named limitations, not omitted.**

1. **The definition is pinned by `{id, version}`, never by content** — the
   same exposure named for aggregation above, shared by every
   definition-consuming door in this engine including this one. At this
   door specifically, a same-`{id, version}` content swap does not merely
   change evidence a verdict is derived over; it can remove the window gate
   entirely and launder a false `visibilityWindowRef` claim into a permanent,
   replay-accepted record. Not closed here; the systemic fix (pinning
   `definitionRef` by content hash, once, for all five definition-consuming
   doors) is out of scope for any single cell.
2. **`revision` currency is checked once, at link time.** An artifact edited
   after linking leaves the link standing with a pin that no longer matches
   current bytes — correct for an immutable lineage record, but a reader
   wanting "is this still current" must recompute it; no helper does that.
3. **No CLI/`show` rendering yet.** `replaySession`'s four contribution-shaped
   return values are ready to render; nothing under `src/verbs/coordination/`
   renders them beyond the ownership set `show`'s disposition mirror already
   consumes.
4. **`specialist-request` has no real dispatched-session proof.** All six
   contribution types are proven legal at the event-schema layer; the three
   method-shaped fixtures (P08.3) exercise `proposal`, `objection`,
   `response`, `clarification`, and `rank` end to end through real dispatch —
   `specialist-request` is left for whichever cell wires MVP9 bounded
   specialist binding.

## Specialist Slot Binding (MVP9, Step 09)

A bounded, predeclared capacity for the driver to recruit ONE previously-
unknown specialist identity per declared `topology.specialistSlots[]` slot
(see the [FlowDefinition Contract](flow-definition.md#specialist-slots-phase-09-step-09-mvp9)
for the schema half) — never an open-ended actor pool, never a runtime
topology mutation, and never a worker-authored recruitment. A worker may
request a specialist (the `specialist-request` deliberation contribution
type, above); only the driver may authorize one.

**One event does both jobs.** `specialist-authorized` is simultaneously the
authorization record AND the session-scoped actor binding — there is no
separate `specialist-bound`/`actor-bound` event for a specialist. This meets
the phase's own atomicity requirement ("atomically record authorization and
session-scoped actor binding before any Assignment is issued") structurally:
`recordSpecialistAuthorization` (`store.mjs`) performs every check (session
active, driver identity, `maxBindings` cap) and the append as ONE
`appendEventLocked` call inside a single `withEventsLock` critical section —
there are not two writes for a crash to land between. This is a deliberate
departure from `replaceSessionActor`'s own precedent (a `bindActor` call
followed by a separate `recordActorReplacement` call, two appends with a
real window a crash-resume claim-file has to paper over): a specialist is
never added to `manifest.actors[]` at all — it is a synthesized `{id, role}`
pair, resolved fresh from the live `specialist-authorized` record on every
dispatch, never a second stored structure that could itself drift out of
sync with the authorization that created it.

**"Live" occupant = last-write-wins per slot; expiry is a pure read-side
filter, never a rewrite.** The MOST RECENT (log-order) `specialist-authorized`
record for a given `slotId` is that slot's current occupant — a later
authorization for the same slot IS the supersession signal (mirroring
`actor-replaced`'s own "last wins" semantics), so there is no separate
"specialist-superseded" event kind. `expiresAfterRound` bounds ONLY future
Assignments: a slot whose live record's `expiresAfterRound` is behind the
session's real, internally-derived current round is simply absent from the
live-bindings view for that round — the record itself, and every event tied
to it, is never erased, rewritten, or hidden. The current round is derived
purely from the replayed event log (one plus the count of
`assignment-created` events, session-wide) — never a caller-supplied value,
closing the class of bug this event kind's own Fix Round 1 found (below).

**`maxBindings` is cumulative-ever, not concurrent.** A slot has exactly one
LIVE occupant at a time by construction (last-write-wins, above), so
`maxBindings` is read as a hard ceiling on how many DISTINCT
`specialistActorId` values may EVER be authorized for a given slot across
the session's whole history — never decremented by expiry or supersession.
Re-authorizing the SAME specialist actor already occupying the slot does not
consume a new binding.

**`maxAssignments` is a separate cap from the pre-existing per-binding
invocation cap.** A specialist's `maxAssignments` bounds its TOTAL
`operation-authorized` invocation allowance across every operation its slot
declares (a slot's `operationRefs[]` may name more than one operation) —
counted by `targetActorId` alone, which is safe because a live
`specialistActorId` is unique to one occupant of one slot at a time. This is
distinct from `activation.maxInvocations`, which bounds one exact
`(nodeId, operationId, targetActorId)` binding.

**Every specialist invocation still goes through the pre-existing
`operation-authorized` door**, exactly as for a statically-`actor`-bound
operation — no new dispatch gate was introduced. `dispatchDeclaredOperation`
resolves a `specialistSlotRef` binding's effective actor id by looking up
the slot in a freshly-derived live-bindings map before resolving the
authorization, then proceeds through the SAME context-grant enforcement,
visibility-window re-derivation, and contract construction
(`buildSessionContract`, defaulting `mutation: 'read-only'`) every other
`dispatchDeclaredOperation` call uses — a specialist-dispatched Assignment
introduces no NEW mutation mechanism of its own; it is subject to the exact
same Mutation Rule (see below) as any other declared `operation` step,
statically-bound or specialist-slot-bound alike (proved in
`test/runner/coordination-r7-work-isolation.test.mjs` and
`test/runner/coordination-specialist-binding.test.mjs`, P09.3).

**No `addSessionEdge`/topology-overlay mutation path exists.** Neither
`addSessionEdge` nor `addSharedEdge` is defined anywhere in this codebase — a
structural absence, not a runtime refusal (`test/runner/coordination-r7-work-isolation.test.mjs`,
P09.3, scans both `src/runner/coordination/**` and `src/runner/definitions/**`
for the identifier and for any exported name shaped like a branch/worktree/
merge/approve/Work-transition operation). A specialist slot is declarative
capacity, never a routable topology edge: `topology.edges[]` rejects an
entry naming a declared specialist slot id as its `from`/`to`
(FlowDefinition Contract), and no schema field resolves a graph operation's
static `actor` against a slot id.

**Named limitations, not omitted.**

1. **`allowedContextRefs` is validated for session ownership at authorize
   time but not yet enforced as a per-invocation ceiling.** The Candidate
   Contract lists `allowedContextRefs` as slot-LEVEL capacity data on
   `specialist-authorized` itself; the field that actually gates what one
   dispatched Assignment may read is `operation-authorized`'s own
   `grantedContextRefs`, reused unchanged for every specialist invocation.
   Read this way, `allowedContextRefs` is the ceiling a driver's later
   `grantedContextRefs` choice SHOULD stay within; this cell validates it is
   session-owned but does not yet enforce that later per-invocation grants
   stay within it. Additional wiring inside `dispatchDeclaredOperation`'s
   existing context-grant block would close this, not a new mechanism.
2. **`allowedVisibilityWindows[]` (declared on the slot) is not yet
   cross-checked against the dispatched operation binding's own
   `contextAccess.visibilityWindowRef`.** The pre-existing
   `deriveVisibilityWindowState` gate still applies unchanged and uniformly
   to a slot-bound operation exactly as to a statically-bound one, but
   nothing yet refuses an authorization naming a visibility window outside
   the slot's own declared list specifically — an over-declared slot, not an
   unfillable one.
3. **The definition is pinned by `{id, version}`, never by content** — the
   same systemic exposure named for Evidence-Preserving Aggregation and the
   Deliberation Contribution Ledger above, shared by every
   definition-consuming door in this engine including `authorizeSpecialistSlot`
   and `dispatchDeclaredOperation`'s specialist-binding resolution. Not
   closed here.

### Fix Round 1 (P09.2): specialist-liveness round derivation

The originally-shipped `resolveLiveSpecialistBindings` accepted a bare,
caller-supplied `round` parameter (default `1`) to compare against
`expiresAfterRound`. The one real production call path
(`src/verbs/coordination/run.mjs`'s "authorize" step) never forwarded it at
all, so `expiresAfterRound` structurally never fired through real usage —
empirically reproduced (5 real calls, `round` omitted, all wrongly
succeeded against `expiresAfterRound: 1`). Closed by deriving the session's
current round internally, purely from the replayed event log (one plus the
count of `assignment-created` events, session-wide) — a real, monotonic
quantity no caller input can move. `resolveLiveSpecialistBindings` now
accepts no `round` parameter at all; `dispatchDeclaredOperation`'s own
pre-existing `round` parameter is fully decoupled and unaffected, remaining
a per-edge taskKey/`maxRounds` disambiguator only.

## Multi-Operation Quorum Completion (Phase 10, Step 09, P10-KERNEL-FIX)

`classifySessionQuorum`/`closeSessionByQuorum` (`session-engine.mjs`) decide
whether every declared actor has done enough to let a session close. Before
this fix, an actor counted complete the instant its FIRST-ever
`assignment-created` event existed — correct for every pre-Phase-10 mechanism
(one operation per actor), but wrong once a single actor legally performs
MORE THAN ONE declared operation across a session's life (a real shape all
three group-thinking-lite protocols below have): the session auto-closed
after that actor's first operation settled, silently and permanently
refusing any later, genuinely separate call that tried to reach the actor's
remaining declared work.

**The real rule.** An actor's graph-declared operation binding gates its own
quorum completion when it is `required`, OR when it is `driver-authorized`
AND ALSO declares `contextAccess.visibilityWindowRef` (real MVP6 access
control, not a skippable driver's-choice branch). An actor with zero gating
bindings falls back to the original, byte-identical "first assignment" rule
— this fix narrows a false completion, it never widens a true one. Proven
directly: three independent conformance cells (P10.6/RFC-Review-Lite,
P10.7/Nominal-Group-Lite, P10.8/Delphi-Feedback-Lite) each independently
converged on the identical root cause on a different protocol; P10.7's
Red-Team live-reproduced it against P10.6's own already-closed, already-
merged protocol under normal "launch, resume" usage, proving it was already
live in shipped code. Fixed and independently rechecked (`P10-KERNEL-FIX.md`,
3 fix rounds, final recheck APPROVE); regression coverage:
`test/runner/coordination-recovery-and-quorum.test.mjs`'s own
`multiOpQuorumDefinition` fixture and both `P10-KERNEL-FIX Fix Round 3`
tests (resolution-failure refusal, version-drift read honesty).

**Named residual, not fixed here.** An operation id bound to the SAME actor
at two DIFFERENT graph nodes deduplicates to one gating entry (settling
either node's own Assignment satisfies both) — a real, unfixed instance of
the premature-close bug for that one authoring shape. No shipped protocol
has it today (`P10-KERNEL-FIX.md` §5, MEDIUM-6); closing it would require
gating on `(operationId, nodeId)` pairs, judged out of scope for a
kernel-classification fix.

## Group-Thinking Protocol Pack (Phase 10, Step 09)

A small, data-first application layer OUTSIDE this kernel
(`core/protocol-packs/group-thinking.json`,
`src/verbs/coordination/group-thinking-pack.mjs`) that indexes real
FlowDefinition protocols by `metadata.id@version` and gates
`fgos-group-thinking`-style requests to an explicitly-selected pack member
before forwarding them, byte-for-byte, into this contract's own
`runCoordinationUseCase` (`src/verbs/coordination/run.mjs`) — the SAME door
`fgos coordination run --file` and the headless adapter already use. The
pack never decides visibility legality, aggregate validity, specialist
authority, or terminal truth; every one of those stays owned by this
kernel, unchanged, per the Pack Integration Gate
(`plans/260903-2334-step09-mvp6-to-mvp9/phase-10-group-thinking-protocol-pack-conformance-and-closeout.md`).

**Three registered protocols**
(`core/protocol-packs/group-thinking.json`, all `1.0.0`), each a genuinely
new FlowDefinition, not a clone of an earlier fixture, each proven end to
end through the real pack gate (not merely by direct engine call):
`group-thinking-rfc-review-lite` (two independent objectors before a
controlled, driver-authorized reveal and response —
`test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs`),
`group-thinking-nominal-group-lite` (private proposals, controlled sharing,
clarification, private ranks, a real 3-actor cohort —
`test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs`),
and `group-thinking-delphi-feedback-lite` (private round-1 proposals feeding
a mediated, non-contribution aggregate that gates a bounded round-2, with an
engine-enforced round cap —
`test/verbs/coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs`).

**Request step vocabulary — five kinds.** `run.mjs`'s request `steps[]`
(`src/verbs/coordination/schema.mjs`'s `validateSteps`) accepts exactly
`operation` | `authorize` | `disposition` | `fan-out` | `contribution`.
The fifth kind, `contribution` (added Phase 10, P10.10), forwards into
`linkSessionContribution` (Deliberation Contribution Ledger, above) the same
way `authorize`/`disposition` already forward into their own mediated doors
— `linkedBy` is never caller-supplied, always the request's own derived
driver identity, and every window/provenance/lineage check
`linkSessionContribution` already performs runs unchanged. Before this, the
pack's closed four-kind vocabulary never reached that door at all, so no
contribution-typed lineage record (proposal/objection/response, with
`anchors`/`respondsTo`) could ever be created through the pack, for any of
the three protocols above — first found by P10.6, re-confirmed by
P10.7/P10.8, classified by P10.10 as a scoped pack-layer wiring gap (the
underlying door already existed and was already proven, P08.2/P08.3; only
the request-vocabulary channel reaching it was missing), not a new kernel
capability, and closed without touching any kernel file (`src/runner/**`) —
see `test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs`'s
own positive proof (full proposal/objection/response lineage, reconstructed
from `replaySession` alone, across three separate pack-gate calls),
`test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs`'s
own positive proof (a real `rank`-typed contribution linked for the
`private-rank` operation, same three-call/replay-reconstruction shape),
and `test/verbs/coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs`'s
own round-order proof (an early link attempt refused by the SAME
window-not-open message `linkSessionContribution` already gives directly)
— positive end-to-end proof now exists for all three registered protocols.
The request boundary's `contributionId`/`anchors`/`respondsTo` charset
(`assertSafeId`, `^[A-Za-z0-9_-]+$`) is stricter than the engine's own
`assertContributionIdShape` (`store.mjs`, which permits dots and colons) —
a narrowing-only, safe direction, but disclosed here explicitly: a
contribution created through a direct engine call with a dotted or
colon'd id cannot be named as an `anchor` or `respondsTo` through this
request boundary.

**Five bypasses, verified structurally impossible** (`P10.1.md` §5/§11,
re-verified against two real registered protocols by `P10.5.md` §4-5):
(1) switch protocols silently — the pack's own explicit-selection check
plus, on resume, a cross-check against the session's REAL bound protocol
(`manifest.definitionRef.id`, via `resumeSession`) fixed by P10.1's own Fix
Round 1 after Red-Team proved a resume-path gap in the original design;
(3) validate its own aggregate, (4) authorize a specialist, (5) close a
session directly — `run.mjs`'s public request vocabulary never exposes any
of these three as caller-invokable actions at all (`closeSessionByQuorum`
in particular is called unconditionally, and only, inside `run.mjs` itself
at the end of its own steps loop, never as a request-selectable action);
(2) bypass grants — `run.mjs`'s public vocabulary DOES expose an
`authorize` step, but it dispatches through `authorizeDeclaredOperation`,
the exact same mediated door with the exact same context-grant enforcement
every hand-authored request already uses — this gate's own explicit-
selection checks run before, and add nothing to, `run.mjs`'s existing
enforcement, so the bypass is refused by mediation, not by absence from the
vocabulary (`P10.1.md`'s own accurate framing, quoted rather than
paraphrased: three bypasses — validate-aggregate, authorize-specialist,
close-directly — are refused because `run.mjs`'s vocabulary never exposes
them at all; two — switch-protocols, bypass-grants — are refused because
the pack gate's own explicit-selection checks run before, and add nothing
to, `run.mjs`'s existing enforcement. This is NOT "upstream mediation" in
`run.mjs` itself: the base `runCoordinationUseCase` door has no
resumed-session protocol cross-check of its own — see this document's
"Group-Thinking Protocol Pack" section, residual #22 — so switch-protocols
is refused by the PACK gate's own explicit check, not by anything
`run.mjs` enforces upstream).

**Per-actor provider/tier customization, proven live, never collapsed onto
one hardcoded provider** (the user's own mid-flight requirement,
`P10.1.md` §3a, `P10.3.md`): the pack gate never reads or touches
`requestObject.actors`, so per-actor `executor`/`model`/`tier`/`persona`
selection reaches `run.mjs`'s real `actorPolicyFields` resolution
completely unchanged. Proven with two genuinely different registered
executors dispatching as two different actors in one session (P10.1), and
with Nominal-Group-Lite's facilitator/participant roles resolving to two
different registered executors/providers via `cliPolicy`
(`test/runner/coordination-group-thinking-nominal-group-lite.test.mjs`,
P10.3).

**Two resolution-failure crashes fixed (Phase 10, P10.10), never a kernel
change.** `run.mjs` had two separate, previously-unguarded
`loadCoordinationProtocol` calls — the request-boundary actor-membership
check (resolves `request.protocolRef.id`, runs first, on every
declared-protocol request) and `aggregationCloseParams` (resolves
`manifest.definitionRef.id`, P10-KERNEL-FIX.md §5's own N3/R2-MEDIUM-C
Gap) — both of which threw a raw, uncaught `FlowDefinitionError` on a
resolution failure (a malformed sibling protocol file, a removed protocol)
instead of the same honest, correctly-attributed refusal
`classifySessionQuorum` already gives its own resolution-failure case.
Pre-existing, always failed safe (a session never wrongly closed); fixed by
wrapping each load in a try/catch mirroring `classifySessionQuorum`'s own
pattern — see
`test/verbs/coordination-aggregation-surface.test.mjs`'s two P10.10
regression tests and `test/verbs/coordination-launch-master-loop.test.mjs`'s
updated R4 test.

**Named limitation, not closed here.** The definition-pinned-by-`{id,
version}`-not-content exposure (Deliberation Contribution Ledger, above)
applies identically to every pack-registered protocol; the pack registry
adds real `{id, version}` pairs, it does not close or worsen this
systemic, already-disclosed, whole-kernel limitation.

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

## Mutation Rule (declared `operation` steps, group-thinking-plan-loop Phase 01)

Every dispatch door in this contract defaults to read-only
(`buildSessionContract`'s own `mutation = 'read-only'` default, byte-identical
to every caller that predates this section). `dispatchPrimaryTask` and
`proposeConsult` (the agent-led, undeclared-protocol path) keep their own,
separate, hard read-only assertions unconditionally — this section applies
ONLY to `dispatchDeclaredOperation`'s own path, and only to a declared
`operation` step specifically (never `authorize`/`disposition`/`fan-out`/
`contribution`, which stay hard-refused for anything but `"read-only"` at the
request-schema boundary, `src/verbs/coordination/schema.mjs`).

A declared `operation` step may set `mutation: 'mutating'` and dispatch as a
real, mutating worker — producing an actual git delta the dispatch evidence
ladder grades `verified` — ONLY when ALL four conditions hold, checked in
`dispatchDeclaredOperation` before any Assignment is materialized, refused
with an error naming the SPECIFIC failed condition otherwise (never a generic
validation message):

1. **Declared on an `operation` step.** The request-schema boundary accepts
   `mutation: 'mutating'` only on a `type: "operation"` step; every other
   step/branch type is refused at the schema layer before this rule is ever
   reached.
2. **The bound operation declares `result.kind: 'work-product'`.** Read from
   the FlowDefinition's own resolved operation at dispatch time — never
   trusted from a caller-supplied claim. An operation declaring
   `result.kind: 'advisory'` (or any other value) is refused, naming the
   operation's own declared kind.
3. **The dispatch `cwd` resolves to a linked git worktree, never the main
   checkout.** Exact comparison: `resolveMainCheckoutRoot(cwd) ===
   resolveRepoRoot(cwd)` (the toplevel of `cwd` IS the main checkout root)
   refuses — never `resolveMainCheckoutRoot(cwd) === cwd`, since `cwd` may
   legitimately be a subdirectory of either checkout. A `null`
   `resolveMainCheckoutRoot` result (cwd outside any git checkout at all)
   also refuses — fail closed, never fail open on an unresolvable root.
4. **The inline execution contract carries the engine's own reserved
   `protocol-operation:` provenance stamp.** `dispatchDeclaredOperation` is
   the ONLY minter of this stamp (`session-engine.mjs`'s
   `assertNoReservedOperationStamp`/stamp-append mechanism); a bare inline
   contract built by any OTHER caller (e.g. a hand-crafted
   `provenance.kind: 'inline'` Assignment) that sets `mutation: 'mutating'`
   without this stamp is still rejected by `execution-contract.mjs`'s/
   `assignment-normalizer.mjs`'s own gates — the schema/normalizer-level door
   alone is forgeable and is NOT by itself sufficient.

**The invariant that actually enforces this at execution time**:
`runExecutorAttempt` (`session-engine.mjs`) is the ONLY code path anywhere in
this codebase allowed to pass `isReadOnlyMode: false` into `executeAssignment`
— it derives that flag from the Assignment's own already-stamped `mutation`
field (`isReadOnlyMode: assignment.mutation !== 'mutating'`), never a
second, independently-decided boolean. A static, codebase-wide enumeration
test (`test/architecture.test.mjs`) asserts every other real
`executeAssignment(...)` call site keeps a provably safe posture.

A step that omits `mutation` entirely behaves byte-identically to before this
rule existed — read-only, `isReadOnlyMode: true` — and a reviewer/red-team/
consult dispatch that mutates a file regardless still fails closed (the
pre-existing read-only-violation gate in `dispatch/assignment-runner.mjs`,
unaffected by this rule).

**Open, out-of-scope consideration** (not decided by this section): nothing
here gives two DIFFERENT declared `operation` dispatches — from two different
actors, potentially concurrent — a workspace-exclusivity guarantee if a
caller happened to target the SAME linked worktree `cwd` for both. Condition
3 only ever refuses the MAIN CHECKOUT; it says nothing about two mutating
dispatches sharing one worktree. This is a real, open question for whichever
cell/ADR next addresses multi-actor workspace allocation, not resolved here.

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
- A `specialist-authorized` event is refused when: `authorizedBy` does not
  name this session's own driver identity; `slotId` names no declared slot;
  `role`/`capabilities` do not satisfy the slot's own declared
  `role`/`requiredCapabilities`; the slot is already at its declared
  `maxBindings` cap for a NEW distinct specialist actor;
  `triggerEvidenceRefs`/`allowedContextRefs` name a different
  CoordinationSession; `specialistActorId` collides with a
  statically-declared `spec.actors[]` id; or the session has left `active`
  status (Phase 09, Step 09 MVP9).
- A specialist's dispatch is refused once real session progress (Assignments
  materialized, session-wide) has passed its authorization's own
  `expiresAfterRound` — the authorization event itself is never erased, and
  the refusal holds even when `round` is never supplied by the caller
  (matching real production usage) (Phase 09, Step 09 MVP9).
- A specialist cannot be authorized for dispatch beyond its own
  `maxAssignments` cap, counted across every operation its slot declares
  (Phase 09, Step 09 MVP9).
- Retrying an already-durably-written `specialist-authorized` request (same
  `specialistAuthorizationId`) resumes idempotently, never mints a second
  authorization event, and leaves the slot's live binding unaffected; retrying
  an already-dispatched specialist request resumes the SAME Assignment,
  never double-authorizes or double-dispatches (Phase 09, Step 09 MVP9,
  crash recovery).
- No exported name anywhere in `src/runner/coordination/**` or
  `src/runner/definitions/**` is shaped like a branch/worktree/merge/approve/
  Work-transition operation, and neither `addSessionEdge` nor
  `addSharedEdge` appears anywhere in either directory's source (Phase 09,
  Step 09 MVP9, extending Phase 06 R7's existing scan).
