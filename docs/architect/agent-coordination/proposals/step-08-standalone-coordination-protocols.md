# Step 08 - Standalone Coordination And Optional Protocols

Document type: Proposal
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until explicitly accepted
Original date: 2026-08-31
Scope: capture the current discussion about agent-led and optionally
protocol-led Work-independent research, brainstorm, debate, consult,
leader-worker, and peer collaboration on top of the proposed Step 07
CoordinationSession/AdhocTask runtime

Implementation note: a mission-lite prototype exists, but the generalized
standalone protocol model remains unimplemented.

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

Step 08 supplies protocol definitions, participant topology, operation
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

The prototype should be treated as evidence and migration input. It must not be
silently declared the final standalone architecture.

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
| `CoordinationSession` | One executable protocol instance with bounded inputs, participants, task graph, budget, and outcome. | Run one evidence-backed debate comparing two database options. |

A one-off consult or brainstorm should be able to create only a session. Mission
should not be mandatory ceremony.

**Open:** whether Mission belongs in Step 08 V1 at all. The current prototype
already persists it, but the simplest migration may reinterpret each existing
mission-lite record as a session and defer multi-session Mission grouping.

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
shape, or may need a neutral `Phase` abstraction shared by WorkWorkflow and
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
  value exceeds coordination cost, not forced to work alone.

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

**Proposed migration question:** separate optional mission metadata from session
runtime state and avoid duplicating canonical assignment/run stores:

```txt
.fgos/coordination/
  missions/<mission-id>.json              # optional grouping
  sessions/<session-id>/
    session.json
    events.jsonl
    tasks/<task-id>.json
    synthesis.md
```

Assignments, Runs, and RunResults should be referenced from their canonical
stores unless a reviewed storage design says otherwise.

**Open:** exact paths, indexes, schema versions, migration of existing mission
artifacts, atomicity, retention, redaction, and cleanup.

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

- map mission-lite records/functions/tests to Mission, CoordinationSession,
  AdhocTask, Assignment, Run, RunResult, AgentMessage, and Synthesis;
- document which behavior is retained, migrated, or removed;
- repair naming drift in the eventual implementation slice;
- establish a focused green baseline or record every unrelated failure;
- decide whether Mission is deferred.

Exit candidate: reviewed migration matrix and no ambiguity about canonical
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
- mission-lite migration preserves provenance or rejects unsupported legacy data.

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
10. How should existing mission-lite artifacts migrate?
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
