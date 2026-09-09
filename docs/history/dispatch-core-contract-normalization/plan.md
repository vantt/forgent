# Dispatch Core Contract Normalization Plan

## Objective

Normalize the boundary between high-level context layers and the Dispatch And
Execution Engine without creating a second dispatch mechanism.

The result must make one distinction explicit:

```text
component-outer:
  derive semantic context and policy intent

component-internal:
  resolve capability/executor binding and execute one governed Run
```

The dispatch core must remain flexible: an executor may be an agent, CLI,
MCP/tool provider, API adapter, or future native mechanism. A high-level layer
may customize executor preference and rigor policy, but it must enter through a
typed contract and must not resolve provider/model/mechanism privately.

This plan is implementation-ready but intentionally starts with contract and
documentation reconciliation. No runtime change is accepted until the
contract slices below are reviewed against the existing code and tests.

## Current evidence to preserve

The repository already has the required primitives, although they are exposed
through several paths:

- `src/runner/dispatch/plan.mjs` — `compileDispatchPlan()` and selector output;
- `src/runner/dispatch/resolve.mjs` — capability/executor binding,
  `resolveExecutorAndOverrides()`, provider/model resolution;
- `src/runner/dispatch/assignment-policy.mjs` — scoped policy merge and
  provenance;
- `src/runner/dispatch/mechanism.mjs` — in-process/out-of-process/unavailable;
- `src/runner/dispatch/config.mjs` — capability/executor/invocation shape;
- `src/runner/dispatch/assignment-runner.mjs` — Assignment → Run execution;
- `src/state/workflow-stage-graphs.mjs` and
  `src/runner/definitions/*` — workflow/stage/operation/taskSpec/skill data;
- `runner.capabilities.<id>` — capability binding (`prefer`, overrides);
- `runner.executors.<id>` — concrete agent/tool/provider invocation;
- `PolicyPatch` and its seven-scope merge in the Coordination contracts;
- existing `impact-analysis → gitnexus` MCP/tool binding, proving an executor
  need not be an agent.

Existing design contracts to preserve and reconcile:

- `docs/architect/component-boundary/component-boundary-advisory.md`;
- `docs/architect/proposals/component-authority-boundary-map.md`;
- `docs/architect/agent-coordination/architecture/dispatch-control-plane.md`;
- `docs/architect/dispatch-control-plane-redesign.md`;
- `docs/architect/agent-coordination/contracts/flow-definition.md`;
- `docs/architect/agent-coordination/contracts/workflow-stage-operation.md`;
- `docs/architect/agent-coordination/contracts/assignment-run-runresult.md`;
- `docs/architect/agent-coordination/vocabulary/canonical-concepts.md`;
- `docs/architect/agent-coordination/vocabulary/concept-relationships.md`;
- `docs/specs/runner.md` and the accepted ADRs it cites.

## Locked semantic decisions for this plan

### Routing identities owned by dispatch core

The core owns only two semantic target identities:

```text
capability  — abstract behavior promise
executor-id  — explicit concrete implementation override
```

`purpose` is not a third concept. Existing `purpose` parameters and
`--for` syntax are compatibility terminology for capability and must be
renamed in the internal model over time without breaking existing callers.

`job` is not a routing identity. If retained in logs, it means a caller's
execution request label. A `Run` is one concrete attempt for that request.

### Context owned outside the core

The following are component-outer context selectors:

```text
Work, workflow, stage, operation, taskSpec, skill, protocol, Assignment context
```

They may derive a capability or explicit executor-id, but they must not become
additional dispatch-core routing ontologies.

### Policy owned by the core, declared by the outer layer

An outer layer may submit a typed policy patch. The core remains the sole place
that merges and enforces it.

Allowed portable policy intent:

```text
minTier
preferPersona
preferExecutor
fallbackExecutors
visibility
```

Workflow/protocol definitions must not pin literal provider/model names.
Literal model overrides remain restricted to Assignment or trusted human/CLI
input, per the existing assignment-policy contract.

Provider/model/tier resolution, governance, and mechanism choice remain
dispatch-core authority.

## Target contracts

### 1. DispatchRequest (outer → core)

Define and document one normalized request boundary. The exact field name may
follow the existing `compileDispatchPlan` shape, but the semantic shape is:

```json
{
  "target": {
    "kind": "capability | executor",
    "value": "code:implement"
  },
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

- `target.kind=capability` resolves through `runner.capabilities` and executor
  bindings;
- `target.kind=executor` is an explicit concrete override and must still be
  recorded alongside any requested capability;
- provenance is explanatory/audit metadata, not an extra route key;
- Work/workflow/task/skill objects never cross the core boundary as semantic
  resolver input;
- an unavailable capability is a valid resolution result, not malformed config.

### 2. PolicyPatch

Reuse the existing `PolicyPatch` contract and `mergePolicyStack` precedence.
Do not create a second policy shape for dispatch.

Document the scope/source ownership explicitly:

```text
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

The merge rules must remain:

- tier constraints accumulate monotonically; a weaker layer cannot lower a
  stronger required tier;
- executor preference is most-specific-wins, subject to registration and
  governance;
- provider family derives from the selected registered executor;
- literal model is not portable workflow/protocol data;
- provenance records the winning scope for every resolved field.

### 3. DispatchPlan (core → runtime)

Make the canonical plan distinguish request intent from concrete execution:

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

An explicit executor override must remain visible as an override; do not
silently replace the requested capability with the executor id.

## Component-internal normalization

Update the internal boundary map so Dispatch And Execution Engine owns these
modules/authorities:

1. Request normalizer — accepts only normalized capability/executor target plus
   PolicyPatch/provenance; no Work graph traversal.
2. Capability binding resolver — resolves capability aliases, `prefer`, and
   executor `for` declarations.
3. Executor registry resolver — resolves a literal executor-id and concrete
   invocation/tool/agent shape.
4. Policy resolver — reuses `resolveAssignmentDispatchPolicy`/
   `mergePolicyStack`; owns provider/model/tier derivation and provenance.
5. Governance resolver — checks egress/provider/executor/content constraints.
6. Mechanism resolver — decides in-process/out-of-process/unavailable and
   MCP/tool handback.
7. DispatchPlan compiler — joins the prior decisions into one immutable plan.
8. Run runtime/adapters — creates, launches, observes, settles, and retries a
   Run without choosing semantic operation.

Internal forbidden dependencies:

- no `Work` lifecycle mutation;
- no workflow/stage/task/skill lookup;
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision;
- no provider/model selection outside the policy resolver;
- no second private dispatch path for coordination or domain harnesses.

## Component-outer normalization

Update the outer boundary map so each caller owns only context derivation:

### Work Driver / workflow interpreter

```text
Work → domain/workflow/stage → legal operation → taskSpec/skill metadata
     → capability or explicit executor-id + PolicyPatch + provenance
```

It must not call `resolveExecutorConfig` or launch an executor directly.

### Coordination Engine / FlowDefinition

```text
protocol definition/operation/actor
→ Assignment target + PolicyPatch + provenance
→ DispatchRequest
```

Portable protocol definitions may declare operation policy intent, but cannot
pin literal model/provider commands.

### Domain harness

May enrich an operation with domain evidence/resource/isolation constraints and
capability identity. It may not create a private resolver.

### Host/CLI/API

May use explicit executor-id or capability selectors and trusted overrides. It
must pass through the same DispatchRequest and DispatchPlan path.

## Implementation slices

### Slice A — contract and terminology inventory

- map every current `purpose`, `job`, `--for`, `executorIdForWork`, and
  `compileDispatchPlan` caller;
- classify each caller as core or outer;
- document compatibility behavior before renaming anything;
- identify whether `DispatchRequest` can be an additive normalization over the
  current plan/assignment shapes.

Proof:

```text
repo-wide caller inventory; no unexplained selector path remains
```

### Slice B — component-internal docs

Update:

- component-boundary advisory internal map;
- authority-boundary map and `DispatchResolverPort`;
- dispatch control-plane architecture;
- Assignment/Run/RunResult contract references.

Document exact ownership, forbidden dependencies, and the three contracts
above. No runtime behavior change in this slice.

### Slice C — component-outer docs

Update:

- Work Driver/domain workflow boundary;
- FlowDefinition/operation/PolicyPatch contract;
- taskSpec/skill/operation derivation rules;
- coordination protocol and domain-harness caller rules;
- host CLI/API selector compatibility (`--for`, executor-id, work/assignment).

Explicitly show that outer layers derive targets but do not select concrete
provider/model/mechanism.

### Slice D — normalize runtime request boundary

Introduce the smallest additive normalization helper/contract near
`src/runner/dispatch/plan.mjs` (or the lower-level dispatch module chosen by
impact analysis). It must:

- accept capability or executor-id as canonical target;
- carry PolicyPatch/provenance;
- preserve current `--for`, `--work`, `--assignment` compatibility at adapters;
- route Work/workflow derivation before entering the core;
- keep `compileDispatchPlan` as the sole execution chooser;
- preserve tool/MCP handback and agent executor behavior.

Before editing symbols, run GitNexus impact analysis and warn on HIGH/CRITICAL
risk. Do not rename public flags in the same slice unless tests prove the
compatibility alias.

### Slice E — unify policy application

Ensure direct capability dispatch, Assignment dispatch, coordination dispatch,
and operation dispatch all enter the same PolicyPatch/policy resolver path.

Required proof cases:

- capability preference selects a configured executor;
- operation `preferExecutor` overrides the capability default according to the
  documented precedence;
- a Work/Assignment tier raises but cannot weaken rigor;
- literal model is rejected from portable workflow/protocol policy;
- explicit trusted CLI/Assignment model override remains supported;
- provider derives from the selected executor, not from a selector string;
- governance rejects the final provider/executor after resolution;
- MCP/tool capability resolves without pretending to be an agent.

### Slice F — documentation rewrite and migration

Rewrite the canonical dispatch design document after runtime contract proof:

- current architecture and authority boundaries;
- request/PolicyPatch/DispatchPlan schemas;
- selector normalization and compatibility aliases;
- resolution precedence and provenance;
- agent/tool/MCP executor examples;
- Work/Workflow/Task/Skill outer derivation;
- provider/model/tier override rules;
- failure/unavailable/governance behavior;
- migration from `purpose` terminology;
- observability and Run relationship.

Then synchronize living summaries in the component maps, runner spec,
canonical vocabulary, and related contract indexes. Historical ADRs remain
unchanged unless a new superseding decision is explicitly approved.

## Verification matrix

### Structural/static

- no outer component imports private executor launch or resolver internals;
- no dispatch-core module imports Work lifecycle or workflow registry merely to
  route a normalized request;
- one `DispatchPlan` compiler remains the execution chooser;
- all direct dispatch call sites use the same normalized request/policy path;
- terminology scan distinguishes capability, executor, Run, and job.

### Runtime

- direct capability → agent executor;
- direct executor-id → exact executor;
- direct capability → MCP/tool executor;
- operation/task/skill → capability → executor;
- Work context → workflow operation → capability → executor;
- explicit executor override preserves requested capability provenance;
- unavailable capability returns a truthful unavailable result;
- governance-blocked target does not appear dispatchable;
- provider/model/tier provenance is complete.

### Documentation

- component-internal and component-outer maps agree;
- Dispatch Control Plane is canonical and no longer defers this boundary as
  unresolved;
- FlowDefinition/PolicyPatch/Assignment contracts agree with runtime;
- examples cover agent and tool executors;
- no active document treats purpose as a separate semantic identity;
- no active document treats job as a routing selector.

## Parallelization and order

Safe parallel tracks after Slice A inventory:

```text
Track 1: component-internal authority/docs
Track 2: component-outer workflow/coordination docs
Track 3: runtime normalization/policy tests
```

Slice F documentation rewrite waits for the runtime contract decision from
Tracks 1–3. All tracks must start from the same main baseline and use separate
worktrees. Do not mix this work with the state/root-resolution stream.

## Non-goals

- no Work schema redesign;
- no new lifecycle stage/status/event;
- no new group-thinking protocol;
- no provider auto-ranking or cost optimizer;
- no deletion of `--for`, `--work`, or `--assignment` before a compatibility
  migration is proven;
- no direct executor calls from skills, protocols, or domain harnesses;
- no `.fgos` state migration or worktree-root repair.

## Completion criteria

The work is complete only when a stranger agent can answer:

1. Which layer derives capability/executor-id from Work/workflow/task/skill?
2. Which layer merges provider/model/tier policy?
3. Where is explicit executor override represented?
4. How does an MCP/tool executor differ from an agent executor?
5. What is a Run, and why is it not a job/operation identity?
6. Which document is canonical for Dispatch Core?

Required final evidence:

- implementation commits and test results;
- updated component-internal map;
- updated component-outer map;
- rewritten canonical Dispatch Control Plane design;
- compatibility/terminology migration notes;
- GitNexus `detect_changes()` result before commit;
- explicit `[DONE]` or `[BLOCKED]` handback.

## Outstanding questions

None for the target boundary. Any disagreement about policy precedence,
literal model authority, or selector compatibility must be recorded as a
design decision before runtime edits, not silently resolved in code.
