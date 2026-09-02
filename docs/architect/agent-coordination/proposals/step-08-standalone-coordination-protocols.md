# Step 08 - Standalone Coordination And Optional Protocols

Document type: Proposal
Design status: Discussion
Implementation: Delivered by `plans/260901-1542-step08-standalone-coordination/plan.md`
(track `step-08-standalone-coordination`, Phases 00-07, closed) -- see that
plan's own Intent Traceability table and the final Deferral Audit
(`docs/architect/agent-coordination/verification/step-08-standalone-coordination/deferral-audit.md`)
for what is implemented versus still `deferred-preserved`. This proposal
itself stays non-normative discussion history, per "Canonical for" below.
Last reviewed: 2026-09-02
Canonical for: nothing until explicitly accepted; the extraction pointers below
mark sections whose content has been promoted into accepted ADRs/contracts —
those pointers do not make this proposal itself normative
Original date: 2026-08-31
Scope: capture the current discussion about agent-led and optionally
protocol-led Work-independent research, brainstorm, debate, consult,
leader-worker, and peer collaboration on top of the proposed Step 07
CoordinationSession/AdhocTask runtime
Intent traceability: [Agent Coordination Intent Preservation Ledger](../intent-preservation-ledger.md),
entries AC-I001 through AC-I009; every implementation phase requires a Deferral Audit

Implementation note: the generalized standalone protocol model this proposal
discussed is now implemented and live-proved end to end -- persistent
standalone CoordinationSession, agent-led dynamic consult, declared
protocols (consult/research fan-out-fan-in/Group Cognition) on a shared
FlowDefinition kernel, a deterministic Cohort Planner, and interactive plus
headless doors with proven capability parity. The mission-lite prototype
this note originally referred to was directly cut over (removed, no
migration reader) at Phase 01. Mission itself, additional frameworks,
organization overlays, AgentMessage, AdhocTask, provider scoring/router,
telemetry, herdr, and Work-attached mutation remain `deferred-preserved` --
see the final Deferral Audit linked above.

## 1. How To Read This Draft

This document uses three labels:

- **Observed** describes current repository behavior or an existing prototype.
- **Proposed** captures a candidate direction from the discussion.
- **Open** identifies a decision that still requires design review or proof.

The protocol set, schemas, CLI, runtime slices, and acceptance criteria below
are not approved implementation instructions. They are preserved now so Step 08
can be refined after Step 07 boundaries are settled.

The [Agent Coordination Foundation Vision](../vision.md) is accepted authority
above this proposal. Coordination Protocols are optional reusable accelerators;
Step 08 must not make a predeclared protocol an entry requirement for standalone
coordination.

## 2. Reframed Goal

The earlier mission-lite plan asked whether Team Dispatch could run a read-only
brainstorm/debate without Work. That proof is still useful, but the larger goal
is clearer now:

```txt
Run reusable multi-agent collaboration protocols
across providers/models/tiers/roles/capabilities
without requiring a placeholder Work item,
while preserving dispatch governance and evidence integrity.
```

The accepted goal is broader than protocol execution alone:

```txt
Run agent-led or optionally protocol-led multi-agent coordination
from an objective, without Work or a fabricated coding Stage,
then reuse domain/protocol augmentation when it adds real value.
```

Brainstorm and debate are two protocols, not the whole standalone runtime.
Research/discovery, consult, leader-worker, peer review, and synthesis should
fit the same model when their semantics are declared explicitly.

The expected relationship is:

```txt
optional Mission
  -> CoordinationSession
    -> agent-led planning or optional protocol phase/stage graph
      -> optional/dynamic AdhocTask dependency graph
        -> Assignment
          -> Run
            -> RunResult + Evidence
    -> Synthesis / decision / report
    -> optional proposal to create Work
```

## 3. Dependency On Step 07

**Proposed:** Step 08 should consume, not redefine:

- CoordinationSession identity and persistence;
- AdhocTask graph and dependency semantics;
- Assignment/Run/RunResult execution and evidence contracts;
- communication edge enforcement;
- dispatch policy and provider/model/tier resolution;
- budgets, retries, cancellation, and recovery;
- the boundary that only Work verbs can mutate Work lifecycle.

**Accepted by Vision:** Step 08 must prove at least one agent-led session with no
predeclared protocol. Declared research/consult/brainstorm/debate definitions
then demonstrate reusable doctrine, not mandatory routing.

Step 08 supplies protocol definitions, SessionActor topology, operation
contracts, synthesis rules, and real adoption scenarios.

**Open:** a narrow read-only protocol proof may be useful before all Step 07
planning and Git-isolation slices are complete. The implementation order should
be dependency-based, not blocked by a ceremonial all-or-nothing Step 07 gate.

## 4. Current Prototype Reality

**Observed:** `src/runner/dispatch/mission-lite.mjs` and focused tests already
provide a prototype that can:

- create a local mission envelope;
- use `workId: null`;
- store a semantic thread;
- dispatch read-only role Assignments;
- collect structured results;
- produce a synthesis artifact;
- refuse some mutating behavior.

**Observed limitations:**

1. It stores Mission directly as the execution envelope rather than separating
   optional Mission from one executable CoordinationSession.
2. It has no first-class AdhocTask dependency graph.
3. It chooses operations from coding Work stages, so standalone flow authority
   is not yet independent.
4. Assignment patterns are hard-coded around the first debate shape.
5. Source/tests retain old Step 07 naming after the plan moved to Step 08.
6. Earlier focused verification had four mission-lite failures caused by
   dispatch-governance rejection of test executors; later Step 06 hardening
   verification records those mission-lite tests as fixed and passing.
7. The earlier document described implementation as future work, which no
   longer matched repository reality.

The prototype should be treated as implementation evidence and direct-cutover
input, not as a compatibility contract. It must not be silently declared the
final standalone architecture.

## 5. Why Standalone Must Mean No Work Required

A Work item exists for durable human-managed delivery lifecycle: requirements,
decisions, ownership, dashboard state, acceptance, approval, history, branch,
and merge. Creating fake Work merely to host a discussion produces noise and
couples collaboration to delivery lifecycle.

Standalone protocols should support cases such as:

- investigate an unfamiliar subsystem before deciding whether work exists;
- brainstorm product or architecture alternatives;
- debate a disputed technical direction;
- consult a specialist about one bounded question;
- compare provider/model outputs;
- run a red-team challenge on a proposal;
- synthesize evidence into a recommendation;
- discover several possible Work items without creating them automatically.

**Proposed invariant:**

```txt
No Work item is required to start or complete a standalone session.
A session may reference existing Work as context.
A synthesis may propose Work.
Only explicit normal intake may create Work.
```

## 6. Mission Versus CoordinationSession

**Proposed distinction:**

| Concept | Purpose | Example |
|---|---|---|
| `Mission` | Optional broader objective grouping multiple sessions and outcomes. | Evaluate whether to adopt a new database over several research/debate sessions. |
| `CoordinationSession` | One executable protocol instance with bounded inputs, SessionActors, task graph, budget, and outcome. | Run one evidence-backed debate comparing two database options. |

A one-off consult or brainstorm should be able to create only a session. Mission
should not be mandatory ceremony.

**Locked in the 2026-09-01 checkpoint:** Mission is `deferred-preserved` and
CoordinationSession is the V1 executable root. The unreleased mission-lite
prototype is replaced directly; no legacy record reader or migration is built.

> Extracted into [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)
> and the [CoordinationSession Contract](../contracts/coordination-session.md).

## 7. Protocol Definition Model

### 7.1 Hard And Soft Coordination

**Proposed for sessions that select a declared protocol:** preserve the existing
design strength:

```txt
Protocol graph
  -> legal phases/stages and transitions
  -> communication topology
  -> legal operations by phase
  -> TaskSpec input/output/evidence gates
  -> Skill prose for adaptive judgment
  -> Role and capability expectations
  -> policy hints for provider/model/tier and runtime
```

The graph prevents arbitrary flow. TaskSpec prevents ambiguous completion.
Skill/prose allows agents to reason, ask useful teammates, adapt research depth,
and challenge weak claims. Runtime policy constrains cost and execution.

This does not conflict with flexibility as long as prose cannot override hard
rules and hard rules do not attempt to encode every reasoning move.

Agent-led sessions instead create validated runtime execution contracts under
foundation policy and optional domain validation. They do not need to invent a
protocol phase solely to access dispatch.

### 7.2 Workflow Reuse Question

**Open for declared protocols only:** standalone protocol phases may reuse the normalized Workflow Stage
shape, or may need a neutral `Phase` abstraction shared by Workflow and
CoordinationProtocol.

Candidate options:

1. Reuse Stage directly with profile-specific validation.
2. Extract a common graph/operation definition and keep Work Stage and Session
   Phase as semantic wrappers.
3. Define standalone protocols separately and share only operation references,
   TaskSpec, Skill, Role, policy, dispatch, and evidence.

This decision must be based on actual schema overlap. Reusing the word Stage
must not import Work lifecycle transitions into a standalone session.

It also must not make Stage, Phase, or a declared graph mandatory for an
agent-led session.

> Extracted into [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md)
> and the [FlowDefinition Contract](../contracts/flow-definition.md): option 2
> (common graph/operation IR, Stage and Phase kept as distinct profile-typed
> public names) is the accepted answer.

## 8. Candidate Protocol Families

These families are optional reusable doctrine/configuration packages. An agent
may perform the corresponding coordination dynamically from an objective before
or without selecting one of these named definitions.

### 8.1 Research / Discovering

Purpose: gather and cross-check evidence about an unfamiliar question.

Candidate shape:

```txt
frame question
  -> decompose evidence questions
  -> parallel research AdhocTasks
  -> cross-check sources and contradictions
  -> fill critical gaps
  -> synthesize findings, confidence, and unknowns
```

Important doctrine:

- discovery remains machine-alone: it does not ask the human directly;
- it may consult researcher/helper roles to gather evidence;
- if uncertainty cannot be resolved internally, the outcome routes to exploring
  with explicit questions rather than pretending certainty;
- sources, code refs, commands, and confidence remain linked to claims;
- fan-out must be bounded and deduplicated.

### 8.2 Brainstorm

Purpose: generate diverse candidates before convergence.

Candidate shape:

```txt
frame objective and constraints
  -> independent ideation branches
  -> cluster/deduplicate candidates
  -> critique feasibility and omissions
  -> synthesize shortlist without false consensus
```

Brainstorm should preserve minority ideas and uncertainty. Early branches should
not see each other's answers when independence matters.

### 8.3 Debate

Purpose: test a disputed proposition through explicit opposing arguments and
evidence-backed rebuttal.

Candidate shape:

```txt
state proposition and decision criteria
  -> background evidence brief
  -> independent argument-for and argument-against
  -> bounded rebuttal/cross-examination
  -> neutral review of unsupported claims
  -> synthesis with recommendation, tradeoffs, and dissent
```

Debate should not define truth by vote or role count. Evidence quality and
decision criteria matter more than apparent agreement.

### 8.4 Consult

Purpose: let a primary agent ask a specialist one bounded question while
retaining responsibility for the main task.

Candidate shape:

```txt
primary task
  -> specialist consult Assignment
  -> evidence-backed advice
  -> primary agent accepts, rejects, or requests one clarification
  -> decision and rationale recorded
```

Consult is likely the smallest protocol and a useful early proof of coding-team
communication.

### 8.5 Leader-Worker

Purpose: let a coordinator decompose work, assign bounded tasks, handle
blockers, and aggregate results.

Candidate shape:

```txt
leader frames task graph
  -> workers execute ready AdhocTasks
  -> workers return results/blockers
  -> leader issues bounded follow-up or reroute
  -> reviewer verifies aggregate outcome
```

The leader does not gain permission to bypass dispatch policy, alter Work
lifecycle, or accept evidence-free completion.

### 8.6 Peer Review / Challenge

Purpose: inspect another role's output for correctness, missing evidence,
regression risk, or contradictory assumptions.

Candidate shape:

```txt
producer result
  -> independent reviewer task
  -> findings with severity and evidence
  -> producer response/fix or coordinator disposition
  -> accepted result or explicit unresolved risk
```

### 8.7 Group Cognition Frameworks As Protocols

**Proposed:** the families above are instances of a wider class. Structured
group-thinking frameworks (diverge/converge cycles, Six Thinking Hats, Delphi
rounds, dialectic/red-team, nominal group technique, creative-then-critical
passes) map onto the same protocol shape without new runtime concepts:

| Framework concept | Protocol concept | Notes |
|---|---|---|
| Framework | Protocol definition (§7.1) | same graph shape as a Work workflow: phase -> operation -> role + policy |
| Phase (diverge / converge / critique / decide) | Phase | |
| Activity (generate, cluster, critique, rebut, vote, synthesize) | Operation + optional TaskSpec | operation id + Role + capabilities/policy; no V1 `purpose` field |
| Stance / hat / argument position | Stance + optional persona (`preferPersona`) | Stance is temporary viewpoint; Role remains responsibility and is not executor |
| Who sees whose output; anonymity | Topology (§9) enforced through `contextRefs` | coordinator withholds sibling outputs when independence matters |
| Rounds, cost | Protocol rounds + Assignment budget | |
| Aggregation (no vote, dissent preserved) | Synthesis operation, `resultKind: advisory` | §8.3 rule: evidence over head-count |

**Proposed — where provider/model/tier customization attaches.** Three axes;
two have a proposed policy scope, one is new and belongs to the coordinator,
not to dispatch:

- **By activity kind.** Diverge wants creative/cheap, critique wants
  analytical, judgment wants critical. The existing tier vocabulary is already
  named by cognitive mode (`lightweight / standard / creative / analytical /
  critical`, `src/runner/dispatch/assignment-policy.mjs`), so an operation can
  declare `policy.minTier`. Current dispatch cannot resolve all policy tiers;
  the explicit policy-tier-to-provider-model bridge in Phase 8.0 is a required
  prerequisite.
- **By Role, SessionActor, persona, or stance.** `actors[].policy` in the protocol definition,
  same shape as `operation.policy`, lowered into `assignment.policy` the way
  the coding harness already lowers operation policy. This is the "Role
  defaults" rung the dispatch policy ladder names but does not yet implement.
- **By actor diversity (new).** Independent branches or opposing sides
  may need to run on *different* providers to reduce correlated error.
  Dispatch resolves one Assignment at a time and cannot see siblings, so this
  is a session/coordinator allocation: the protocol operation declares
  `diversity: provider` (or an explicit executor pool) and the coordinator
  assigns `policy.preferExecutor` per branch before each Assignment is built.
  Governance still gates every resulting dispatch.

**Locked for V1:** do not add `purpose` to the kernel or inline contract.
`capabilities[]` names required mechanisms/tools. Revisit cross-definition
semantic purpose routing only when two real definitions need it.

> Extracted into [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md)
> Decision 5; the revisit trigger is recorded in the
> [Intent Preservation Ledger, AC-I006](../intent-preservation-ledger.md#ac-i006-one-governed-dispatch-and-evidence-core).

## 9. Communication Topologies

The protocol must declare who may communicate with whom and for what semantic
purpose. Candidate topologies:

| Topology | Allowed exchange | Suitable protocols |
|---|---|---|
| Mediated leader-worker | Worker communicates through leader except declared specialist consult. | Coding decomposition, controlled research. |
| Direct bounded consult | Primary role can ask one named specialist and receive response/clarification. | Consult, coding assistance. |
| Independent fan-out | Coordinator sends equivalent or distinct tasks; branches cannot see each other before submission. | Brainstorm, model comparison, initial debate positions. |
| Bounded peer exchange | Named peers can critique/rebut for a fixed number of rounds. | Debate, review. |
| Broadcast evidence update | Coordinator publishes one evidence artifact to selected pending tasks. | Research correction, changed constraint. |
| Fan-in synthesis | Synthesizer reads accepted result refs, not private process state. | All multi-branch protocols. |

**Proposed rules:**

- every request that can trigger execution becomes an Assignment;
- every exchange has sender role, recipient role, intent, task/session refs,
  content/artifact refs, and timestamp;
- direct executor invocation is forbidden;
- protocol graph and current phase authorize communication edges;
- a role may escalate blocker or missing context through a declared path;
- communication rounds and token/time budgets are bounded;
- private chain-of-thought is neither requested nor stored; agents exchange
  conclusions, rationale, questions, and evidence;
- repeated clarification must not become an unbounded chat loop;
- coding-domain agents should be encouraged to consult/review when the expected
  value exceeds coordination cost, not forced to work alone;
- when a phase declares actor diversity (§8.7), the coordinator allocates
  distinct providers/executors across the independent branches before building
  their Assignments; dispatch itself stays single-Assignment and never reads
  sibling state.

**Open:** whether the first implementation needs durable `AgentMessage` records
for every semantic exchange or can represent simple exchanges as linked
Assignments and results.

## 10. AdhocTask Use In Protocols

AdhocTask gives protocol prose a controlled way to decompose work without
creating Work items.

Examples:

```txt
research session
  task A: inspect current docs       (read-only, parallel)
  task B: inspect implementation     (read-only, parallel)
  task C: inspect tests/failures     (read-only, parallel)
  task D: reconcile contradictions   (depends on A, B, C)
  task E: synthesis                  (depends on D)

debate session
  task A: background brief
  task B: argument for               (depends on A)
  task C: argument against           (depends on A)
  task D: rebuttal                   (depends on B, C)
  task E: neutral evidence review    (depends on B, C, D)
  task F: synthesis                  (depends on E)
```

**Proposed:** protocol Skills may propose additional TaskCandidates when a
critical unknown appears. The session runtime validates dependencies,
lifecycle, isolation, operation legality, duplicate intent, and budget before
materialization.

Standalone read-only sessions should normally materialize only AdhocTasks. If a
branch discovers actual delivery work, it records a Work proposal; it does not
silently promote or create Work without explicit intake authorization.

## 11. Assignment Patterns From The Prototype

The existing mission-lite patterns remain useful examples, not a closed enum:

| Pattern | Candidate role | Purpose |
|---|---|---|
| `background-brief` | researcher | Gather current facts, docs, code paths, decisions, and unresolved gaps. |
| `argument-for` | advisor | Make the strongest evidence-backed case for a proposition. |
| `argument-against` | reviewer | Find contradictions, risks, false-success paths, and missing tests. |
| `rebuttal` | peer/advisor | Respond to named claims without broadening the question. |
| `specialist-consult` | specialist | Answer one bounded domain question with confidence and evidence. |
| `evidence-review` | reviewer | Grade support for material claims and identify unsupported inference. |
| `synthesis` | synthesizer | Produce a decision-ready aggregate with refs, dissent, and unknowns. |

All patterns should resolve through declared protocol operations and TaskSpecs,
not string switches embedded only in mission-lite code.

## 12. Result And Evidence Contract

### 12.1 Per-Task Result

A role result should identify:

- task and Assignment/Run refs;
- concise conclusion or output;
- evidence/artifact refs;
- assumptions and unresolved unknowns;
- confidence derived from evidence policy, not self-attestation;
- blockers, contradictions, or recommended follow-up;
- whether expected outputs were met.

### 12.2 Failure Semantics

**Proposed:**

- `verified` requires independently checkable evidence appropriate to TaskSpec;
- `reported` may be accepted for opinion/ideation but must remain labeled;
- `no-evidence` cannot silently satisfy an evidence-required task;
- `failed` stops that task branch unless retry/fallback policy permits another
  Assignment or Run;
- synthesis may proceed with a failed branch only when protocol quorum allows
  it and the missing perspective is prominent in the output;
- exit code zero, quiet terminal, or Herdr pane state cannot prove success.

### 12.3 Synthesis Is Not Consensus

Synthesis must preserve:

- input task/result refs;
- claim-to-evidence links;
- decision criteria;
- agreements and disagreements;
- unsupported or excluded inputs;
- minority position where material;
- unresolved unknowns;
- recommendation and tradeoffs;
- confidence and reason;
- proposed next action, including explicit no-op.

It must not convert three weak reports into one verified conclusion.

## 13. Candidate Synthesis Artifact

An illustrative report shape:

```md
# Coordination Synthesis

## Objective
...

## Protocol And Session
- protocol: ...
- session: ...
- completed/failed tasks: ...

## Inputs
- task/result/evidence refs

## Findings Or Candidates
...

## Decision Recommendation
...

## Tradeoffs And Dissent
...

## Risks And Unknowns
...

## Evidence Quality
...

## Proposed Next Action
- no-op, another session, or proposed Work intake
```

If Work creation is recommended, the artifact should provide a proposal that a
human or authorized caller can send through normal intake. Synthesis itself
must not create, stage, approve, or merge Work.

## 14. Candidate Storage Direction

Earlier mission-lite storage used:

```txt
.fgos/missions/<mission-id>/
  mission.json
  thread.jsonl
  assignments/
  results/
  synthesis.md
```

**Locked direction:** use gitignored local CoordinationSession runtime state and
avoid duplicating canonical assignment/run stores:

```txt
.fgos/coordination/
  sessions/<session-id>/
    session.json
    events.jsonl
    tasks/<task-id>.json
    synthesis.md
```

Assignments, Runs, and RunResults should be referenced from their canonical
stores unless a reviewed storage design says otherwise.

**Open below the locked boundary:** exact indexes, schema versions, atomicity,
retention, redaction, and cleanup. There is no V1 Mission store or mission-lite
artifact migration.

## 15. Business Cases For Live Proof

### 15.1 Smallest Consult Proof

Question:

```txt
Ask a coding agent to inspect one bounded implementation path, consult a
reviewer about a suspected false-success case, then return its own decision
with both evidence and reviewer disposition.
```

Why useful:

- tests real team communication in the coding domain;
- needs only a small task graph;
- can remain read-only;
- proves the primary agent retains responsibility after consultation;
- exposes governance and evidence bypass quickly.

### 15.2 Research Fan-Out Proof

Question:

```txt
Assess whether current planning creates child Work for cases that should be
session-local AdhocTasks.
```

Tasks inspect docs, implementation, tests, and real planning artifacts in
parallel, then reconcile and synthesize. No Work item is required because the
outcome is an assessment, not a delivery commitment.

### 15.3 Debate Proof

Question retained from the earlier plan:

```txt
Should coding-domain planning validation run as a reviewer Assignment, or stay
as direct same-session validation until executing-stage adoption is stable?
```

This is safe and relevant, but it should run after the smaller consult proof so
communication and evidence mechanics are isolated before multi-round debate.

### 15.4 Brainstorm Proof

Question:

```txt
Generate and evaluate the smallest useful protocol set for standalone
coordination without turning Mission into another Work lifecycle.
```

Independent idea generation should be followed by deduplication, feasibility
review, and synthesis. Vote count must not choose the answer.

## 16. Proposed Step 08 Slices

These slices are planning material only.

### 8.0 Reconcile Prototype And Step 07 Contracts

- map mission-lite functions/tests to CoordinationSession, Assignment, Run,
  RunResult, and Synthesis behavior;
- document which prototype behavior is retained or removed;
- repair naming drift in the eventual implementation slice;
- establish a focused green baseline or record every unrelated failure;
- decide whether Mission is deferred.

Exit candidate: reviewed direct-cutover matrix and no ambiguity about canonical
storage or lifecycle ownership.

### 8.1 Define Neutral Protocol Schema

- define protocol id/version, phases, transitions, operations, TaskSpecs, Skills,
  Roles, policy hints, communication topology, budgets, and synthesis contract;
- decide Stage reuse versus neutral Phase;
- add normalization and invalid-reference validation design;
- ensure no Work stage/status semantics are required.

Exit candidate: one consult protocol and one fan-out protocol validate from
declarative config.

This slice does not gate agent-led standalone coordination and must not become
the only Assignment-construction path.

### 8.2 Implement Consult First

- run a primary-agent task;
- permit one declared specialist/reviewer consult edge;
- route both through Assignment/dispatch/Run/RunResult;
- record advice and primary-agent disposition;
- enforce round and budget limits;
- prohibit Work and repository mutation in the first proof.

Exit candidate: the live consult case is independently reviewable from stored
evidence and cannot bypass governance.

### 8.3 Implement Research Fan-Out/Fan-In

- decompose bounded evidence questions into AdhocTasks;
- run independent read-only branches concurrently;
- cross-check contradictions and missing evidence;
- permit bounded dynamic follow-up;
- synthesize with source/confidence refs;
- route unresolved discovery to exploring rather than asking the human directly.

Exit candidate: one real repository research case completes without Work and
without unsupported claims appearing verified.

### 8.4 Implement Brainstorm

- isolate initial ideation branches when independence is required;
- cluster and deduplicate candidates;
- add feasibility/constraint review;
- preserve minority candidates and uncertainty;
- synthesize a shortlist with evaluation criteria.

Exit candidate: output diversity and evidence labels survive synthesis; no vote
or premature convergence masquerades as a decision.

### 8.5 Implement Debate

- frame proposition and decision criteria;
- produce background brief and independent positions;
- allow bounded rebuttal/cross-examination edges;
- run neutral evidence review;
- synthesize recommendation, dissent, tradeoffs, and unknowns;
- support branch failure without false consensus.

Exit candidate: the retained debate business case completes with every material
claim traceable to a result/evidence ref or labeled unsupported.

### 8.6 Add Leader-Worker And Peer Patterns

- permit protocol-owned task assignment and bounded rerouting;
- support worker blocker/escalation messages;
- support peer review/challenge without unrestricted chat;
- prove model/provider/tier diversity through policy resolution;
- cap loops, retries, depth, concurrency, and total budget.

Exit candidate: a coding-domain read-only scenario demonstrates active team
exchange while preserving one clear coordinator and evidence authority.

### 8.7 Optional Work Reference And Work Proposal

- allow a standalone session to reference Work context without attaching
  lifecycle ownership;
- allow synthesis to emit a validated Work proposal;
- require explicit intake to create Work;
- prove no session action can move existing Work stage/status or merge state.

Exit candidate: references and proposals are useful while lifecycle mutation
remains impossible through the session API.

### 8.Final Independent Review And Live Adoption

- review protocol bypass, hidden Work lifecycle, false consensus, evidence
  laundering, unbounded loops, role collusion, stale artifacts, and cost growth;
- run consult, research, brainstorm, and debate live proofs;
- compare persisted behavior with the traceability matrix;
- measure operator effort, latency, tokens, retries, and result quality;
- close only after high-severity findings have fixes and regression tests.

## 17. Candidate Test Matrix

### Protocol And Graph

- declared protocols reject invalid phase/operation/role/Skill/TaskSpec refs;
- agent-led sessions require no fake Stage/Phase/protocol reference and reject
  invalid or under-specified inline execution contracts;
- illegal communication edge is rejected;
- dependency cycle and missing task are rejected;
- fan-out branches cannot see each other when independence is required;
- fan-in waits for required branches and handles permitted partial quorum;
- dynamic fan-out respects depth/task/token/time limits.

### Dispatch And Evidence

- every role execution creates Assignment, Run, and RunResult refs;
- direct executor bypass is rejected;
- provider/model/tier choice follows dispatch governance;
- exit zero without expected evidence cannot satisfy the task;
- stale or cross-session evidence is rejected;
- failed/no-evidence branch cannot become silent consensus;
- Herdr state is never used as truth.

### Work Boundary

- standalone session runs with `workId: null`;
- optional Work reference is read-only;
- session cannot create or mutate Work without explicit intake;
- synthesis proposal does not create Work;
- Work stage/status/claim/approval/merge remain unchanged.

### Persistence And Recovery

- interrupted write does not produce a satisfied task;
- resumed session does not duplicate completed Assignments;
- retry creates a new Run without replacing prior evidence;
- schema/version mismatch fails clearly;
- synthesis references only records in the same authorized context;
- mission-lite direct cutover preserves required behavior/provenance tests
  without carrying an unsupported legacy state reader.

## 18. Candidate Acceptance Criteria

Step 08 should not be considered complete merely because several agents
produced text. Candidate completion requires:

- at least one standalone session starts and completes without Work;
- at least one agent-led session completes without a predeclared protocol;
- consult and one multi-branch protocol use declarative legal operations;
- tasks execute only through governed Assignment/Run paths;
- communication topology is enforced, not only described in prompts;
- synthesis preserves evidence quality, dissent, failures, and unknowns;
- no Work lifecycle or repository mutation occurs in read-only scenarios;
- discovery does not ask the human directly;
- focused tests and live proofs are green;
- an independent reviewer can reconstruct the outcome from stored artifacts;
- the implementation trace names all deviations from the approved design.

## 19. Risks To Carry Forward

1. A generic protocol engine can become more complex than the concrete flows it
   serves.
2. Over-reuse of Work Stage can leak Work semantics into standalone sessions.
3. Under-reuse can duplicate graph normalization, operation validation, and
   dispatch policy.
4. Rich peer exchange can become unbounded token spend or circular discussion.
5. Leader mediation can become a bottleneck; unrestricted peer exchange can
   destroy accountability.
6. Brainstorm/debate can manufacture confidence through repetition or majority.
7. Synthesizers can omit failed branches or inconvenient dissent.
8. Dynamic research decomposition can explode tasks and duplicate questions.
9. Mission can grow into a shadow lifecycle if scope is not constrained.
10. A Work proposal can become de facto Work creation if operator boundaries
    are unclear.

## 20. Open Decisions Before Approval

1. Which protocol is the smallest first implementation: consult or research?
2. Is Mission included in V1 or deferred until multiple sessions need grouping?
3. For declared standalone protocols, do they reuse Stage or introduce a
   neutral Phase/common graph primitive?
4. What is the minimum declarative communication-topology schema?
5. Which direct peer exchanges are necessary for coding collaboration?
6. How many rebuttal/clarification rounds are allowed by default?
7. What quorum rules, if any, are safe for partial branch failure?
8. Which result types may be `reported`, and which require `verified`?
9. How are token, time, concurrency, task count, and model cost budgets enforced?
10. Does mission-lite direct-cut over without a legacy artifact migration path?
11. What is the minimum CLI or API surface after the file-module prototype?
12. Which business case best measures quality improvement rather than merely
    proving that multiple processes ran?
13. Which agent-led business case best proves the validated inline execution
    contract without smuggling in a protocol graph?

## 21. Explicit Non-Goals

- no mandatory Work item for standalone coordination;
- no mandatory Workflow, Stage, Phase, TaskSpec file, or Coordination Protocol
  for agent-led standalone coordination;
- no unvalidated free-form executor request when declared structure is absent;
- no queued `Job`, scheduler, daemon, or general mailbox;
- no autonomous creation of delivery Work from synthesis;
- no Work lifecycle mutation by Mission, Session, Task, Assignment, or result;
- no unrestricted agent chat or storage of private reasoning traces;
- no repository mutation in the first standalone live proofs;
- no Herdr-as-truth completion rule;
- no claim that debate consensus replaces human/product authority;
- no final commitment in this draft to names, schema, paths, or implementation
  order.

## 22. Discussion Checkpoints

**Discussion status:** this section records synthesized discussion only; it is
not an accepted architecture, contract, or implementation authorization.

When several agents discuss standalone coordination, one designated synthesizer
appends a checkpoint here after reconciling their review notes. A checkpoint
must state its scope, claims, evidence, observations versus inferences,
benefits, costs/failure modes, simpler alternatives, unresolved dissent, and
affected open decisions.

Use this section for agent-led standalone research/consult/brainstorm/debate,
optional declared protocol, Mission grouping, standalone synthesis, and
standalone proof-consumer questions. Keep Step 07 runtime-boundary questions in
the Step 07 proposal. Keep communication-topology and AgentMessage questions in
the Team Communication Protocol proposal. Do not promote a checkpoint into
Vision, vocabulary, accepted architecture, contracts, or ADRs until an explicit
human decision is recorded under documentation governance.

### Discussion Checkpoint: Shared Definition Kernel And Typed Profiles (2026-09-01)

**Discussion status:** recommended design after reconciling the Step 08 handoff,
current Workflow/Stage/Operation implementation, executor-selection research,
and the Group Cognition discussion. This is not an accepted contract or
implementation authorization.

**Human decision recorded 2026-09-01:** approve the shared-kernel/typed-profile
direction. Phase 8.0 must promote the exact schema through documentation
governance before implementation.

**Correction recorded 2026-09-01:** an intermediate syntax candidate separated
Role from Seat. Repository history establishes Role as the responsibility
seat/position, so that split is withdrawn. The corrected model uses `role` for
the responsibility, `SessionActor` (`actors` in config) for an addressable actor
instance, `persona` for behavioral identity, and `stance` for a temporary
viewpoint. `Participant` is not reused because platform foundations already use
it for a process that speaks the fgOS event-log contract.

> Extracted into [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)
> Decision 6 and the vocabulary entries for
> [SessionActor](../vocabulary/canonical-concepts.md#sessionactor),
> [Persona](../vocabulary/canonical-concepts.md#persona), and
> [Stance](../vocabulary/canonical-concepts.md#stance); `Participant` is
> reserved in [Deprecated And Reserved Terms](../vocabulary/deprecated-and-reserved.md#participant).

#### Scope

This checkpoint asks whether Work workflows, standalone protocols, cognitive
frameworks, and domain packages can share one standardized configuration system
without leaking Work lifecycle semantics into all coordination. It covers
declared definitions only. Agent-led coordination may still build validated
inline Assignments without selecting a definition, as required by Vision.

#### Claims

**C1. Use one normalized definition kernel, not one untyped YAML schema.**

```txt
FlowDefinition
  common graph + operation + policy primitives
  |
  +-- Workflow profile
  |     Stage, base-step mapping, Work lifecycle integration
  |
  +-- CoordinationProtocol profile
        Phase, topology, cohort constraints, completion/synthesis,
        no Work lifecycle authority
```

Both profiles normalize metadata, graph nodes/transitions, operations, roles,
session actors, capabilities, policy patches, and result/evidence requirements. Public
Stage and Phase semantics remain distinct even if both normalize to internal
graph nodes.

The relationship must also be explicit in configuration, not visible only in
the implementation. The proposed syntax uses one root `FlowDefinition`, one
common `spec` kernel, and a required typed `profile` discriminator:

```yaml
apiVersion: fgos.dev/v1alpha1
kind: FlowDefinition
metadata:
  id: architecture-deliberation

spec:
  profile:
    kind: CoordinationProtocol
    completion:
      mode: synthesize
    topology:
      contextVisibility: isolated-until-fan-in

  graph:
    entry: diverge
    nodes:
      - id: diverge
        operations:
          - ref: generate-options
            actor: creator
        transitions: [challenge]
      - id: challenge
        operations:
          - ref: critical-review
            actor: critic
        transitions: [converge]
      - id: converge
        operations:
          - ref: synthesize
            actor: chair

  roles:
    - divergent-thinker
    - critical-reviewer
    - synthesizer

  actors:
    - id: creator
      role: divergent-thinker
    - id: critic
      role: critical-reviewer
    - id: chair
      role: synthesizer

  operations:
    - id: generate-options
      role: divergent-thinker
      policy:
        minTier: creative
    - id: critical-review
      role: critical-reviewer
      policy:
        minTier: critical
    - id: synthesize
      role: synthesizer

  policy:
    visibility: headless
```

Here `graph`, `actors`, `operations`, and `policy` are shared-kernel fields.
`profile.kind: CoordinationProtocol` selects the profile validator and makes
`Phase`, protocol topology, cohort, rounds, and synthesis legal while rejecting
Work lifecycle authority.

Node `kind` is derived from the profile: graph nodes are Stages under
`Workflow` and Phases under `CoordinationProtocol`. The config does not restate
that type per node.

`role`, `seat`, and responsibility `position` are the same concept in the
existing fgOS vocabulary. They must not become duplicate fields:

```txt
Role / seat / responsibility position
  = reusable semantic responsibility required by the process

SessionActor
  = one addressable actor instance filling a Role in a definition/session

critical-reviewer role
  <- critic-a actor  { actor policy A, isolated context A }
  <- critic-b actor  { actor policy B, isolated context B }
```

An operation declares the Role needed to perform it. A graph operation binding
may assign that operation to a specific SessionActor. Topology edges, round
limits, context visibility, actor-level policy, and cohort diversity address
actor ids because multiple SessionActors may fill the same Role. The generated
Assignment keeps the semantic Role; the one-way coordination ledger records the
actor-to-Assignment membership without adding a session field to Assignment.

`Workflow` normally needs only `roles`; `CoordinationProtocol` declares
`actors` whenever topology or actor-specific allocation requires stable local
identities. A SessionActor must reference one declared or registry-resolved
Role. It does not define a new Role implicitly.

`position` is not a schema field. When it means a responsibility position, use
`role`. When it means a temporary viewpoint such as argument-for or
argument-against, use `stance`. When it means location in the process, use the
current `Stage` or `Phase`.

The Work form keeps those same kernel paths and changes only the profile and
typed additions:

```yaml
apiVersion: fgos.dev/v1alpha1
kind: FlowDefinition
metadata:
  id: coding-feature

spec:
  profile:
    kind: Workflow
    work:
      baseStepMap:
        planning: planning
        executing: executing

  graph:
    entry: clarify
    nodes:
      - id: clarify
        operations: [clarify-intent]
        transitions: [planning]
      - id: planning
        operations: [write-plan]
        transitions: [executing]

  roles: [clarifier, planner, implementer]

  operations:
    - id: write-plan
      role: planner
      task:
        taskSpec: coding-write-plan

  policy:
    minTier: standard
```

The root shape is therefore standardized without pretending the profiles are
semantically identical:

```txt
FlowDefinition
  spec.graph       shared graph/reference contract
  spec.roles       shared semantic responsibilities
  spec.actors      optional local SessionActor declarations
  spec.operations  shared executable-intent primitive
  spec.policy      shared PolicyPatch
  spec.profile     typed semantics and legal extensions
       Workflow             => Stage + Work integration
       CoordinationProtocol => Phase + topology/cohort/synthesis
```

The exact field names remain schema candidates until Phase 8.0. The locked
relationship is more important: the profile must be a visible discriminator,
not inferred from directory names or optional-field combinations.

**C2. Keep current workflow YAML backward compatible.** Add an adapter from the
existing normalized workflow shape into the shared IR. Do not rewrite
`domains/<domain>/workflows/*.yaml` or change current lookup behavior in the
first slice. Protocol files use a typed protocol profile and the same normalizer
kernel.

**C3. Standardize the operation primitive first.** Recommended common shape:

```yaml
id: local-operation-id
role: target-responsibility
capabilities:
  - required-mechanism-or-tool
task:
  taskSpec: optional-declared-spec
  contractTemplate: optional-inline-template
policy:
  minTier: analytical
  preferPersona: code-reviewer
result:
  kind: advisory
  evidenceRequired: verified
```

- `id` is local graph identity;
- `capabilities[]` are required mechanisms/tools;
- TaskSpec remains available to declared domain operations but is not mandatory
  for agent-led standalone execution;
- policy contains constraints/hints, never commands, credentials, or lifecycle
  authority;
- result fields govern interpretation/evidence and cannot drive Work directly.

V1 deliberately omits a separate `purpose` routing key. Operation `id`, Role,
capabilities, and validated policy are sufficient for the demonstrated
consumers. The existing CLI capability-purpose resolver remains unchanged. A
cross-definition semantic purpose may be reconsidered under AC-I006 only after
two real definitions need shared task-category routing; this checkpoint does
not alter ADR-006.

**C4. Use one validated `PolicyPatch` shape at every declared scope.**

```yaml
policy:
  minTier: lightweight | standard | creative | analytical | critical
  preferPersona: <persona-id>
  preferExecutor: <executor-id>
  fallbackExecutors:
    - <executor-id>
  visibility: headless | visible
```

Potential scopes are global, domain/organization, definition, node, operation,
role, SessionActor, Assignment, human/CLI, and governance. This is one
policy language, not a claim that all rungs are implemented today. Tier floors
are monotonic; most-specific executor/persona/visibility preferences win before
governance; literal model names remain trusted session/human experiment
overrides rather than portable framework defaults; governance stays final.

**C5. Keep cohort policy separate from one-Assignment policy.**

```yaml
cohort:
  count: 4
  distinctProviderFamilies: 3
  distinctModelFamilies: 2
  requiredRoles: [researcher, critic, synthesizer]
  independence: isolated-until-fan-in
```

These are cross-actor constraints. A coordinator allocates actor
policy inputs, then every Assignment uses the existing resolver and governance:

```txt
Cohort Planner       = constructs a valid set of actors
Assignment Resolver  = selects/runs one actor
```

The cohort planner may never spawn an executor directly.

**C6. Layer validation.** Shared validation checks schema version/kind, unique
ids, graph references, operation/role/capability/policy shape, and transition
integrity. Workflow validation adds Stage/base-step, TaskSpec, roleGraph,
primary operation, and Work authority rules. CoordinationProtocol validation
adds Phase, SessionActor, topology, cohort, round/quorum/budget, synthesis, and explicit
no-Work-authority rules.

**C7. Foundation and domain customization use the same loader contract.** V1
supports foundation protocols, domain protocols, existing domain workflows, and
project runner/execution bindings. It does not add YAML inheritance or a broad
extension SDK. Domain definitions normalize through the same kernel; pure
domain augmentation may enrich or reject a runtime plan through the existing
harness direction. Organization overlay syntax waits for a second real
organization consumer.

#### Evidence

- Repository vocabulary history explicitly defines Role as a responsibility
  position/seat and Persona as the behavioral identity sitting in it:
  `docs/architect/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md:308-326,782-872`.
- Executor/provider research concludes that responsibility `position` is the
  same concept as Role, while an argument position is a separate stance:
  `plans/reports/researcher2_260901-1120-step08-executor-provider-selection-architecture.md:778-822`.
- Current workflow YAML already declares stages, transitions, operations,
  roles, skills, TaskSpecs, and policy:
  `domains/coding/workflows/feature.yaml:3-142`.
- `normalizeWorkflow()` already decomposes workflow YAML into graph and operation
  maps while preserving policy without resolving execution:
  `src/state/workflow-stage-graphs.mjs:188-275`.
- Workflow loading is currently domain/Work-specific:
  `src/state/workflow-stage-graphs.mjs:277-365`.
- `operationsForStage()` exposes normalized operations plus a compatibility
  synthesis path: `src/state/workflow-stage-graphs.mjs:662-686`.
- Setup/doctor already validates operation TaskSpecs, roles, skills, roleGraph
  edges, primary operations, and policy:
  `src/setup/registrations.mjs:723-890`.
- Accepted Vision keeps declared Workflow/Stage/Operation/TaskSpec while
  rejecting it as a mandatory entry path:
  `docs/architect/agent-coordination/vision.md:297-325`.
- Vision V-006 requires agent, protocol, and domain planning to share one
  execution core: `docs/architect/agent-coordination/vision.md:192-200`.
- Vision V-008 permits domain/organization protocol, role, policy, validation,
  and evidence augmentation, with a two-consumer threshold:
  `docs/architect/agent-coordination/vision.md:212-225`.
- Current Assignment policy does not implement its documented full ladder:
  `src/runner/dispatch/assignment-policy.mjs:56-165`.
- Current executor resolution handles one selector and has no cohort view:
  `src/runner/dispatch/resolve.mjs:221-240`.

#### Observations Versus Inferences

**Observed:** Workflow and protocol designs share graph, operation, role,
capability, policy, and evidence concepts. Current code has only a
workflow-specific loader/normalizer. The resolver cannot enforce diversity
across sibling Assignments.

**Inference:** Workflow and CoordinationProtocol are now two concrete
consumers sufficient to justify a shared normalized kernel. A single flat schema
with many optional fields would reduce file count but increase ambiguity; typed
profiles provide flexibility with a smaller trust surface. Cohort allocation is
a real new runtime capability above dispatch, not another dispatch mechanism.

#### Benefits

- one graph/operation normalization model and policy vocabulary;
- backward-compatible Work workflows without fake Work semantics in protocols;
- common reference and policy validation;
- domain frameworks can reuse foundation primitives;
- provider/model cohort diversity remains auditable and governed;
- new cognitive frameworks become definitions plus doctrine, not new engines.

#### Costs And Failure Modes

- a common IR can become a risky rewrite of the stable workflow loader;
- generic node terminology can erase important Stage/Phase semantics;
- many policy scopes are opaque without field-level provenance;
- adding a generic purpose/routing category before two consumers need it would
  widen the Assignment contract speculatively;
- profile validators may drift;
- cohort allocation can become an unproven optimizer if scoring is added early;
- YAML inheritance can become an extension SDK by stealth.

#### Simpler Alternatives

1. Copy workflow schema into protocols: rejected because normalization,
   validation, and policy would fork.
2. Reuse Work Stage literally: rejected because Stage carries Work lifecycle
   meaning.
3. One flat universal YAML: rejected because fields become legal in the wrong
   profile.
4. Keep mission-lite functions only: sufficient for a throwaway proof, not two
   declared consumers.
5. Build a plugin framework first: rejected by the two-consumer/YAGNI threshold.

#### Unresolved Dissent

- The internal name `FlowDefinition` is provisional.
- A cross-definition `purpose` routing key is deferred under AC-I006.
- Separate `workflows/` and `protocols/` directories with one loader are simpler
  than one mixed directory, but storage naming is not locked here.
- Role defaults help repeated single-actor routing but do not solve cohort
  diversity; one review considered them the only additional selection mechanism.

#### Affected Open Decisions

- **3:** neutral common graph IR with typed Stage/Phase profiles.
- **4:** topology is a CoordinationProtocol profile concern.
- **9:** per-Assignment policy/budget and cohort/session constraints are separate.
- **11:** one definition loader/validator, preserving existing workflow doors.
- **12:** the proof must exercise common IR and cohort allocation.

### Discussion Checkpoint: Step 08 Recommended Decisions And Plan (2026-09-01)

**Discussion status:** recommended lock candidate. It answers all thirteen open
decisions and proposes an implementation sequence, but remains Proposed until a
human promotes the boundary through documentation governance.

#### Scope

The smallest Step 08 product slice proves:

```txt
agent-led standalone coordination
+ declared reusable coordination
+ one heterogeneous multi-branch cognitive framework
+ one Assignment/Run/RunResult core
+ no Work lifecycle dependency or mutation
```

It consumes Step 07 inline Assignment and the deferred minimal coordination
ledger. It excludes Mission grouping, mutating standalone tasks, unrestricted
peer chat, organization overlays, a scheduler, and a framework marketplace.

#### Claims

##### Answers to all open decisions

| # | Recommended decision | Reason |
|---|---|---|
| 1 | **Consult first**, then research fan-out/fan-in. | Consult proves one communication edge; research is the first cohort proof. |
| 2 | **Defer-preserve Mission.** CoordinationSession/ledger is the V1 executable root; Mission remains the intended optional multi-session grouping layer. | No current use case needs Mission persistence, but V1 must not make later grouping require a Session contract rewrite. |
| 3 | **Shared neutral graph IR with typed profiles.** Work uses Stage; protocols use Phase. | Reuses machinery without leaking lifecycle semantics. |
| 4 | **Topology = stable SessionActor ids plus directed edges, intents, context visibility, and round caps.** | Enforces consult, isolation, critique, and fan-in without duplicating Role. |
| 5 | **V1 peer exchanges: consult response, one declared critique/rebuttal, evidence correction.** | Covers first protocols without free chat. |
| 6 | **Default peer rounds zero; consult one request/response; rebuttal explicitly opts into one round.** | Bounded and fail-closed. |
| 7 | **No vote-based truth. Default requires all required actors; explicit partial completion must name minimum actors and expose every missing branch.** | Prevents false consensus. |
| 8 | **Ideation/advice may be `reported`; factual research, evidence review, and decision-driving claims require `verified`. Synthesis cannot upgrade material input evidence.** | Matches current evidence vocabulary. |
| 9 | **Hard limits: wall time, Assignment count, concurrency, rounds, task depth. Token/model cost stays telemetry until reliable.** | Structural/time limits are enforceable now. |
| 10 | **Direct-cut over mission-lite code/tests to CoordinationSession; no legacy reader or stored-data migration.** | fgOS is unreleased and has no customer consumer; compatibility machinery would preserve only prototype shape. |
| 11 | **Minimum CLI: synchronous `coordination run --file`, read-only `coordination show`, plus Assignment `--executor/--model/--tier`.** | One door, no daemon. |
| 12 | **Quality proof: real non-fgOS project decision, single-agent baseline versus heterogeneous diverge/critique/converge session.** | Measures user-project leverage, not process count. |
| 13 | **Agent-led proof: primary investigator dynamically requests one bounded specialist/reviewer consult without a protocol id.** | Proves inline planning without smuggling in a graph. |

##### Minimal topology

Stable actor ids are required because several actors may share one role:

```yaml
actors:
  - id: primary
    role: researcher
  - id: specialist
    role: reviewer
topology:
  contextVisibility: mediated
  edges:
    - from: primary
      to: specialist
      intents: [consult]
      maxRounds: 1
    - from: specialist
      to: primary
      intents: [response]
      maxRounds: 1
```

Independent fan-out has no branch-to-branch edges. Every execution-triggering
exchange becomes an Assignment. V1 can use Assignment/result/session-event links
instead of introducing first-class durable AgentMessage immediately.

##### Deterministic Cohort Planner V1

The planner performs constraint satisfaction, not scoring:

1. enumerate configured executor candidates;
2. filter governance failures and missing capabilities/persona/tools/tier/context;
3. allocate actors satisfying required roles;
4. satisfy hard provider/model-family diversity;
5. use explicit candidate order for ties;
6. emit actor policy patches plus an allocation explanation;
7. fail with named unsatisfied constraints when no valid cohort exists.

It may not silently reduce hard diversity, infer credentials, substitute an
unknown executor, or execute directly. Soft diversity may degrade only through
an explicit persisted fallback rule.

##### Exercised policy precedence

```text
runner/global
-> domain or protocol defaults
-> Phase/activity
-> role
-> cohort allocation / SessionActor
-> Assignment
-> human CLI
-> governance
```

Tier remains monotonic. Effective values and field-level sources are persisted.
Portable frameworks express abstract requirements; trusted session/project
policy may pin executors/models for controlled comparisons. The inline contract
does not gain concrete infrastructure fields.

##### Dispatch prerequisite corrections

Phase 8.0 must correct the current base before cognitive tier/cohort proofs:

- bridge policy tiers (`lightweight`, `standard`, `creative`, `analytical`,
  `critical`) directly to provider model-policy tables without changing Work
  tier semantics (`light`, `standard`, `heavy`);
- stop swallowing unsupported provider/tier failures in Assignment policy;
- allow providers to declare only supported policy tiers; an unsupported pair
  fails closed and Cohort Planner removes that candidate;
- derive provider provenance from the configured executor entry, reject unknown
  executor preferences, and either implement fallback execution or mark
  `fallbackExecutors` reserved;
- require the Step 8.5 proof configuration to expose at least two provider
  families supporting every tier that the chosen framework actually requires,
  rather than requiring a full provider-by-tier matrix.

##### Coordination storage and Work isolation

`.fgos/coordination/` is local runtime/recovery state and must be gitignored,
like `.fgos/assignments/`. Durable verification is exported deliberately into
the verification area; session objectives, context references, allocation, and
runtime policy do not become committed Work truth by default.

Gitignore does not provide execution isolation. For a Work-attached session:

- Work remains lifecycle authority and the domain harness remains isolation,
  resource-conflict, branch, and merge authority;
- read-only actors may share an authorized snapshot while context-visibility
  rules still prevent unintended sibling-result leakage;
- two mutating actors may not run concurrently in one worktree;
- mutating activity is either serialized in one authorized workspace or placed
  in distinct domain-provisioned worktrees/branches with resource claims;
- the coordination ledger records workspace/isolation references but cannot
  merge branches, advance Work, or invent a coding isolation policy;
- the first standalone proofs stay read-only; Work-attached mutation remains a
  stop gate until a coding-domain live proof demonstrates conflict detection,
  isolation, merge ownership, and recovery.

> Extracted into [ADR-010](../decisions/ADR-010-interactive-headless-parity-and-work-isolation.md)
> and the [CoordinationSession Contract](../contracts/coordination-session.md)
> storage layout / Work Boundary sections.

##### Interactive and headless operating modes

Interactive and headless are rollout/visibility modes over the same
CoordinationSession, protocol, dispatch, Assignment, Run, RunResult, evidence,
and recovery contracts. They are not separate capability classes:

```text
interactive = operator-attached, explicitly observable execution
headless    = unattended, quiet execution after the same capability stabilizes
```

Target capability parity is an original intention. Interactive ships first so
the maintainer can observe and correct real agent behavior. Headless follows
without a second engine or weaker semantic contract. Temporary rollout gaps must
remain visible in AC-I008. Telemetry for unattended observation and continuous
improvement is `deferred-preserved`; it does not justify changing execution
truth or creating a headless-only path.

> Extracted into [ADR-010](../decisions/ADR-010-interactive-headless-parity-and-work-isolation.md).

##### Detailed implementation phases

**8.0 - Lock contracts and baseline**

- promote only explicitly approved checkpoint decisions; do not edit ADR-006/007
  in place;
- reconcile every scope decision with the Intent Preservation Ledger and add an
  intent traceability table to the approved implementation plan;
- inventory mission-lite storage/tests and Step 07 ledger prerequisite;
- record focused test and configured provider/executor baselines;
- plan the narrow Assignment CLI override/provider-provenance fix as a Step 08
  dependency, separate from protocol runtime;
- write area spec/config registration before new modules.

Exit: decision trace, Session/Mission/persistence boundary, dispatch dependency,
baseline, and deferral audit are unambiguous.

**8.1 - Minimal CoordinationSession ledger and agent-led proof**

- create a gitignored manifest before the first Assignment with coordination
  id, objective, aggregate bounds, status, provenance root, and Assignment refs;
- use the ledger as the authoritative one-way actor-to-Assignment membership
  index; Assignment remains session-blind and there is no adoption API;
- append coordination events atomically for actor/task/Assignment/result
  linkage and recovery;
- direct-cut over mission-lite code and tests; do not add a legacy reader,
  detector, reporter, or stored-data migration path;
- retain canonical Assignment/Run/RunResult stores;
- run primary-investigator plus dynamic bounded-consult live proof with no
  protocol, Work, Stage, or TaskSpec.

Exit: a stranger can reconstruct and resume the session without duplicate runs;
Work and mutation gates remain closed.

**8.2 - Shared definition kernel and typed adapters**

- define versioned FlowDefinition, graph, operation, PolicyPatch, and result IR;
- adapt the current normalized Workflow without changing its behavior;
- add CoordinationProtocol parser/adapter;
- implement shared and profile validators;
- validate one consult and one fan-out fixture;
- add setup/doctor discovery checks.

Exit: current coding workflow plus two protocol fixtures normalize through the
kernel; wrong-profile fields reject; declared definitions remain optional.

**8.3 - Declared consult protocol**

- materialize primary/specialist actors from shared config;
- enforce request/response topology and one-round cap;
- persist advice and primary disposition;
- enforce wall-time, Assignment-count, and concurrency caps;
- reject undeclared edges and direct executor bypass;
- run the same case through declared and agent-led profiles.

Exit: both profiles produce equivalent governed evidence through one core.

**8.4 - Research fan-out/fan-in and Cohort Planner V1**

- materialize independent evidence questions without Work;
- allocate provider/model-diverse actors deterministically;
- isolate sibling contexts before fan-in;
- run concurrently under hard session caps;
- require verified evidence for material factual findings;
- expose contradictions and failed/missing branches;
- synthesize only accepted result/evidence refs;
- require at least two real provider families in the live proof, or stop rather
  than fake diversity.

Exit: allocation is explainable, hard constraints hold or fail loudly, and
synthesis cannot upgrade weak evidence.

**8.5 - First Group Cognition framework**

```text
divergent exploration
-> cluster/deduplicate
-> critical challenge
-> evidence review
-> convergent synthesis
-> recommendation with dissent
```

- declare phases, activities, roles, actors, topology, and cohort constraints as config;
- apply activity-level creative/analytical/critical tier floors;
- preserve independent initial branches and minority candidates;
- permit one bounded critique/rebuttal round only when declared;
- keep synthesis advisory and reject vote-as-truth;
- compare with a single-agent baseline on a real consuming project's read-only
  architecture/vendor/problem-solving decision.

Measure evidence coverage, unsupported claims, unique valid alternatives/risks,
decision-criteria coverage, dissent preservation, reviewer-rated actionability,
operator time, wall time, cost telemetry, and retries.

Exit: a named quality gain is demonstrated or honestly recorded absent; diversity
comes from cognitive requirements/allocation, not launcher prose.

**8.6 - Recovery, partial completion, and budget hardening**

- enforce required actors and explicit partial-completion rules;
- resume after crash without duplicate Assignments;
- replace failed actors only through declared retry policy;
- hard-enforce rounds, depth, concurrency, count, and wall time;
- report tokens/cost as measured or unknown;
- independently review topology bypass, context leakage, policy provenance,
  evidence laundering, and allocation failures.

Exit: partial results never become silent consensus; retries and every hard bound
are auditable and negatively tested.

**8.Final - CLI/API stabilization and external adoption**

- expose `fgos coordination run --file <request>` and
  `fgos coordination show <id> --json` through the command registry;
- permit global human executor/model/tier overrides; keep actor overrides
  in the request/session file;
- publish one agent-led example, consult protocol, and Group Cognition framework;
- run external-project quality proof and independent review;
- decide whether Mission, more frameworks, or organization overlays now have a
  second real consumer.
- close with a Deferral Audit against every Step 08 ledger entry; no
  `deferred-preserved` intention may disappear by omission.

Exit: reproducible tests/live proofs and demonstrated leverage for a project
using fgOS, without implementing each named framework as a separate engine.

##### Test and proof matrix

| Surface | Required proof |
|---|---|
| Shared IR | Existing coding workflow golden plus protocol fixtures normalize deterministically |
| Profile isolation | Work-only/protocol-only fields reject in the wrong profile |
| Agent-led | No protocol/Work/Stage/TaskSpec; dynamic consult governed |
| Consult | Illegal edge and extra round reject; advice/disposition persisted |
| Cohort | Diversity constraints hold; unsatisfied hard constraint explains failure |
| Context | Independent branches cannot read sibling outputs before fan-in |
| Evidence | Synthesis cannot upgrade reported/failed inputs |
| Quorum | Missing required SessionActor blocks; partial completion names omissions |
| Budgets | Time/count/concurrency/depth/rounds have negative tests |
| Recovery | Restart does not duplicate completed Assignments or lose refs |
| Work boundary | No Work lifecycle or repo mutation in proofs |
| Quality | Single-agent baseline versus Group Cognition on consuming project |
| Dispatch | Actual executor/provider/model/tier provenance and governance per SessionActor |
| Work isolation | Concurrent mutating actors never share one worktree; merge and Work transition remain domain-owned |
| Operating modes | Interactive and headless use the same contracts/capabilities; only visibility/operator presence differs |

#### Evidence

- Handoff requires Step 08 to consume Step 07 runtime/evidence/dispatch/Work
  boundaries and answer §20:
  `plans/reports/handoff-260901-1123-GH-07-step08-standalone-coordination-protocols-design-prompt.md:15-36`.
- Step 07 locked a thin coordination-ledger shape but deferred implementation and
  declared Protocol/Phase:
  `docs/architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md:879-899`.
- Mission-lite already creates one read-only inline Assignment per role and runs
  through executeAssignment:
  `src/runner/dispatch/mission-lite.mjs:233-328,428-508`.
- Inline contracts support role, capabilities, evidence, and budget while
  rejecting unknown/infrastructure fields:
  `src/runner/dispatch/execution-contract.mjs:23-44,115-167`.
- Assignment runner selects one executor, runs it, and persists policy/actual
  executor: `src/runner/dispatch/assignment-runner.mjs:621-680,794-807,1004-1015`.
- Existing §8.7 correctly puts diversity allocation in the coordinator, but "no
  new runtime concepts" is too broad because no coordinator currently performs
  cohort constraint satisfaction:
  `docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md:336-380`.
- Current slices postpone provider/model diversity until after consult,
  research, brainstorm, and debate; the plan above moves it to the first
  multi-branch proof:
  `docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md:643-729`.
- Executor research proves the narrow CLI gap and single-Assignment resolver;
  role defaults alone do not cover cohort constraints:
  `plans/reports/researcher-260901-1049-GH-07-executor-provider-selection-architecture.md:419-448,481-492`.

#### Observations Versus Inferences

**Observed:** Inline Assignment and mission-lite provide a working
single-actor core. No Session runtime, protocol loader, topology enforcer,
cohort planner, or diversity allocator exists. Existing protocol families map to
Phase/activity/role/actor/topology variations.

**Inference:** Consult is the smallest declared communication proof. Research
fan-out is the earliest honest cohort proof. One diverge/critique/converge
framework is stronger than separate bespoke brainstorm/debate engines. Hard
token/cost enforcement should wait for reliable adapter telemetry; hard
structural and wall-clock limits should ship first.

#### Benefits

- proves leverage for projects using fgOS, not only fgOS self-development;
- agent-led and declared coordination share one core;
- domain/framework customization is config-driven but typed;
- provider/model specialization and diversity are auditable policy;
- cognitive methods compose without new orchestration engines;
- complexity lands in dependency order and stops before a scheduler/optimizer.

#### Costs And Failure Modes

- Step 07 ledger prerequisite may expand unless kept thin;
- shared kernel may become a refactor project;
- policy layering is opaque without provenance;
- executor ids may falsely appear diverse while sharing provider/model family;
- synthesis may launder weak evidence or erase dissent;
- small installations may not satisfy diversity constraints;
- quality comparison is subjective unless criteria are fixed before execution;
- external adoption proof costs more but is required by fgOS's mission boundary.

#### Simpler Alternatives

1. Only wire `--executor`: required but insufficient for topology/cohort/recovery.
2. Role defaults only: useful, but cannot enforce cross-actor constraints.
3. Hard-code each protocol: fast demo, duplicated engines.
4. Generic provider router first: wrong problem; cohort constraints are the need.
5. Implement every framework: unnecessary; one compositional proof is enough.
6. Require protocols always: rejected by accepted Vision.

#### Unresolved Dissent

- Exact CLI noun remains naming-level; run/show behavior is the requirement.
- Partial completion may defer until hardening; default-all can ship first.
- First-class AgentMessage may become necessary later; linked
  Assignments/results/events are the smaller V1 proof.
- Diversity requires explicit provider/model-family metadata or must fail closed.
- The external project/question need not be selected during design. It must be
  selected before Phase 8.5 so the comparison rubric and case are locked before
  observing results.

#### Affected Open Decisions

This checkpoint proposes answers for decisions **1 through 13**.

Human decisions recorded on 2026-09-01:

1. approve shared kernel plus typed profiles;
2. mark Mission `deferred-preserved`, not rejected or replaced, while
   CoordinationSession is the V1 executable root;
3. approve consult -> research/cohort -> Group Cognition order;
4. defer selection of the external proof case until before Phase 8.5; this is a
   test-fixture decision, not an architecture decision;
5. keep partial completion in hardening and defer first-class AgentMessage until
   linked Assignments/results/events prove insufficient;
6. require the Intent Preservation Ledger and phase-closing Deferral Audit;
7. store `.fgos/coordination/` as gitignored local runtime state while keeping
   coding worktree/resource isolation under the domain harness and Work driver;
8. preserve target capability parity between interactive and headless modes,
   differing by visibility/operator presence, with interactive first and
   telemetry deferred;
9. direct-cut over mission-lite code/tests with no legacy reader, detector, or
   stored-data migration because fgOS is unreleased with no customer consumer;
10. accept the pre-plan review reconciliation: one-way ledger membership, omit
    `purpose` from V1, use SessionActor/`actors`, correct tier/provider dispatch,
    and execute agent-led Session proof before shared-kernel adaptation.

These decisions lock the recommended direction for planning. They do not make
the mixed proposal canonical; Phase 8.0 must extract accepted terms,
boundaries, contracts, ADRs, and roadmap content under documentation governance.
