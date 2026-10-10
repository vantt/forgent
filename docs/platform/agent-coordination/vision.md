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

The [original intent ledger](history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot)
is dated preservation evidence, not a required current second read or an approval
authority. It records earlier scope and deferred intent without making retired
engine choices current.

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

The direction supports execution with or without Work and without requiring
a predeclared Workflow for every objective. Current bounded requests use Unit,
CollaborationPattern and Workflow execution; the retired CoordinationProtocol,
Mission/session plan and session-task store are not current entry requirements.
Domain doctrine can enrich planning without acquiring private launch authority.

The foundation owns the durable execution invariants that free-form prose must
not own: dispatch governance, bounded execution, authority checks, budgets,
Run provenance, normalized results, evidence quality, and safe integration
boundaries.

Domain and organization layers add differentiated experience: knowledge,
doctrine, Skills, protocol templates, planning harnesses, validators, evidence
policy, resource analysis, isolation strategy, and lifecycle integration.

```txt
Objective
  -> bounded Unit or Workflow execution
       -> semantic execution contracts
       -> governed binding and dispatch
       -> Assignment -> Run -> RunResult / Evidence
       -> bounded collaboration and synthesis
  -> optional augmentation
       -> registered Workflow definitions
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

Independently governable delivery units belong in Work intake. Temporary
research, review and consultation instead have current Unit/Pattern execution
paths without requiring an extra Work record. The old claim that no neutral
execution path exists is no longer current; further dynamic planning models
are design questions, not grounds to revive a session-local task store.

### 3. Standalone Coordination Borrows Coding Workflow Structure

The former mission-lite prototype and coding-stage borrowing are historical;
that module no longer implements standalone execution. Current Unit execution
does not need a fabricated coding Work stage. A generic dynamic task-graph
design remains distinct from the shipped Workflow/Pattern paths.

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

A Workflow operation/TaskSpec, Unit or validated inline contract supplies the
applicable execution contract. Inline validation is implemented in
`src/runner/dispatch/execution-contract.mjs:180-240,295-340`; it is not still an
undecided schema. Unit and generic inline admission are distinct current paths.

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

Planning intelligence may come from a caller, declared Workflow or domain
doctrine without forking governed execution. The current coding harness enriches
and validates supporting inline contracts through its pure seam; it is not proof
that research/marketing harnesses or a universal plugin SDK already exist.
Evidence: `domains/coding/harness/enrich-and-validate-contract.mjs:102-147`.

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

- Skill prose may bypass governed execution or mutate Work lifecycle directly.
- Work is required before any bounded Unit may execute.
- Domain-specific file/Git planning rules belong in the universal core.
- Domain neutrality removes hard safety, evidence, budget or authority constraints.

The retired session/protocol interpretations remain in the complete historical
input; they are not reinstated as current engine requirements.

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

The earlier questions now have mixed status; answered contracts and still-open designs must be distinguished:

- Inline schema is now answered by the current validator; its reserved mutation
  stamp gate is distinct from the Unit-run mutating worktree/binding gate.
- Current declared/inline provenance and normalization are answered by the
  Assignment builder/normalizer; a broader dynamic graph remains a proposal.
- Additional unlike consumers must still prove new generic extension seams.
- Provider privacy/context-egress guarantees need evidence from the effective
  governance/confinement path; future soul/provider policies are not implied.
- General same-workspace inherited-edit takeover remains an unimplemented
  recovery profile, not an existing session-isolation mechanism.
- Nested Work integration topology remains a separate owning-domain decision.

The earlier V-003/V-009 session graph formulations remain historical. The
desired breadth of a future generic dynamic graph is open, not asserted shipped.

These belong in proposals, ADRs, architecture, and contracts beneath this
Vision. They must be answered without reopening V-001 through V-012 implicitly.

## Reading Down From The Vision

1. [Vocabulary](vocabulary/README.md) names current, proposed and reserved terms.
2. [Architecture](architecture/README.md) routes to current implementation owners
   and explicitly proposed designs.
3. [Assignment, Run and RunResult contract](contracts/assignment-run-runresult.md)
   distinguishes current execution/evidence boundaries from historical schemas.
4. [Decisions](decisions/README.md) distinguishes surviving boundaries from
   retired-engine acceptance.
5. [Historical Step 07](history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)
   and [Step 08](history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)
   preserve their earlier frontier; they do not define current execution doors.
6. Current sequencing and binding implementation is linked by
   [the runner spec](../../specs/runner.md). The two recorded spec/code conflicts
   require separate main-owner investigation, not inference from old acceptance.

