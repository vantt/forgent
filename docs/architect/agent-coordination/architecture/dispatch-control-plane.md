# Dispatch Control Plane

Document type: Architecture
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-09
Canonical for: dispatch responsibility and governance boundaries; the
DispatchRequest, PolicyPatch, and DispatchPlan contracts; component-internal
ownership and forbidden dependencies for the Dispatch And Execution Engine.
Related: [Component Boundary Advisory](../../component-boundary/component-boundary-advisory.md)
(discussion-only), [Component Authority Boundary Map](../../proposals/component-authority-boundary-map.md)
(draft), [FlowDefinition Contract](../contracts/flow-definition.md),
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md),
[Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md),
[Dispatch Core Contract Normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)

## Responsibility

The dispatch control plane converts one semantic Assignment into one governed
execution attempt. It resolves target, capability, provider/model/tier,
soul/profile, mechanism, adapter, policy checks, result channel, and runtime
metadata.

It does not choose the Work lifecycle transition or invent a semantic operation.

## Flow

```txt
Assignment
  -> policy resolver
  -> executor/target resolution
  -> governance and egress checks
  -> mechanism/adapter selection
  -> execution capability set
  -> Run creation and launch
  -> settlement/result collection
  -> RunResult normalization
```

`execution capability set` is a declared step, not a derived one. A mechanism
having been selected does not tell the Run what that mechanism can and cannot
do, so an executor declares it: how the prompt reaches the worker, what
permission posture it runs under and what confinement that posture requires,
what counts as a receipt, and whether the mechanism can be observed or
contacted at all. A capability the mechanism does not have is refused by name
rather than silently degraded, and a capability reachable in one execution
mode but not the other has to say so (ADR-010 §3).

## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[]
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorIdForPurpose`,
`resolveExecutorAndOverrides(cfg, executorIdOrPurpose)`) all name a capability
value, resolved against the same `runner.capabilities` catalog an explicit
capability selector would use. `compileDispatchPlan()`'s
`selector.type: 'purpose'` denotes a capability-shaped request, not a separate
ontology; nothing downstream branches on `purpose` as a concept distinct from
capability. Renaming these call sites internally is compatibility work
(tracked as Slice D/E in the normalization plan above), not a semantic
change — `--for`, `--work`, and `--assignment` stay supported at the CLI/API
adapter layer.

`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.

Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.

## Contracts

These three contracts are canonical for this control plane. They are
additive over the current implementation, not a replacement of it — see the
Implementation Status line under each for what is real today versus still
Slice D/E scope in the normalization plan.

### DispatchRequest (outer → core)

```json
{
  "target": { "kind": "capability | executor", "value": "code:implement" },
  "policy": {
    "minTier": "standard",
    "preferExecutor": "agy-herdr",
    "fallbackExecutors": ["codex-herdr"],
    "preferPersona": "code-reviewer",
    "visibility": "headless"
  },
  "provenance": {
    "source": "workflow-operation",
    "domain": "coding",
    "workflow": "feature",
    "stage": "executing",
    "operation": "implement-item",
    "taskSpec": "implement-item",
    "skill": "fgos-coding-implement"
  }
}
```

Rules:

- `target.kind: capability` resolves through `runner.capabilities` and
  executor `for[]` bindings.
- `target.kind: executor` is an explicit concrete override and remains
  visible as an override — it must not silently discard a requested
  capability's provenance.
- `provenance` is explanatory/audit metadata, not an extra route key.
- Work/workflow/task/skill objects never cross this boundary as semantic
  resolver input; they are read by the component-outer caller only, before
  a DispatchRequest is built.
- An unavailable capability is a valid resolution result (`mechanism:
  "unavailable"`), not malformed config.

**Implementation status.** No single typed `DispatchRequest` object exists
yet. `compileDispatchPlan()`'s options bag
(`executorId | for | work | assignment | stage | needsSoul |
hasLiveTaskAccess | caller | cliOverride | options`) is the de facto request
shape today — untyped, and `work`/`assignment` are resolved to a
capability/executor-id *inside* `plan.mjs` rather than by the caller before
the boundary. Introducing a normalized `DispatchRequest` helper near
`plan.mjs` without changing `compileDispatchPlan`'s role as the sole
execution chooser is Slice D scope.

### PolicyPatch

One validated shape at every declared scope (runner/default, definition,
node, operation, role, actor, Work, Assignment, human/CLI, governance) — see
the [FlowDefinition Contract](../contracts/flow-definition.md#policypatch)
for the accepted schema. Dispatch does not define a second policy shape; it
consumes the same one.

```txt
runner/default
→ definition/protocol
→ operation/taskSpec
→ role
→ actor/persona
→ Work constraints
→ Assignment
→ trusted human/CLI override
→ governance
```

Merge rules (already accepted and enforced):

- tier constraints accumulate monotonically — a weaker layer cannot lower a
  stronger required tier;
- executor preference is most-specific-wins, subject to registration and
  governance;
- provider family derives from the selected registered executor, never from
  a raw selector string;
- literal model/executor names are not portable workflow/protocol data — a
  *portable* definition expresses `minTier`/`capabilities` only;
- provenance records the winning scope for every resolved field, as
  `{field: {value, source: {scope, id}}}`.

**Implementation status.** Implemented. `resolveAssignmentDispatchPolicy()`
(`src/runner/dispatch/assignment-policy.mjs`) implements this exact
precedence and provenance shape. `assertNoPortableExecutorPin()`
(`src/runner/coordination/session-engine.mjs`) already rejects a literal
`preferExecutor` declared at a portable definition/role/actor/operation
scope. `fallbackExecutors` remains `reserved-not-executed`: recorded and
validated, never automatically dispatched as failover.

### DispatchPlan (core → runtime)

```json
{
  "requestedTarget": { "kind": "capability", "value": "code:implement" },
  "requestedCapability": "code:implement",
  "selectedExecutor": "agy-herdr",
  "bindingSource": "capability.prefer",
  "providerModel": "gemini",
  "tier": "standard",
  "model": "<resolved-from-policy>",
  "mechanism": "out-of-process",
  "invocation": { "via": "cli", "adapter": "herdr-spawn" },
  "governance": {},
  "provenance": {}
}
```

An explicit executor override remains visible as an override; it must not
silently replace the requested capability's own provenance.

**Implementation status.** Implemented for dispatchable plans.
`compileDispatchPlan()` (`src/runner/dispatch/plan.mjs`) returns the legacy
selector/mechanism fields plus `bindingSource`, `tier`, `model`,
`providerModel`, structured field-level `provenance`, and the complete
merged `policy`. It delegates those policy fields to
`resolveAssignmentDispatchPolicy()` rather than re-deriving them, and
`assignment-runner.mjs` now reads `compiledPlan.policy` directly instead of
calling the policy resolver a second time.

For a real Assignment, policy resolution failure or a
decided-executor-versus-policy-executor mismatch remains a hard
`RunnerConfigError`. For a non-Assignment compatibility request
(`decide --for`, `decide <executor-id>`, `decide --work`), `plan.mjs`
synthesizes the smallest policy object needed for observability:
`preferExecutor` is the already-selected executor, and capability
`overrides.providerModel`/`overrides.model`/`overrides.tier`/
`overrides.rigorOverrides` are folded into the synthesized policy so the
reported model/tier matches the same capability-default path used by
execution. If that synthesized policy would disagree with an explicit caller
override, the plan stays dispatchable and records
`policy.executor-mismatch-ignored`; the optional policy fields are left
unset rather than turning a legacy `decide` probe into a thrown error.

Governance-blocked and genuinely unavailable plans also leave
`tier`/`model`/`providerModel`/`provenance`/`policy` unset so they never
publish a partial policy for a Run that will not launch.

`selector.type: 'purpose'` in the current implementation corresponds to
`requestedTarget.kind: 'capability'` in the target contract above (see
Routing Identities). It is a compatibility label on the public shape, not a
semantic third identity.

## Executor Kinds

An executor is not assumed to be an agent. `runner.executors.<id>.kind` is
one of `agent | tool` (`src/runner/dispatch/config.mjs`,
`EXECUTOR_KINDS`) — orthogonal to the invocation mechanism
(`invocations[].via`, one of `cli | task | mcp | api`). A `tool`/MCP-only
executor (e.g. `gitnexus`, `invocations: [{via: "mcp"}]`) is never spawned
as a subprocess: `resolveExecutorConfig()`'s own Gate B3 throws rather than
silently falling through to the global CLI executor when a caller asks an
MCP-only executor to resolve for CLI dispatch. This is how impact-analysis
tools like GitNexus participate in dispatch as executors without pretending
to be agents — the same control plane, the same capability/executor-id
routing, a different declared mechanism.

## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer** — accepts only a normalized capability/executor
   target plus PolicyPatch/provenance; performs no Work graph traversal.
2. **Capability binding resolver** — resolves capability aliases, `prefer`,
   and executor `for[]` declarations (`resolveExecutorAndOverrides`).
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`/
   `mergePolicyStack`; owns provider/model/tier derivation and provenance.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()`; joins the prior
   decisions into one plan. Remains the sole execution chooser.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).

Forbidden dependencies for all eight:

- no `Work` lifecycle mutation;
- no workflow/stage/task/skill lookup;
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private dispatch path for a coordination or domain harness —
  `cohort-planner.mjs` is the one confirmed exception, and it only *re-reads*
  `resolveExecutorConfig`/`resolveAssignmentDispatchPolicy` for a
  pre-dispatch feasibility check; it never spawns and never bypasses them.

## Component-Outer Boundary Note

Work Driver, Coordination Engine/FlowDefinition, Domain Harness, and
Host/CLI/API callers derive a capability or explicit executor-id plus a
PolicyPatch and provenance, then hand a DispatchRequest to this control
plane. None of them calls `resolveExecutorConfig` or launches an executor
directly. `dispatchDeclaredOperation()`
(`src/runner/coordination/session-engine.mjs`) is the concrete example
today: it composes a full scoped policy stack (runner → definition →
operation → role → actor) and passes the winning provenance to
`resolveAssignmentDispatchPolicy` via `cliOverride.policyProvenance`, rather
than re-deriving policy itself. Full component-outer ownership (Work Driver,
FlowDefinition/operation, domain harness, host CLI/API selector
compatibility) is documented in the normalization plan's Slice C scope, not
duplicated here.

## Governance

- Executor identifiers must resolve through configured/approved targets.
- Cross-provider/model/tier dispatch must remain explicit and auditable.
- Capability, role, soul/profile, privacy, and context-egress requirements must
  be resolved through policy rather than hard-wired to a Workflow.
- CLI spawn is an execution mechanism, not a governance bypass.
- Read-only/mutating policy must be checked before launch.
- Result and artifact locations must be bounded and attributable to the Run.
- Direct executor calls from protocol, Skill, coordinator, or domain-harness
  prose are invalid.

## Separation Of Concerns

```txt
planner     proposes a declared or dynamic semantic action
policy      validates legality, authority, bounds, and selected domain rules
builder     creates Assignment
resolver    produces governed DispatchPlan
dispatcher  launches and observes Run
normalizer  creates RunResult
caller      consumes evidence and invokes authorized lifecycle behavior, if any
```

Planning may be agent-led, declared, or domain-assisted. Dispatch does not care
which source proposed the validated Assignment and must not create separate
runtime paths for them. A CoordinationSession or a declared
`CoordinationProtocol` FlowDefinition (see
[ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md),
[ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md))
is one more caller of this same flow: a Cohort Planner may emit actor policy
inputs, but it resolves and dispatches exactly one Assignment at a time
through this control plane — it may not spawn an executor directly or read
sibling Assignment state.

The detailed redesign source remains a
[proposal](../proposals/dispatch-control-plane-redesign.md) until its unresolved
target-state sections are reconciled with implementation.
