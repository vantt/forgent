# Component Authority Boundary Map

Document type: Proposal artifact
Design status: Draft / architect-level discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing until promoted or replaced by an accepted boundary document
Related: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md), [Agent Coordination Vision](../agent-coordination/vision.md), [Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md), [Architecture Intent](../architecture-intent.md), [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md), [Repo Layout Vision](../component-boundary/repo-layout-vision.md), [Node To Rust Component Migration](../component-boundary/node-to-rust-component-migration.md)

## 1. Status And Reading Rule

This is an architect-level boundary draft, not a child of Step 09 or Step 10.
It is not accepted architecture, not a roadmap, and not permission to move
files. It names likely ownership so group-thinking substrate work and later
coding-domain adoption can place primitives under the right authority before
any implementation or physical layout move starts.

Read this draft under the accepted constraints:

- Work is optional integration, not Agent Coordination identity.
- Work Lifecycle remains the only authority for Work status, stage, claim,
  return, approval gates, and lifecycle verbs.
- CoordinationSession is a bounded execution/recovery ledger. It records
  `workRef`, actor/topology/bounds, and Assignment membership; it does not
  resolve Work, Stage, operation, branch, merge, or lifecycle authority.
- Dispatch is the only execution control plane. In-process execution is a
  Dispatch/Run Runtime mechanism, not a CoordinationSession feature.
- RunResult confidence is derived from evidence policy and accepted evidence,
  not worker self-report, terminal output, or session synthesis.
- Coding Domain consumes platform engines. It does not migrate into Agent
  Coordination.

## 2. Organizing Formula

The earlier draft blurred layer, category, hierarchy, authority, and dependency.
This artifact is organized around four rules:

```txt
Parent-child = responsibility grouping + runtime coupling + placement hint.
Authority = exactly one component.
Dependency = explicit contract direction, never inferred from nesting.
Sibling collaboration = through ports/events, not private calls.
```

Consequences:

- A parent groups related responsibility concepts that coordinate tightly at
  runtime.
- A parent-child tree helps package placement and reader navigation.
- Authority does not flow upward to the parent.
- Siblings do not call private internals just because they share a parent.
- Allowed dependencies must be named in a contract matrix or port.

## 3. Vocabulary

| Term | Meaning in this draft |
|---|---|
| Component | A practical packaging and replacement unit, eventually suitable for `packages/*` or a service/binary facade. |
| Bounded context | A model and vocabulary with one reason to change. It may live inside a larger component. |
| Authority boundary | The source of truth for a decision or write. Every authority belongs to exactly one component. |
| Platform layer | The fgOS product layer that hosts reusable engines, platform support, domain components, host surfaces, and extensions. |
| Component category | The kind of component: foundation engine, integration engine, support infrastructure, domain component, adapter/surface, or extension package. |
| Foundation engine | A platform-core engine with domain-neutral runtime authority and reusable contracts. This is a component category, not a separate layer above platform core. |
| Platform support | Cross-cutting infrastructure such as setup/doctor, event substrate, distribution health, and learning registries. |
| Definition registry / config loader | A platform-core registry that loads runtime definitions such as domains, workflows, stage operations, TaskSpecs, Skills, roles, and FlowDefinition projections. It is "general" across domains, but it is not the same authority as setup/distribution config. |
| Domain core | Behavior whose model depends on a domain's semantics. For coding, that means repository, code-change, worktree, branch, merge, technical approval, and verification doctrine. |

Physical placement must follow authority; it does not define authority. A file
under `src/runner` or `src/state` may belong to a domain or platform component.
Moving it later does not make the authority true unless this map or its
accepted boundary successor says so.

## 4. Two Classification Axes

This draft separates platform layer from component category:

```txt
Platform layer:
  platform-core | platform-support | domain | host-surface | plugin/extension

Component category:
  foundation-engine | integration-engine | support-infrastructure |
  domain-component | adapter/surface | extension-package
```

| Component | Platform layer | Component category |
|---|---|---|
| Agent Coordination Engine | Platform core | Foundation engine |
| Dispatch And Execution Engine | Platform core | Foundation engine |
| Run Result Evaluator | Platform core | Foundation engine |
| Work Lifecycle Engine | Platform core | Foundation engine |
| Work Driver / Domain Workflow Interpreter | Platform core | Integration engine |
| Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary |
| Setup, Doctor, And Distribution Health | Platform support | Support infrastructure |
| Coding Domain Component | Domain | Domain component |
| Host And Surface Layer | Host surface | Adapter/surface |

Boundary rule:

```txt
Do not label a component "foundation" when the intended meaning is merely
"not coding-specific." First decide whether it has runtime authority and a
reusable contract. If not, call it platform support, host surface, or domain.
```

## 5. Parent-Child Responsibility Map

Some accepted Agent Coordination docs discuss dispatch governance, Run
provenance, normalized results, and evidence quality in the same architecture
area. This draft treats **Agent Coordination** as the umbrella responsibility
group for those tightly coupled runtime concerns. It does not mean every one of
those authorities is an internal submodule of the narrower Agent Coordination
Engine.

Draft hierarchy:

```txt
Platform Core
  Agent Coordination
    Agent Coordination Engine
      CoordinationSession Runtime
      Team Cognition Engine
      Assignment Builder
    Dispatch And Execution Engine
      Dispatch Control Plane
      Run Runtime
      Execution Adapters
    Run Result Evaluator
      Evidence Collectors
      Artifact Store/Refs
      Confidence Evaluator

  Work Core
    Work Lifecycle Engine
    Work Driver / Domain Workflow Interpreter
    Runtime Occupancy Support

  Domain Registry And Definition Loader

Platform Support
  Setup, Doctor, And Distribution Health
  Learning, Knowledge, And Documentation Registry

Host Surface
  CLI
  Runner
  Gateway
  Herdr
  Plugin/API adapters

Domain Layer
  Coding Domain Component
    Coding Domain Core
    Product/Design Flow (name open)
    Cook Workflow
    Bugfix Workflow
    Small-Change Policy/Path (open)
```

Reading the tree:

- `Agent Coordination` is an umbrella responsibility group.
- `Agent Coordination Engine`, `Dispatch And Execution Engine`, and `Run Result
  Evaluator` are sibling authority components under that umbrella.
- `Work Core` is a separate platform-core group because Work lifecycle and
  Work/domain driving can exist without CoordinationSession. Work Driver is a
  child responsibility under Work Core.
- `Coding Domain Component` is a domain component that consumes both platform
  groups and supplies coding-specific declarations, policies, and adapters.

## 6. Authority Ownership

| Component | Owns | Must not own |
|---|---|---|
| Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context refs, document refs, questions, human gates, lifecycle verbs, domain-agnostic Work event truth. | Agent runtime, Assignment membership, executor choice, evidence confidence, coding merge/worktree/technical approval. |
| Work Driver / Domain Workflow Interpreter | Ready-work selection, automation loop policy, declared Stage Operation choice, cross-flow routing, park/halt behavior, recovery/anti-loop around Work execution, invoking lifecycle verbs and dispatch surfaces. | Domain workflow semantics, lifecycle writes outside Work Lifecycle verbs, dispatch target choice, RunResult confidence, coding repository isolation, CoordinationSession progress. |
| Agent Coordination Engine | CoordinationSession manifest/events, Assignment membership, actor/topology/bounds, session recovery, session synthesis boundary, Team Cognition invocation, optional protocol/dynamic planning consumption. | Work stage/status/claim/return, declared Work operation selection, dispatch mechanism, provider/model choice, coding worktree/merge authority. |
| Dispatch And Execution Engine | Assignment-to-DispatchPlan resolution, executor/provider/model/tier/mechanism/adapter selection, governance/egress, Run creation, launch, timeout, cancellation, retry attempt metadata, in-process Run mechanism. | Semantic operation choice, Work lifecycle, evidence confidence, coding merge/approval. |
| Run Result Evaluator | Worker result parsing, evidence collection coordination, artifact freshness/provenance checks, confidence decision, RunResult normalization, failure classification for one Assignment Run. | Executor launch, provider choice, Work lifecycle, session completion policy, domain-specific evidence collection ownership. |
| Domain Registry And Definition Loader | General runtime definition registry and config loader for domains, workflows, workflow/stage/operation declarations, task-spec/skill references, roles, and FlowDefinition validation/projection. | Runtime session state, dispatch target choice, Work lifecycle writes, evidence confidence, setup/distribution config authority. |
| Coding Domain Component | Coding Domain Core plus product/design, cook, bugfix, and possible small-change policies; repo scope, footprint, worktree/branch/isolation, merge/catchup, technical approval, code verification doctrine, coding evidence adapters. | Generic Work lifecycle, generic Agent Coordination runtime, direct executor launch, final confidence outside Run Result Evaluator. |
| Setup, Doctor, And Distribution Health | Config defaults, config merge, global/project precedence, doctor checks/fixes registry, install/upgrade/distribution health, required binaries/services/directories. | Domain behavior, lifecycle mutation, dispatch or evidence truth. |
| Host And Surface Layer | CLI/API/plugin/gateway/Herdr/webhook/chat entrypoints, auth, envelopes, visibility, process control, operator diagnostics. | Work truth, CoordinationSession truth, dispatch governance, evidence confidence. |
| Learning, Knowledge, And Documentation Registry | Retrospective knowledge capture, doc slot/topic registry, projections, traces, end-user docs index, learning outputs. | Work lifecycle, Agent Coordination runtime, RunResult confidence. |

## 7. Contract Dependency Matrix

| Relation | Allowed dependency | Forbidden dependency |
|---|---|---|
| Agent Coordination Engine -> Dispatch And Execution Engine | May call Dispatch through Assignment/DispatchPlan contracts. | Must not choose executor/provider/model directly or bypass dispatch. |
| Agent Coordination Engine -> Run Result Evaluator | May consume RunResult/evidence refs. | Must not compute confidence or upgrade evidence in synthesis. |
| Work Driver -> Work Lifecycle Engine | May read Work view and invoke lifecycle verbs. | Must not write Work event truth directly or create a second lifecycle path. |
| Work Driver -> Domain Registry And Definition Loader | May load legal workflow/stage/operation declarations and cross-flow rules. | Must not invent undeclared domain operations. |
| Work Driver -> Agent Coordination | May open Work-attached sessions and dispatch Assignments through Agent Coordination contracts. | Must not make Agent Coordination own Work lifecycle or domain workflow routing. |
| Domain Component -> Work Driver / Agent Coordination | May supply workflow declarations, TaskSpecs, Skills, policies, harness advice, evidence adapters, and resource/isolation constraints. | Must not call executors privately or mutate Work outside lifecycle verbs. |
| Host Surface -> platform engines | May route commands/API calls into component ports. | Must not become source of truth for lifecycle, dispatch governance, or evidence. |
| Sibling components under one parent | May collaborate through declared ports/events and shared immutable references. | Must not reach into each other's private state or rely on physical nesting as API. |

Placement rule:

```txt
Put children near their parent when they share release/runtime contracts.
Split children into separate packages when their authority, tests, or Rust
replacement path needs independent ownership.
Never use physical nesting as proof that the parent may rewrite child truth.
```

## 8. Advisory Section 18 Cluster Classification

| Cluster | Draft owner | Platform layer | Component category | Why |
|---|---|---|---|---|
| F1 / Work State And Event Store Kernel | Work Lifecycle Engine, with reusable store utilities only behind explicit ports | Platform core | Foundation substrate | Append-only events, replay, locks, CAS, and `.fgos` path registry are truth substrate. Coding consumes them but does not own them. |
| F2 / Domain Registry And Workflow Definition Loader | Domain Registry And Definition Loader | Platform core | Definition registry / extension boundary | Stage vocabulary, legal operations, workflow selection, task-spec/skill mappings, and role metadata are domain declarations consumed by Work Driver and Agent Coordination. This is a general runtime-definition loader, not setup/distribution config. |
| F3 / Claim And Runtime Occupancy Coordination | Work Driver / Runtime Occupancy Support | Platform core | Integration support | Effective claim state, worker-slot pressure, and main-checkout safety are about running Work safely. Coding is the first heavy user, but other Work-backed domains can need occupancy. |
| F4 / Work Driver And Automation Engine | Work Driver / Domain Workflow Interpreter | Platform core | Integration engine | It chooses ready Work and legal declared operations, then calls lifecycle/dispatch surfaces. It is a shared Work-backed-domain engine, not a Coding Domain component. |
| F5 / Coding Repository Integration Core | Coding Domain Component / Coding Domain Core | Domain | Domain core | Worktree, branch, merge, drift, cleanup, verification gates, and technical approval depend on repository/code-change semantics. Marketing or operations Work must not inherit them. |
| F6 / Setup, Doctor, And Distribution Health | Setup, Doctor, And Distribution Health | Platform support | Support infrastructure | New domains, protocols, executors, binaries, services, config defaults, and directories must be discoverable through setup/doctor instead of hidden prerequisites. |
| F7 / Gateway And External Interface Control Plane | Host And Surface Layer | Host surface | Adapter/surface | Gateway, REST, MCP, Herdr, auth, terminal ports, and VerbGateway expose/control surfaces. They are visibility and integration, not lifecycle/evidence truth. |
| F8 / Knowledge, Learning, And Documentation Registry | Learning, Knowledge, And Documentation Registry | Platform support | Support infrastructure | Coding currently generates much of the learning, but the registry/index/projection model is cross-domain retrospective infrastructure. |

Naming risks that remain active:

- `runtime-coordination.mjs` means claim/runtime occupancy, not
  CoordinationSession.
- `session.mjs` means git checkout session, not CoordinationSession.
- `graph-harness.mjs` and `cleanup-harness.mjs` are coding readiness/cleanup
  gates, not ADR-007 generic domain harnesses.
- `operation-choice.mjs` is currently under dispatch, but its authority is
  closer to Work Driver / Domain Workflow Interpreter.
- `assignment-runner.mjs` and `result-ladder.mjs` may keep implementation
  plumbing near dispatch for now, but target authority remains split between
  Dispatch/Run Runtime and Run Result Evaluator.

## 9. Coding Domain Responsibility Map

Coding Domain Component is large enough to contain its own subcomponents:

| Subcomponent | Owns | Consumes |
|---|---|---|
| Coding Domain Core | Repository scope, allowed footprint, resource conflict model, worktree/branch/isolation policy, merge/catchup, technical approval, verification doctrine, coding evidence adapters. | Work Lifecycle for Work state; Agent Coordination for sessions/Assignments; Dispatch/Run Runtime for execution; Run Result Evaluator for final confidence. |
| Coding Product/Design Flow, name open | Requirement discovery, product requirement detail, architecture/design decision, implementation shape, high-level implementation sequence, decision capture, feasibility proof, and handoff package for implementation. This is an escalation flow for heavy or ambiguous items. | Coding Domain Core for repo constraints and feasibility; Work Driver for operation choice; Agent Coordination for consult/review/research sessions. |
| Coding Cook Workflow | Implementation from a sufficiently detailed item: detailed execution planning, concrete task split, execution acceleration/stability, verify, review, fix red findings, prepare approval/merge evidence. This is the candidate rename/replacement for today's implementation half of `feature`. | Coding Domain Core for repo mechanics; Work Driver for operation choice; Agent Coordination for collaboration operations; Run Result Evaluator for confidence. |
| Coding Bugfix Workflow | Reproduce/diagnose/fix/verify/review doctrine, bugfix stages/operations, bugfix TaskSpecs and Skills. | Coding Domain Core and the same platform engines. |
| Coding Small-Change Policy/Path, open | A possible fast path for small coding work where the domain contract can prove enough detail and evidence without a full upstream product/design flow. It is not yet clear whether this should be a workflow, a cook mode, or only a routing policy. | Coding Domain Core and the same platform engines. |

Draft flow relationship:

```txt
Coding Product/Design Flow (name open)
  -> detailed requirement/design/architecture/shape artifact
  -> high-level implementation sequence
  -> implementation-ready Work item or handoff package
  -> Coding Cook Workflow
       -> detailed execution plan
       -> concrete child/task split where useful
       -> implementation / verify / review
```

Planning vocabulary split:

| Planning meaning | Belongs to | Human posture | Output |
|---|---|---|---|
| Product/design planning | Product/Design Flow, name open | Human-adjacent when product or architecture decisions are material; machine should research and propose first, then ask only for real decisions. | Requirements, architecture/design decision, implementation shape, high-level sequence, accepted constraints, readiness verdict for `cook`. |
| Execution planning | Cook Workflow | Machine-owned by default; no human gate unless the item is missing a product/design decision or crosses an explicit approval/risk threshold. | Detailed task split, order of work, verification plan, resource/footprint plan, dispatch-ready units. |

The boundary is not "planning vs implementation." It is "decision-shaping
planning" versus "execution planning." The first reduces ambiguity and locks
the work's shape. The second increases speed and stability once the shape is
already good enough.

Cross-flow routing belongs to the domain workflow layer:

- default route for a sufficiently detailed coding item is `cook`;
- under-specified, heavy, or architecture-sensitive feature enters the
  upstream product/design flow;
- upstream product/design output routes into `cook`;
- a `cook` item that discovers missing product/design decisions routes back to
  the upstream product/design flow or parks with a named question;
- detailed decomposition inside `cook` is an execution optimization, not a
  human gate.

Candidate names for the upstream flow:

| Candidate name | Fit |
|---|---|
| `shape` | Short and close to current doctrine; may be too narrow if it must include product requirements and coding design. |
| `design` | Clear for technical design, weaker for product requirement discussion. |
| `define` | Emphasizes deciding what the work is before cooking it; less tied to code. |
| `spec` | Emphasizes requirement/design artifact output; risks confusion with `docs/specs/` accepted state layer. |
| `forge` | Product-flavored, but less mechanically obvious than `shape` or `define`. |

No name is accepted yet. `define` remains the best current candidate, but it
does not fully satisfy the desired nuance. Reserve `shape` for the final
operation inside the upstream flow that prepares the handoff to `cook`.

Simple item rule:

```txt
Route directly to cook when requirement, acceptance, verify, and footprint are
already sufficient. Route to the upstream product/design flow only when a
readiness check finds material requirement ambiguity, architecture/design
choices, cross-component sequencing, or unresolved product decisions.
```

The small-change path is still open. It should not be named as a real workflow
until an accepted coding-domain design decides whether "small" means a separate workflow, a mode inside
`cook`, or only a routing policy that skips the upstream product/design flow.

The test for whether a concern belongs in Coding Domain Core:

```txt
If removing Git, branches, worktrees, code deltas, build/test verification, or
technical code approval would make the model meaningless, it is coding-domain.
Otherwise classify it by its generic authority first.
```

## 10. Driver, Router, And Coordination Relationship

Agent Coordination may have its own session driver/router/launcher vocabulary,
but that does not replace the Work Driver / Domain Workflow Interpreter:

| Driver concern | Owner | Meaning |
|---|---|---|
| Coordination session driving | Agent Coordination Engine | Drive one CoordinationSession: materialize session tasks/Assignments, enforce topology/bounds/recovery, synthesize results. |
| Work/domain workflow driving | Work Driver / Domain Workflow Interpreter | Drive one Work item through domain workflow operations: inspect Work status/stage, select a legal declared Stage Operation, call Agent Coordination or Dispatch, then invoke Work Lifecycle verbs when evidence permits. |

`Router` is not one global component. It is a responsibility scoped by what is
being routed:

| Router scope | Likely owner | Routes |
|---|---|---|
| Surface routing | Host And Surface Layer | CLI/API/plugin request to the correct platform component/verb. |
| Work/domain routing | Work Driver / Domain Workflow Interpreter, using Domain Registry | Work item to domain, workflow, stage operation, or cross-flow route such as upstream product/design flow -> `cook`. |
| Coordination routing | Agent Coordination Engine | Session-local phase/task/actor/topology routing inside one CoordinationSession. |
| Dispatch routing | Dispatch And Execution Engine | One Assignment to executor/provider/model/tier/mechanism under governance. |

These routers may call each other through contracts, but they must not collapse
into one authority. For example, Work/domain routing may decide that a Work
item needs a `validate-plan` reviewer session; Agent Coordination then routes
session tasks and actors; Dispatch routes each Assignment to execution
infrastructure.

Why not move Work Driver into Agent Coordination?

| Reason | Boundary |
|---|---|
| Work Driver requires Work lifecycle authority adjacency. | It reads Work status/stage/claims and invokes Work Lifecycle verbs. Agent Coordination must remain Work-optional and cannot depend on Work to exist. |
| Domain workflows are not coordination protocols. | Coding product/design -> `cook`, marketing content review, and operations runbooks are Work-domain flow semantics. Agent Coordination can execute coordinated actions inside them, but should not own their lifecycle graph. |
| Cross-flow routing can exist without multi-agent coordination. | A simple item may route directly to `cook` and run one Assignment or no session. Putting this in Agent Coordination would make coordination look mandatory. |
| Non-Work coordination must stay clean. | Standalone brainstorm/research sessions should not carry Work status/stage/domain workflow baggage. |
| Other domains should reuse the driver without inheriting coding. | Marketing can plug its workflow config into the same Work/domain driver, while Agent Coordination remains the shared session/Assignment engine. |

Composition:

```txt
Work Driver / Domain Workflow Interpreter
  -> uses Agent Coordination as a coordination engine when a Work operation
     needs session/actor/topology/Assignment machinery

Agent Coordination
  -> does not own Work-domain flow selection or Work lifecycle progression
```

What Work Driver uses from Agent Coordination:

| Agent Coordination capability | How Work Driver uses it |
|---|---|
| CoordinationSession ledger | Opens a Work-attached session with `workRef` so collaboration has recovery, actor/topology/bounds, and one-way Assignment membership. |
| FlowDefinition / protocol parser | Consumes declared protocol or workflow projection shape when selected. The parser validates graph/roles/operations/policy shape; it does not choose Work's next lifecycle action. |
| Assignment Builder | Freezes the Work Driver's selected declared operation, or a validated inline contract, into immutable Assignment intent. |
| Team cognition / coordinator runtime | Plans session-local consult/research/review/debate steps inside bounds when a Work operation needs multiple actors or adaptive collaboration. |
| Dispatch/Run Runtime bridge | Ensures every executable Assignment goes through governed dispatch and gets a Run. |
| Session synthesis | Aggregates session outputs without upgrading weak evidence or mutating Work. |

Coding domain input is necessary but not sufficient by itself. Coding supplies
workflow YAML, TaskSpecs, Skills, doctrine, repo/resource/footprint policy,
evidence adapters, persona/soul preferences, and quality gates. Dispatch
resolves actual executor/provider/model/tier/soul/profile under governance.

## 11. Four Coordination Rings

The four rings should be preserved by a shared orchestration spine, not by
turning each ring into an unrelated module and not by collapsing all rings into
Agent Coordination:

```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher

Shared spine:
  request envelope
  -> ring handoff contract
  -> authority check
  -> state/evidence reference
  -> next-ring decision
```

`Spine` means a common control contract and trace shape across rings. It does
not mean one module owns every decision.

| Ring | Platform component | Authority preserved by the spine |
|---|---|---|
| Strategic / Orchestrator | Future orchestration strategy above single Work/session execution | Selects objectives, candidate Work/Assignment sets, and broad strategy; does not mutate Work or dispatch directly. |
| Activation / Launcher | Host And Surface Layer plus Work Driver entrypoints | Starts or resumes one selected Work item/session through the right door; does not reimplement driver logic. |
| Flow / Router + Driver | Work Driver / Domain Workflow Interpreter and Agent Coordination session routing | Chooses legal domain flow/operation or session-local task/actor route; does not select concrete executor infrastructure. |
| Execution / Dispatcher | Dispatch And Execution Engine | Resolves and launches one Assignment under governance; does not choose semantic operation or lifecycle result. |

The eventual accepted boundary document should decide whether this spine is
named as its own platform-core contract, or recorded as a required
cross-component contract spanning Work Driver, Agent Coordination, Dispatch,
and Host Surface.

## 12. Work-Attached Coding Collaboration Chain

The draft chain for Step 10 coding adoption remains:

```txt
Work Driver / Domain Workflow Interpreter
  -> selects one legal declared Stage Operation from the coding workflow
Assignment Builder
  -> freezes the declared operation into an immutable Assignment
CoordinationSession
  -> records workRef, actors/topology/bounds, and Assignment membership
Coding Domain Harness/Core
  -> enriches or rejects using repo scope, footprint, isolation, and evidence policy
Dispatch And Execution Engine
  -> resolves DispatchPlan and records/launches one Run
Run Result Evaluator
  -> computes RunResult confidence from evidence
Work Driver
  -> consumes RunResult and calls existing Work Lifecycle verbs when allowed
Work Lifecycle Engine
  -> applies status/stage/claim/return/approval transitions
Coding Domain Core
  -> applies merge/catchup/technical approval only through coding-owned gates
```

Forbidden shortcuts:

- CoordinationSession must not resolve Work, Stage, operation, branch, merge,
  or lifecycle status.
- Domain harnesses must not spawn executors.
- Dispatch must not invent semantic operations.
- RunResult or synthesis must not move Work.
- Host surfaces and Herdr must not become evidence or lifecycle truth.

Examples:

| Concern | Draft owner |
|---|---|
| `validate-plan` as a legal operation | Upstream product/design flow declares it while shaping remains open; Work Driver selects it; Assignment Builder freezes it. |
| `validate-plan` reviewer session | Agent Coordination owns session/membership; Work Driver owns Work-attached bridge. |
| File footprint conflict | Coding Domain Core, exposed as harness/resource advice. |
| Worker slot ceiling | Work Driver / Runtime Occupancy Support; coding may provide stricter resource claims. |
| Merge readiness | Coding Domain Core. |
| Work item status after review | Work Lifecycle Engine, through Work verbs only. |
| Confidence for reviewer RunResult | Run Result Evaluator, using coding evidence adapter inputs. |

## 13. Draft Ports

These are proposal-level names for future facades. This boundary draft does
not require creating them.

| Port | Owned by | Shape |
|---|---|---|
| `WorkLifecyclePort` | Work Lifecycle Engine | Read Work view; apply existing lifecycle verbs; expose domain-agnostic state transitions and gates. |
| `WorkDriverPort` | Work Driver / Domain Workflow Interpreter | Choose next legal operation; drive to a ceiling; park/halt; invoke Assignment/dispatch/lifecycle surfaces. |
| `DefinitionLoaderPort` | Domain Registry And Definition Loader | Load/validate domain registry, Workflow, FlowDefinition, TaskSpec, Skill refs, RoleGraph metadata. |
| `SessionStorePort` | Agent Coordination Engine | Open/replay/close CoordinationSession; append one-way Assignment membership; derive transient phase. |
| `AssignmentBuilderPort` | Agent Coordination Engine | Freeze declared operation or validated inline contract into immutable Assignment with provenance. |
| `DomainHarnessPort` | Domain Components | Enrich/reject contracts with domain constraints, evidence policy, resource/isolation advice, opaque workspace refs. |
| `DispatchRuntimePort` | Dispatch And Execution Engine | Resolve DispatchPlan; create Run; launch/observe/cancel/retry; support subprocess and in-process mechanisms. |
| `RunResultEvaluatorPort` | Run Result Evaluator | Parse worker claim; collect/validate evidence; compute confidence; normalize RunResult. |
| `OccupancyPort` | Work Driver / Runtime Occupancy Support | Check claims, worker slots, checkout locks, and resource availability before dispatch. |
| `SurfacePort` | Host And Surface Layer | Translate CLI/API/plugin/gateway calls into component requests and fgOS envelopes. |
| `SetupDoctorRegistryPort` | Setup, Doctor, And Distribution Health | Register config defaults, doctor checks, fixers, required binaries/services/directories. |
| `LearningDocsPort` | Learning, Knowledge, And Documentation Registry | Record/read retrospective captures, projections, traces, and docs indexes. |

## 14. Node Repo-Layout Overlay Direction

This overlay extends the `apps/` + `packages/` direction to Node, but only as
a proposal. Existing files stay where they are until a later slice creates a
facade, contract tests, and a low-risk move plan.

```txt
apps/
  cli/                         # thin fgos / fgos-runner entrypoints
  gateway/                     # Rust/web target already covered by repo-layout-vision
  herdr-tui/                   # Rust/web target already covered by repo-layout-vision

packages/
  work-core/
    work-lifecycle/            # Work state, status/stage, claim/return, Work verbs
    work-driver/               # ready selection, operation choice, automation loop
    runtime-occupancy/         # worker slots, checkout locks, resource pressure
  agent-coordination/
    coordination-engine/       # CoordinationSession, topology, team cognition, Assignment builder
    dispatch-execution/        # DispatchPlan, Run runtime, executor adapters
    run-result-evaluator/      # evidence collection, confidence, RunResult
  domain-registry/             # domain/workflow/task-spec/FlowDefinition loading
  domains/
    coding/                    # Coding Domain Core + product/design, cook, bugfix, small-change policy
  setup-doctor/                # config defaults, setup, doctor, distribution health
  host-surfaces/               # CLI/API/plugin/gateway/Herdr adapters and envelopes
  learning-docs/               # knowledge registry, projections, end-user docs index
```

Layout constraints:

- `apps/*` stay thin and wire packages together.
- `packages/*` own reusable component contracts and facades before moving
  implementations.
- A Rust replacement may sit behind the same Node facade as a binary or service
  adapter.
- Public `fgos` and `fgos-runner` command shape, `fgos.v1` envelopes, exit-code
  behavior, and current state authority stay stable through moves.
- Setup/doctor must learn any new binary, service, directory, config default,
  or writable path introduced by a future implementation slice.
- Physical movement follows accepted boundary authority, not draft vocabulary.

## 15. Code Scan Findings For Boundary Drafting

Scan date: 2026-09-02. This scan read the current Node implementation only to
shape the proposal. It did not run tests, edit runtime code, or claim Work.

| Finding | Evidence | Architecture read | Recommendation |
|---|---|---|---|
| A. `operation-choice.mjs` is the highest-risk boundary knot. | `chooseStageOperation()` line 649, `interpretAssignmentRunResult()` line 1671, `executeDriverOperationChoice()` line 2144 in a 2,260-line file. GitNexus shows callers from `dispatchClaimedItem()`, `runOnce()`, and tests. | The file spans Work Driver, Assignment/Dispatch invocation, and RunResult interpretation. It is a compatibility join point, not the long-term component home. | Treat `executeDriverOperationChoice()` as the temporary adapter seam for Step 10 slice 2. The accepted boundary should target `WorkDriverPort.chooseOperation() -> AssignmentBuilderPort.freezeDeclaredOperation() -> DispatchRuntimePort.runAssignment() -> RunResultEvaluatorPort.evaluate() -> WorkDriverPort.consumeRunResult()`. |
| B. Secondary operations use Assignment/RunResult; primary executing still uses `spawnWorker`. | `src/runner/loop.mjs` chooses operations and calls `executeDriverOperationChoice()` for assignment dispatch, but still falls through to `spawnWorker()` around executing/research paths. `assignment-runner.mjs` persists Run, dispatch plan, result, evidence, dirty-before state, and hashes. | The repo has two execution cores: `Assignment -> DispatchPlan -> Run -> RunResult` and legacy `spawnWorker -> goal-check -> settleClaim`. | Keep Step 2 narrow on read-only `validate-plan`. Mark `spawnWorker` primary execution as a legacy path to retire behind `DispatchRuntimePort`; goal-check becomes a coding evidence adapter. |
| C. CoordinationSession bounds and worker slots are separate caps. | Coordination defaults `aggregateBounds.maxConcurrency` and enforces session assignment creation; worker slots are computed from Work claims and optional ceiling. | Both caps are legitimate but currently have no shared port. Work-attached fan-out or mutation could create conflicting answers to "is there room?" | Step 2 should use concurrency 1 and borrow the host Work claim. Before fan-out/mutation, accept an `OccupancyPort` rule that clamps session materialization against Work runtime slots and coding resource claims. |
| D. CoordinationSession is correctly lifecycle-blind today. | `openSession()` accepts `workRef`; session engine builds read-only inline contracts; inline mutating contracts are rejected. | Session can reference Work but does not own lifecycle/isolation/merge and cannot run mutating inline Assignments. | Do not extend CoordinationSession into a Work/Stage resolver. Add declared Assignment handoff from Work Driver + Assignment Builder into session membership. |
| E. Coding harness is pure and read-only, but too narrow for mutation proof. | `domains/coding/harness/enrich-and-validate-contract.mjs` validates declared stage operation and appends context/policy hints without filesystem, store, network, dispatch, or executor choice. | This is a good ADR-007 seam. It lacks footprint/resource/isolation advice and opaque workspace refs needed for mutating proof. | Extend harness I/O only after the boundary and Step 10 readiness gates: enriched contract + policy + evidencePolicy + resourceClaims + isolationAdvice + `workspaceRef?`. |
| F. Domain workflow declarations already contain legal operation truth. | `domains/coding/workflows/feature.yaml` declares `validate-plan`, `implement-item`, `review-item`, `fix-verify-red`, `scoped-subtask`, `scout-blast-radius`, and `resolve-question`; `assignment.mjs` rejects unknown declared operations. | Step 10 does not need a new place to decide legal operations. It needs a clean path for declared operation truth to enter a Work-attached session. | For Step 10 slice 2: Work Driver selects `planning.validate-plan`; Assignment Builder freezes; Session store appends membership; Dispatch executes; Run Result Evaluator evaluates; Work Driver consumes verdict and calls lifecycle verbs if allowed. |
| G. Coding Repository Integration Core is scattered but authority is clear. | `src/runner/worktree.mjs`, `src/runner/merge.mjs`, `src/verbs/merge/**`, readiness/cleanup/drift state files. | These concerns are coding-specific because they depend on Git branches, worktrees, repo deltas, verification, merge readiness, and technical approval. | Do not move files in the boundary draft or Step 10 slice 2. The accepted boundary should mark them as Coding Domain Core and require a `CodingRepositoryPort` facade before layout moves. |
| H. Setup/Doctor is already a real platform boundary. | `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `src/setup/config-merge.mjs`, shared config helpers. | Clean architecture on paper is not enough if new files/config/executors/services are undiscoverable in real projects. | Make setup/doctor registration part of implementation gates for Step 09/Step 10 changes that introduce new config, files, services, or directories. |

## 16. Boundary Promotion Checklist

Before this draft can become accepted architecture:

1. Reconcile against Step 08 P07.2 final Deferral Audit and any changed
   CoordinationSession, FlowDefinition, dispatch, evidence, recovery, or
   headless-parity contracts.
2. Confirm Work Driver / Domain Workflow Interpreter as a child responsibility
   under Work Core, and decide its explicit contract boundary with Work
   Lifecycle Engine and Runtime Occupancy Support.
3. Decide first read-only concurrency posture: inherit host Work slot at
   concurrency 1, clamp session bounds through `OccupancyPort`, or another
   explicit rule.
4. Decide the `fgos handoff` relationship: Work event holder truth versus
   session collaboration evidence/projection.
5. Decide the minimal in-process Run record shape before executing-stage
   primary work moves onto Assignment.
6. Choose whether Node repo-layout overlay is accepted now, deferred as
   migration-only guidance, or split into a separate distribution/component
   document.
7. Add accepted-source links from Step 09 and Step 10 before any coding
   adoption implementation plan claims readiness.

## 17. Recommended Next Architecture Moves

1. Keep this draft as architect-level discussion input until promoted.
2. Run one focused review against Step 08's final audit and the Step 09
   substrate direction before accepting boundary rules.
3. Decide three gates explicitly: `OccupancyPort`, `fgos handoff`
   truth/projection, and in-process Run minimum record.
4. For Step 10 slice 2, implement only Work-attached read-only `validate-plan`
   session after the relevant Step 09 substrate primitive and boundary
   guardrails are accepted. Keep session concurrency at 1 and do not introduce
   fan-out.
5. For Step 10 slice 3, extract coding-specific result interpretation toward a
   coding evidence adapter feeding Run Result Evaluator.
6. For Step 10 mutating proof, lift the mutation gate only through a new ADR
   with live proof; do not edit ADR-010 in place.

## 18. Agent Coordination Documentation Organization Pressure

The current `docs/architect/agent-coordination/` tree is organized mostly by
document authority:

```txt
vision/
vocabulary/
architecture/
contracts/
decisions/
proposals/
roadmap/
verification/
playbooks/
history/
```

That is good for governance, but weak for internal boundary reading. The same
tree discusses CoordinationSession runtime, FlowDefinition/protocol model,
Assignment construction, Dispatch, Run/RunResult/evidence, Work integration,
Herdr/visibility, Team Cognition, Work/domain driver boundaries, and
orchestration rings.

Without a component-boundary view, two wrong readings become likely:

1. everything under this tree belongs inside the Agent Coordination Engine;
2. everything named driver/router/launcher is owned by Agent Coordination.

Both are false. Some documents under this tree describe adjacent platform
components because Agent Coordination interacts with them. A third reading is
partly true but needs precision: Dispatch and Run Result Evaluation belong
inside the **Agent Coordination** umbrella, but they are not submodules of the
narrower **Agent Coordination Engine**.

Recommended documentation overlay for boundary promotion:

```txt
docs/architect/agent-coordination/
  README.md
  vision.md
  intent-preservation-ledger.md

  boundaries/
    README.md
    orchestration-rings.md
    work-driver-integration.md
    component-authority-map.md

  architecture/
    system-context.md
    protocol-model.md
    runtime-model.md
    work-integration.md
    dispatch-control-plane.md
    evidence-and-results.md
    visibility-and-herdr.md

  contracts/
  decisions/
  proposals/
  roadmap/
  verification/
  playbooks/
  history/
```

This is an overlay direction, not a file-move request. The first move should be
an index-style `boundaries/README.md` or accepted
`architecture/component-boundary.md` that maps existing docs by component. Only
after Step 08 closes should any physical reorganization happen.

Draft component-to-doc reading map:

| Component concern | Current docs | Proposed boundary view |
|---|---|---|
| Agent Coordination Engine | `architecture/{system-context,protocol-model,runtime-model}.md`, `contracts/coordination-session.md`, `contracts/flow-definition.md` | Core Agent Coordination-owned docs. |
| Dispatch And Execution Engine | `architecture/dispatch-control-plane.md`, Run section of `contracts/assignment-run-runresult.md`, dispatch proposals | Adjacent platform-core engine under the foundation umbrella, not a submodule owned by session runtime. |
| Run Result Evaluator | `architecture/evidence-and-results.md`, RunResult/confidence section of `contracts/assignment-run-runresult.md` | Split from dispatch even if source files are still together. |
| Work Lifecycle / Work Driver integration | `architecture/work-integration.md`, Team Dispatch roadmap, Step 10 proposal | Work Driver is a platform-core integration engine that uses Agent Coordination, not an Agent Coordination subcomponent. |
| Host/visibility | `architecture/visibility-and-herdr.md`, gateway docs | Visibility stays out of runtime truth and evidence authority. |
| Rings / router / launcher / driver vocabulary | `vocabulary/concept-relationships.md`, roadmap Team Dispatch docs | Ring vocabulary becomes a component-neutral map. |

Do not reorganize the whole tree now. Add the boundary overlay first. If Step
1B accepts it, then move or split docs only where the accepted authority map
proves that navigation by document authority is no longer enough.
