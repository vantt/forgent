# Agent Coordination Foundation Vision

```txt
Document type: Vision
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](history/retired-engine/files/vision.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Authority And Reading Rule

Read this document before every other agent-coordination document.

This Vision is the highest authority for what Agent Coordination is, what it
must enable, and which concerns belong in the foundation versus a domain. ADRs,
architecture, contracts, proposals, roadmaps, Skills, and implementation define
more specific behavior underneath it. They may refine this Vision but must not
silently narrow or contradict it.

The [Intent Preservation Ledger](history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot) is the required
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

## Consequences For Downstream Design

### Protocol Model

The declared Workflow/Stage/Operation/TaskSpec/Skill model remains valuable and
backward compatible. Its graph and TaskSpec are hard constraints when that
declared model is selected. It is not the universal entry path for a session.

### Assignment

Assignment remains the immutable semantic request. Downstream contracts must
support both declared-operation provenance and a validated dynamic/inline
operation contract without creating a governance bypass.

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

These belong in proposals, ADRs, architecture, and contracts beneath this
Vision. They must be answered without reopening V-001 through V-012 implicitly.

## Reading Down From The Vision

1. [Documentation Governance](../../architect/agent-coordination/documentation-governance.md) explains authority
   and promotion rules.
2. [Vocabulary](../../architect/agent-coordination/vocabulary/README.md) defines canonical terms.
3. [Accepted Architecture](../../architect/agent-coordination/architecture/README.md) defines current system
   boundaries and implemented profiles.
4. [Contracts](../../architect/agent-coordination/contracts/README.md) define exact machine-visible behavior.
5. [Architecture Decisions](../../architect/agent-coordination/decisions/README.md) record specific accepted and
   rejected choices.
6. [Step 07](../../architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md) resolves the
   session/task/planning/isolation design still open under this Vision.
7. [Step 08](../../architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md) develops
   optional reusable protocols and agent-led standalone adoption.
8. [Step 09](../../architect/proposals/step-09-group-thinking-substrate.md) discusses the
   standalone group-thinking substrate expansion, and
   [Step 10](../../architect/proposals/step-10-coding-domain-adoption.md) discusses bringing
   the existing coding domain onto that foundation as its second unlike
   consumer.

