# Agent Coordination Foundation Vision

Document type: Vision
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-01
Canonical for: product identity, foundation boundaries, optional structure, and domain augmentation

## Authority And Reading Rule

Read this document before every other agent-coordination document.

This Vision is the highest authority for what Agent Coordination is, what it
must enable, and which concerns belong in the foundation versus a domain. ADRs,
architecture, contracts, proposals, roadmaps, Skills, and implementation define
more specific behavior underneath it. They may refine this Vision but must not
silently narrow or contradict it.

The [Intent Preservation Ledger](intent-preservation-ledger.md) is the required
second read. It does not outrank this Vision or make deferred ideas accepted
architecture. It makes deliberate narrowing visible and records what each
increment must not preclude, so a temporary MVP does not silently replace the
original direction.

When a downstream document conflicts with this Vision:

1. preserve the Vision boundary;
2. mark the downstream design or implementation as drifted;
3. reconcile the downstream document explicitly;
4. change this Vision first if the product direction itself must change.

This authority does not make the Vision a field-level runtime contract. Exact
schemas, state transitions, compatibility, and validation rules remain owned by
accepted contracts and ADRs.

## Vision

Agent Coordination is the domain-neutral foundation that turns an objective
into governed, evidence-aware activity across agents, capabilities, souls,
providers, models, tiers, and execution mechanisms.

It must work with or without Work and with or without a predeclared Workflow or
Coordination Protocol. A coordinator agent may reason from a Mission/objective,
create and revise a runtime plan, delegate bounded requests, consult or
challenge other roles, and synthesize results. Declarative protocols and domain
harnesses may constrain or improve that process, but they are augmentation, not
an entry requirement.

The foundation owns the durable execution invariants that free-form prose must
not own: dispatch governance, bounded execution, authority checks, budgets,
Run provenance, normalized results, evidence quality, and safe integration
boundaries.

Domain and organization layers add differentiated experience: knowledge,
doctrine, Skills, protocol templates, planning harnesses, validators, evidence
policy, resource analysis, isolation strategy, and lifecycle integration.

```txt
Mission / objective
  -> Agent Coordination Foundation
       -> coordinator reasoning and runtime planning
       -> semantic execution contracts
       -> governed dispatch
       -> Assignment -> Run -> RunResult / Evidence
       -> bounded adaptation and synthesis
  -> optional augmentation
       -> reusable Coordination Protocol
       -> domain knowledge / doctrine / Skills
       -> domain planning and validation harness
       -> organization-specific policy and experience
       -> optional Work integration
```

## Problems This Vision Resolves

### 1. Coordination Has Been Too Closely Identified With Work

Work is a durable, human-managed delivery lifecycle. Research, brainstorm,
consult, debate, review, and internal decomposition often need coordination but
do not need backlog identity, acceptance, approval, a durable branch, or merge
lifecycle.

Requiring placeholder Work for every collaboration creates dashboard noise and
makes an integration profile look like the identity of the system.

### 2. Planning Currently Over-Materializes Work

Current coding planning materializes every decomposed child through Work intake.
That is correct for independently governable delivery units and too heavy for
temporary research branches, review passes, specialist consultations, or
bounded tasks returning to one parent objective.

The system lacks a neutral way to represent session-local intent and dependency
without creating another Work item.

### 3. Standalone Coordination Borrows Coding Workflow Structure

The mission-lite prototype proves that read-only Assignments can run with
`workId: null`, but it selects operations from coding Workflow stages and has no
general runtime task graph. A standalone objective should not pretend to be at
`planning` or `executing` merely to access dispatch.

### 4. Predeclared Structure Has Been Treated As Universally Mandatory

Workflow, Stage, Stage Operation, TaskSpec, and Skill provide valuable
repeatability and hard-and-soft coordination. They are not the only legitimate
source of coordination structure.

Research and brainstorm can often be planned competently by an agent from the
objective and current evidence. Their task graph may be created incrementally
at runtime. Forcing every such objective through a predeclared graph adds
ceremony without adding safety.

### 5. Generic And Domain-Specific Planning Concerns Are Mixed

Coding needs special reasoning about files, Git indexes, generated output,
lockfiles, worktrees, verification, and merge topology. Other domains may have
different resources and risks, or may need no specialized planning harness at
all.

Putting coding-specific planning rules in the foundation prevents the
foundation from remaining reusable. Omitting all hard runtime rules, however,
would reduce it to an unsafe multi-agent prompt loop.

### 6. The Two Unsafe Extremes

The design must avoid both:

- a mandatory workflow engine that makes every collaboration preconfigured and
  domain-shaped;
- unrestricted prose that may launch executors, grant itself authority, spend
  unbounded budget, mutate state, or declare its own evidence verified.

## Accepted Vision Decisions

### V-001: Agent Coordination Is A Foundation Layer

The core is domain-neutral. It coordinates semantic execution and evidence; it
does not encode one domain's preferred problem-solving workflow.

### V-002: Work Is Optional Integration, Not System Identity

A coordination activity may be Work-attached or standalone. Work remains the
sole authority whenever delivery lifecycle exists. Mission, Session, task,
Assignment, Run, RunResult, protocol, or synthesis cannot become a second Work
lifecycle.

### V-003: A Predeclared Workflow Or Protocol Is Optional

A session may use:

- agent-led runtime planning;
- a declared Workflow or Coordination Protocol;
- a domain planning harness;
- a composition of those sources.

A one-shot consult may lower directly to one Assignment. A research session may
create a runtime task graph incrementally. A repeatable or regulated process may
select a declared protocol graph.

These are composable sources of planning and constraints, not mutually
exclusive top-level lifecycle modes.

### V-004: Runtime Execution Contracts Are Mandatory

Optional predeclared structure does not mean optional execution contracts.
Every executable request must lower to a validated semantic contract containing
at least:

- objective and bounded context references;
- constraints and authority;
- expected outputs;
- mutation policy;
- evidence expectations;
- role/capability requirements;
- budget or execution bounds;
- caller/session provenance.

A registered Stage Operation and TaskSpec may supply that contract. Agent-led
planning may supply an inline contract that passes the same foundation-level
validation. The exact inline schema remains a contract-design decision.

### V-005: Agents Own Adaptive Reasoning; The Foundation Owns Authority

Skill/prose and coordinator agents may propose tasks, roles, capabilities,
fan-out, follow-ups, reviews, and next actions. They may not directly bypass
dispatch, grant mutation permission, weaken evidence policy, expand budget
without authorization, or mutate Work lifecycle.

```txt
agent / Skill       -> proposes semantic action
policy / harness    -> validates and enriches constraints
dispatch            -> resolves execution infrastructure
runtime             -> records attempt and result
driver / caller     -> applies authorized lifecycle action, if any
```

### V-006: Planning Is Pluggable And Composable

The foundation must accept planning intelligence from an agent, a declarative
protocol, or a domain/organization harness without forking the execution core.

Domain planning may enrich or reject an agent proposal. For example, coding may
derive resource claims, detect file overlap, require isolated worktrees, and
constrain merge targets. Research may rely only on generic dependency, budget,
duplicate-intent, source-quality, and evidence rules.

### V-007: Dispatch Is A Primary Foundation Capability

Semantic roles are not executors. An Assignment expresses the capability,
role, policy, privacy, context, and evidence needs of an action. Dispatch
resolves the appropriate executor, provider, model, tier, soul/profile,
mechanism, and adapter under governance.

No Workflow, Skill, domain harness, coordinator, or external agent may invoke
execution infrastructure as a private bypass around the dispatch control plane.

### V-008: Domain And Organization Augmentation Creates Differentiation

Domain packages and organization-specific extensions may provide:

- knowledge and context enrichment;
- doctrine and Skills;
- reusable protocol definitions;
- plan/task validation;
- resource, conflict, and isolation analysis;
- evidence and result evaluation;
- Work or other lifecycle integration;
- organization-specific roles, souls, policy, and quality criteria.

The foundation defines stable seams only when at least two real consumers prove
the common need. It must not pre-build a large generic plugin framework from
hypothetical variation.

### V-009: Runtime Graphs May Be Trivial, Dynamic, Or Declared

Coordination structure may be:

- one Assignment with no meaningful graph;
- an upfront task dependency graph;
- a graph expanded dynamically as evidence reveals new questions;
- a declared protocol graph;
- a domain-validated hybrid of dynamic and declared structure.

Dynamic does not mean unbounded. Task count, depth, concurrency, time, tokens,
cost, communication rounds, mutation, and duplicate intent remain governed.

### V-010: Evidence And Provenance Survive Every Profile

Agent-led planning does not weaken the Assignment, Run, RunResult, evidence, or
provenance boundaries. Exit zero, terminal visibility, repetition, consensus,
or agent self-report cannot manufacture verified success.

### V-011: The Foundation Core Stays Small

The first foundation does not require a scheduler, durable Job queue, daemon,
general mailbox, mandatory Mission lifecycle, unrestricted peer chat, or a
universal domain plugin system.

New persisted entities require a distinct authority, recovery need, or
invariant that existing entities cannot represent correctly.

### V-012: Generalization Requires Two Unlike Consumers

The foundation claim must be proved by at least:

1. an agent-led research or brainstorm session with no predeclared Workflow;
2. a coding session using the same dispatch/runtime core plus domain-specific
   planning, resource, evidence, or isolation constraints.

If those consumers require separate execution cores, the foundation boundary
has not been found yet.

## Foundation Responsibilities

The foundation owns:

- bounded session/invocation context;
- semantic execution-contract validation;
- task/Assignment identity and dependency mechanics when needed;
- dispatch governance and capability resolution;
- execution budgets, retries, cancellation, and recovery boundaries;
- Run and RunResult provenance;
- evidence normalization and confidence boundaries;
- communication authorization and loop bounds;
- aggregate outcome and synthesis inputs;
- extension seams proven to be domain-neutral.

## Domain And Integration Responsibilities

Domain, organization, or lifecycle integrations own:

- domain knowledge and vocabulary;
- preferred problem-solving doctrine;
- reusable Skills and protocol templates;
- domain-specific planning heuristics and validators;
- domain resource/conflict models;
- domain evidence strength and acceptance criteria;
- Work lifecycle decisions and verbs;
- durable branch/merge behavior where the domain requires it;
- organization-specific policy, roles, souls, and quality posture.

## Rejected Interpretations

The accepted Vision rejects these interpretations:

1. Every CoordinationSession must reference a predeclared Workflow, Stage, or
   Coordination Protocol.
2. Every executable request must have a pre-existing TaskSpec file.
3. No predefined graph means no structured runtime contract.
4. Skill prose may call executors or mutate lifecycle directly.
5. Work is required to gain access to coordination or dispatch.
6. Protocol families such as research, brainstorm, or debate are mandatory
   gateways rather than optional reusable accelerators.
7. Coding-specific file/Git rules belong in the universal coordination core.
8. Domain neutrality means the foundation has no hard safety, evidence, budget,
   or authority policy.

## Consequences For Downstream Design

### Protocol Model

The declared Workflow/Stage/Operation/TaskSpec/Skill model remains valuable and
backward compatible. Its graph and TaskSpec are hard constraints when that
declared model is selected. It is not the universal entry path for a session.

### Assignment

Assignment remains the immutable semantic request. Downstream contracts must
support both declared-operation provenance and a validated dynamic/inline
operation contract without creating a governance bypass.

### CoordinationSession And AdhocTask

A CoordinationSession, if persisted, is a thin execution and recovery boundary;
it does not require a protocol reference. AdhocTask, if used, represents
session-local intent and evidence roll-up. A session may contain one trivial
task or a dynamically evolving task graph.

The exact persistence boundary and minimum task state remain Step 07 design
questions.

### Standalone Protocols

Research, consult, brainstorm, debate, leader-worker, and peer-review protocols
are optional doctrine/configuration packages on the foundation. Step 08 must
also prove agent-led coordination without a predefined protocol.

### Planning Materialization

Planning output must not automatically imply child Work. Domain planning may
propose tasks and lifecycle needs; deterministic policy validates them; only
units requiring independently governable delivery lifecycle become child Work.

### Extension Design

Do not design a comprehensive extension SDK upfront. Begin with the smallest
seams required by the two proof consumers, likely context enrichment,
plan/task validation, resource/isolation advice, and result/evidence evaluation.

## Open Design Questions Under This Vision

The Vision fixes direction but intentionally does not decide:

1. whether CoordinationSession is always persisted or may be an invocation
   envelope for trivial calls;
2. the minimum AdhocTask state and persistence model;
3. the exact validated inline execution-contract schema;
4. how declared and dynamic tasks share operation identity and policy lookup;
5. which planning/validation extension seams the first two consumers prove;
6. how privacy and context-egress policy constrain external providers and souls;
7. how dynamic fan-out budgets and duplicate-intent checks are enforced;
8. how mutating session-local tasks obtain and integrate isolation;
9. how nested Work branch topology is reconciled;
10. whether and how an AdhocTask may be promoted to child Work.

These belong in proposals, ADRs, architecture, and contracts beneath this
Vision. They must be answered without reopening V-001 through V-012 implicitly.

## Reading Down From The Vision

1. [Documentation Governance](documentation-governance.md) explains authority
   and promotion rules.
2. [Vocabulary](vocabulary/README.md) defines canonical terms.
3. [Accepted Architecture](architecture/README.md) defines current system
   boundaries and implemented profiles.
4. [Contracts](contracts/README.md) define exact machine-visible behavior.
5. [Architecture Decisions](decisions/README.md) record specific accepted and
   rejected choices.
6. [Step 07](proposals/step-07-coordination-session-adhoc-task.md) resolves the
   session/task/planning/isolation design still open under this Vision.
7. [Step 08](proposals/step-08-standalone-coordination-protocols.md) develops
   optional reusable protocols and agent-led standalone adoption.
8. [Step 09](../proposals/step-09-coding-domain-adoption.md) discusses bringing the
   existing coding domain onto that foundation as its second unlike consumer.
