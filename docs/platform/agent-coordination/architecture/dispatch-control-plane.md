# Dispatch Control Plane

```txt
Document type: Architecture
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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/dispatch-control-plane.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Responsibility | Current contract/invariant | src/runner/dispatch/assignment-runner.mjs:1-10 (executeAssignment; 'Never mutates Work lifecycle state') |
| Flow | Implemented compiler pipeline; capability-set declaration remains design | compileDispatchPlan plan.mjs:45,444-461; no standalone execution-capability-set step is claimed |
| Routing Identities | Legacy resolver implementation, distinct from host binding | resolve.mjs:33-66,269; executor for[] remains read by that resolver; runner.md contradiction is queued separately |
| Contracts | Current implementation plus explicitly labelled target interfaces | DispatchRequest normalizer is proposed; compiled fields and accepted policy inputs are stated locally |
| DispatchRequest (outer → core) | Unimplemented design proposal | git grep DispatchRequest src packages apps domains bin test: zero hits; plan.mjs:45 options bag is still the de facto request |
| PolicyPatch | Current policy resolver; normalized patch API remains design | assignment-policy.mjs:181,334-380; supported preference and rigor differ from runner.md's removal narrative, queued separately |
| DispatchPlan (core → runtime) | Current compiled fields; example target shape is not literal output | plan.mjs:444-461; policy.executor-mismatch-ignored is a real reason code |
| Executor Kinds | Current contract/invariant | src/runner/dispatch/config.mjs:452 EXECUTOR_KINDS=['agent','tool']; src/runner/dispatch/resolve.mjs:385 Gate B3; test/runner/dispatch.test.mjs |
| Component-Internal Ownership | Current owners; proposed normalizer labelled design | resolve, assignment-policy, mechanism, plan, assignment-runner, transport and herdr-round; no live cohort exception |
| Component-Outer Boundary Note | Current authority boundary and proposed normalized handoff | assignment-runner.mjs:523-539; outer callers cannot create an ungoverned launch door |
| Governance | Current contract/invariant | assignment-policy.mjs:146; config.mjs:454-488; actual invocation/confinement validation before launch |
| Separation Of Concerns | Current owner boundary | assignment.mjs, plan.mjs, assignment-runner.mjs, run-result.mjs; semantic operation selection belongs outside dispatch |
| Source Inventory | Current source owners; no unsupported manifest registration | src/runner/work-compat.mjs and operation-choice.mjs are Work-layer modules; boundary tests prohibit lifecycle mutation, not all occurrences of claim |

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

Execution requirements are not inferred merely from the mechanism name.
The current implementation expresses prompt delivery, permission posture and
confinement through executor/configuration and adapter checks. A unified
`execution capability set` is a design description, not a separately emitted
plan field or an implemented compiler stage. Unsupported requirements must
not be silently weakened; check the owning adapter and confinement authority.

## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/rigor), then
               runner.executors.<id>.for[]
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`) name capability
values. `resolveExecutorIdForPurpose` is not a current exported resolver.
`compileDispatchPlan()`'s `selector.type: 'purpose'` is the compatibility
selector label. It does not create a third conceptual route identity.
The [earlier normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)
is dated migration context, not an assertion that its remaining helpers ship.

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

The following shapes describe the intended request/policy/plan boundary.
The status below each distinguishes design fields from the actual exported
function inputs and compiled output; do not send the illustrative JSON as if
all fields were already accepted by a typed normalizer.

### DispatchRequest (outer → core)

```json
{
  "target": { "kind": "capability | executor", "value": "code:implement" },
  "policy": {
    "rigor": "standard",
    "preferExecutor": "agy-herdr",
    "fallbackExecutors": ["codex-herdr"],
    "preferPersona": "code-reviewer",
    "visibility": "headless"
  },
  "provenance": {
    "source": "workflow-operation",
    "domain": "coding",
    "workflow": "feature",
    "workflowStep": "executing",
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
(`executorId | for | work | assignment | needsSoul | hasLiveTaskAccess |
caller | workItem | workExecutorId | assignmentItem | cliOverride | options`)
is the current input shape (`plan.mjs:46-60`). Work compatibility context is
resolved through that path, not through a shipped typed DispatchRequest helper.
The proposed normalized outer request remains an unimplemented design.

### PolicyPatch

```txt
Global defaults
→ Domain defaults
→ Workflow defaults
→ Step defaults
→ Operation/taskSpec defaults
→ Role defaults
→ Persona defaults
→ Work policy
→ Assignment policy
→ Human/CLI inputs
→ Governance
```

This is the documented policy composition order, not a claim that every scope
is separately discovered by the leaf resolver. Callers supply composed inputs;
`resolveAssignmentDispatchPolicy` resolves Assignment/Work/config/caller inputs.

- Explicit rigor requirements cannot be weakened by a later lower requirement;
  the implicit standard is a fallback, not a floor. Derived tiers retain the
  strongest requirement (`assignment-policy.mjs:224-325`).
- Executor/persona preferences use the most-specific supported input, subject
  to governance (`assignment-policy.mjs:332-380`).
- Provider/model selection belongs to the registered executor/policy path.
- Portable YAML uses rigor rather than removed `minTier` or explicit tier/model
  pins; the resolver rejects those retired/forbidden inputs
  (`assignment-policy.mjs:203-215`). A general
  `assertNoPortableExecutorPin` helper is not current implementation.
- Effective provenance records winning values and sources
  (`assignment-policy.mjs:493-505`); no current `mergePolicyStack` function is
  implied by the composition diagram.

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

**Implementation status.** The illustrative `requestedTarget`,
`requestedCapability` and `selectedExecutor` names above are target-state
vocabulary, not current compiled output keys. `compileDispatchPlan()` returns
`selector`, `caller`, `mechanism`, `executorId`, `capability`, `invocation`,
`governance`, `reasonCodes`, optional `agentType`/`mcpTool`, `configured`,
`bindingSource`, `tier`, `model`, `providerModel`, `provenance` and `policy`
(`plan.mjs:444-461`). Policy resolution delegates to
`resolveAssignmentDispatchPolicy`; it is not duplicated by the caller.

For a real Assignment, policy resolution failure or a
decided-executor-versus-policy-executor mismatch remains a hard
`RunnerConfigError`. For a non-Assignment compatibility request
(`decide --for`, `decide <executor-id>`, `decide --work`), `plan.mjs`
synthesizes an Assignment policy with `preferExecutor` and, when configured,
capability `rigor` and `capability` (`plan.mjs:403-411`).
Removed capability `overrides` are rejected by config validation, not folded
into policy. Synthetic policy failures leave policy fields null; an executor
mismatch also records `policy.executor-mismatch-ignored`
(`plan.mjs:422-441`). A real Assignment's corresponding failure remains fatal.

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

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — resolves capability aliases, `prefer`,
   and executor `for[]` declarations (`resolveExecutorAndOverrides`).
3. **Executor registry resolver** — resolves a literal executor-id to its
   concrete invocation/tool/agent shape (`resolveExecutorConfig`).
4. **Policy resolver** — `resolveAssignmentDispatchPolicy`; owns supported
   provider/model/rigor/tier derivation and provenance, not a `mergePolicyStack`.
5. **Governance resolver** — checks egress/provider/executor/content
   constraints (cross-provider gate, `allowCrossProvider`, `carries`).
6. **Mechanism resolver** — decides in-process/out-of-process/unavailable
   and MCP/tool handback (`decideDispatchMechanism`,
   `decideExecutorDispatchMechanism`).
7. **DispatchPlan compiler** — `compileDispatchPlan()` joins the legacy
   dispatch decisions. Unit execution first obtains its binding through
   `bind()`; assignment-runner revalidates that binding and compiles the
   governed execution plan. The domain harness owns neither choice.
8. **Run runtime/adapters** — creates, launches, observes, settles, and
   retries a Run without choosing semantic operation
   (`assignment-runner.mjs`, `transport.mjs`, `herdr-round.mjs`).

Forbidden dependencies for all eight:

- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private executor-launch path for a domain or coordinating harness.
  The retired `cohort-planner.mjs` is not a current exception or authority.

## Component-Outer Boundary Note

Work, host, CLI/API and domain callers choose the semantic task and pass its
target/capability, policy inputs and provenance into governed execution.
They retain lifecycle decisions and consume returned evidence; they must not
resolve executor configuration and launch around dispatch governance or
confinement. The proposed outer normalizer is not a shipped alternate door.

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

Planning may be agent-led, declared by a Workflow, or supplied by a domain
harness. A validated Assignment still enters the same governed execution path;
the planning source does not grant a private launch or result-acceptance path.

```txt
planner     proposes a declared or dynamic semantic action
policy      validates legality, authority, bounds, and selected domain rules
builder     creates Assignment
resolver    produces governed DispatchPlan
dispatcher  launches and observes Run
normalizer  creates RunResult
caller      consumes evidence and invokes authorized lifecycle behavior, if any
```

The detailed redesign source remains a
[proposal](../proposals/dispatch-control-plane-redesign.md) until its unresolved
target-state sections are reconciled with implementation.

## Source Inventory

| Layer | Modules | Responsibilities & Boundaries |
| --- | --- | --- |
| Dispatch Core | `src/runner/dispatch/**` (`cli.mjs`, `plan.mjs`, `resolve.mjs`, `prepare.mjs`, `settlement.mjs`, `reconcile-cli-spawn.mjs`, `herdr-reconcile.mjs`, `proof-helpers.mjs`, `assignment-runner.mjs`, `confinement/**`, `transport.mjs`, `herdr-round.mjs`, `brief.mjs`, `assignment.mjs`, `runtime-inspection.mjs`) | Execution allocation, plan compilation, confinement and adapter execution. Boundary tests prohibit Work lifecycle mutation/imports; they do not prohibit every textual occurrence of `claim`. |
| Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
| Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
| Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
| Audit Seam | `src/runner/dispatch-log.mjs` | Audit event logging (`logExecutorDispatch`) isolated from dispatch core. |

