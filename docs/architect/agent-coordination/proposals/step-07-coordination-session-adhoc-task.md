# Step 07 - CoordinationSession And AdhocTask Graph

Document type: Proposal
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing until explicitly accepted
Original date: 2026-08-31
Scope: capture the current discussion about an independent coordination runtime,
session-local task decomposition, planning materialization, isolation, and the
boundary with Work lifecycle

Implementation note: only related primitives/prototypes exist; this proposed
runtime contract has not been implemented as a whole.

## 1. How To Read This Draft

This document deliberately separates three kinds of statements:

- **Observed** describes behavior found in the current docs or implementation.
- **Proposed** records a candidate design discussed so far.
- **Open** marks a decision that still needs evidence, brainstorming, or review.

Nothing marked Proposed is an approved contract. This draft exists so the
discussion can continue without reconstructing the model from chat history.

For a fresh discussion session, use the
[Step 07 Design Discussion Handoff Prompt](../playbooks/prompts/step-07-design-discussion-handoff.md).

The [coordination operating harness](../playbooks/coordination-operating-harness.md) remains
a useful implementation playbook, but it is not the runtime architecture for
Step 07.

## 2. Problem Statement

Agent coordination is intended to be independently useful. It should coordinate
agents across providers, models, tiers, roles, and capabilities through reusable
protocols. Attaching coordination to a Work item is one runtime profile, not the
identity of the system.

The current design and implementation are pulled in two directions:

1. Work-attached workflow already has useful structure: stage graph, Stage
   Protocol, Stage Operation, TaskSpec, Skill, role, policy hints, Assignment,
   Run, RunResult, and evidence.
2. Internal planning decomposition currently tends to create child Work items,
   even when the units are only temporary agent tasks inside one larger Work.
3. Standalone mission-lite proves that `workId: null` is possible, but it still
   borrows coding Work stages and has no general session-local task graph.
4. Some large tasks genuinely need independent child Work, branch isolation,
   acceptance, and merge. Other tasks only need bounded parallel or sequential
   collaboration and should not become dashboard lifecycle objects.

The design must keep the useful hard structure without making Work mandatory
or creating a second lifecycle authority beside Work.

## 3. Current Observations

### 3.1 Workflow And Protocol Definition

**Observed:** workflow stages can expose multiple operations while retaining
`stage.skill` and `stage.taskSpec` as the primary-operation compatibility path.
An operation can reference TaskSpec, Skill(s), Role, and policy hints. The
workflow graph supplies legal transitions and the driver chooses among legal
operations.

This is a useful hard-and-soft combination:

```txt
graph/config    -> legal structure and hard boundaries
TaskSpec        -> input, output, gate, and evidence contract
Skill/prose     -> judgment and context-sensitive behavior
driver          -> protocol enforcement and operation choice
dispatcher      -> executor/provider/model/mechanism selection
```

**Proposed:** preserve this model. Step 07 should generalize where it can run,
not replace it with an unstructured chat loop.

### 3.2 Planning Materialization

**Observed:** a decomposing planning verdict currently materializes planned
children through the Work intake path. Every child therefore becomes durable
Work with parent/dependency/footprint metadata.

That behavior is correct for independently managed child Work, but too heavy
for research fan-out, consultation, debate branches, review passes, or bounded
implementation cells that return directly to the same parent operation.

### 3.3 Assignment And Runtime

**Observed:** Assignment is a semantic execution request. Run represents an
attempt. RunResult normalizes the outcome and evidence. These concepts should
not be reused as task-graph lifecycle nodes.

One logical task may need:

- an initial Assignment;
- a follow-up clarification or challenge Assignment;
- a retry Run for one Assignment;
- a reviewer Assignment before the task can be accepted.

Therefore `AdhocTask != Assignment` and `Assignment != Run`.

### 3.4 Standalone Mission-Lite

**Observed:** a mission-lite prototype already stores a mission, thread,
Assignments, role results, and synthesis without requiring Work. It is
read-only and uses `workId: null`.

**Observed:** the prototype currently chooses operations from coding Work
workflow stages. It has no explicit CoordinationSession or AdhocTask graph.
Some source/test labels still call it Step 07, while the design track now places
standalone protocol adoption in Step 08.

### 3.5 Git Topology

**Observed:** nested Work integration is not represented by one invariant in
all code paths. Some behavior resolves the topmost root, while another sync
path uses the immediate parent.

**Open:** immediate-parent integration is a strong candidate, but it must be
proved across claim, approve, sync, return, conflict recovery, and trunk merge
before it becomes a contract.

## 4. Design Goals Under Discussion

**Proposed goals:**

1. Run useful coordination with or without a Work item.
2. Keep Work as the sole authority for durable delivery lifecycle.
3. Introduce session-local task decomposition without turning every task into
   Work.
4. Reuse Stage/Protocol/Operation/TaskSpec/Skill structure for both runtime
   profiles where semantics genuinely match.
5. Support sequential and parallel task graphs with explicit dependencies.
6. Separate lifecycle ownership from process/Git isolation.
7. Route all agent execution through Assignment -> dispatch -> Run ->
   RunResult so governance and evidence cannot be bypassed.
8. Allow coding agents to consult, challenge, review, and exchange evidence
   with other team members through declared communication topology.
9. Preserve evidence provenance through task aggregation and synthesis.
10. Permit a temporary task to be promoted to child Work when its scope becomes
    independently governable.

**Proposed non-goals for Step 07:**

- no `Job`, durable queue, scheduler, or daemon;
- no replacement for Work status, stage, approval, claim, or merge verbs;
- no unrestricted peer-to-peer process messaging outside dispatch governance;
- no general mission lifecycle FSM;
- no claim that Herdr visibility proves task completion;
- no commitment yet to one storage schema or CLI surface;
- no full brainstorm/debate product flow; protocol adoption belongs to Step 08.

## 5. Candidate Runtime Model

### 5.1 Two Profiles, One Execution Core

**Proposed:**

```txt
Work-attached profile

Work (lifecycle authority)
  -> CoordinationSession (optional collaboration run)
    -> AdhocTask graph (session-local decomposition)
      -> Assignment (semantic request)
        -> Run (runtime attempt)
          -> RunResult + Evidence
    -> session outcome returned to Work driver

Standalone profile

Mission (optional objective envelope)
  -> CoordinationSession (one executable collaboration flow)
    -> AdhocTask graph
      -> Assignment
        -> Run
          -> RunResult + Evidence
    -> Synthesis / decision / report
```

Mission is optional because a single brainstorm, consult, or research session
does not need a larger container. A Mission may group several sessions around a
broader objective, but must not become a hidden Work replacement.

### 5.2 Candidate Concept Responsibilities

| Concept | Candidate responsibility | Must not own |
|---|---|---|
| `Work` | Durable delivery lifecycle, dashboard ownership, acceptance, approval, durable branch/merge. | Per-agent runtime attempts. |
| `Mission` | Optional envelope for a broader non-Work objective and related sessions. | Work lifecycle or automatic code delivery. |
| `CoordinationSession` | One invocation of a collaboration protocol, its context, task graph, participants, and aggregate outcome. | Work stage/status, approval, or merge state. |
| `TaskCandidate` | Planner output before lifecycle and isolation validation/materialization. | Runtime execution or durable lifecycle by itself. |
| `AdhocTask` | Session-local unit of intent, dependency, ownership, state, and evidence roll-up. | Durable backlog lifecycle or an implicit Run. |
| `Assignment` | Immutable semantic request from one role to an execution target. | Task lifecycle, retries, or Work mutation authority. |
| `Run` | One concrete execution attempt through an approved mechanism. | Semantic task identity. |
| `RunResult` | Normalized outcome claim, evidence refs, artifacts, and verification confidence for one Run. | Lifecycle transition authority. |
| `Synthesis` | Evidence-linked aggregate conclusion from session tasks/results. | Automatic consensus or unverified truth. |

## 6. Work Versus AdhocTask

### 6.1 Candidate Decision Rule

**Proposed:** use child Work when the unit needs at least one durable lifecycle
property that must remain independently governable:

- separate backlog identity or prioritization;
- independent human acceptance or approval;
- independent claim/return ownership;
- durable dependency visible outside the current session;
- durable branch and merge lifecycle;
- delivery or audit history that must survive the session;
- ability to pause, resume, or reassign as a first-class item.

Use AdhocTask when the unit exists to complete one coordination session:

- research or discovery fan-out;
- consult or specialist question;
- alternative analysis or debate branch;
- review, verification, or red-team pass;
- synthesis;
- bounded coding cell whose result returns to the same Work/session;
- dynamically discovered follow-up that does not need independent lifecycle.

Task size alone is not sufficient. A large research branch may still be an
AdhocTask; a small compliance change may need independent Work because it has
separate approval and delivery ownership.

### 6.2 Promotion

**Proposed:** an AdhocTask may be promoted to child Work when execution reveals
independent lifecycle needs. Promotion should:

1. stop further task execution while the decision is recorded;
2. create Work through the normal intake/add path;
3. preserve links to source session, task, evidence, decisions, dependencies,
   and any isolated branch/worktree;
4. mark the AdhocTask as delegated/promoted rather than independently done;
5. let Work verbs own all subsequent lifecycle and merge behavior.

**Open:** whether already-produced commits can be adopted by the new child Work
or must be replayed through a clean Work branch.

### 6.3 No Hidden Demotion

**Proposed:** an existing Work item should not silently become an AdhocTask.
Work may be linked into a session or coordinated alongside tasks, but deleting
its durable lifecycle would require an explicit existing Work operation.

## 7. Planning Without Mode Explosion

### 7.1 Candidate Graph

**Proposed:** avoid a top-level enum such as:

```txt
single | adhoc-graph | child-work-graph | hybrid
```

That model creates a special hybrid branch and makes planners choose a global
mode before each task is understood.

Instead:

1. keep pass-through when no decomposition is required;
2. otherwise produce a dependency graph of `TaskCandidate` nodes;
3. classify each candidate independently;
4. validate the complete graph;
5. materialize each node according to its properties.

Candidate fields under discussion:

```yaml
id: candidate-a
objective: Gather current implementation evidence
dependsOn: []
lifecycle: inherited       # inherited | independent
isolation: shared          # shared | isolated
mutation: read-only        # read-only | mutating
role: researcher
operation: inspect-implementation
expectedOutputs:
  - evidence brief
footprintHints: []
reason: Bounded evidence gathering for the parent plan
```

### 7.2 Candidate Materialization

| Candidate property | Proposed materialization |
|---|---|
| No decomposition | Existing Work/session operation continues directly. |
| `lifecycle: inherited` | Create an AdhocTask in the active CoordinationSession. |
| `lifecycle: independent` | Create child Work through normal Work intake. |
| Mixed candidates | Materialize each independently; the result is naturally hybrid. |

**Open:** whether candidate classification is first proposed by an agent and
then deterministically validated, or fully resolved by a policy function. The
likely answer is agent judgment plus deterministic invariant validation, but
the exact boundary is not settled.

### 7.3 Validation Before Materialization

**Proposed validation must catch:**

- missing or cyclic dependencies;
- inherited task depending on a child Work result without a declared wait/link;
- parallel mutating tasks sharing a physical checkout;
- impossible or overlapping durable branch destinations;
- operation not legal for the selected protocol phase;
- role/capability mismatch;
- missing expected output/evidence contract;
- a claimed independent lifecycle with no stated lifecycle reason;
- a task that can mutate Work lifecycle without using Work verbs.

## 8. Lifecycle And Isolation Are Independent

**Proposed matrix:**

| Lifecycle | Isolation | Candidate execution shape |
|---|---|---|
| inherited | shared | Session-local task in the session checkout; serialize mutations. |
| inherited | isolated | Session-local task in an ephemeral worktree/branch; integrate result back into the session target. |
| independent | shared | Usually invalid for mutating child Work; possibly allowed for read-only lifecycle work. |
| independent | isolated | Child Work with durable Work-owned branch/worktree and merge lifecycle. |

Initial safety rules under discussion:

- read-only tasks may run concurrently when dependency rules allow;
- mutating tasks in one physical checkout must be serialized;
- parallel mutating tasks require separate worktrees, even if declared source
  footprints do not overlap;
- file footprints remain useful for conflict prediction and reviewer scope, but
  they are not sufficient isolation because Git index, formatters, generated
  output, lockfiles, and build caches can collide;
- an ephemeral branch does not make an AdhocTask a Work item;
- a durable Work branch does not authorize bypassing Work merge verbs.

## 9. Candidate AdhocTask Graph Semantics

### 9.1 Minimum Node Contract

**Proposed minimum fields, subject to schema design:**

```yaml
taskId: task-research-runtime
sessionId: session-123
objective: Inspect current runtime behavior
status: pending
dependsOn: []
lifecycle: inherited
isolation: shared
mutation: read-only
operationRef: research.inspect-runtime
roleRef: researcher
assignmentRefs: []
resultRefs: []
expectedOutputs:
  - implementation evidence brief
```

Possible task states:

```txt
pending -> ready -> running -> satisfied
                    |          |
                    |          -> rejected
                    -> failed
                    -> blocked
pending/ready -> cancelled
```

**Open:** exact names and whether `blocked` is stored or derived from dependency
state. The task state machine must remain smaller than Work lifecycle.

### 9.2 Readiness And Completion

**Proposed:** a task becomes ready only when:

- all required dependencies are satisfied;
- its operation is legal in the current protocol phase;
- required context/evidence refs are available;
- isolation resources are available;
- dispatch policy permits the target.

A task is not satisfied merely because a Run exited zero. Satisfaction should
require the task's expected outputs and evidence policy to be met by accepted
RunResults, optionally including a review/challenge Assignment.

### 9.3 Dynamic Fan-Out

**Proposed:** a running protocol may propose new TaskCandidates when evidence
reveals missing questions. Dynamic expansion must be bounded by:

- protocol permission;
- maximum depth/task/budget limits;
- explicit parent/reason/dependency links;
- lifecycle and isolation classification;
- duplicate-intent detection;
- coordinator or policy approval where risk requires it.

This is especially important for researching and discovering, where useful
subquestions often emerge only after initial evidence is gathered.

## 10. Communication Topology

Step 07 should provide the runtime substrate for the existing
[Team Communication Protocol V1](team-communication-protocol-v1.md).

**Proposed:** agents do not receive permission to contact arbitrary executors
directly. A protocol declares allowed semantic communication edges, for example:

```txt
leader -> worker          assign or clarify
worker -> leader          result, blocker, escalation
worker -> specialist      consult request, when protocol permits
specialist -> worker      evidence-backed advice
peer <-> peer             critique/rebuttal, when protocol permits
reviewer -> coordinator   finding and severity
coordinator -> any role   bounded follow-up assignment
```

Every executable request still becomes an Assignment and passes dispatch
governance. Responses become structured result artifacts or AgentMessages with
evidence references. A protocol may require mediation through a leader, allow
bounded peer exchange, or fan out one prompt to several independent roles.

**Open:** whether AgentMessage is persisted inside the session event stream,
the assignment store, or both with one canonical record and references.

## 11. Work-Attached Integration Boundary

**Proposed invariant:**

```txt
CoordinationSession may read Work context and return a session outcome.
Only Work engine verbs may change Work stage, status, claim, approval, or merge.
```

A Work-attached driver may:

- start a session for one legal Stage Operation;
- provide Work requirements, decisions, artifacts, and allowed repository scope;
- receive task-level evidence and synthesis;
- use that evidence to decide which existing Work verb to invoke next.

It may not:

- let task completion directly move the Work stage;
- infer approval from agent consensus;
- mark Work complete from session status alone;
- merge an isolated task branch outside Work merge policy;
- duplicate the Work lifecycle in session/task status fields.

## 12. Git Integration Discussion

### 12.1 Candidate Durable Invariant

For nested independent Work, the desired topology under discussion is:

```txt
grandchild Work -> immediate child Work branch
child Work      -> immediate parent Work branch
top-level Work  -> trunk/main
```

This supports isolation and lets each parent accept integrated child results
before its own final merge.

### 12.2 Inherited Isolated Task

For an isolated AdhocTask:

```txt
ephemeral task branch/worktree
  -> verified task result
  -> integrate into owning session/Work integration target
  -> remove ephemeral resources after durable evidence is captured
```

**Open decisions:**

- branch naming and ownership metadata;
- whether integration uses commit, patch, cherry-pick, or another artifact;
- who resolves conflicts: task worker, session coordinator, or owning Work;
- cleanup timing after failure, rejection, or promotion;
- recovery after the process exits mid-integration;
- how nested Work and ephemeral task branches coexist in one task graph.

No implementation should normalize branch behavior until these paths are
tested against current claim/approve/sync-root behavior.

## 13. Storage Direction, Not Yet A Contract

One candidate file-backed layout is:

```txt
.fgos/coordination/sessions/<session-id>/
  session.json
  events.jsonl
  tasks/
    <task-id>.json
  assignments/
    <assignment-id>.json
  runs/
    <run-id>.json
  results/
    <run-id>.json
  synthesis.md
```

The existing assignment/run storage should be referenced rather than copied if
it already provides canonical records. The layout above is illustrative; the
design must first identify canonical ownership, indexes, atomic-write rules,
recovery behavior, and compatibility with current `.fgos` stores.

## 14. Proposed Step 07 Slices

These slices are discussion material, not implementation authorization.

### 7.0 Reconcile Baseline And Vocabulary

- map current planning, scoped-subtask, mission-lite, Work branch, and dispatch
  paths to the proposed concepts;
- resolve terminology conflicts in Step 00-06 and communication docs;
- record current test failures and behavior as baseline evidence;
- decide which existing mission-lite artifacts can migrate without data loss.

Exit candidate: one reviewed traceability matrix with no concept represented by
two incompatible names.

### 7.1 Lock Session And Task Contracts

- decide minimum CoordinationSession and AdhocTask schemas;
- define IDs, refs, state semantics, timestamps, budgets, and evidence roll-up;
- define AgentMessage ownership;
- define schema versioning and invalid-state rejection;
- prove that none of these fields duplicate Work lifecycle authority.

Exit candidate: schema tests and lifecycle-boundary review plan are written
before runtime implementation.

### 7.2 Implement A Read-Only Task Graph Core

- create/load/update one session and its task DAG;
- calculate readiness from dependencies;
- dispatch one legal Assignment per ready task;
- aggregate RunResults without false success;
- recover from partial writes and failed Runs;
- keep all tasks read-only in the first implementation slice.

Exit candidate: sequential and fan-out/fan-in graphs pass deterministic tests.

### 7.3 Bind Protocol Definition To Session Runtime

- define how a protocol's phases/stages and operations are resolved;
- reuse normalization and validation where semantics match Work workflow;
- keep `stage.skill`/`taskSpec` compatibility behavior intact;
- reject operations not legal for the current session phase;
- route communication edges through Assignment governance.

Exit candidate: one non-Work read-only protocol runs without selecting a coding
Work stage as a surrogate.

### 7.4 Attach Sessions To Work Without Lifecycle Leakage

- start a CoordinationSession from one Work Stage Operation;
- pass Work context by reference;
- return structured session outcome and evidence to the driver;
- prove only Work verbs can move stage/status or merge;
- test retries and failed sessions without corrupting Work.

Exit candidate: a Work-attached read-only session informs a driver decision but
cannot mutate lifecycle directly.

### 7.5 Replace Planning Over-Materialization

- introduce TaskCandidate output and graph validation;
- classify lifecycle and isolation independently;
- materialize inherited nodes as AdhocTasks;
- materialize independent nodes as child Work through normal intake;
- preserve pass-through behavior when no decomposition is needed;
- support a mixed graph without a special hybrid mode.

Exit candidate: representative plans produce zero, some, or all child Work for
explicit reasons, with stable dependency links and no accidental duplicates.

### 7.6 Prove Isolation And Integration

- serialize shared-checkout mutations;
- implement/prove ephemeral isolation for inherited tasks;
- reconcile immediate-parent integration for nested Work;
- test generated-file, lockfile, formatter, Git-index, and conflict cases;
- define failure cleanup and restart recovery.

Exit candidate: parallel mutating proof cannot corrupt another task or bypass
the owning Work's merge authority.

### 7.7 Live Hybrid Scenario

- use one real Work with internal research/review AdhocTasks;
- include one task promoted or materialized as independent child Work;
- run at least one fan-out/fan-in dependency shape;
- inspect Assignment, Run, RunResult, evidence, branch, and Work history;
- record operator friction and token/context cost.

Exit candidate: the result is independently reviewable from persisted evidence,
not from terminal visibility or agent narrative.

### 7.Final Independent Review And Red-Team

- review lifecycle leakage, dispatch bypass, false-success, graph deadlock,
  duplicate task, recovery, branch target, and cleanup risks;
- run adversarial tests for forged/stale evidence and illegal operation choice;
- compare actual implementation against the traceability matrix;
- close only when high-severity findings have fixes and regression tests.

## 15. Risks To Carry Forward

1. Generalizing Work workflow too aggressively may make standalone protocols
   inherit irrelevant lifecycle assumptions.
2. Creating a second graph/runtime may duplicate normalization and policy logic.
3. Agent-generated lifecycle classification may inflate child Work or hide
   independently governable work as temporary tasks.
4. Task status can accidentally become a shadow Work lifecycle.
5. Dynamic fan-out can cause unbounded cost, depth, or context growth.
6. Parallel coding can corrupt a shared checkout despite disjoint source hints.
7. Session synthesis can report consensus from missing or weak evidence.
8. Promotion can lose provenance or create two owners for the same commits.
9. Immediate-parent integration can conflict with current root resolution.
10. Detailed artifacts can save repeated context but become stale if they are
    not generated from canonical runtime records.

## 16. Open Decisions Before Approval

The following are intentionally not settled:

1. Is `CoordinationSession` the final name and persistence boundary?
2. Is Mission needed in the first standalone runtime, or only later for grouping?
3. What is the minimum AdhocTask state machine?
4. Which protocol graph concepts can reuse Workflow Stage directly, and which
   require a neutral Phase type?
5. Who proposes and who validates `lifecycle` and `isolation`?
6. What budget limits govern dynamic task creation and cross-agent exchange?
7. What is the canonical AgentMessage/event storage model?
8. How are ephemeral task changes integrated and recovered?
9. Is immediate-parent merge the correct invariant for every nested Work type?
10. Which planning cases must still create child Work by default?
11. How does an AdhocTask promotion adopt existing evidence and commits safely?
12. Which Step 07 slice is the smallest honest proof before planning behavior is
    changed?

## 17. Evidence To Revisit During Design Review

Before approving implementation, review at least:

- workflow normalization and `operationsForStage()` behavior;
- planning `resolvePlan()` child Work materialization;
- scoped-subtask contracts and current driver selection;
- mission-lite module and focused tests;
- Work `resolveRoot()`, claim, approve, and sync-root behavior;
- Assignment/Run/RunResult storage and evidence hardening;
- Team Communication Protocol role and routing constraints;
- one real planning case that should remain child Work;
- one real planning case that should become only AdhocTasks;
- one mixed case with both lifecycle types and isolated mutations.
