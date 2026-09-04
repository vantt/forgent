# Step 09 - Group Thinking Substrate

Document type: Proposal
Design status: Accepted for the implemented slice (MVP0-9 plus the Post-MVP9
Acceptance Layer); Discussion for every item this document still names as
deferred (vote/rank tally/weighted scoring/convergence, anonymization,
partial-window exceptions, aggregate transformation, cross-session grants,
`addSessionEdge`/arbitrary topology overlays, driver handoff, persistent
organization membership, peer-invited specialists — none of these are
implemented or claimed by any cell in this track).
Implementation: MVP0-5 implemented per `step-09-group-thinking-mvp1-mvp2`
(MVP1/MVP2) and `step-09-mvp3-to-mvp5` (MVP3-MVP5). MVP6-9 (§8.1's own
"Locked MVP6-MVP9 Shape") plus the Post-MVP9 Acceptance Layer (§8.2: the
Group-Thinking Protocol Pack, three conformance-proven protocol
definitions, and the `fgos-group-thinking` skill) implemented and closed by
`step-09-mvp6-to-mvp9` (Phases 00/06/07/08/09/10, including the
user-authorized P10-KERNEL-FIX quorum fix) — see that track's own
verification index for the full per-phase evidence trail and the
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md)/
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)
for the promoted contract text, each with its own named limitations.
Last reviewed: 2026-09-04
Canonical for: nothing until explicitly accepted; the implemented MVP0-9 +
Post-MVP9 Acceptance Layer slice is canonical only through the
CoordinationSession/FlowDefinition contracts it was promoted into, above —
this proposal document itself never becomes canonical by implementation
alone
Original date: 2026-09-02
Scope: preserve and narrow the next Agent Coordination design frontier after
Step 08: make fgOS able to express richer group-thinking and problem-solving
collaboration patterns without weakening the isolation-heavy fixtures already
proved by Step 08.
Intent traceability: [Architecture Intent](../architecture-intent.md),
[Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md)
Related: [Coordination Foundation Baseline](../agent-coordination/architecture/coordination-foundation-baseline.md),
[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),
[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),
[Team Communication Protocol V1](../agent-coordination/proposals/team-communication-protocol-v1.md),
[Component Authority Boundary Map](component-authority-boundary-map.md),
[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md),
[Step 09 MVP1/MVP2 group-thinking verification](../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md),
[Step 09 MVP3-MVP5 verification](../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md),
[MVP6+ Dogfood Handoff](../agent-coordination/playbooks/mvp6-dogfood-handoff.md)

Implementation note (updated by `step-09-mvp6-to-mvp9`'s own closing cell,
P10.10 — Step 09 is now closed): MVP1-MVP5 promoted starting Phase 00 — see
`step-09-group-thinking-mvp1-mvp2` (MVP1/MVP2) and `step-09-mvp3-to-mvp5`
(MVP3-MVP5: recheck lineage/disposition hardening, a thin CLI launcher,
intentional role-tier dispatch policy, and session resume). MVP6 visibility
windows, MVP7 aggregation rules, MVP8 deliberation memory, and MVP9
dynamic specialist pull-in — §8.1's own "Locked MVP6-MVP9 Shape" — are now
IMPLEMENTED AND PROVEN, along with the Post-MVP9 Acceptance Layer (§8.2):
the Group-Thinking Protocol Pack, three real, conformance-proven protocol
definitions (RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-Lite),
and the `fgos-group-thinking` skill — see
`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`
for the full evidence trail and the CoordinationSession/FlowDefinition
contracts for the promoted text. This document still does not authorize
any runtime/schema change beyond what those contracts now accept — every
item this document names elsewhere as deferred (§8.1's per-MVP "remain
deferred" clauses; §15 "Explicitly Not Proposed") is STILL deferred, not
implemented by this track: no vote/rank tally/weighted scoring/convergence
semantics, no anonymization, no partial-window exceptions, no aggregate
transformation, no cross-session grants, no `addSessionEdge`/arbitrary
topology overlay, no driver handoff, no persistent organization
membership, no peer-invited specialists. It exists so a future deferred
slice does not narrow the original intent into only the currently
convenient fixture.

## 1. Why This Step Exists

The original plan after Step 08 was to make Coding Domain consume the
coordination foundation. During Step 01-08 implementation, the manual
Master Coordination Prompt worked well enough to expose a separate question:

```txt
Can Agent Coordination itself express the group-thinking loop that the manual
Master Coordinator used successfully?
```

That loop is not a Coding Domain adoption effort. It is a standalone
coordination capability proof: Doer, Reviewer, Fixer, Red-Team, recheck, and a
persistent external coordinator deciding whether to continue or stop. It does
not require Work lifecycle, Work status/stage, git merge, or coding-domain
mutation authority.

The current foundation can express static declared graphs, mediated consult,
bounded fan-out/fan-in, evidence refs, retry, replacement, and synthesis. It
cannot yet express a bounded adaptive group-thinking loop cleanly: optional
follow-up rounds, recheck distinct from retry, driver authorization, and
disposition are still ad hoc.

## 2. Intent Guardrail

Step 09 must keep the design open to future group collaboration mechanisms
without implementing all of them now. "Open" means the core has declared
extension points and fixture-local posture; it does not mean global peer chat,
unbounded dynamic topology, or weakening proven invariants.

The capability map remains the group-thinking axes from
[Architecture Intent](../architecture-intent.md):

- topology shape;
- timing;
- role symmetry;
- information visibility;
- control regime / meta-authority;
- feedback loop;
- decision / aggregation rule;
- deliberation memory;
- speech acts.

These axes are not one implementation backlog. They are the map that prevents a
small MVP from hardcoding itself into the only collaboration shape fgOS can
ever express.

## 3. Non-Negotiables

- Do not change or loosen `group-cognition-framework.yaml`; it remains the
  isolation-heavy R3 proof fixture.
- Do not reopen evidence immutability, governance-final dispatch, budget caps,
  path safety, or mutation exclusivity.
- Do not introduce an autonomous in-graph leader. The persistent coordinator
  or driver authority stays outside the declared worker graph.
- Do not require Work. Step 09 is standalone coordination first.
- Do not move Work lifecycle, git, merge, status/stage, or coding-domain
  mutation authority into Agent Coordination.
- Do not make this proposal accepted design before it is promoted through the
  documentation governance path.

## 4. Stable Spine

The step's stable architecture direction is the spine below. Later MVPs may
add capability layers, but should not replace this shape just because a new
group-thinking method appears:

```txt
FlowDefinition = static legality envelope
CoordinationSession = event-sourced runtime ledger
External driver = adaptive authority outside the worker graph
Assignment / Run / RunResult = execution and evidence path
Context grant = visibility and memory access path
Skill / surface = thin launcher only
```

The first useful fixture should be `standalone-master-coordination-loop`, a
CoordinationProtocol-profile FlowDefinition plus a small runtime primitive for
driver-authorized declared rounds. The input can be a plan or artifact file.

Target flow:

```txt
external coordinator / session driver
  -> doer receives plan.md / artifact.md and produces candidate artifact
  -> reviewer reviews the candidate artifact
  -> red-team challenges the candidate artifact
  -> coordinator reads evidence and records disposition
  -> optional fixer or doer-followup produces revision
  -> reviewer or red-team rechecks revision
  -> coordinator records final disposition and closes session
```

The coordinator is not a `spec.actors[]` worker. It is the durable authority
that reads RunResults/evidence, authorizes optional rounds, records
disposition, and decides terminal session status within declared bounds.

## 5. Prompt Source, Not Runtime Dependency

The manual proof source is
[Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),
backed by the
[Coordination Operating Harness](../agent-coordination/playbooks/coordination-operating-harness.md).
Those playbooks are not loaded by runtime and must not become hidden runtime
prose. Their value for Step 09 is the operating shape they proved:

```txt
external coordinator owns durable state and stop/go authority
  -> doer produces a bounded candidate
  -> reviewer independently checks correctness/regression
  -> red-team independently attacks invariants and false-success paths
  -> coordinator dispositions findings
  -> fixer/doer-followup handles accepted findings only
  -> reviewer/red-team recheck the new revision
  -> coordinator closes, blocks, or authorizes another declared round
```

Step 09 extracts that shape into declared FlowDefinition/session primitives. It
does not paste the prompt into product runtime, and it does not make the prompt
the authority for Work, git, merge, approval, or lifecycle mutation.

## 6. MVP1 - Master Coordination Fixture

The first fixture should be named:

```txt
standalone-master-coordination-loop
```

It is a `CoordinationProtocol` FlowDefinition used with a coordination request
whose input is an already-approved plan or artifact reference:

```yaml
definitionRef:
  id: standalone-master-coordination-loop
  version: v0
objective: <one approved plan or artifact review objective>
inputRefs:
  - path: plans/.../plan.md
  - path: docs/.../artifact.md
aggregateBounds:
  maxAssignments: 8
  maxRounds: 3
  maxConcurrency: 2
```

`inputRefs` are context references. They do not create Work items and do not
grant mutation authority.

The declared worker graph contains workers only:

```yaml
actors:
  - id: doer
    role: doer
  - id: reviewer
    role: reviewer
  - id: red-team
    role: red-team
  - id: fixer
    role: fixer
```

The driver/coordinator is not an actor. It opens the session, reads evidence,
authorizes optional operations, records disposition, and closes or stops the
session.

Minimal operation set:

```yaml
operations:
  - id: produce-candidate
    role: doer
    result: {kind: work-product, evidenceRequired: reported}
  - id: review-candidate
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-candidate
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
  - id: revise-candidate
    role: fixer
    result: {kind: work-product, evidenceRequired: reported}
  - id: reviewer-recheck
    role: reviewer
    result: {kind: advisory, evidenceRequired: reported}
  - id: red-team-recheck
    role: red-team
    result: {kind: advisory, evidenceRequired: reported}
```

The first three operations are required. `revise-candidate`,
`reviewer-recheck`, and `red-team-recheck` are declared in the graph but may
materialize only after driver authorization. MVP1 can document and validate the
static fixture skeleton first; a real adaptive run requires MVP2.

Artifact stance:

```txt
RunResult owns produced artifact refs.
CoordinationSession links those refs.
CoordinationSession does not become a second artifact authority.
```

If runtime cannot yet carry produced artifact refs cleanly, MVP1 may keep
artifact refs as documented fixture intent. MVP2 decides the persisted shape.

## 7. MVP2 - Driver Authorization Primitive

The primitive should be `operation-authorized`, not `requestRound` and not
`addSessionEdge`.

Workers may recommend another round later, but they do not authorize it.
Dynamic edge addition is useful later, but too broad for the first Master
Coordination proof and too easy to confuse with the isolation-heavy R3 fixture.

The FlowDefinition delta belongs on the node-operation binding:

```yaml
graph:
  nodes:
    - id: revision
      operations:
        - ref: revise-candidate
          actor: fixer
          activation:
            mode: driver-authorized
            maxInvocations: 1
```

`activation.mode` is not a reusable operation property. The same operation may
be required in one graph position and driver-authorized in another.

Candidate session event:

```json
{
  "kind": "operation-authorized",
  "authorizationId": "auth_...",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "targetActorId": "fixer",
  "invocationKey": "revision:1",
  "authorizedBy": {"type": "driver", "id": "session-driver"},
  "reason": "accepted findings require revision",
  "grantedContextRefs": [
    "run:<doer-run>/artifact:candidate",
    "run:<reviewer-run>/artifact:review-report",
    "run:<red-team-run>/artifact:red-team-report"
  ],
  "targetArtifactRef": "run:<doer-run>/artifact:candidate",
  "ts": "..."
}
```

Assignment creation for that operation must persist the authorization
provenance:

```json
{
  "kind": "assignment-created",
  "assignmentId": "asgn_...",
  "actorId": "fixer",
  "operationId": "revise-candidate",
  "nodeId": "revision",
  "authorizationId": "auth_...",
  "invocationKey": "revision:1",
  "contextGrant": {"refs": ["..."]},
  "ts": "..."
}
```

Disposition is a driver event, not a worker result:

```json
{
  "kind": "driver-disposition-recorded",
  "targetRef": "finding:RT-1",
  "disposition": "accepted",
  "rationale": "violates declared invariant",
  "evidenceRefs": ["run:<red-team-run>/artifact:red-team-report"],
  "ts": "..."
}
```

Recheck is not retry:

```txt
retry   = new Run for the same Assignment, with supersession rules
recheck = new Assignment against a new artifact revision/evidence ref
```

Therefore `reviewer-recheck` and `red-team-recheck` are new operations or
driver-authorized redispatches with distinct operation provenance. The old
verdict and RunResult remain immutable.

Bounds rule:

```txt
An optional operation invocation must satisfy:
  declared binding activation
  binding-level maxInvocations
  aggregateBounds.maxAssignments
  aggregateBounds.maxRounds
  terminal-session refusal
```

Binding-level caps never widen aggregate caps. `aggregateBounds.maxRounds`
remains the hard session-wide ceiling; binding caps only narrow a specific
operation position.

## 8. MVP Plan

MVPs 0-5 make Master Coordination usable as a standalone group-thinking proof.
MVPs 6-9 preserve the expansion path for broader methods such as Delphi, NGT,
RFC review, adversarial triads, and specialist pull-in.

| MVP | Goal | Real shape | Docs/schema/runtime | Proof | Held invariant |
|---|---|---|---|---|
| 0 | Shape lock. | Record the stable spine and boundaries before runtime work. | Docs-only. | Link/check review. | No source runtime edit; Step 09 remains discussion. |
| 1 | Standalone Master Coordination fixture. | `plan.md` or `artifact.md` enters a declared worker graph: Doer, Reviewer, Red-Team, Fixer/Doer-followup, optional Synthesizer. Doer/Fixer produce session-local artifacts/revisions. | Docs + fixture draft first; then schema validation when accepted. | Static skeleton can be expressed without Work fields. | `group-cognition-framework.yaml` remains untouched. |
| 2 | Driver authorization primitive. | Optional operations require `operation-authorized` before dispatch. Authorization carries `authorizationId`, `operationId`, `targetActorId`, `invocationKey`, `authorizedBy`, `reason`, `grantedContextRefs`, and `artifactRevision`. | Schema/runtime after acceptance. | Reject missing authorization, undeclared operation, over-cap invocation, terminal-session authorization, and context beyond grant. | External driver is authority; budget/topology caps stay hard. |
| 3 | Recheck and disposition. | Recheck is a new Assignment against a new artifact revision; disposition is a driver event, not worker self-report. | Schema/runtime after MVP 2. | Old verdict remains immutable; new verdict links to revision; synthesis preserves dissent and unresolved findings. | Retry remains attempt supersession, not recheck. |
| 4 | Surface launcher. | A skill/slash surface builds a request for a declared fixture and calls `fgos coordination run --file`, then reads `coordination show`/evidence. | Surface only; no group-thinking logic inside the skill. | Launcher cannot bypass FlowDefinition/session authorization. | Surface is not truth or coordination mechanism. |
| 5 | Live standalone proof. | Run the Master Coordination loop with no Work: input plan, Doer artifact, Reviewer report, Red-Team report, driver-authorized fix, revision, recheck, final disposition. | CLI/headless run. | CLI/headless parity, crash/resume no duplicate, unauthorized optional operation rejected, hidden context rejected, bounds enforced. | No Work lifecycle, git, merge, or repo mutation. |
| 6 | Visibility windows. | Topology declares fail-closed private-first-pass and post-independent-pass windows; operation bindings select a window; runtime authorization carries the exact eligible `grantedContextRefs`. | Deferred schema/runtime. | Post-milestone sharing works only in an opt-in fixture; pre-window, foreign-session, late/failed-source, and unchanged isolation-fixture access reject. | FlowDefinition is legality, context grant is invocation authority, and isolation-heavy fixtures remain unchanged. |
| 7 | Evidence-preserving aggregation. | Keep completion eligibility separate from one `evidence-preserving-synthesis` method with `consensus`, `qualified`, or `no-consensus` outcome and mandatory disclosure fields. | Deferred schema/runtime plus Team Cognition boundary. | Validation rejects hidden source gaps, dissent, unresolved objections, failed/missing actors, or stale artifact revisions. | Aggregation never upgrades RunResult confidence or becomes driver disposition. |
| 8 | Deliberation memory. | Session events link immutable artifacts as `proposal`, `objection`, `response`, `clarification`, `rank`, or `specialist-request` contributions with explicit lineage. | Deferred schema/runtime. | Replay reconstructs contribution chains using artifact refs without chat history. | No recipient, inbox, unread, delivery, arbitrary message body, or mutable record status. |
| 9 | Bounded dynamic specialist pull-in. | The driver binds a specialist identity into a predeclared role/capability/assignment-capped specialist slot, then authorizes declared operations normally. | Deferred schema/runtime. | Opt-in slot works; undeclared slot, second/over-cap binding, unauthorized writer, terminal session, and isolation fixtures reject. | No arbitrary runtime edge, autonomous recruitment, or global dynamic topology. |

### 8.1 Locked MVP6-MVP9 Shape

The discussion round on 2026-09-03 narrows the four remaining MVPs as follows.
These are planning inputs, not accepted runtime contracts until each slice is
implemented, proved, and promoted into the canonical contracts.

**MVP6 ownership and shape.** `spec.profile.topology.visibilityWindows`
declares static legality. A node-operation binding may select one window using
`contextAccess.visibilityWindowRef`. The first slice supports only
private-first-pass and post-independent-pass sharing of same-session artifact
refs. The milestone is replay-derived from listed first-pass `result-linked`
events; missing, failed, or late sources keep it closed, while a formally
recorded replacement may satisfy the original obligation. Partial-window
exceptions, anonymization, aggregate transformation, and cross-session grants
remain deferred. `operation-authorized.grantedContextRefs` and
`assignment-created.contextGrant.refs` remain the exact invocation authority
and replay proof.

**MVP7 ownership and shape.** Existing `completion.mode` keeps its completion-
eligibility meaning. A separate `completion.aggregation` declaration selects
`evidence-preserving-synthesis`, names source and output operations, and
requires disclosure of source coverage, dissent, unresolved objections,
missing/failed actors, and artifact revisions. Team Cognition validates a
linked RunResult artifact and records an `aggregation-validated` fact with
outcome `consensus | qualified | no-consensus`; Agent Coordination alone
decides whether the session may transition terminal. Vote, rank tally,
weighted scoring, convergence, and prose-parsed pseudo-voting remain deferred.

**MVP8 ownership and shape.** Operations declare allowed contribution types;
the session ledger records `deliberation-contribution-linked` with contribution
identity/type, Assignment/Run/artifact provenance, anchors, response lineage,
round key, and visibility-window provenance. Contribution content remains in
immutable artifacts. Existing `driver-disposition-recorded` may target a
contribution and remains the only final disposition primitive. No general
AgentMessage, mailbox, recipient, delivery, unread, mutable thread status, or
arbitrary event-body protocol is introduced.

**MVP9 ownership and shape.** `topology.specialistSlots` predeclares legal
role, capability, operation, visibility-window, binding, and Assignment caps.
The external driver records `specialist-authorized`; the runtime atomically
binds the session-scoped actor and then uses existing `operation-authorized`
for each invocation. Workers may emit `specialist-request` contributions but
cannot recruit or dispatch. Expiry stops future materialization and never
erases history. `addSessionEdge`, arbitrary topology overlays, driver handoff,
persistent organization membership, and peer-invited specialists remain
deferred.

### 8.2 Post-MVP9 Acceptance Layer

The post-MVP9 acceptance work is outside the Agent Coordination kernel:

```txt
Group-Thinking Protocol Pack
  -> RFC-review-lite, Nominal-Group-lite, Delphi-feedback-lite definitions
Group-Thinking Conformance Suite
  -> public-contract, replay, isolation, CLI/headless parity proofs
fgos-group-thinking skill
  -> thin request/launch/resume/render surface over the pack
```

FlowDefinition `metadata.id@version` remains the protocol identity; a pack
registry only indexes it. Protocol definitions are data-first. Request
adapters and renderers may contain code but may use only public contracts and
must not decide visibility legality, aggregate validity, specialist authority,
or terminal truth. Passing this external suite is the Step 09 exit gate; it
does not make the suite part of core runtime authority.

Step 10 starts after the relevant Step 09 substrate slice exists. Coding Domain
adoption then consumes the substrate for Work-attached review/fix/red-team/
recheck, with mutation, worktree, merge, and return still owned by Work/Coding
authorities.

## 9. Schema And Runtime Deltas Under Discussion

Current FlowDefinition can draft actors, static edges, fixture-local `intents`,
per-edge `maxRounds`, operations, policies, and advisory/work-product result
kinds. It is enough for the static skeleton.

Current contracts are not enough for the adaptive loop without at least these
candidate deltas:

| Gap | Candidate shape | Why |
|---|---|---|
| Optional materialization | `activation.mode: required \| driver-authorized` on the node-operation binding, plus `operation-authorized` before Assignment creation. | The driver must approve optional operations before they consume budget; activation belongs to this graph position, not the reusable operation template. |
| Round request | Later `round-requested` event from an actor, not required for MVP. | Actors may recommend more work; they do not authorize it. |
| Recheck distinct from retry | Dedicated `recheck-*` operation or authorization intent. | Retry replaces an attempt; recheck preserves prior verdict and evaluates a new revision/evidence ref. |
| Disposition | `driver-disposition-recorded` event with `targetAssignmentId` or `targetArtifactRef`, `disposition`, `rationale`, and evidence refs. | Stop/go authority must be auditable without becoming worker self-report or another worker Assignment. |
| Context grant | Authorization carries `grantedContextRefs` and `artifactRevision`; dispatch rejects context outside the grant. | Adaptive loops need controlled memory without opening peer chat or hidden sibling leakage. |
| Invocation identity | `invocationKey` is idempotent and can be consumed exactly once for a logical optional operation. | Prevents authorization replay/double-spend and crash-resume duplication. |
| Execution effect | `executionEffect: read-only` for Step 09 MVP. | Role is cognitive responsibility; read-only/mutation is execution/evidence posture. Doer/Fixer can be read-only artifact producers. |
| Operation provenance | `assignment-created` or a companion event records `operationId`, `nodeId`, `authorizationId`, `invocationKey`, and `contextGrant`. | Replay must explain why a worker ran and which grant made its context legal. |
| Edge disambiguation | Materialization must select the exact node-operation/edge binding, not just the first incoming edge for an actor. | One actor may receive first-pass and recheck operations from different sources. |
| Invocation caps | Binding-level `maxInvocations` or equivalent; `aggregateBounds.maxRounds` remains a hard session cap. | A semantic round may contain multiple Assignments; Assignment count is not round semantics. |
| Driver authority | Pin an authorized driver identity or provenance root for authorization/disposition events. | `writerId` alone is provenance, not a complete authority model. |
| Visibility windows | Deferred topology declaration plus binding reference for phase-limited context legality; concrete grants remain on authorization/Assignment provenance. | Needed for RFC/NGT/Delphi later without weakening fixture-local isolation. |
| Aggregation validation | Deferred `completion.aggregation` declaration and Team-Cognition-owned `aggregation-validated` result linked to RunResult evidence. | Completion eligibility, cognitive interpretation, and terminal authority must not collapse into one worker synthesis. |
| Deliberation contribution | Deferred artifact-backed `deliberation-contribution-linked` event with typed lineage. | Durable reasoning must remain auditable without becoming a mailbox. |
| Dynamic specialist pull-in | Deferred predeclared `topology.specialistSlots` plus driver-owned `specialist-authorized`. | Covers bounded unknown-identity recruitment without arbitrary runtime topology mutation. |

## 10. Read-Only And Mutation Stance

Step 09 must consider execution effect, but must not implement repo or Work
mutation in the MVP. The substrate should avoid encoding "Doer means mutating"
or "Reviewer means read-only." Role names describe cognitive responsibility.
Execution effect describes what the Assignment is allowed to change.

For Step 09:

```txt
executionEffect = read-only
Doer/Fixer output = session-local artifact or revision artifact
No Work lifecycle
No git authority
No repo mutation
```

Mutation remains deferred to Step 10 or a later ADR. When it arrives,
Coordination may carry opaque evidence/resource/workspace references, but the
authority for worktree, branch, merge, lifecycle return, and technical approval
stays outside Agent Coordination.

## 11. Surface Launcher Stance

Step 09 should include a thin surface launcher once the Master Coordination
fixture exists. The launcher is useful because it makes group-thinking patterns
easy to trigger, but it must not become another prose coordination mechanism.

Target shape:

```txt
/fgOS:coordinate master-plan <plan.md>
  -> builds a request file/object for a declared fixture
  -> calls fgos coordination run --file <request>
  -> reads fgos coordination show / evidence
```

The skill or slash command may choose a fixture and assemble inputs. It must
not add undeclared actors, bypass authorization, synthesize final truth outside
the session ledger, or contain the group-thinking logic itself.

## 12. Relationship To Component Boundary

[Component Authority Boundary Map](component-authority-boundary-map.md) runs
in parallel with this step. It is not a Step 10 appendix.

Step 09 must use that map to keep new primitives in the right component:

- driver-authorized session operations belong to Agent Coordination Engine;
- Assignment execution still goes through Dispatch And Execution Engine;
- RunResult confidence belongs to Run Result Evaluator;
- Work routing belongs to Work Driver / Domain Workflow Interpreter;
- git/worktree/merge/mutation belongs to Coding Domain Core when Step 10 later
  consumes this substrate.

## 13. Relationship To Step 10

[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md) becomes the
consumer track. It should read Step 09 first and then apply the proven
group-thinking substrate to Work-attached coding collaboration.

Coding must not shape Step 09's core around coding-only needs. Coding is the
second unlike consumer that proves the substrate boundary, not the authority
that owns group thinking.

## 14. Tests And Proofs Required

Minimum proof for MVP1/MVP2:

- fixture validates without Work fields;
- missing authorization rejects optional operation dispatch;
- undeclared operation or actor rejects;
- authorization after terminal session rejects;
- `invocationKey` cannot be reused;
- context outside `grantedContextRefs` rejects;
- `activation.maxInvocations` and `aggregateBounds.maxRounds` are both enforced;
- recheck creates a new Assignment rather than a retry;
- old verdicts and RunResults remain immutable after recheck;
- disposition is replayable as a driver event and cannot masquerade as a worker
  result;
- the proof fixture does not modify or loosen
  `core/coordination-protocols/group-cognition-framework.yaml`;
- no Work lifecycle, git, merge, or repo mutation path is reachable from the
  Step 09 standalone proof.

## 15. Explicitly Not Proposed

- no generalized mailbox or AgentMessage thread in this step;
- no arbitrary dynamic `addSessionEdge` or topology overlay; MVP9 is limited to
  predeclared specialist slots;
- no global closed intent vocabulary in the MVP;
- no Delphi/NGT/RFC full implementation in the MVP;
- no Work-attached mutation;
- no Workflow runtime migration onto FlowDefinition;
- no physical repo-layout migration;
- no autonomous in-graph coordinator.
