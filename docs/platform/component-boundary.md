# Component Boundary

```txt
Document type: Platform architecture anchor
Audience: Human reviewer, architect, maintainer, design-shaping agent
Purpose: Track the whole-system component and authority boundary map
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted anchor for docs/architect/component-boundary/**
Last reviewed: 2026-10-04
Related:
- docs/architect/component-boundary/README.md
- docs/architect/component-boundary/component-boundary-advisory.md
- docs/architect/proposals/component-authority-boundary-map.md
- docs/platform/README.md
Implementation: Partial
Provenance: Promoted anchor for docs/architect/component-boundary/**
Writer type: Original writer attribution not recorded; retained source provenance
Canonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard
Use this when: Track the whole-system component and authority boundary map
Do not use this for: Authority beyond the declared scope or implementation truth without the cited verification
Supersedes: None; legacy sources remain in place during migration
Superseded by: None recorded
```

## 1. Purpose

This document is the platform-wide anchor for component boundaries.

It answers:

- which major components exist;
- which parent/child responsibilities belong together;
- which component owns a decision or state write;
- which areas depend on each other through explicit contracts;
- when a design changes the whole-system boundary map.

## 2. Current Source During Migration

The current detailed source remains:

| Source | Role |
| --- | --- |
| [../architect/component-boundary/README.md](component-boundary.md) | Reading portal for the existing component-boundary architecture package. |
| [../architect/component-boundary/component-boundary-advisory.md](component-boundary.md) | Advisory map of components, bounded contexts, and authority boundaries. |
| [../architect/proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |

Until this anchor is fully promoted, use those sources for detail and update this file as the stable entry point.

## 3. Update Rule

Any design discussion or documentation rewrite must check this boundary map when it changes:

- a platform component;
- a parent/child component relationship;
- ownership of a state write, decision, runtime authority, or contract;
- a cross-area dependency;
- the boundary between platform core, platform support, domain layer, host surface, or extension/plugin layer.

If the boundary changes, update this document or the current detailed source listed above. If it does not change, record `No component-boundary change` in the implementation alignment, verification note, discussion summary, or PR note.

## 4. Current High-Level Components

This table is a compact navigation surface, not a full replacement for the advisory docs.

| Component | Current role | Current source |
| --- | --- | --- |
| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gates. Does not own stage or sequencing (owned by Workflow runner). Owns worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`). | [../architect/component-boundary/component-boundary-advisory.md](component-boundary.md) |
| Workflow (Định nghĩa + Run + Runner + Tích hợp) | Domain-neutral step & Unit DAG scheduling (`src/workflow/**`), human review gates, pure git integration. Single sequencer for plans, workflows, and multi-unit tasks. | [../specs/runner.md](runner/README.md) |
| Execution Core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture) | Single authority for "ai làm / model / persona / cơ chế" (`src/runner/execution/bind.mjs`), single run door for new work (`fgos run` via `src/runner/execution/run.mjs`, herdr pane default, cli fallback), OS confinement posture for both herdr and cli, verifiable mutating gate. Strictly forbids L3 Work lifecycle dependencies (`src/state/**`). | [../specs/runner.md](runner/README.md) |
| Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](runner/README.md) |
| Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](herdr-web-dashboard/spec.md) |
| fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\|status\|stop`; không phải một phần của herdr và không phải "herdr-gateway" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](herdr-web-dashboard/spec.md) |
| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters; the `bwrap` driver calls the credential renewal module at provisioning (`copyCredentialFiles`, the write-back marker) and removing a private home (`confinement/cleanup.mjs`) calls it again for write-back (dependency confinement → provider capacity, for the account lock only). | [../specs/confinement-authority.md](agent-confinement/README.md) |
| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](agent-coordination/README.md) |
| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |
| Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |
| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |
| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |
| Observe (Metrics & Friction) | Measurement and friction tracking across substrate entities (cases, runs, sessions, friction, snapshots). Owned in Rust (`packages/observe/rust`), native routing. | [../specs/observe.md](observe/README.md) |
| Convention (Executable Names & Placement) | Platform-core authority for deterministic artifact names, repository-relative placement, path classification, and conformance checking. Implemented; owns no state and depends only on `fgos-host-runtime`. | [convention/spec.md](convention/spec.md) |
## 5. How To Change

1. Read this anchor and the current detailed component-boundary source.
2. Identify whether the change is component packaging, bounded context, authority boundary, or physical layout.
3. Update the owning area docs.
4. Update this anchor or the detailed source when the whole-system map changes.
5. Link evidence or record `No component-boundary change`.

## 6. Related Files

| Relationship | File |
| --- | --- |
| platform portal | [README.md](README.md) |
| detailed component-boundary source | [../architect/component-boundary/component-boundary-advisory.md](component-boundary.md) |
| draft authority map | [../architect/proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |
| packaging-distribution area | [packaging-distribution/README.md](packaging-distribution/README.md) |
| observe component | [../specs/observe.md](observe/README.md) |

## Added in candidate: component-boundary-advisory source carriage

Carriage from `docs/architect/component-boundary/component-boundary-advisory.md` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; pending independent conservation review. Full source text follows, with heading levels and physical link destinations adjusted only. Source metadata is provenance; this section makes no new implementation or authority claim.

### fgOS Component Boundary Advisory

Document type: Proposal
Design status: Discussion / Visionary advisory
Implementation: N/A
Last reviewed: 2026-09-01
Canonical for: nothing; architectural advisory only
Related: [Architecture Map](architecture-map.md), [System Overview](system-overview/spec.md), [Platform Foundations](platform-foundations.md), [Domainization Architecture](domainization/architecture/domainization.md), [Agent Coordination Foundation Vision](agent-coordination/README.md), [Concept Relationships](agent-coordination/README.md), [Dispatch Control Plane](agent-coordination/README.md), [Protocol Model](agent-coordination/README.md), [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md), [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)

#### 1. Purpose

> **Ghi chú chuyển tiếp (2026-10-02):** Bảng phân chia component sau track Request-to-Run (P1–P5) đã thay thế "Agent Coordination Engine" bằng **Workflow Runner** (`src/workflow/**`) và **Collaboration Patterns / Execution Core** (`src/runner/execution/**`). Nguồn chuẩn hiện hành là `docs/platform/component-boundary.md`.

This note records an architecture advisory view of fgOS as a whole under
single-responsibility and hexagonal-architecture criteria. It is intentionally
not an implementation plan and does not approve new contracts. Its goal is to
make the candidate component, bounded-context, and authority boundaries easier
to discuss before any one area grows into a system-shaped module by accident.

The scope is the whole forgentX system: Work Lifecycle, Agent
Coordination, Dispatch And Execution, Run Result Evaluation, Domain Components,
Host And Surface, setup/doctor/distribution, gateway/Herdr,
knowledge/learning, and Node/Rust implementation boundaries.

Read this document as a refactoring compass, not as a rebuild mandate. It
describes the direction for moving existing behavior toward clearer
component, bounded-context, and authority ownership as implementation slices
create a natural opening. It should help reviewers decide whether a slice is
placing behavior behind the right boundary. It should not be used to require a
large repackage, rename, or module split before the runtime has proven the
need.

The central recommendation is:

```txt
Keep each platform engine small.
Separate component packaging, bounded contexts, and authority boundaries.
Make dispatch, cognition/protocols, domain harnesses, execution adapters, and
evidence evaluation replaceable through explicit ports.
```

#### 2. Architectural Reading

The accepted documents already point in the right direction:

- Work is optional integration, not coordination identity.
- Workflow or CollaborationPattern is optional structure, not a universal entry
  requirement.
- Every executable request still lowers to a validated semantic contract.
- Assignment, DispatchPlan, Run, RunResult, and Evidence form the shared
  governed execution path.
- Domain and organization augmentation must enrich or reject plans without
  forking the execution core.
- Foundation seams should be generalized only after unlike consumers prove the
  common need.

The risk is not that the concepts are missing. The risk is that several
adjacent concepts can drift into one large runner-shaped module unless their
ownership is made explicit:

```txt
coordinator / planner / protocol / domain harness / assignment builder /
dispatch / executor adapter / run runtime / evidence evaluator / work driver
```

These names describe different responsibilities. If they share one implicit
control path, changes such as a Rust dispatcher, new protocol families,
Herdr/headless parity, provider diversity, or Work-attached mutation will be
harder to introduce safely.

#### 3. Recommended Responsibility Chain

The clean boundary chain is:

```txt
Team cognition decides what roles, tasks, and relations are useful.
Protocol and policy validate whether the proposed action is legal and bounded.
Assignment builder freezes exactly what is being requested.
Dispatch decides who/how may execute it.
Runtime records what attempt happened.
Evidence evaluation decides what can be trusted.
Work driver decides what lifecycle action is allowed.
```

No step should reach backward and secretly own the prior step's authority. No
step should reach forward and silently decide the next step's truth.

#### 4. Boundary Vocabulary

This advisory uses three different boundary concepts. They are related, but
they should not be collapsed into one idea.

| Concept | Question it answers | Use it for | Do not use it for |
|---|---|---|---|
| High-level component/module | How should the system be packaged so major parts can collaborate without becoming too fragmented? | Source/package/service grouping, implementation ownership, replacement strategy. | Deciding source of truth by itself. |
| Bounded context | Which model, vocabulary, and reason-to-change belong together? | Domain language, internal model boundaries, validation ownership, extension design. | Every small authority rule or helper function. |
| Authority boundary | Who is allowed to decide or write a specific piece of truth? | "Only X may", "must not bypass", state ownership, contract enforcement, false-success prevention. | Packaging every rule as a separate module. |

Practical reading rule:

```txt
Use components to decide packaging.
Use bounded contexts to decide model and vocabulary.
Use authority boundaries to decide who can write truth or make a decision.
```

Example:

```txt
Dispatch And Execution Engine    = high-level component
Dispatch                         = bounded context inside that component
"Only dispatch creates DispatchPlan" = authority boundary
```

Another example:

```txt
Run Result Evaluator                         = high-level component
Run Result Evaluation                        = bounded context
"Only Run Result Evaluator computes confidence" = authority boundary
```

An authority boundary may cross a module boundary. A module may call another
module to apply a decision, but it must not privately re-derive or overwrite
that module's authority.

#### 5. High-Level Component Authority Register

The lower-level boundaries below should not be mapped one-to-one into
top-level modules, services, or packages. That would make the implementation
too fragmented. They are a mix of bounded contexts and authority boundaries,
and should be grouped into a smaller set of practical components.

A component boundary can link to several documents because ownership is split
between product spec, architecture contract, and implementation reality. The
table below is the management view for the whole system.

| Component | Role | Internal boundaries | Owning / reference documents |
|---|---|---|---|
| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](work-state/README.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), [System Overview](system-overview/spec.md) |
| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](runner/README.md), [Platform Component Boundary](component-boundary.md) |
| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](runner/README.md), [Dispatch Control Plane](agent-coordination/README.md), [Assignment/Run/RunResult Contract](agent-coordination/README.md) |
| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](agent-coordination/README.md), [Assignment/Run/RunResult Contract](agent-coordination/README.md), [Runner Spec](runner/README.md) |
| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](domainization/architecture/domainization.md), [System Overview](system-overview/spec.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](claude-plugin/spec.md), [Herdr Web Dashboard Spec](herdr-web-dashboard/spec.md), [Visibility And Herdr](agent-coordination/README.md), [IO Contract](work-state/contracts/cli-io-contract.md) |
| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](packaging-distribution/README.md), [Distribution Vision](../distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |
| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](system-overview/spec.md) |

The collaboration shape should stay:

```txt
Host / Surface
  -> Work Lifecycle Engine
       owns Work lifecycle and may ask Agent Coordination to perform a legal
       operation
  -> Agent Coordination Engine
       can also run standalone without Work

Agent Coordination Engine
  -> Team Cognition Engine
       proposes cognitive strategy, roles, tasks, topology, and synthesis plan
  -> Dispatch And Execution Engine
       resolves and launches governed execution
  -> Run Result Evaluator
       normalizes RunResult, evidence, and confidence
  -> Work Lifecycle Engine
       returns evidence/recommendations only; Work verbs decide lifecycle

Domain Components And Extension Layer supplies domain workflow definitions,
protocol packages, domain harnesses, evidence policy adapters, and organization
policy through controlled ports.
```

Under this view, `Work Lifecycle Engine` is not an Agent Coordination submodule.
It is a sibling fgOS component that can consume Agent Coordination as an
execution/collaboration capability. It should stay domain-agnostic: marketing,
operations, coding, or another domain can use Work items to manage units of
work without inheriting coding-specific Git, worktree, merge, or technical
approval behavior.

The split is: the Work engine owns domain-agnostic work-unit lifecycle and
human gates; a domain extension owns domain-specific approval semantics,
resource isolation, branch/worktree behavior, and merge mechanics when that
domain needs them.

A Coding Domain Component is a high-level domain package, not a small
extension. Its job is to own coding-specific product and technical behavior
while consuming platform engines for generic lifecycle and collaboration.

Inside it, `Coding Domain Core`, `Coding Feature Workflow`, and `Bugfix
Workflow` are separate subcomponents. The core owns repository mechanics and
technical policy. The workflows own different coding work shapes. The component
uses Work Lifecycle Engine to manage Work units and Agent Coordination Engine to
run agent collaboration.

`Team Cognition Engine` is a major internal module of Agent Coordination
Engine, not a protocol package. Protocol packages are recipes/configuration.
The engine is the runtime reasoning component that consumes an objective,
session state, optional protocol definition, and domain/org constraints, then
proposes the next bounded coordination action.

`Run Result Evaluator` is not a generic verification harness. Its scope is
specific: evaluate the result of one Run for one Assignment. Domain-specific
evidence adapters may provide proof inputs, but the evaluator owns the final
RunResult confidence decision.

#### 6. Existing Decisions That Must Be Preserved

This advisory should not re-open decisions that the repo has already made. The
important recovered constraints are:

1. `domain -> N workflow -> item` is already the intended hierarchy.
   `coding` has a default workflow, `feature`, and the domain model separates
   coding into `feature`, `bugfix`, and `lightweight` workflows.
   Workflow selection belongs to the domain registry through `workflowFor`
   keyed by item `kind`; it is not an Agent Coordination decision.
2. A domain owns stage vocabulary, step mapping, legal stage transitions,
   stage-to-skill mapping, legal operations, `worktreeBacked`, status labels,
   park reasons, and classification vocabulary. A domain does not own the
   global status FSM.
3. The coding feature workflow declares `planning.validate-plan` as a legal
   operation: role `reviewer`, reason `review`, task-spec
   `validate-plan`, skill `fgos-coding-validating`, with policy hints
   `minTier: standard`, `preferPersona: code-reviewer`, and
   `preferExecutor: claude`.
4. `validate-plan` is the second half of planning, not a separate stage. The
   shape-plan skill writes the plan; validation proves it against reality; the
   lifecycle driver owns the eventual `planning -> executing` engine verb.
5. Skills do not own stage transitions. They produce artifacts, verdicts, and
   recommendations. Engine verbs validate and apply lifecycle movement.
6. Human gates are real authority boundaries. The machine must make the best
   grounded decision it can first, but a genuine human gate is not self-answered
   by a skill or worker.
7. Task-spec, skill, knowledge, and context are four different layers:
   task-spec is the executable contract; skill is executor know-how; knowledge
   is domain expertise; context is instance-specific material and references.
8. Collaboration triggers belong in task-specs per call edge and workflow/stage:
   when to call, why, to whom, and what return shape is expected. The doctrine
   is: prose teaches, the soul decides, guard blocks.
9. RoleGraph should stay small: implementer, researcher, reviewer, helper, and
   advisor. New specialties should normally be expressed as task-spec/skill
   combinations, not new core roles.

The practical correction for this document is: do not ask humans to classify a
case that is already classified by the domain registry, workflow declaration,
task-spec, or skill doctrine. The advisor must inspect those sources first,
then ask only when the existing system has a real gap or a human-only choice.

For example, the question "a coding feature work item at planning needs plan
validation; which component owns that?" should be answered from the repo:

```txt
Coding Feature Workflow
  declares planning.validate-plan as a legal reviewer operation

Work Lifecycle Driver / Domain Workflow Interpreter
  selects that legal operation when plan.md exists and validation is due

Assignment Builder
  freezes planning.validate-plan into an Assignment with taskSpec, role,
  skill, policy, expected outputs, and provenance

Dispatch And Execution Engine
  resolves executor/provider/model/mechanism and runs the reviewer Assignment

Run Result Evaluator
  interprets the reviewer run result and confidence for this Assignment

Work Lifecycle Engine
  applies planning -> executing only through the engine verb when validation
  produced sufficient evidence
```

This case does not require a new component or a human architecture decision. It
requires preserving the already-declared authority chain.

#### 7. Contract Authority Matrix

The existing contracts should be read as shared system contracts with explicit
component ownership. A document may describe a chain across components, but the
authority for each decision should still belong to one component.

In this advisory, a contract is not a component. A contract is the public
interface, schema, or invariant owned by the component that controls the
behavior. Other components interact through that contract and must not
re-derive it privately.

| Existing contract or rule | Primary owner | Important consumers | Ownership note |
|---|---|---|---|
| [Workflow Stage Operation Contract](agent-coordination/README.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
| [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
| [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
| Assignment section of [Assignment, Run, And RunResult Contract](agent-coordination/README.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
| Run section of [Assignment, Run, And RunResult Contract](agent-coordination/README.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](agent-coordination/README.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
| [Dispatch Control Plane](agent-coordination/README.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
| [Evidence And Result Architecture](agent-coordination/README.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
| [Work Integration Boundaries](agent-coordination/README.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
| [Visibility And Herdr](agent-coordination/README.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
| [ADR-007 Domain Harness Seam](agent-coordination/README.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |
| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |
| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |

Two contract files deserve special care:

1. `assignment-run-runresult.md` is a chain contract, not a single-component
   ownership contract. Assignment, Run, and RunResult should remain separate
   authority boundaries even if they are documented together.
2. `flow-definition.md` carries policy and evidence requirement fields, but
   those are declared requirements. Effective provider/model resolution belongs
   to Dispatch And Execution, and confidence computation belongs to the Run
   Result Evaluator.

Three coding-domain sources deserve the same treatment:

1. `domains/coding/workflows/feature.yaml` is the source for the feature
   workflow's legal stage operations. `planning.validate-plan` should be read
   from here before any architectural question is asked.
2. `domains/coding/task-specs/*.md` are the task contracts. They should carry
   collaboration triggers and return-shape expectations.
3. `domains/coding/skills/*` are executor doctrine. They can describe how to do
   the work, but they do not own lifecycle movement or dispatch governance.

#### 8. Internal Boundary Map

These are lower-level boundaries that can live inside the high-level components
above. Some are bounded contexts with their own vocabulary and model; some are
authority boundaries that may remain as explicit ports, contracts, or policy
checks rather than standalone modules.

| Boundary | Type | Likely component | Owns | Must not own |
|---|---|---|---|---|
| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |
| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |
| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |
| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |
| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |
| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |
| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |
| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |
| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |
| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](agent-coordination/README.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |
| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |
| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |
| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |
| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |

#### 9. Hexagonal Architecture View

The system model should stay independent from concrete storage, transport,
executor, and UI choices.

Core model candidates, grouped by owning component:

```txt
Work Lifecycle Engine:
  Work
  Work identity/status/stage/claim/context/document state

Agent Coordination Engine:
  CoordinationSession
  AdhocTask
  Assignment
  Synthesis

Dispatch And Execution Engine:
  DispatchPlan
  Run

Run Result Evaluator:
  RunResult
  Evidence
  ArtifactRef

Domain Components And Extension Layer:
  FlowDefinition normalized model
  PolicyPatch
  TaskSpec / Skill references
  domain workflow definitions
```

This replaces the flatter mental model:

```txt
CoordinationSession
AdhocTask
Assignment
DispatchPlan
Run
RunResult
Evidence
Synthesis
PolicyPatch
FlowDefinition normalized model
```

Port candidates, grouped by owning component:

```txt
Work Lifecycle Engine:
  WorkLifecyclePort
  OccupancyPort

Agent Coordination Engine:
  SessionStorePort
  AssignmentStorePort
  TeamCognitionPort
  WorkContextPort

Dispatch And Execution Engine:
  DispatchResolverPort   (superseded in naming by DispatchRuntimePort,
                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);
                          same candidate facade, not two live ports)
  RunStorePort
  ExecutorAdapterPort

Run Result Evaluator:
  EvidenceCollectorPort
  ResultNormalizerPort
  ArtifactStorePort

Domain Components And Extension Layer:
  DefinitionLoaderPort
  DomainHarnessPort
  ProtocolPackagePort
  PolicyProviderPort
  EvidencePolicyPort

Host And Surface Layer:
  VisibilityPort
  CommandSurfacePort
  ApiSurfacePort

Shared infrastructure:
  ClockPort
  IdGeneratorPort
  FilesystemPort
```

Adapter candidates:

```txt
YAML Workflow loader
Workflow definition loader
coding-domain harness
CLI spawn adapter
Herdr spawn adapter
MCP adapter
API adapter
local .fgos file store
Git evidence collector
test command evidence collector
Work engine verb adapter
```

This split makes replacement easier. For example, dispatch governance,
FlowDefinition validation, session DAG scheduling, Run supervision, or evidence
collection could move to Rust without requiring protocol packages or Skills to
move with them.

#### 10. Coding Domain Component

The coding domain is a useful test case because it is large enough to be a real
domain component, not just a thin harness function. It touches multiple engines
without belonging wholly to any one of them.

The key architectural stance is:

```txt
Coding Domain Component is one large domain component.
It is not Work Lifecycle.
It is not Agent Coordination.
It is not Dispatch.
It uses those platform engines to deliver coding-domain behavior.
```

That makes the responsibility line simpler:

- Work Lifecycle manages generic work-unit state.
- Agent Coordination manages collaboration sessions and Assignments.
- Dispatch runs approved Assignments through governed executors.
- Run Result Evaluator computes confidence for one Assignment Run.
- Coding Domain decides what "coding work" means: feature planning, bug fixing,
  repo isolation, worktree/branch behavior, merge/integration, code verification,
  and technical approval semantics.

This is the intended high-level reading:

```txt
Coding Domain Component
  owns coding-specific product and technical behavior

  subcomponents:
    Coding Domain Core
      - repo scope model
      - repository/resource conflict model
      - worktree, branch, and isolation policy
      - merge and integration policy
      - technical approval gates
      - verification expectations for code changes
      - coding-specific evidence policy and adapters

    Coding Feature Workflow
      - feature-oriented stage graph
      - product/technical shaping for new or changed behavior
      - feature planning doctrine
      - feature TaskSpecs and Skills
      - operations such as shape-plan and validate-plan

    Bugfix Workflow
      - bugfix-oriented stage graph
      - reproduce/diagnose/fix/verify/review doctrine
      - bugfix TaskSpecs and Skills
      - bugfix-specific evidence and verification expectations

    Lightweight Workflow
      - cheap path for small coding work
      - reduced planning/review shape where the domain contract permits it

  consumes:
    Work Lifecycle Engine
      - Work item identity
      - domain-agnostic status/stage
      - claim/return
      - related info, context refs, docs refs, questions
      - lifecycle verbs and human gates

    Agent Coordination Engine
      - CoordinationSession / Assignment path
      - role-based collaboration
      - reviewer/researcher/helper/advisor calls
      - session evidence and synthesis hooks

    Dispatch And Execution Engine
      - governed executor/provider/model/mechanism selection
      - run launch/settlement

    Run Result Evaluator
      - normalized RunResult and confidence judgment
```

Coding workflows should not be implemented as Agent Coordination core. They are
subcomponents of the Coding Domain Component. The domain component uses Work
Lifecycle and Agent Coordination as platform engines while preserving its own
technical core.

The split is valuable because feature work and bugfix work have different
questions:

| Workflow | Primary question | Typical stages/operations | Evidence posture |
|---|---|---|---|
| Coding Feature Workflow | What should be built, how should it be shaped, and is the plan feasible? | discover/explore/shape-plan/validate-plan/implement/review | Plan evidence, scope fit, blast-radius, implementation proof, tests. |
| Bugfix Workflow | What is broken, why is it broken, and did the fix address the proven cause? | reproduce/diagnose/fix/verify/regression-review | Reproduction proof, root-cause evidence, before/after behavior, regression checks. |
| Lightweight Workflow | Can this small coding item safely skip heavier planning ceremony? | classify/execute/verify/review-as-needed | Cheap but still reproducible proof; no silent bypass of lifecycle or confidence. |

The Coding Domain Core is what prevents those workflows from duplicating
technical mechanics. It should centralize repo-level concerns:

- resolving repository scope and allowed file/resource footprint;
- deciding whether the item needs isolated worktree/branch handling;
- protecting against cross-item resource conflicts;
- defining merge, catch-up, and integration policy;
- defining technical approval semantics for coding results;
- mapping coding-specific evidence into evidence policies/adapters;
- keeping coding-specific verification doctrine out of generic Work Lifecycle.

This means `Feature Workflow` and `Bugfix Workflow` can differ in product
process while sharing the same coding core for repository mechanics.

Current coding-domain placement should therefore be:

| Concern | Component placement | Reason |
|---|---|---|
| `feature` workflow graph | Coding Domain Component / Feature Workflow | Already declared as the default workflow. It owns feature stage operation vocabulary. |
| Future `bugfix` workflow | Coding Domain Component / Bugfix Workflow | Bugfix needs different doctrine: reproduce, diagnose, fix, verify, review. It should not overload feature planning. |
| Future `lightweight` workflow | Coding Domain Component / Lightweight Workflow | Small coding work can use a cheaper graph without pretending to be full feature delivery. |
| `workflowFor(kind)` selector | Coding Domain Component / Domain Registry | Domain-level routing from item kind to workflow. Not dispatch, not team cognition. |
| `shape-plan` | Coding Feature Workflow task-spec/skill pair | First half of planning. Produces plan.md and handoff material. |
| `validate-plan` | Coding Feature Workflow task-spec, executed through Agent Coordination as reviewer Assignment | Second half of planning. Proves the plan against repo evidence and returns structured verdict artifacts. |
| Worktree, branch, merge, technical approval | Coding Domain Core | These are coding-specific resource and integration concerns. Marketing Work items must not inherit them. |
| Claim/status/stage/context/docs/questions | Work Lifecycle Engine | Domain-agnostic Work-unit lifecycle. Coding consumes it; coding does not redefine it. |
| Executor/provider/model choice | Dispatch And Execution Engine | A workflow can declare policy hints; dispatch computes the effective mechanism. |
| RunResult confidence | Run Result Evaluator | A domain can provide evidence policy/adapters; the evaluator computes confidence. |

The most important architectural consequences are:

1. A coding feature workflow is a domain workflow, not the Work Lifecycle
   Engine itself.
2. Coding Core must not leak into Work Lifecycle. Work Lifecycle can manage a
   marketing work unit, a coding work unit, or an operations work unit through
   the same domain-agnostic primitives.
3. Worktree, branch, merge, and technical approval are coding-domain concerns.
   They may be implemented as harnesses/adapters behind Coding Domain Core, but
   they should not become generic Work lifecycle semantics.
4. Coding workflows should call into platform engines through contracts:
   Work verbs for lifecycle, Assignment for collaboration work, DispatchPlan
   for execution, and RunResult for confidence.
5. Marketing can use the same Work lifecycle primitives while owning very
   different task-specs, skills, knowledge, context assets, gates, and
   dashboards.

#### 11. Machine-First Decision Discipline

The architecture should encode the principle that agents must try hard to
decide from available evidence before asking a person.

That does not mean "never ask". It means each component must ask only at the
right authority boundary:

| Situation | First source of truth | If still unresolved |
|---|---|---|
| Which workflow applies to a Work item? | Domain registry `workflowFor(kind)` and default workflow. | Ask only if the domain has no declared selector and choosing changes product semantics. |
| Which operation is legal at the current stage? | Domain workflow operation declaration. | Stop/fail closed on undeclared operation; do not invent one. |
| A feature plan exists and needs validation. | `planning.validate-plan` operation + `validate-plan` task-spec + reviewer Assignment path. | Ask only if validation exposes a genuine product/authority gap. |
| Discovery ambiguity. | Machine-alone discovery and research consult where bounded evidence gaps exist. | Move to human-adjacent exploring only when evidence is insufficient. |
| Exploring product decision. | CONTEXT.md, refs, prior answers, material/grounded/answerable filter. | Ask the person only for material, grounded, answerable product decisions. |
| Planning uncertainty. | Existing locked decisions, CONTEXT.md, plan.md, codebase evidence, research consult. | Record Outstanding Question or ask only when the answer changes scope/contract. |
| Executor selection. | Dispatch policy and executor registry. | Report unavailable or fail by contract; do not ask the user to pick if policy is enough. |

This discipline belongs partly to task-spec/skill doctrine and partly to engine
guards. The skill prose teaches the executor how to reason; the executor/soul
decides within that envelope; mechanical guards block illegal operations,
missing task-specs, human-only dispatch, or insufficient evidence.

#### 12. Dispatch As A Replaceable System

Dispatch is a strong candidate for a separately owned subsystem because it has
one clear reason to change: execution allocation and governance.

It should accept:

```txt
Assignment snapshot + resolved policy inputs
```

and return:

```txt
DispatchPlan + launch/settlement metadata for one Run
```

Dispatch should not:

- decide which semantic operation should happen;
- inspect sibling Assignments to implement cohort diversity;
- infer task success from output text;
- move Work lifecycle (driving fanout batches and mutating Work state via `pick`/`return` belongs strictly to Work Driver `src/runner/fanout-batch.mjs`);
- append audit event logs directly (delegated to `src/runner/dispatch-log.mjs`, since removed with `dispatch log`, decision 0062);
- implement team cognition or protocol graph rules.

Cohort diversity is a good example boundary. A coordinator or session allocator
may decide that independent branches should prefer distinct providers. It then
sets per-Assignment policy inputs. Dispatch still governs each Assignment one at
a time and remains the final egress/policy gate.

#### 13. Team Cognition And Protocol Packages

Consult, research, debate, brainstorm, leader-worker, and peer review should be
treated as cognition/protocol capability on top of the foundation, not as the
foundation itself.

There should be a clear split between the engine and the packages:

```txt
Team Cognition Engine
  -> consumes objective, session state, optional protocol package, and
     domain/org constraints
  -> chooses or revises cognitive strategy
  -> proposes TaskCandidates, Assignment intents, actor allocation, topology
     usage, follow-up, and synthesis inputs

Protocol Package / Definition
  -> declares reusable graph, phases, roles, operations, topology, policy hints,
     expected results, and synthesis requirements
```

The Team Cognition Engine is the reusable runtime module. Protocol packages are
replaceable recipes/configuration that the engine may use. Agent-led planning
can use the same engine without selecting a predeclared package, as long as the
resulting execution contracts are validated by the foundation.

Together they should own:

- role and SessionActor doctrine;
- task decomposition patterns;
- allowed communication topology;
- independence/fan-in/fan-out rules;
- synthesis requirements;
- dissent and uncertainty preservation;
- protocol-specific evidence posture.

They should lower every executable action into the same Assignment path. A
protocol package should not spawn executors directly and should not create a
private result/evidence format.

This keeps "team cognition" reusable and replaceable. An organization
could provide a different debate framework, research doctrine, or cohort
allocation strategy without changing dispatch or Assignment/Run stores.

#### 14. Domain Harness Boundary

The domain harness should be a pure validation/enrichment seam for domain
knowledge, not a hidden runtime engine.

For coding, a harness may add or reject based on:

- repository scope;
- file/resource footprint;
- generated-file and lockfile risks;
- worktree/branch isolation advice;
- evidence required for code changes;
- Work-stage legality for supporting inline contracts.

It must not:

- choose the concrete executor/provider/model;
- spawn a process;
- mutate Work lifecycle;
- merge branches;
- create a second Assignment or Run runtime.

The existing one-function seam, `enrichAndValidateContract(contract, { domain,
work })`, is a good conservative starting point. It can grow only when a second
consumer proves a common foundation-level seam.

#### 15. Run Result Evaluator Boundary

Run Result evaluation deserves its own authority boundary instead of being
treated as a detail of dispatch or transport.

Execution adapters can prove that a process started, ended, timed out, or
returned bytes. They cannot prove semantic success. Workers can claim success,
but a claim is not proof. The Run Result Evaluator should be the component that
turns the Assignment contract, Run settlement, worker claim, artifacts, git
deltas, test outputs, hashes, timestamps, and domain evidence rules into a
RunResult confidence decision.

Its scope is deliberately narrow:

```txt
Input:
  Assignment contract
  Run settlement
  worker claim
  artifacts/evidence
  selected domain evidence policy

Output:
  RunResult
  confidence
  accepted/rejected evidence refs
  failure classification
```

It is not a general-purpose verification harness. A coding harness can provide
domain-specific evidence adapters and policy, but the evaluator owns the final
RunResult confidence decision for one Assignment Run.

This boundary matters because it lets new transports arrive without changing
truth semantics. CLI, Herdr, MCP, and API runs can all feed the same evaluator.

#### 16. Plugin And Extension Direction

The likely extension surfaces are:

1. Domain harnesses.
2. Protocol packages.
3. Executor adapters.
4. Domain evidence adapters and policies.
5. Policy providers.
6. Definition loaders.
7. Visibility adapters.

The caution is to avoid building a broad plugin SDK before real variation
exists. A better sequence is:

```txt
first: define narrow ports where two consumers already exist
then: stabilize schemas and provenance
then: expose extension packaging
finally: add marketplace or dynamic plugin loading
```

This follows the accepted rule that the foundation should not generalize from
one hypothetical consumer.

#### 17. Related Agent Coordination Contract Set

The system-wide boundary map is compatible with the Agent Coordination
documents as long as it is read at the same authority level as its header:
useful discussion guidance, not a normative contract or roadmap.

Whole-system alignment:

- The Vision says Agent Coordination is a domain-neutral foundation, Work is
  optional integration, predeclared Workflow/Protocol structure is optional,
  and every executable action still lowers to a validated semantic contract.
  The component map preserves that by keeping Work Lifecycle, Agent
  Coordination, Dispatch, Run Result Evaluation, Domain Components, and Host
  Surfaces as separate high-level responsibilities.
- ADR-001 and Work Integration make Work verbs the only delivery lifecycle
  authority. The advisory matches this by keeping status/stage/claim/return/
  human gates in Work Lifecycle and keeping coding merge/branch/technical
  approval out of generic Work semantics.
- ADR-002 and the Workflow Stage Operation contract preserve existing
  `stage.skill`/`stage.taskSpec` compatibility while adding multiple legal
  operations per stage. The advisory matches this by treating workflow
  operation selection as domain/workflow declaration plus driver
  interpretation, not Agent Coordination invention.
- ADR-003, ADR-006, Runtime Model, and the Assignment/Run/RunResult contract
  separate semantic request, concrete attempt, and normalized outcome. The
  advisory matches this by splitting Assignment Builder, Dispatch/Run Runtime,
  and Run Result Evaluator authority even when the records are documented in
  one chain.
- ADR-004 reserves `Job`; the advisory does not introduce a scheduler or use
  Job as a hidden lifecycle object.
- ADR-005 and Visibility/Herdr keep UI/process observation separate from
  evidence and lifecycle truth. The advisory matches this by placing Herdr in
  Host And Surface Layer only.
- ADR-007 makes the domain harness a pure validation/enrichment seam for
  agent-led contracts. The advisory matches this by allowing domain knowledge,
  evidence policy, and resource advice while forbidding hidden dispatch,
  lifecycle mutation, and private runtimes.
- Protocol Model says planning may be agent-led, declared, domain-assisted, or
  composed, and all paths lower into the same Assignment/dispatch/Run/RunResult
  runtime. The advisory matches this by separating Team Cognition Engine from
  protocol packages and by keeping protocol packages declarative.

CoordinationSession and FlowDefinition alignment:

- ADR-008 makes `CoordinationSession` the V1 executable/recovery root and keeps
  Assignment session-blind through one-way session-to-Assignment membership.
  This matches the advisory's split between Agent Coordination runtime state
  and the Assignment/Run/RunResult execution chain.
- ADR-009 promotes `FlowDefinition` as a shared graph/operation/policy IR with
  typed `Workflow` and `CoordinationProtocol` profiles. This matches the
  advisory's claim that protocol packages and domain workflows may share a
  kernel without collapsing Stage and Phase semantics or importing Work
  lifecycle authority into standalone coordination.
- ADR-010 keeps interactive and headless as operating modes over the same
  contracts and explicitly keeps branch, merge, Work transition, and isolation
  authority out of `src/runner/coordination/**`. This matches the advisory's
  Coding Domain Core boundary.
- The CoordinationSession contract stores session manifest/events under
  `.fgos/coordination/` and references Assignment/Run/RunResult records rather
  than duplicating them. This matches the advisory's authority split: session
  recovery is not execution truth.
- The FlowDefinition contract is additive over existing Workflow consumers.
  This matches the advisory's conservative stance: introduce shared seams only
  where unlike consumers prove the need, without forcing existing coding
  workflow paths to migrate prematurely.

The main caution for ongoing implementation is naming and placement drift:

- Do not let the new CoordinationSession ledger grow Work lifecycle fields,
  merge state, branch ownership, or technical approval state. It may reference
  domain-provided workspace/isolation context for auditability, but it cannot
  own those decisions.
- Do not let standalone protocol work borrow coding Stage vocabulary merely to
  reach dispatch. A declared `CoordinationProtocol` uses Phase semantics; an
  agent-led session may lower directly to validated execution contracts.
- Do not make a declared protocol mandatory for standalone coordination. A
  valid standalone agent-led session may have no Work, no Stage, and no
  predeclared protocol.
- Do not treat FlowDefinition policy fields as effective dispatch decisions.
  They are declared inputs; Dispatch And Execution still resolves the concrete
  executor/provider/model/mechanism under governance.
- Do not treat Run settlement or worker output as semantic truth. Run Result
  Evaluator remains the confidence boundary for one Assignment Run.
- Do not move Coding Domain responsibilities into the foundation when adding
  Work-attached mutation. Resource conflicts, worktree/branch isolation,
  merge/catch-up, verification expectations, and technical approval are the
  coding domain's authority.

The practical requirement is simple: coordination runtime, FlowDefinition,
dispatch, RunResult, Work lifecycle, and coding-domain authority stay separate
even when a single feature path exercises all of them.

#### 18. Implementation Reality: Additional Boundaries Found In Code

The source tree already exposes several high-level boundaries that are not
fully named in the component map above. They should be treated as discussion
inputs before any structural refactor. Some may become standalone foundation
components, while others should remain subcomponents inside a larger bounded
context. The goal is to name the authority clearly first, not to move files
prematurely.

Likely additional or more explicit boundaries:

1. Work State And Event Store Kernel.

   Existing code under `src/state/events.mjs`, `src/state/replay.mjs`,
   `src/state/store.mjs`, and `src/state/fgos-file-registry.mjs` acts as the
   append-only truth substrate, projection layer, lock/CAS layer, and well-known
   `.fgos/` path registry. This can stay internal to Work Lifecycle as an
   implementation boundary, but its authority should be named separately from
   Agent Coordination.

2. Domain Registry And Workflow Definition Loader.

   Existing code under `src/state/workflow-stage-graphs.mjs` plus
   `domains/*/manifest.yaml` and workflow definitions owns stage vocabulary,
   legal operations, workflow selection, skill/taskSpec mappings, and role
   graph metadata. This looks like a Domain Components And Extension Layer
   boundary, even if its physical placement is in `src/state` for
   dependency reasons.

3. Claim And Runtime Occupancy Coordination.

   Existing code under `src/runner/claim-port.mjs`,
   `src/state/runtime-coordination.mjs`, `src/state/worker-slots.mjs`, and
   `src/runner/main-checkout-lock.mjs` owns effective claim state, worker slot
   pressure, and main-checkout safety. This is not the same thing as
   `CoordinationSession`; it is runtime occupancy around Work execution.

4. Work Driver And Automation Engine.

   Existing code under `src/runner/loop.mjs`,
   `src/runner/dispatch/operation-choice.mjs`, runner recovery/anti-loop
   helpers, and the stage pool selectors decides which work is ready, which
   legal operation to attempt, when to dispatch, and when to park or halt. This
   should not be folded into Work Lifecycle truth. A cleaner boundary is:
   lifecycle owns legal state transition; driver owns automation policy that
   calls the lifecycle and dispatch surfaces.

5. Coding Repository Integration Core.

   Existing code under `src/runner/worktree.mjs`, `src/runner/merge.mjs`,
   `src/verbs/merge/approve.mjs`, `src/state/graph-harness.mjs`,
   `src/state/drift-status.mjs`, `src/state/cleanup-harness.mjs`,
   `src/runner/iron-law-gate.mjs`, and repository adapters owns worktree,
   branch, merge readiness, drift, cleanup, verification, and approval gates.
   Architecturally this should be discussed as a subcomponent of Coding Domain
   Core, not as a generic foundation component. Its location under `runner`,
   `state`, and `verbs` should not decide ownership by itself.

6. Setup, Doctor, And Distribution Health.

   Existing code under `src/setup/registrations.mjs`,
   `src/setup/checks.mjs`, `src/config/shared-config-file.mjs`, and global
   config helpers owns config defaults, doctor checks/fixes, and global/project
   config precedence. This is platform support infrastructure. It deserves an
   explicit boundary because new extension seams should be discoverable by
   setup and doctor instead of adding hidden prerequisites.

7. Gateway And External Interface Control Plane.

   Existing code under `src/runner/gateway-control.mjs` and
   `apps/fgos-gateway/src/{gateway,mcp,ports}.rs` and
   `packages/herdr-fgos-common/rust/src/fgos.rs` own process lifecycle, REST
   and MCP exposure, authentication, terminal/UI ports, and the `VerbGateway`
   chokepoint. This belongs under Host And Surface Layer, but it should be
   called out so visibility/process control does not drift into lifecycle or
   evidence authority.

8. Knowledge, Learning, And Documentation Registry.

   Existing code under `src/state/knowledge-registry.mjs`,
   `src/report/knowledge-resolver.mjs`, `src/report/knowledge-projection.mjs`,
   `src/report/item-trace.mjs`, and `src/evolve/**` owns retrospective
   knowledge, topic/doc slots, projection, trace, and learning outputs. This is
   lifecycle-adjacent and evidence-adjacent, but it is not Agent Coordination.

Naming risks found during the scan:

- `runtime-coordination.mjs` sounds close to Agent Coordination, but it is
  claim/runtime occupancy, not `CoordinationSession`.
- `session.mjs` manages git checkout sessions, not coordination sessions.
- `graph-harness.mjs` and `cleanup-harness.mjs` are not ADR-007 domain
  harnesses; they are merge/readiness and cleanup lifecycle gates.
- `operation-choice.mjs` lives under dispatch, but its responsibility is closer
  to Work Driver / Workflow Interpreter than to Dispatch Control Plane.
- `assignment-runner.mjs` and `result-ladder.mjs` carry some result
  interpretation behavior in the dispatch path. The target authority split
  remains:
  dispatch governs execution attempts; Run Result Evaluator governs confidence
  over one Assignment Run.

#### 19. Rust Replacement Candidates

If implementation quality or runtime reliability pushes some components toward
Rust, the best candidates are the ones with stable contracts and mechanical
behavior:

- FlowDefinition/schema validation;
- policy merge and monotonicity checks;
- dispatch governance and egress classification;
- session/AdhocTask DAG readiness calculation;
- run supervision, timeout, and cancellation;
- file/git evidence snapshotting;
- artifact hashing and provenance checks.

The weaker candidates for early Rust migration are the fast-changing reasoning
surfaces:

- Skill prose;
- protocol authoring ergonomics;
- domain doctrine;
- synthesis wording;
- planning heuristics still under product discovery.

#### 20. Architectural Pressure Points

These are the areas most likely to become tangled if boundaries are not named
early:

1. Dispatch plus RunResult normalization: dispatch should govern execution;
   evidence evaluation should govern confidence.
2. Assignment/Run/RunResult chain ownership: one flow should not imply one
   module owns semantic intent, execution attempt, and confidence truth.
3. Protocol graph plus runtime task state: FlowDefinition defines legal shape;
   CoordinationSession/AdhocTask records runtime progress.
4. FlowDefinition policy fields plus dispatch policy resolution: protocol
   definitions declare hints and constraints; Dispatch computes effective
   executor/provider/model/mechanism under governance.
5. Coordinator planning plus domain harness: coordinator proposes; harness
   enriches or rejects; neither dispatches.
6. Work-attached session plus Work lifecycle: session may inform the driver;
   only Work verbs mutate domain-agnostic Work lifecycle, while coding merge,
   worktree, and technical approval behavior stays in the coding domain
   extension.
7. Herdr visibility plus runtime truth: Herdr shows processes; Run/RunResult
   settle truth.
8. Cohort diversity plus dispatch: session/coordinator allocates sibling-aware
   policy inputs; dispatch remains one-Assignment-at-a-time.
9. Agent-led planning plus free-form prose: inline contracts are mandatory;
   absence of a declared protocol must not mean unbounded execution.

#### 21. Suggested Next Discussion Artifact

If this advisory is accepted as useful, the next useful document is a canonical
or near-canonical "Component, Bounded-Context, And Authority Map" for fgOS as a
whole. It should record:

- each high-level component's packaging responsibility;
- each bounded context's model and vocabulary;
- each authority boundary's source of truth and writer;
- state it owns;
- ports it exposes;
- adapters it permits;
- forbidden dependencies;
- whether it belongs to foundation, domain, integration, visibility, or plugin
  layer;
- which seams are active boundaries and which are preserved extension points.

That document should not be a roadmap. It should be an ownership map that lets
implementation slices stay small without losing the architecture, while
also preventing a convenient module boundary from silently becoming authority
over state it does not own.

## Added in candidate: README source carriage

Carriage from `docs/architect/component-boundary/README.md` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; pending independent conservation review. Full source text follows, with heading levels and physical link destinations adjusted only. Source metadata is provenance; this section makes no new implementation or authority claim.

### Component Boundary Architecture

This folder collects vision-level architecture notes about how fgOS should name,
separate, and eventually place its high-level components across the whole
system.

These documents are not implementation plans. They are refactoring compass
documents: use them to keep slices moving toward clearer boundaries without
forcing a large rebuild.

The scope is all of forgentX: Work Lifecycle, domain components,
dispatch/execution, result evaluation, host surfaces, setup/doctor/distribution,
gateway/Herdr, learning, and runtime implementation boundaries.

For the domain-specific split itself, read
[Domainization Architecture](domainization/architecture/domainization.md). This folder keeps the
whole-system component map; domainization is the deep dive for the Domain
Components And Extension Layer.

#### 1. How To Read This Folder

Read boundary before layout:

1. [Component Boundary Advisory](component-boundary.md)
2. [Repo Layout Vision](component-boundary.md)
3. [Host Invocation And Provider Routing](host-invocation-routing/README.md)
4. [Node To Rust Component Migration](host-invocation-routing/README.md)
5. [Packaging And Distribution Architecture](packaging-distribution/README.md)

The first document answers:

```txt
What components exist?
What responsibility does each component own?
Where are the bounded contexts?
Which component has authority over each state transition or decision?
Which behavior must stay domain-specific instead of moving into foundation?
```

The second document answers:

```txt
Where should those components live physically in the repo?
Which code should be a thin app entrypoint?
Which code should become a reusable package?
Which source paths are placement, not architectural ownership?
```

The third document answers:

```txt
How do CLI and remote host use cases enter the same semantic operation path?
How does one router select built-in, legacy, process-plugin, or WASM providers?
Where do provider discovery, capability grants, and failure normalization live?
```

The fourth document answers:

```txt
How can one component at a time move from Node to Rust?
Which parts of fgos are already thin, partly thin, or not thin yet?
How does fgos keep the same CLI and envelope while implementation changes?
How does the Rust host delegate whole operations to the legacy Node provider?
When does implementation movement become authority movement?
```

The fifth document answers:

```txt
How is the project-local fgOS runtime payload selected, installed, verified,
repaired, and upgraded?
Where is the boundary between global bootstrap, shared web/gateway, project
runtime adapter, and local project fgOS semantics?
How do skills, agents, prose, runner, legacy Node payload, Rust host, and docs
fit into one distributable payload identity?
```

Do not invert that order. Folder layout should express component boundaries; it
should not create authority by convenience of file location.

#### 2. Documents

##### Component Boundary Advisory

[component-boundary-advisory.md](component-boundary.md) is the
vision document for component responsibility, bounded context, and authority
boundary.

It asks whether fgOS is split at the right conceptual boundaries: Work
Lifecycle, Agent Coordination, Dispatch And Execution, Run Result Evaluation,
Domain Components, Host Surfaces, setup/doctor/distribution, gateway/Herdr,
learning, and the additional boundaries already visible in code.

Use this document when deciding:

- whether a behavior belongs in foundation or a domain;
- whether Coding Domain is owning enough of its coding-specific behavior;
- whether Work Lifecycle remains domain-agnostic;
- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses
  are overlapping;
- whether a refactor is clarifying an authority boundary or merely moving
  files.

For folder-level domain authoring shape, domain manifest/workflow files,
domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
domain-siloing enforcement, use
[Domainization Architecture](domainization/architecture/domainization.md).

##### Repo Layout Vision

[repo-layout-vision.md](component-boundary.md) is the vision document for
physical source layout.

It describes the `apps/` plus `packages/` direction: apps are thin entrypoints
and packages hold reusable implementation logic. Its concrete scope is the
Rust/web split of the former `herdr-plugin/` package (now `apps/fgos-gateway/`, `herdr-dashboard/` and `packages/herdr-fgos-common/rust/`; see its status note). The Node side is outside this document.

Use this document when deciding:

- where a component should live once its boundary is agreed;
- whether a binary should be a thin app or a logic-owning package;
- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be
  separated physically;
- what mechanical blast radius a layout refactor is likely to touch.

##### Host Invocation And Provider Routing

[host-invocation-provider-routing.md](host-invocation-routing/README.md)
defines the shared host invocation path and the Operation Provider Router.

Use this document when deciding:

- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;
- where CLI/REST/MCP input becomes a transport-neutral semantic operation;
- how one operation selects a built-in, legacy, process, or WASM provider;
- how external plugins declare operations and requested capabilities;
- which layer owns authority checks, provider lifecycle, and error projection.

##### Node To Rust Component Migration

[node-to-rust-component-migration.md](host-invocation-routing/README.md)
records the migration shape for replacing Node harness internals with
Rust components one boundary at a time while preserving the existing `fgos`
surface.

Use this document when deciding:

- how the Rust CLI delegates unmigrated operations to the legacy Node provider;
- which `fgos` verb clusters are ready to become native Rust providers;
- how to avoid double parsing and split transactions during migration;
- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a
  gradual migration;
- when a Node implementation and rollback path can be removed.

#### 3. Relationship Between These Documents

`component-boundary-advisory.md` defines the conceptual map.
`repo-layout-vision.md` defines a possible physical map.
`host-invocation-provider-routing.md` defines the host/provider invocation map.
`node-to-rust-component-migration.md` defines an implementation migration map
from the legacy Node provider to built-in Rust providers.
`packaging-distribution/README.md` defines the emerging install/runtime
authority map that keeps global machine services separate from project-local
fgOS semantic authority.

They are related but not interchangeable:

- a component boundary can exist before files move;
- source placement can reflect old implementation choices instead of ownership;
- some discovered boundaries may become subcomponents instead of top-level
  packages;
- coding-specific repository integration should be discussed as a subcomponent
  of Coding Domain Core, not as a generic foundation package;
- runtime-language migration should happen behind component contracts, not by
  treating a Node file or Rust crate as authority;
- shared web/gateway can aggregate many projects, but must delegate mutating
  project semantics through the selected project's local runtime adapter and
  payload;
- global bootstrap/control and project workflow authority are different
  components: `fgctl` installs/manages; local `fgos` drives workspace
  semantics;
- layout refactors should happen only after the component authority is clear.

#### 4. Current Status

This folder is advisory. It can guide repo-layout cleanup, component
extraction, and authority-boundary review across fgOS, but canonical contracts
still live under their owning architecture, contract, spec, or ADR documents.

When a decision becomes settled, extract the stable fact into the appropriate
canonical document instead of treating this folder as the source of truth.

#### 5. External Review Links

Use these outside documents as review material while shaping component
boundaries. They are not part of this folder's source-of-truth chain unless a
settled decision is later extracted into the owning canonical document.

##### Canonical Architecture And Specs

- [Architecture Map](architecture-map.md) — structure/physics/authority
  map, component registry, and contract registry.
- [System Overview](system-overview/spec.md) — area map, shared
  entities, actors, and cross-area flows.
- [Platform Foundations](platform-foundations.md) — locked platform laws
  and durability/DoD doctrine.
- [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md) — base
  workflow and coding-specific lifecycle mapping.
- [Distribution Vision](../distribution-vision.md) — install/setup/doctor
  direction and config/default registration posture.
- [Domainization Architecture](domainization/architecture/domainization.md) — core vs domain
  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
  agent boundaries.

##### Related Agent Coordination Contracts

- [Agent Coordination Portal](agent-coordination/README.md) — reading entry
  for the Agent Coordination architecture set.
- [Agent Coordination Foundation Vision](agent-coordination/README.md) —
  foundation/domain split, runtime contracts, and small-core constraints.
- [System Context](agent-coordination/README.md) —
  boundaries, runtime profiles, and trust boundaries.
- [Runtime Model](agent-coordination/README.md) —
  assignment execution chain, invariants, and failure domains.
- [Dispatch Control Plane](agent-coordination/README.md)
  — executor/provider/model/tier/mechanism governance boundary.
- [Evidence And Results](agent-coordination/README.md)
  — RunResult confidence and evidence boundary.
- [Work Integration](agent-coordination/README.md) —
  Work lifecycle integration boundary.

## Added in candidate: repo-layout-vision source carriage

Carriage from `docs/architect/component-boundary/repo-layout-vision.md` at `69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539`; pending independent conservation review. Full source text follows, with heading levels and physical link destinations adjusted only. Source metadata is provenance; this section makes no new implementation or authority claim.

### Repo Layout Vision: Apps And Packages

**Status:** Vision / direction, not a locked platform law and not a full spec.
**Date:** 2026-08-26.
**Source:** Product-owner direction.

This document records a physical repo-layout direction for separating thin
entrypoints from reusable implementation packages. It does not change runtime
behavior by itself.

The locked target in this document is the Rust/web slice around
`herdr-plugin/`. The Node side is intentionally left for a later discussion.

#### Implementation Status (2026-10-04)

A smaller slice of this vision is implemented. It is a pure move and rename,
with no change to behavior:

- the gateway is `apps/fgos-gateway/` (crate and binary `fgos-gateway`, no
  `gateway` argument); it keeps `gateway.rs`, `mcp.rs`, `cf_access.rs`,
  `remote_invocation.rs`, `web/` and the embedded `static/` together instead of
  the `packages/gateway`, `packages/mcp` and `packages/web-dashboard` split;
- the herdr plugin stays one crate at `herdr-dashboard/` (renamed from
  `herdr-plugin/`; binary `herdr-dashboard`, manifest `herdr-plugin.toml`)
  instead of `apps/herdr-tui` plus `packages/herdr-core` and
  `packages/herdr-ui`;
- the shared fgos CLI adapter, settings and `WorkItemSource` port are
  `packages/herdr-fgos-common/rust/`, standing in for `packages/fgos-ports`;
  the gateway's `VerbGateway` port moved next to its only users in the gateway
  crate;
- both Rust crates stay outside the root Cargo workspace with their own lock
  file and `target/`, because herdr loads the plugin binary from
  `$HERDR_PLUGIN_ROOT/target/release/`.

The finer `packages/*` split below remains the long-term direction and is not
yet done.

#### 1. Decision Summary

Move the current single `herdr-plugin/` package shape toward:

```txt
apps/       thin binaries and entrypoints
packages/   reusable implementation libraries
```

For the Rust/web slice:

- split the current `herdr-fgos` binary into two binaries with names that match
  their default behavior: `apps/gateway` and `apps/herdr-tui`;
- move real gateway, MCP, cockpit, UI, fgos-port, and web-dashboard logic into
  `packages/*`;
- keep the web dashboard served by the gateway from an embedded static bundle;
- keep `apps/*` thin: each app wires packages together and starts one runtime.

#### 2. Current Problem

`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:

- no argument: TUI mode;
- `gateway` argument: daemon REST/MCP/web mode.

The current launch path confirms the mismatch:

```txt
src/runner/gateway-control.mjs:295
spawn(binaryPath, ['gateway'])
```

The binary name does not describe its default behavior, and gateway mode is a
separate launch path hidden behind an argument.

The code already has a cleaner hexagonal boundary than the folder layout shows:

- `ports.rs` defines the important ports: `WorkItemSource`, `PaneRegistry`,
  `PaneOrchestrator`, `VerbGateway`, and `TerminalUi`;
- `gateway.rs` and `mcp.rs` depend on `VerbGateway`, not on TUI internals;
- gateway logic is already separate from `app.rs`, `ui.rs`, `layout.rs`,
  `pane_scan.rs`, and `pick.rs`;
- the gateway already hosts static web assets through `rust_embed`.

The layout should make those existing boundaries visible.

#### 3. Target Layout

Scope of this target tree: Rust plus web only. Node packages are not decided in
this document.

```txt
forgentX/
  Cargo.toml
    # workspace members:
    # - apps/gateway
    # - apps/herdr-tui
    # - packages/gateway
    # - packages/mcp
    # - packages/herdr-core
    # - packages/herdr-ui
    # - packages/fgos-ports

  apps/
    gateway/
      Cargo.toml
      build.rs
      src/main.rs
      static/

    herdr-tui/
      Cargo.toml
      src/main.rs

  packages/
    gateway/
    mcp/
    herdr-core/
    herdr-ui/
    fgos-ports/
    web-dashboard/
```

#### 4. App Boundaries

`apps/gateway` is a thin binary:

- wires `packages/gateway` and `packages/mcp`;
- starts the Axum server;
- serves embedded static files from `static/`;
- runs as gateway by default, without a `gateway` argument.

`apps/herdr-tui` is a thin binary:

- wires `packages/herdr-core` and `packages/herdr-ui`;
- starts the terminal dashboard loop;
- runs as TUI by default.

App packages should not own reusable domain logic. They assemble ports,
adapters, config, and runtime startup.

#### 5. Package Boundaries

`packages/gateway`

- owns REST route handlers and gateway-specific middleware;
- includes `cf_access.rs` for now;
- mounts web serving behavior but does not own the web-dashboard source.

`packages/mcp`

- owns the MCP surface;
- is mounted by `apps/gateway` into the same Axum process;
- keeps the current "same process" contract.

`packages/herdr-core`

- owns cockpit application state and operation-pane logic;
- includes `app.rs`, `layout.rs`, `pane_scan.rs`, and `pick.rs`;
- keeps pane scanning and pick logic together unless a clearer split emerges.

`packages/herdr-ui`

- owns terminal rendering;
- keeps crossterm/TUI drawing separate from cockpit domain state.

`packages/fgos-ports`

- owns shared ports and the fgos CLI adapter;
- includes `ports.rs`, `fgos.rs`, and shared settings;
- is the place where gateway and TUI agree on their boundary to fgOS.

`packages/web-dashboard`

- owns the Vite/TypeScript/React/Tailwind dashboard source;
- is not a Cargo crate;
- builds into `apps/gateway/static` for embedding and serving.

#### 6. Execution Blast Radius

The following edits would be mechanical when this vision is implemented:

- `src/runner/gateway-control.mjs:240`: update the compiled binary path to the
  new `apps/gateway` binary;
- `src/runner/gateway-control.mjs:273`: change the release build command from
  `cargo build --release --bin herdr-fgos` to the new gateway package target;
- `src/runner/gateway-control.mjs:295`: remove the extra `gateway` argument
  from the spawned process;
- `herdr-plugin/web/package.json`: change the bundle output from `../static`
  to `../../apps/gateway/static`;
- `herdr-plugin.toml`: update any binary or package path assumptions;
- docs, tests, CI, and setup references to `herdr-plugin/`: update paths where
  they describe the physical layout;
- upstream Herdr plugin integration: update any path that loads the TUI binary.

This list describes known blast radius, not a complete implementation plan.

#### 7. Out Of Scope For This Document

The Node side is deliberately not designed here:

- `packages/core`;
- `packages/config`;
- `packages/state`;
- `packages/shared`;
- `packages/orchestrator`;
- the thin-entry location for Node CLI/orchestrator binaries.

`packages/orchestrator` is reserved vocabulary. It must continue to match the
existing fgOS meaning: the T0 composition layer around dispatch/runner. It must
not be confused with the unrelated Rust setting name `herdr_orchestrator`.

#### 8. Open Questions

- Should Node thin entries stay under root `bin/`, or move under an `apps/cli`
  shape when the Node side is designed?
- Should `cf_access.rs` remain inside `packages/gateway`, or become a separate
  `packages/cf-access` package if another consumer appears?
- Should `pane_scan.rs` and `pick.rs` remain inside `packages/herdr-core`, or
  split later if cockpit-core becomes too broad?
