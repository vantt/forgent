# Targeted carriage-label, historical-successor and current-text packet

Author session: codex-session:1@2026-10-10

Inventory commit: 91a899f1863b2147a0f96db855dd0b2695fddc95

Receipt commit: e3989e217d932ced11b99f40f7cfd9c9097c6c31

This ordinary non-checkpoint packet carries no seeds. It contains exactly 114 affected historical decisions, 42 pending current-unit classification receipts and six changed current sections. The native source packet separately contains 48 affected source rows. Historical witnesses are proved against three actual committed native snapshots; current text/digests come from the authored frozen inventory. Prior immutable receipts are not rewritten. Every new/corrected decision remains independently reviewable; earlier approval is never inferred from neighbouring text or a reused heading.

## Historical successor decisions

Report header: Reviewer; Author session; Commit (inventory commit above). Table: `| Claim | Verdict | Source digest | Target digest | Note |`. One verdict per affected ID; inspect the entire source and entire counterpart, not only headings. The target digest column is the real native unit digest; full shown-text SHA-256 is also supplied.

### claim_00e1cb91d634a22b72c2256909cd407d

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `e1304a6a126e9f403638d42ccb4476b132e6aa74cdf84bbca3bf92cfb26e1678`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership`; native digest `2733a56fe75fb75ffd77892a1cbc0937340927f3c7727df7cc59446f24be91ce`; whole shown digest `0c74651edd5b7e919916e16bb79bbe5536883eb24333911502d943c37f14d833`.

Rationale: Supersede the complete component-internal-ownership historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "1. **Request normalizer** — accepts only a normalized capability/executor". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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

- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no workflow/stage/task/skill lookup: dispatch core contains no Work lookup implementations. Work capability lookups (`executorIdForWork`, `resolveCapabilityIdentityDetails`, `resolveCapabilityIdentity`, `buildPrompt`) are housed in dedicated leaf compatibility module `src/runner/work-compat.mjs` (registered as `infra` in architecture manifest) with zero imports into dispatch core; `src/runner/dispatch/resolve.mjs` and `prepare.mjs` provide backward-compatible re-exports without importing `workflow-stage-graphs` or `operation-choice.mjs`, consumed by pre-existing callers (`plan.mjs` for `compileDispatchPlan({work})` and `cli.mjs` for `spawnWorker`). All 13 strictly decoupled dispatch core modules contain zero `workflow-stage-graphs` imports, and boundary tests enforce that strict core modules cannot import Work lookup symbols or `work-compat.mjs` (verified by `test/runner/dispatch-reconciliation-import-graph.test.mjs`);
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private dispatch path for a coordination or domain harness —
  `cohort-planner.mjs` is the one confirmed exception, and it only *re-reads*
  `resolveExecutorConfig`/`resolveAssignmentDispatchPolicy` for a
  pre-dispatch feasibility check; it never spawns and never bypasses them.
~~~~

#### Complete current counterpart

~~~~markdown
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
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
~~~~

### claim_956d10da281258c396a6a9459ef8071c

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `1db07abb2e64bc19c2559886cc7c51c1ca6f8eead285ac56c19daefac76faa7d`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts`; native digest `bbe2a5a5b82a6a3145532c058e0d786e05b3bd13215fdce5b39d9dedf53e6b46`; whole shown digest `65c99601c2be1c483c69db5fc80a2067648536b3a1cbc81eb7b158b464b53196`.

Rationale: Supersede the complete contracts historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "These three contracts are canonical for this control plane. They are". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## Contracts

These three contracts are canonical for this control plane. They are
additive over the current implementation, not a replacement of it — see the
Implementation Status line under each for what is real today versus still
Slice D/E scope in the normalization plan.
~~~~

#### Complete current counterpart

~~~~markdown
## Contracts

The following shapes describe the intended request/policy/plan boundary.
The status below each distinguishes design fields from the actual exported
function inputs and compiled output; do not send the illustrative JSON as if
all fields were already accepted by a typed normalizer.
~~~~

### claim_c146eb9ca2936c2b94a0ebbf081089c3

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `a63062dacf5fb1a383548f84351b45af3d54c71ae03cfd6695b6f6d471a1d573`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime`; native digest `a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567`; whole shown digest `b93376611d0d1f508a68c27e000c76e1656c6ba5f4daedc6d2f29521281681b8`.

Rationale: Supersede the complete dispatchplan-core-runtime historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "**Implementation status.** Implemented for dispatchable plans.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_55a9444e77866c7803537f5684e5da13

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `8b22819a500c36828f9724bf2eb65ec61799c8e420f866575ac83ab9396fa3b9`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core`; native digest `c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3`; whole shown digest `fc87845c9d21b755856c47049824f8a2dd695be3f378a019581447b52738bdcc`.

Rationale: Supersede the complete dispatchrequest-outer-core historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "(`executorId | for | work | assignment | stage | needsSoul |". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_cc694e436718853f93d26210b711851b

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#flow` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `f0fb1bcadf263892e171e8e5a81e940d7c4a2158c070f56f999eade4a309107f`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#flow`; native digest `a31d566e09a26dae7ecafe699a9562fb482e8ee23231126e1457f37ce861e0b2`; whole shown digest `659ec159f963c1a23dce3137eff49ebdf8adb0ad009b1dd4e3ba03fec7ea05a8`.

Rationale: Supersede the complete flow historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#flow. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "`execution capability set` is a declared step, not a derived one. A mechanism". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_576d8164dbbe914a84da4587e377cd47

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `abd895bacd7a5e70bd5915ba5a6dfb5843929fc64919d3b0290513a273641029`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities`; native digest `9346bcff67d284b8b32d0fbdc8b35e9da446a76e5f244fc7e6c89d68c958d671`; whole shown digest `c7634d6197f50b6174b05b60d0164fac0837a06cce0efe17c6cd71abdf38c720`.

Rationale: Supersede the complete routing-identities historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "capability   — abstract behavior promise, resolved through". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
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
~~~~

### claim_9ef44cee11ca6f130d5a28fa4cc49394

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-11` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `79cd1e06fa13094d10975bb96137f73a4cf5ad8205777c9ce7e6cb83e162d515`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts`; native digest `bbe2a5a5b82a6a3145532c058e0d786e05b3bd13215fdce5b39d9dedf53e6b46`; whole shown digest `65c99601c2be1c483c69db5fc80a2067648536b3a1cbc81eb7b158b464b53196`.

Rationale: Supersede the complete unheaded-block-11 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#contracts. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "These three contracts are canonical for this control plane. They are". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
These three contracts are canonical for this control plane. They are
additive over the current implementation, not a replacement of it — see the
Implementation Status line under each for what is real today versus still
Slice D/E scope in the normalization plan.
~~~~

#### Complete current counterpart

~~~~markdown
## Contracts

The following shapes describe the intended request/policy/plan boundary.
The status below each distinguishes design fields from the actual exported
function inputs and compiled output; do not send the illustrative JSON as if
all fields were already accepted by a typed normalizer.
~~~~

### claim_bbf72392c1062ed1b443cd93b177cc61

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-12` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `660379a03ef45ee4294296fa6c6457a0c39aecaa2f43b4a9da3a8428ca859ba4`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core`; native digest `c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3`; whole shown digest `fc87845c9d21b755856c47049824f8a2dd695be3f378a019581447b52738bdcc`.

Rationale: Supersede the complete unheaded-block-12 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "```json". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_f9536edbf15fb8cd770895db4e3db776

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-14` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `a5f0746c52639a115b4cc3c46edf9c430b1c809223e2bb7e7d64e4d8081a0f21`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core`; native digest `c9e22dfa3e05e994e43bfa65ca96600406295aa8182af265e948fedce72ff9d3`; whole shown digest `fc87845c9d21b755856c47049824f8a2dd695be3f378a019581447b52738bdcc`.

Rationale: Supersede the complete unheaded-block-14 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchrequest-outer-core. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "(`executorId | for | work | assignment | stage | needsSoul |". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
**Implementation status.** No single typed `DispatchRequest` object exists
yet. `compileDispatchPlan()`'s options bag
(`executorId | for | work | assignment | stage | needsSoul |
hasLiveTaskAccess | caller | cliOverride | options`) is the de facto request
shape today — untyped, and `work`/`assignment` are resolved to a
capability/executor-id *inside* `plan.mjs` rather than by the caller before
the boundary. Introducing a normalized `DispatchRequest` helper near
`plan.mjs` without changing `compileDispatchPlan`'s role as the sole
execution chooser is Slice D scope.
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_2de3ff94e2a72a014c15799b9ae43f2b

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-16` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `250ec2e00a19da1f8b1d5e457e45fc375c7d2cd648dc3ee53d9b08ff1e6716e2`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch`; native digest `36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989`; whole shown digest `9d356c7d4553337e4ea8d396f8ac84ea41df6809bcc86e77d5537c806f29e532`.

Rationale: Supersede the complete unheaded-block-16 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "→ trusted human/CLI override". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_9ef3c80fdfe0d056a4520028d43ed96c

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-17` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `fcd98567b2d5218f8f72e677335a5a8a73ee4ed19bfe73947a05b59b9a80fcce`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch`; native digest `36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989`; whole shown digest `9d356c7d4553337e4ea8d396f8ac84ea41df6809bcc86e77d5537c806f29e532`.

Rationale: Supersede the complete unheaded-block-17 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "Merge rules (already accepted and enforced):". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Merge rules (already accepted and enforced):
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_0083b06d7d1bba8445d501c6b650fee0

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-18` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `3583305de78b7cdc72b5867540aaa0a18573358477c8db746e6c36ef1aa3d05d`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch`; native digest `36695f40c8dcd1f98944f0e05e72217b0e13d6bbc80aa925e4c8923448349989`; whole shown digest `9d356c7d4553337e4ea8d396f8ac84ea41df6809bcc86e77d5537c806f29e532`.

Rationale: Supersede the complete unheaded-block-18 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#policypatch. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "- tier constraints accumulate monotonically — a weaker layer cannot lower a". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_342a3db7d55d432f8e005476d2d84a83

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-22` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `63a4fbd17351a5c00639252f11e139f33cbb60bbef50e0975fc2336029db422a`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime`; native digest `a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567`; whole shown digest `b93376611d0d1f508a68c27e000c76e1656c6ba5f4daedc6d2f29521281681b8`.

Rationale: Supersede the complete unheaded-block-22 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "**Implementation status.** Implemented for dispatchable plans.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
**Implementation status.** Implemented for dispatchable plans.
`compileDispatchPlan()` (`src/runner/dispatch/plan.mjs`) returns the legacy
selector/mechanism fields plus `bindingSource`, `tier`, `model`,
`providerModel`, structured field-level `provenance`, and the complete
merged `policy`. It delegates those policy fields to
`resolveAssignmentDispatchPolicy()` rather than re-deriving them, and
`assignment-runner.mjs` now reads `compiledPlan.policy` directly instead of
calling the policy resolver a second time.
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_2e3d3130591aa534a5bb9ccab93cde3b

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-23` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `2686eec825341d5a13dae16a78affdf85f050be78ac38a4b3fc62c3d39001171`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime`; native digest `a45ae72abffaf471700451bb238774e045b81bbd3818512a9709af2b54c02567`; whole shown digest `b93376611d0d1f508a68c27e000c76e1656c6ba5f4daedc6d2f29521281681b8`.

Rationale: Supersede the complete unheaded-block-23 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#dispatchplan-core-runtime. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "synthesizes the smallest policy object needed for observability:". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
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
~~~~

### claim_aca867e065269cdc1b7bff0124e41415

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-28` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `95a2b7c5b5d00e917f2c042d1d49d3829b707933cfea28a3d65f1887744d1c08`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership`; native digest `2733a56fe75fb75ffd77892a1cbc0937340927f3c7727df7cc59446f24be91ce`; whole shown digest `0c74651edd5b7e919916e16bb79bbe5536883eb24333911502d943c37f14d833`.

Rationale: Supersede the complete unheaded-block-28 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "1. **Request normalizer** — accepts only a normalized capability/executor". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
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
~~~~

### claim_7e18dccb4fe896af8b83a2b5de4c266f

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-30` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `e9b40512995229674223f2e51e2cf80e9bc9f95814714f443178d73d8bcece52`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership`; native digest `2733a56fe75fb75ffd77892a1cbc0937340927f3c7727df7cc59446f24be91ce`; whole shown digest `0c74651edd5b7e919916e16bb79bbe5536883eb24333911502d943c37f14d833`.

Rationale: Supersede the complete unheaded-block-30 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "- no workflow/stage/task/skill lookup: dispatch core contains no Work lookup implementations. Work capability lookups (`executorIdForWork`, `resolveCapabilityIdentityDetails`, `resolveCapabilityIdentity`, `buildPrompt`) are housed in dedicated leaf compatibility module `src/runner/work-compat.mjs` (registered as `infra` in architecture manifest) with zero imports into dispatch core; `src/runner/dispatch/resolve.mjs` and `prepare.mjs` provide backward-compatible re-exports without importing `workflow-stage-graphs` or `operation-choice.mjs`, consumed by pre-existing callers (`plan.mjs` for `compileDispatchPlan({work})` and `cli.mjs` for `spawnWorker`). All 13 strictly decoupled dispatch core modules contain zero `workflow-stage-graphs` imports, and boundary tests enforce that strict core modules cannot import Work lookup symbols or `work-compat.mjs` (verified by `test/runner/dispatch-reconciliation-import-graph.test.mjs`);". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no workflow/stage/task/skill lookup: dispatch core contains no Work lookup implementations. Work capability lookups (`executorIdForWork`, `resolveCapabilityIdentityDetails`, `resolveCapabilityIdentity`, `buildPrompt`) are housed in dedicated leaf compatibility module `src/runner/work-compat.mjs` (registered as `infra` in architecture manifest) with zero imports into dispatch core; `src/runner/dispatch/resolve.mjs` and `prepare.mjs` provide backward-compatible re-exports without importing `workflow-stage-graphs` or `operation-choice.mjs`, consumed by pre-existing callers (`plan.mjs` for `compileDispatchPlan({work})` and `cli.mjs` for `spawnWorker`). All 13 strictly decoupled dispatch core modules contain zero `workflow-stage-graphs` imports, and boundary tests enforce that strict core modules cannot import Work lookup symbols or `work-compat.mjs` (verified by `test/runner/dispatch-reconciliation-import-graph.test.mjs`);
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private dispatch path for a coordination or domain harness —
  `cohort-planner.mjs` is the one confirmed exception, and it only *re-reads*
  `resolveExecutorConfig`/`resolveAssignmentDispatchPolicy` for a
  pre-dispatch feasibility check; it never spawns and never bypasses them.
~~~~

#### Complete current counterpart

~~~~markdown
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
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
~~~~

### claim_6f5b02ddd1f0ecb1dcb7053bbabca278

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-7` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `58d62d1e2fb7ced0af3003179e67762eda8bb0b99d37ed17185eb92dafb80d52`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities`; native digest `9346bcff67d284b8b32d0fbdc8b35e9da446a76e5f244fc7e6c89d68c958d671`; whole shown digest `c7634d6197f50b6174b05b60d0164fac0837a06cce0efe17c6cd71abdf38c720`.

Rationale: Supersede the complete unheaded-block-7 historical source unit with docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities. The current counterpart separates proposed typed request/policy shapes from actual compiler inputs, literal/default/capability-prefer binding, rigor/workflowStep policy derivation, and the real runtime/governance ownership. Source-specific changed wording: "capability   — abstract behavior promise, resolved through". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[]
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```
~~~~

#### Complete current counterpart

~~~~markdown
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
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
~~~~

### claim_d1ce767a2e3239b22d2e9fc6649dd9a5

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-8` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `212ffb52fe719fef01a51f585286aedd6792e48d063ada3a2663933e7c2593ec`.

Target: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities`; native digest `9346bcff67d284b8b32d0fbdc8b35e9da446a76e5f244fc7e6c89d68c958d671`; whole shown digest `c7634d6197f50b6174b05b60d0164fac0837a06cce0efe17c6cd71abdf38c720`.

Rationale: Whole-unit replacement, not a structural move or promotion: The complete purpose/capability/executor identity explanation is replaced by the current prefer-only binding, removed resolver name, compatibility selector and dated normalization context. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
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
~~~~

#### Complete current counterpart

~~~~markdown
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
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
~~~~

### claim_ab4146aee9d8e1ab49e57748fbaa4c68

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#1-responsibility-and-inputs` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `583bd631a1d233c2e52bf4e8c7b256f75abc8054524fd3887109b54f35cd574d`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#1-responsibility-and-inputs`; native digest `f97c6b9e2271690437b10e8b0557b6c0afc97b598e3dcf1e527f30d8e4129ac0`; whole shown digest `d97eaab8f245e1fed6bf0a80940132e28a36243cafe6b1211f45469e7879d753`.

Rationale: Supersede the complete 1-responsibility-and-inputs historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#1-responsibility-and-inputs. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "## 1. Responsibility And Inputs". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 1. Responsibility And Inputs

| Stage | Owner | Output |
|---|---|---|
| Worker result interpretation | Existing normalizer/evaluator | Per-Run result; not an executor-health judgment. |
| Liveness classification | Existing signal ladder | Nonterminal or settled/blocked/died/ceiling/paused-limit/idle outcome. |
| Effect and workspace retry eligibility | Operation recovery adapter plus runtime facts | Eligible/reconcile/forbidden verdict. |
| Retry/park/halt and bounds | Existing recovery matrix, extended with an explicit runtime projection | Coarse decision and cap reasons. |
| Candidate ordering | Pure fallback resolver | Ordered selection/rejections. |
| Governance | Existing compileDispatchPlan and Confinement Authority | Governed plan, then runtime enforcement before launch. |
| Admission | Run repository | One durable current attempt under authority. |

The application service composes these stages. Fallback receives values, never
calls herdr, traverses session graphs, moves Work or normalizes evidence.

FailureObservationV1:
`{contract: executor-failure-observation.v1, observationId,
assignmentId, runId, attempt, executorId, capability,
resourceScope, outcome, evidenceRefs, observedAt}`.
ResourceScope is optional provider/account/model identifiers without credentials.
Outcome is a discriminated union:
- infra-ok;
- ladder with `outcome` nullable while nonterminal, delivery, outputBytes,
  rawLimitLineRef?, retryAfter?;
- launch-failed with phase and creation/delivery certainty;
- config-invalid with typed code;
- confinement-refused with attestation/refusal ref.
Success/config/launch outcomes do not require fabricated ladder values.
~~~~

#### Complete current counterpart

~~~~markdown
## 1. Responsibility And Inputs

| Stage | Owner | Output |
|---|---|---|
| Worker result interpretation | Existing normalizer/evaluator | Per-Run result; not an executor-health judgment. |
| Liveness classification | Existing signal ladder | Nonterminal or settled/blocked/died/timed-out-ceiling/provider-limit/timed-out-idle; `paused-limit` is a compatibility pane-fate alias, not evaluateLadder's emitted limit outcome. |
| Effect and workspace retry eligibility | Operation recovery adapter plus runtime facts | Eligible/reconcile/forbidden verdict. |
| Retry/park/halt and bounds | Existing recovery matrix, extended with an explicit runtime projection | Coarse decision and cap reasons. |
| Candidate ordering | Pure fallback resolver | Ordered selection/rejections. |
| Governance | Existing compileDispatchPlan and Confinement Authority | Governed plan, then runtime enforcement before launch. |
| Admission | Run repository | One durable current attempt under authority. |

The application service composes these stages. Fallback receives values, never
calls herdr, traverses session graphs, moves Work or normalizes evidence.

FailureObservationV1:
`{contract: executor-failure-observation.v1, observationId,
assignmentId, runId, attempt, executorId, capability,
resourceScope, outcome, evidenceRefs, observedAt}`.
ResourceScope is optional provider/account/model identifiers without credentials.
Outcome is a discriminated union:
- infra-ok;
- ladder with `outcome` nullable while nonterminal, delivery, outputBytes,
  rawLimitLineRef?, retryAfter?;
- launch-failed with phase and creation/delivery certainty;
- config-invalid with typed code;
- confinement-refused with attestation/refusal ref.
Success/config/launch outcomes do not require fabricated ladder values.
~~~~

### claim_2ff575998d2ae90d5ecc1a2d414d078d

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `dbaf1434220173d1544ccc02f9daa13ca9f87453ace7ad899ef0b8167d758b97`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics`; native digest `21295b47dae8583ef4b70ea406ad45275bdb1902af772589db488dafa179f7c8`; whole shown digest `a35fb469efa3a059e4b81b4abc4cf83ce4f35ea323bb4a311e8f380003086bdc`.

Rationale: Whole-unit replacement, not a structural move or promotion: Every ladder clause has a current counterpart: truth, blocked-before-timeout with the adapter/retry proposal boundary, consecutive death, absolute ceiling, working/blind-time and early screen probing; second-stage samples, default failure retention, protected limits, destructive intent, no status/idleness completion inference and all zero-output/handshake/retryAfter distinctions remain. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout: answer the existing question, do not retry.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Only stale evaluation reads screen; working itself is progress even with zero
   stdout, and blind intervals are subtracted from idle duration.

A screen request is a second stage of the same sample, not another death reading.
Keep all failure panes by default. Paused-limit survives automated closeAlways;
operator destructive intent is separate and guarded. Never infer Run completion
from agent_status or pane idleness.

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
~~~~

#### Complete current counterpart

~~~~markdown
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
~~~~

### claim_5f1ed90b8f9d90a9154d031de27371f6

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `8252eff8a9dcd8ffb252ae6aa6e8651dd50e334bb5c3a8935064430abbab643a`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping`; native digest `4f10d6082daebad81a53b4f06c9d44fa3187f4d894791d39783017ff77e5fcbf`; whole shown digest `a0076bb00087eccdadf3f5e6a24adeb337f2b7cfe70fc1af37321d9b494bbb3b`.

Rationale: Supersede the complete 3-coarse-matrix-mapping historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "For timed-out-ceiling, original session/Run bounds remain binding; an expired". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 3. Coarse Matrix Mapping

Extend the existing recovery module's runtime-facing pure entry rather than
creating a parallel matrix. Preserve `resolveAction(errorClass, claimAttempt)`
for its current Work-runner callers and `resolveStaleDoing` semantics.

| Observation | Existing class / composed action |
|---|---|
| Creation failure proven before delivery | worker-spawn-fail; retry eligibility and bounds still required. |
| timed-out-idle or timed-out-ceiling | worker-timeout; never proof the worker is dead. |
| died without result | worker-spawn-fail for coarse retry class, with original died outcome retained; effect/quiescence gate remains mandatory. |
| paused-limit / blocked | **Proposed behavior change:** park current Run, before retry matrix. Existing callers currently classify these through the retry matrix; S0 must freeze that behavior and this mapping cannot ship as a silent port. |
| Nonterminal/present worker | wait; no failure classification or candidate selection. |
| Unknown delivery or effects | reconcile then park if unresolved. |
| Config-invalid / confinement-refused | refuse current dispatch; do not try another candidate to bypass policy. |
| Semantic RunResult rejection | No infrastructure fallback; caller decides a new semantic operation/recheck if authorized. |
| Unmapped internal error class | Preserve recovery matrix halt, scope reported to caller. |
| dispatch-in-flight | Admission contention, not health; wait/re-read without consuming a Run attempt. |

`verify-miss`, `verify-timeout`, `worktree-fail`, `reject-returned`,
`stale-doing` and `state-conflict` keep their Work-runner meaning. Do not route
them into executor fallback simply because some coarse entries say retry.
For timed-out-ceiling, original session/Run bounds remain binding; an expired
session cannot dispatch a fallback. An eligible retry under still-valid session
authority gets its own bounded Run; it does not extend the old Run ceiling.
~~~~

#### Complete current counterpart

~~~~markdown
## 3. Coarse Matrix Mapping

Extend the existing recovery module's runtime-facing pure entry rather than
creating a parallel matrix. Preserve `resolveAction(errorClass, claimAttempt)`
for its current Work-runner callers and `resolveStaleDoing` semantics.

| Observation | Existing class / composed action |
|---|---|
| Creation failure proven before delivery | worker-spawn-fail; retry eligibility and bounds still required. |
| timed-out-idle or timed-out-ceiling | worker-timeout; never proof the worker is dead. |
| died without result | worker-spawn-fail for coarse retry class, with original died outcome retained; effect/quiescence gate remains mandatory. |
| paused-limit / blocked | **Proposed behavior change:** park current Run, before retry matrix. Existing callers currently classify these through the retry matrix; S0 must freeze that behavior and this mapping cannot ship as a silent port. |
| Nonterminal/present worker | wait; no failure classification or candidate selection. |
| Unknown delivery or effects | reconcile then park if unresolved. |
| Config-invalid / confinement-refused | refuse current dispatch; do not try another candidate to bypass policy. |
| Semantic RunResult rejection | No infrastructure fallback; caller decides a new semantic operation/recheck if authorized. |
| Unmapped internal error class | Preserve recovery matrix halt, scope reported to caller. |
| dispatch-in-flight | Admission contention, not health; wait/re-read without consuming a Run attempt. |

`verify-miss`, `verify-timeout`, `worktree-fail`, `reject-returned`,
`stale-doing` and `state-conflict` keep their Work-runner meaning. Do not route
them into executor fallback simply because some coarse entries say retry.
For timed-out-ceiling, the Run's applicable admission/budget bounds remain
binding. Retry does not extend the failed Run's ceiling; a replacement needs
its own eligible admission. No current session graph grants fallback authority.
~~~~

### claim_f6a2a4af7834e2209c2aa0d79096a0f5

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `96cda438ce7e6fc77e434e10cae074538b8e2062c3f9e05b4a759c7aab8b0b30`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps`; native digest `2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc`; whole shown digest `24937a73bd18414132fa0d84d732905eb7a009b7f92125f8097f9382f3096d3c`.

Rationale: Supersede the complete 4-one-attempt-history-explicit-caps historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "Canonical count A = number of committed admissions for the Assignment, including". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 4. One Attempt History, Explicit Caps

Canonical count A = number of committed admissions for the Assignment, including
admitted attempts that failed before launch. It never resets on restart, changed
executor, changed error class or a new observer. Repeating an admissionKey does
not increment A. Pure refusal before admission consumes no attempt.

For executor e, E(e) counts those same admissions selecting e.
Retry count R = max(0, A - 1). Session retry declarations may reserve the next
attempt before it is admitted; a pending declaration is resumed, not counted as
a completed extra Run. Reservation checks include any outstanding declaration.

Default policy is a derived view of effective DispatchRequest/PolicyPatch:
- candidates = unique `[selected primary, ...fallbackExecutors]`, preserving order;
- maxAttemptsPerExecutor = 1;
- maxAttemptsPerAssignment = 2 (the existing recovery default's total-attempt
  threshold for a retryable runtime failure);
- no automatic retry-same; no fallback if explicitly pinned no-fallback;
- no observation store, cooldown or scoring;
- retry backoff remains the caller's existing bounded scheduling policy; no new
  configurable exponential-backoff subsystem in the default.

A candidate can be admitted only if A < maxAttemptsPerAssignment and
E(candidate) < maxAttemptsPerExecutor. With maxAttempts=2, initial Run 1 fails,
Run 2 may use the next candidate; no third admission. The Session's existing
maxRetries counts retry declarations after the initial attempt: its allowance is
`1 + maxRetries` total attempts, not a number directly passed to the old
per-class claim resolver. The stricter effective cap always wins. Other session
assignment/concurrency/wall-time bounds remain independent predicates.

The runtime projection consumes the SAME recovery table's action/default limit,
using Assignment admission history as its counter input; it does not reset on
class changes. Existing claim-scoped callers of resolveAction keep their current
counter semantics. Name both scopes in APIs/tests so one integer is not silently
reinterpreted. Future policy can permit retry-same with the same history and caps,
but that is not today's default E-b proof.
~~~~

#### Complete current counterpart

~~~~markdown
## 4. One Attempt History, Explicit Caps

Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.

The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.

The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.

Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
~~~~

### claim_a8e8f9d7c1d2f985d88ee5d6e30bc292

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `78463f312d40cdd4e084be386e5490f45e483c7cf982721776a24ae28402186b`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport`; native digest `b1d381bbc887443b7cf100e3487266740edf4f45898aec8b14065bfa410ef8b5`; whole shown digest `e7b631e965372b0c49aecb1ba97379fe13dea24b051dd7cd4742210a93587415`.

Rationale: Supersede the complete 5-effectguaranteeport historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "The operation contract declares repeat mode explicitly: before-delivery-only,". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 5. EffectGuaranteePort

`assess({operationContractRef, assignmentRef, sourceRunId,
recoveryMaterialRef, destinationExecutorFacts, now})` returns a typed verdict:
- eligible with guarantee;
- reconcile with required fact refs/reason;
- forbidden with reason.

The operation contract declares repeat mode explicitly: before-delivery-only,
read-only, idempotent, dedup-keyed or never. The first protocol profile declares
`repeatMode: read-only` in its review/red-team YAML operation contracts. The
read-only effect boundary is derived from the selected executor's DispatchPlan
(`providerModel` and executor facts): provider endpoints may be allowed, while
unlisted external sinks are denied. Operations declare only sinks whose repeated
write is part of their contract; a sink that can change outcome needs its own
dedup identity. The runtime never infers this from `Assignment.mutation`.
Missing/unknown mode cannot authorize automatic
retry after possible delivery. The adapter verifies facts appropriate to that
mode, rather than demanding every idempotent operation have a dedup service.

| Guarantee | Required evidence |
|---|---|
| no-delivery | Proof original launch/input was never delivered and no pending command can later deliver it. |
| read-only | Actual permitted effect scope; writable output artifacts isolated per Run and no unaccounted external mutation. |
| idempotent | Operation contract version, same logical input/effect identity, and evidence that repetition satisfies its operation-specific invariant. |
| deduplicated | Stable effect key, input digest, effect-boundary namespace, verified dedup capability, validity window and destination compatibility. |

All eligible outcomes carry source Run, operation contract digest, input/effect
identity, evidence refs and assessedAt; window end is explicit when relevant.
The effect identity stays stable across attempts, unlike runId. Destination
selection revalidates that the same guarantee holds for that candidate.
`Assignment.mutation` remains descriptive and is not an effect guarantee.
`effectsObserved: false` is not proof of no effects; boolean labels cannot replace
typed unknown/reconcile outcomes. A generic effect ledger is not required.

For writable takeover, eligibility additionally requires proof all old writers
are stopped or deprived of access, and a held exclusive workspace grant. A dead
main PID or a closed pane is insufficient for surviving descendants. New isolated
workspaces can retain read-only snapshots of prior work, but cannot bypass
unknown external effects. Material and grants are passed through the existing
confinement/runtime boundary, not written into immutable Assignment semantics.
~~~~

#### Complete current counterpart

~~~~markdown
## 5. EffectGuaranteePort

`assess({operationContractRef, assignmentRef, sourceRunId,
recoveryMaterialRef, destinationExecutorFacts, now})` returns a typed verdict:
- eligible with guarantee;
- reconcile with required fact refs/reason;
- forbidden with reason.

An operation's repeat mode must be explicit; it is not inferred from
`Assignment.mutation`. Supported current policy values are checked by
`assignment-policy.mjs:439-453`, and recovery assessment refuses to infer mode
(`src/runner/dispatch/recovery.mjs:201-206`). No current review/red-team YAML
profile is claimed here to declare `repeatMode: read-only`.

The following effect-sink, deduplication and guarantee model belongs to the
proposed EffectGuaranteePort, not a shipped generic effect ledger. Operations
would need their own effect identity and adapter proof before enabling it.
Missing/unknown mode cannot authorize automatic
retry after possible delivery. The adapter verifies facts appropriate to that
mode, rather than demanding every idempotent operation have a dedup service.

| Guarantee | Required evidence |
|---|---|
| no-delivery | Proof original launch/input was never delivered and no pending command can later deliver it. |
| read-only | Actual permitted effect scope; writable output artifacts isolated per Run and no unaccounted external mutation. |
| idempotent | Operation contract version, same logical input/effect identity, and evidence that repetition satisfies its operation-specific invariant. |
| deduplicated | Stable effect key, input digest, effect-boundary namespace, verified dedup capability, validity window and destination compatibility. |

All eligible outcomes carry source Run, operation contract digest, input/effect
identity, evidence refs and assessedAt; window end is explicit when relevant.
The effect identity stays stable across attempts, unlike runId. Destination
selection revalidates that the same guarantee holds for that candidate.
`Assignment.mutation` remains descriptive and is not an effect guarantee.
`effectsObserved: false` is not proof of no effects; boolean labels cannot replace
typed unknown/reconcile outcomes. A generic effect ledger is not required.

For writable takeover, eligibility additionally requires proof all old writers
are stopped or deprived of access, and a held exclusive workspace grant. A dead
main PID or a closed pane is insufficient for surviving descendants. New isolated
workspaces can retain read-only snapshots of prior work, but cannot bypass
unknown external effects. Material and grants are passed through the existing
confinement/runtime boundary, not written into immutable Assignment semantics.
~~~~

### claim_389748ac69ec4431898b33b9d3cbaa7a

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-11` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `d53bfd97c7c9bb4662d383886334ce53d28e853d76e8d7c50d0913a2ed431269`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping`; native digest `4f10d6082daebad81a53b4f06c9d44fa3187f4d894791d39783017ff77e5fcbf`; whole shown digest `a0076bb00087eccdadf3f5e6a24adeb337f2b7cfe70fc1af37321d9b494bbb3b`.

Rationale: Supersede the complete unheaded-block-11 historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#3-coarse-matrix-mapping. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "For timed-out-ceiling, original session/Run bounds remain binding; an expired". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
`verify-miss`, `verify-timeout`, `worktree-fail`, `reject-returned`,
`stale-doing` and `state-conflict` keep their Work-runner meaning. Do not route
them into executor fallback simply because some coarse entries say retry.
For timed-out-ceiling, original session/Run bounds remain binding; an expired
session cannot dispatch a fallback. An eligible retry under still-valid session
authority gets its own bounded Run; it does not extend the old Run ceiling.
~~~~

#### Complete current counterpart

~~~~markdown
## 3. Coarse Matrix Mapping

Extend the existing recovery module's runtime-facing pure entry rather than
creating a parallel matrix. Preserve `resolveAction(errorClass, claimAttempt)`
for its current Work-runner callers and `resolveStaleDoing` semantics.

| Observation | Existing class / composed action |
|---|---|
| Creation failure proven before delivery | worker-spawn-fail; retry eligibility and bounds still required. |
| timed-out-idle or timed-out-ceiling | worker-timeout; never proof the worker is dead. |
| died without result | worker-spawn-fail for coarse retry class, with original died outcome retained; effect/quiescence gate remains mandatory. |
| paused-limit / blocked | **Proposed behavior change:** park current Run, before retry matrix. Existing callers currently classify these through the retry matrix; S0 must freeze that behavior and this mapping cannot ship as a silent port. |
| Nonterminal/present worker | wait; no failure classification or candidate selection. |
| Unknown delivery or effects | reconcile then park if unresolved. |
| Config-invalid / confinement-refused | refuse current dispatch; do not try another candidate to bypass policy. |
| Semantic RunResult rejection | No infrastructure fallback; caller decides a new semantic operation/recheck if authorized. |
| Unmapped internal error class | Preserve recovery matrix halt, scope reported to caller. |
| dispatch-in-flight | Admission contention, not health; wait/re-read without consuming a Run attempt. |

`verify-miss`, `verify-timeout`, `worktree-fail`, `reject-returned`,
`stale-doing` and `state-conflict` keep their Work-runner meaning. Do not route
them into executor fallback simply because some coarse entries say retry.
For timed-out-ceiling, the Run's applicable admission/budget bounds remain
binding. Retry does not extend the failed Run's ceiling; a replacement needs
its own eligible admission. No current session graph grants fallback authority.
~~~~

### claim_64841e2814f9e18b59ad1c570b1d7939

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-12` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `4f5b345592d0f6896a7498c30cf5ad5c2646819c56a4c14073fea0f4e649b9a6`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps`; native digest `2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc`; whole shown digest `24937a73bd18414132fa0d84d732905eb7a009b7f92125f8097f9382f3096d3c`.

Rationale: Supersede the complete unheaded-block-12 historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "Canonical count A = number of committed admissions for the Assignment, including". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Canonical count A = number of committed admissions for the Assignment, including
admitted attempts that failed before launch. It never resets on restart, changed
executor, changed error class or a new observer. Repeating an admissionKey does
not increment A. Pure refusal before admission consumes no attempt.
~~~~

#### Complete current counterpart

~~~~markdown
## 4. One Attempt History, Explicit Caps

Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.

The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.

The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.

Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
~~~~

### claim_5979cfd8120d760254dde6ce536f748b

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-13` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `c06867e1d5ad0eafdb6e2cc1dbbf368b1d229e4604c31ea33eb287de111198a3`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps`; native digest `2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc`; whole shown digest `24937a73bd18414132fa0d84d732905eb7a009b7f92125f8097f9382f3096d3c`.

Rationale: Supersede the complete unheaded-block-13 historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "For executor e, E(e) counts those same admissions selecting e.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
For executor e, E(e) counts those same admissions selecting e.
Retry count R = max(0, A - 1). Session retry declarations may reserve the next
attempt before it is admitted; a pending declaration is resumed, not counted as
a completed extra Run. Reservation checks include any outstanding declaration.
~~~~

#### Complete current counterpart

~~~~markdown
## 4. One Attempt History, Explicit Caps

Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.

The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.

The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.

Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
~~~~

### claim_e762a052559d38e47e84dd142cc1e084

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-14` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `ceebada3611071e2438d0b4edb36ff1b583f1ab012e449e5891243d8a9fd682b`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps`; native digest `2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc`; whole shown digest `24937a73bd18414132fa0d84d732905eb7a009b7f92125f8097f9382f3096d3c`.

Rationale: Supersede the complete unheaded-block-14 historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "Default policy is a derived view of effective DispatchRequest/PolicyPatch:". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Default policy is a derived view of effective DispatchRequest/PolicyPatch:
- candidates = unique `[selected primary, ...fallbackExecutors]`, preserving order;
- maxAttemptsPerExecutor = 1;
- maxAttemptsPerAssignment = 2 (the existing recovery default's total-attempt
  threshold for a retryable runtime failure);
- no automatic retry-same; no fallback if explicitly pinned no-fallback;
- no observation store, cooldown or scoring;
- retry backoff remains the caller's existing bounded scheduling policy; no new
  configurable exponential-backoff subsystem in the default.
~~~~

#### Complete current counterpart

~~~~markdown
## 4. One Attempt History, Explicit Caps

Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.

The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.

The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.

Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
~~~~

### claim_5f806e1511b3cc49b3c6b94c4ebb9f26

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-15` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `8351d265484b0dd81108f0aa35df62589eb3292ab052cf6dffe7fa9a2d14214c`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps`; native digest `2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc`; whole shown digest `24937a73bd18414132fa0d84d732905eb7a009b7f92125f8097f9382f3096d3c`.

Rationale: Supersede the complete unheaded-block-15 historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "A candidate can be admitted only if A < maxAttemptsPerAssignment and". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
A candidate can be admitted only if A < maxAttemptsPerAssignment and
E(candidate) < maxAttemptsPerExecutor. With maxAttempts=2, initial Run 1 fails,
Run 2 may use the next candidate; no third admission. The Session's existing
maxRetries counts retry declarations after the initial attempt: its allowance is
`1 + maxRetries` total attempts, not a number directly passed to the old
per-class claim resolver. The stricter effective cap always wins. Other session
assignment/concurrency/wall-time bounds remain independent predicates.
~~~~

#### Complete current counterpart

~~~~markdown
## 4. One Attempt History, Explicit Caps

Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.

The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.

The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.

Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
~~~~

### claim_14196364b2969e5f8e346f512e113fbb

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-16` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `2591a85c59e7bd2ddc86f8251405aba66e1fc9dcb6f5bd99f8666180c20a82a1`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps`; native digest `2f23cfb828da8d49550ee62f606921a1b0c87b974326553ee6c7afb59dff9fbc`; whole shown digest `24937a73bd18414132fa0d84d732905eb7a009b7f92125f8097f9382f3096d3c`.

Rationale: Supersede the complete unheaded-block-16 historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#4-one-attempt-history-explicit-caps. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "The runtime projection consumes the SAME recovery table's action/default limit,". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
The runtime projection consumes the SAME recovery table's action/default limit,
using Assignment admission history as its counter input; it does not reset on
class changes. Existing claim-scoped callers of resolveAction keep their current
counter semantics. Name both scopes in APIs/tests so one integer is not silently
reinterpreted. Future policy can permit retry-same with the same history and caps,
but that is not today's default E-b proof.
~~~~

#### Complete current counterpart

~~~~markdown
## 4. One Attempt History, Explicit Caps

Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.

The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.

The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.

Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
~~~~

### claim_b4a5ab776d481422d642def3422f56b0

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-18` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `971881e56230e867df9e3128911645fdea0daf5002ef793a8a77efd91a1df36c`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport`; native digest `b1d381bbc887443b7cf100e3487266740edf4f45898aec8b14065bfa410ef8b5`; whole shown digest `e7b631e965372b0c49aecb1ba97379fe13dea24b051dd7cd4742210a93587415`.

Rationale: Supersede the complete unheaded-block-18 historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#5-effectguaranteeport. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "The operation contract declares repeat mode explicitly: before-delivery-only,". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
The operation contract declares repeat mode explicitly: before-delivery-only,
read-only, idempotent, dedup-keyed or never. The first protocol profile declares
`repeatMode: read-only` in its review/red-team YAML operation contracts. The
read-only effect boundary is derived from the selected executor's DispatchPlan
(`providerModel` and executor facts): provider endpoints may be allowed, while
unlisted external sinks are denied. Operations declare only sinks whose repeated
write is part of their contract; a sink that can change outcome needs its own
dedup identity. The runtime never infers this from `Assignment.mutation`.
Missing/unknown mode cannot authorize automatic
retry after possible delivery. The adapter verifies facts appropriate to that
mode, rather than demanding every idempotent operation have a dedup service.
~~~~

#### Complete current counterpart

~~~~markdown
## 5. EffectGuaranteePort

`assess({operationContractRef, assignmentRef, sourceRunId,
recoveryMaterialRef, destinationExecutorFacts, now})` returns a typed verdict:
- eligible with guarantee;
- reconcile with required fact refs/reason;
- forbidden with reason.

An operation's repeat mode must be explicit; it is not inferred from
`Assignment.mutation`. Supported current policy values are checked by
`assignment-policy.mjs:439-453`, and recovery assessment refuses to infer mode
(`src/runner/dispatch/recovery.mjs:201-206`). No current review/red-team YAML
profile is claimed here to declare `repeatMode: read-only`.

The following effect-sink, deduplication and guarantee model belongs to the
proposed EffectGuaranteePort, not a shipped generic effect ledger. Operations
would need their own effect identity and adapter proof before enabling it.
Missing/unknown mode cannot authorize automatic
retry after possible delivery. The adapter verifies facts appropriate to that
mode, rather than demanding every idempotent operation have a dedup service.

| Guarantee | Required evidence |
|---|---|
| no-delivery | Proof original launch/input was never delivered and no pending command can later deliver it. |
| read-only | Actual permitted effect scope; writable output artifacts isolated per Run and no unaccounted external mutation. |
| idempotent | Operation contract version, same logical input/effect identity, and evidence that repetition satisfies its operation-specific invariant. |
| deduplicated | Stable effect key, input digest, effect-boundary namespace, verified dedup capability, validity window and destination compatibility. |

All eligible outcomes carry source Run, operation contract digest, input/effect
identity, evidence refs and assessedAt; window end is explicit when relevant.
The effect identity stays stable across attempts, unlike runId. Destination
selection revalidates that the same guarantee holds for that candidate.
`Assignment.mutation` remains descriptive and is not an effect guarantee.
`effectsObserved: false` is not proof of no effects; boolean labels cannot replace
typed unknown/reconcile outcomes. A generic effect ledger is not required.

For writable takeover, eligibility additionally requires proof all old writers
are stopped or deprived of access, and a held exclusive workspace grant. A dead
main PID or a closed pane is insufficient for surviving descendants. New isolated
workspaces can retain read-only snapshots of prior work, but cannot bypass
unknown external effects. Material and grants are passed through the existing
confinement/runtime boundary, not written into immutable Assignment semantics.
~~~~

### claim_d283a70392cc071ee19d103f77228841

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-6` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `3cf3dc60ee31fd5df6ab2864b92ed1f3bdc96982df814f65c4afb545b4458957`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics`; native digest `21295b47dae8583ef4b70ea406ad45275bdb1902af772589db488dafa179f7c8`; whole shown digest `a35fb469efa3a059e4b81b4abc4cf83ce4f35ea323bb4a311e8f380003086bdc`.

Rationale: Whole-unit replacement, not a structural move or promotion: All five numbered ladder clauses have current counterparts, including explicit proposed no-retry behavior versus the current adapter/recovery mapping and the early credential probe versus stale-only screen reads; working and blind-time obligations remain. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout: answer the existing question, do not retry.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Only stale evaluation reads screen; working itself is progress even with zero
   stdout, and blind intervals are subtracted from idle duration.
~~~~

#### Complete current counterpart

~~~~markdown
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
~~~~

### claim_bf85c9cf436ce088c700c256f10da53f

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-7` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `16a6a7ab095e99754b130605651b5c88ba99d377a3a22f140b254077ba6733fb`.

Target: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics`; native digest `21295b47dae8583ef4b70ea406ad45275bdb1902af772589db488dafa179f7c8`; whole shown digest `a35fb469efa3a059e4b81b4abc4cf83ce4f35ea323bb4a311e8f380003086bdc`.

Rationale: Supersede the complete unheaded-block-7 historical source unit with docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics. The current counterpart distinguishes the actual recovery signal vocabulary, attempt-history/context-budget behaviour and effect/result classification from unimplemented health, health-matrix and EffectGuaranteePort design. Source-specific changed wording: "A screen request is a second stage of the same sample, not another death reading.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
A screen request is a second stage of the same sample, not another death reading.
Keep all failure panes by default. Paused-limit survives automated closeAlways;
operator destructive intent is separate and guarded. Never infer Run completion
from agent_status or pane idleness.
~~~~

#### Complete current counterpart

~~~~markdown
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
~~~~

### claim_d3412d82559b826bec94f23111405667

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#declared-model` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `e258047b3d63502051a8afdfa893dafd6af23b6e36404d3eb464f9693b6463d5`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#declared-model`; native digest `54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff`; whole shown digest `4b916660fb807c4637f821f7754d1fbb4f9c639fddc3fbb71338b68165f5fe22`.

Rationale: Supersede the complete declared-model historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#declared-model. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "The same hard-and-soft shape may be used by a standalone Coordination Protocol". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## Declared Model

```txt
Workflow
  -> Stage graph
    -> Stage Protocol
      -> Stage Operation
        -> TaskSpec
        -> Skill(s)
        -> Role
        -> policy hints
```

The same hard-and-soft shape may be used by a standalone Coordination Protocol
when repeatability, auditability, or reusable doctrine justifies a predeclared
graph. A session is not required to select this model.
~~~~

#### Complete current counterpart

~~~~markdown
## Declared Model

```txt
Workflow
  -> step graph
    -> step operations
      -> TaskSpec
      -> Skill(s)
      -> Role
      -> policy hints
```

Current Workflow definitions normalize operations directly
(`src/workflow/definition.mjs:81-109`). No separately shipped Stage Protocol,
CoordinationProtocol or FlowDefinition engine sits between steps and operations.
~~~~

### claim_b62a54a1663d8ec3f97483c7c3696602

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#domain-augmentation` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `6a06c2d7a1a48d21bd95a1f73670aa6d5eb42e4493199e35e1b4b1bbe8a439e7`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#domain-augmentation`; native digest `719057129311d43f8d206c76a7d74e0e5ba1410de21d3b527729f45561e80ef1`; whole shown digest `cc89a329f26ff91efa2d1a150592feab41c24260d32fcc3f4e1aa4f5d989e39f`.

Rationale: Supersede the complete domain-augmentation historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#domain-augmentation. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "protocols, planning validators, resource/isolation analysis, evidence policy,". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## Domain Augmentation

Domains and organizations may add knowledge, doctrine, Skills, declared
protocols, planning validators, resource/isolation analysis, evidence policy,
roles, souls, and quality criteria. The foundation introduces a shared extension
seam only after at least two unlike consumers prove the common responsibility.
~~~~

#### Complete current counterpart

~~~~markdown
## Domain Augmentation

Domains and organizations may add knowledge, doctrine, Skills, declared
Workflow definitions/operations and domain harnesses, planning validators,
resource/isolation analysis, evidence policy, roles, souls and quality criteria.
The foundation introduces a shared extension seam only after at least two unlike
consumers prove the common responsibility.
~~~~

### claim_1d24205383b4179b3af1af8f9e4d4d64

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `0d1d772d1039f1306768adcb9ef903b45b2bfad44875af3f7646cc1585a0ead7`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources`; native digest `29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6`; whole shown digest `94247d76c3a055bc74b16955365bdd8952e7585c310050ea258df9a0aad26e4f`.

Rationale: Supersede the complete planning-sources historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "Per the [Agent Coordination Foundation Vision](../vision.md), a predeclared". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## Planning Sources

Per the [Agent Coordination Foundation Vision](../vision.md), a predeclared
Workflow or Coordination Protocol is optional. Coordination may obtain planning
and constraints from one or more composable sources:

```txt
Agent-led
  objective -> coordinator reasoning -> dynamic semantic task/Assignment

Declared
  Workflow / Coordination Protocol -> legal graph and operations

Domain-assisted
  agent or declared plan -> domain enrichment / validation / resource policy
```

All sources lower executable intent into the same governed
Assignment/dispatch/Run/RunResult runtime. No planning source is allowed to
create a private execution path.
~~~~

#### Complete current counterpart

~~~~markdown
## Planning Sources

Planning need not begin with a predeclared Workflow. Current execution accepts
Unit requests and Workflow execution; the retired CoordinationProtocol is not
another current declared-planning source.

```txt
Agent-led
  objective -> bounded Unit or validated inline Assignment

Declared
  Workflow -> dependent steps and operations -> Unit execution

Domain-assisted
  either source -> registered domain TaskSpecs, skills and validation
```

All sources lower executable intent into the same governed
Assignment/dispatch/Run/RunResult runtime. No planning source is allowed to
create a private execution path.
~~~~

### claim_4b0b5417404fba3e323fecec285d9197

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `24df5e0c852916c5223d15b21d7966f630e29b302ad91c8ee4a36e305265b8df`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split`; native digest `b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a`; whole shown digest `7de8ebfc59729ad701b9f0b39f5d1f1ece8aecedd72c48f1accfbb11eb6c36cd`.

Rationale: Supersede the complete responsibility-split historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "For agent-led planning, the coordinator supplies adaptive planning and proposes". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## Responsibility Split

| Element | Responsibility |
|---|---|
| Workflow/graph | Legal stage transitions and structural boundaries. |
| Stage Protocol | Coordination doctrine active in one stage. |
| Stage Operation | Legal semantic action selectable by the driver. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |

For agent-led planning, the coordinator supplies adaptive planning and proposes
a dynamic execution contract. Foundation policy and any selected domain harness
validate its objective, bounds, mutation, evidence, capability, privacy, and
budget fields before Assignment construction. The exact inline contract schema
remains an open contract-design question.
~~~~

#### Complete current counterpart

~~~~markdown
## Responsibility Split

| Element | Responsibility |
|---|---|
| Workflow/graph | Step dependencies, gates and sequencing boundaries. |
| Step | A declared node in the Workflow graph. |
| Step operation | Semantic action declared by the definition. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |

Agent-led callers supply a bounded Unit or validated inline contract. Current
inline fields and normalization are implemented by
`src/runner/dispatch/execution-contract.mjs:180-200,295-340`, rather than left
as an open schema question. Domain-specific validators must be checked against
their registered implementation; this extension model does not imply research
and marketing harnesses already ship.
~~~~

### claim_0a52ec5fcc2abb5870b350b23451da43

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-14` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `4173ec263ab82dbec1cc0138083b9a13debc8821030f94a08e26c81680068e0c`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#compatibility`; native digest `83aa85a06907fe314ff287f9c63d0d67417933bd0af40a8426180ee499369f64`; whole shown digest `a0a50b9e5327a33e11548c30917dac1b43360b9cf2e8932cb762ef7c1829fb8c`.

Rationale: Whole-unit replacement, not a structural move or promotion: The full Work-attached mandatory compatibility and agent-led nonweakening obligations are restored explicitly in current Compatibility; current Work selection and declared Assignment guards provide their code evidence, alongside the corrected helper field projections. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it.
~~~~

#### Complete current counterpart

~~~~markdown
## Compatibility

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
~~~~

### claim_4b3088ee72a27223da73fe4c6a014636

Disposition: move; physical review state: reviewed

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-15` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `1336340eee4a4baf5590bfd842f9ba0d8c3bd0c08e501ed16e6742ede9b06088`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-16`; native digest `1336340eee4a4baf5590bfd842f9ba0d8c3bd0c08e501ed16e6742ede9b06088`; whole shown digest `1336340eee4a4baf5590bfd842f9ba0d8c3bd0c08e501ed16e6742ede9b06088`.

Rationale: The former candidate identity is superseded by its complete identical primitive unit restored at the same current path. The old whole-file retirement was rejected; live/design content is current by default and is restored, while the complete dated input remains in history. Native inventory unit digest equality proves this primitive carry, not implementation of its surrounding design. The full shown section requires the changed-file independent check.

#### Complete pinned source unit

~~~~markdown
The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
~~~~

#### Complete current counterpart

~~~~markdown
The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
~~~~

### claim_a5d7cd08266654056f95caaca04e2e7b

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-18` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `7e89be501e0db9edb0e49a5712a6e5d9f169db353ec4b9560e30b3d09410cb6e`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-18`; native digest `55cb6ba79e492af45076c573cbd3a10cbe633ce0684f83856244121df23a3800`; whole shown digest `55cb6ba79e492af45076c573cbd3a10cbe633ce0684f83856244121df23a3800`.

Rationale: Supersede the complete older domain-extension unit with its real current Domain Augmentation counterpart. The source names declared protocols; current text instead names Workflow definitions/operations and domain harnesses, preserving the full extension subjects and two-unlike-consumers foundation-seam condition while correcting the changed claim-bearing term. A24 authorizes this inherited label/binding correction. No structural-only move or byte-identical carry is asserted; source witness and identity remain pinned, and the whole replacement is pending independent review.

#### Complete pinned source unit

~~~~markdown
Domains and organizations may add knowledge, doctrine, Skills, declared
protocols, planning validators, resource/isolation analysis, evidence policy,
roles, souls, and quality criteria. The foundation introduces a shared extension
seam only after at least two unlike consumers prove the common responsibility.
~~~~

#### Complete current counterpart

~~~~markdown
Domains and organizations may add knowledge, doctrine, Skills, declared
Workflow definitions/operations and domain harnesses, planning validators,
resource/isolation analysis, evidence policy, roles, souls and quality criteria.
The foundation introduces a shared extension seam only after at least two unlike
consumers prove the common responsibility.
~~~~

### claim_6b1c9b954404efb60283d3586e0ab652

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-2` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `4de01935c05e1015b7a52cba8cea0f52b31e6637adbfcd97ec6185e84ca3e0be`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources`; native digest `29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6`; whole shown digest `94247d76c3a055bc74b16955365bdd8952e7585c310050ea258df9a0aad26e4f`.

Rationale: Supersede the complete unheaded-block-2 historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "Per the [Agent Coordination Foundation Vision](../vision.md), a predeclared". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Per the [Agent Coordination Foundation Vision](../vision.md), a predeclared
Workflow or Coordination Protocol is optional. Coordination may obtain planning
and constraints from one or more composable sources:
~~~~

#### Complete current counterpart

~~~~markdown
## Planning Sources

Planning need not begin with a predeclared Workflow. Current execution accepts
Unit requests and Workflow execution; the retired CoordinationProtocol is not
another current declared-planning source.

```txt
Agent-led
  objective -> bounded Unit or validated inline Assignment

Declared
  Workflow -> dependent steps and operations -> Unit execution

Domain-assisted
  either source -> registered domain TaskSpecs, skills and validation
```

All sources lower executable intent into the same governed
Assignment/dispatch/Run/RunResult runtime. No planning source is allowed to
create a private execution path.
~~~~

### claim_d28cfc459ff698cdc0cba03e41465318

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-3` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `e7573044163f4c72029fe7924af03aeeb083e5932f03761a1c858406ffa339ae`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources`; native digest `29205425e672bf450568296cebc7af19a9f88e89736a712f24cc06d01903f0f6`; whole shown digest `94247d76c3a055bc74b16955365bdd8952e7585c310050ea258df9a0aad26e4f`.

Rationale: Supersede the complete unheaded-block-3 historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#planning-sources. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "objective -> coordinator reasoning -> dynamic semantic task/Assignment". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
```txt
Agent-led
  objective -> coordinator reasoning -> dynamic semantic task/Assignment

Declared
  Workflow / Coordination Protocol -> legal graph and operations

Domain-assisted
  agent or declared plan -> domain enrichment / validation / resource policy
```
~~~~

#### Complete current counterpart

~~~~markdown
## Planning Sources

Planning need not begin with a predeclared Workflow. Current execution accepts
Unit requests and Workflow execution; the retired CoordinationProtocol is not
another current declared-planning source.

```txt
Agent-led
  objective -> bounded Unit or validated inline Assignment

Declared
  Workflow -> dependent steps and operations -> Unit execution

Domain-assisted
  either source -> registered domain TaskSpecs, skills and validation
```

All sources lower executable intent into the same governed
Assignment/dispatch/Run/RunResult runtime. No planning source is allowed to
create a private execution path.
~~~~

### claim_71d5d262a16519dd81c76e97d793f062

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-5` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `f3122a52ffc80c8160aa2a51efbecd8948873d2da3be559bf551f1991cecbc14`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#declared-model`; native digest `54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff`; whole shown digest `4b916660fb807c4637f821f7754d1fbb4f9c639fddc3fbb71338b68165f5fe22`.

Rationale: Supersede the complete unheaded-block-5 historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#declared-model. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "```txt". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
```txt
Workflow
  -> Stage graph
    -> Stage Protocol
      -> Stage Operation
        -> TaskSpec
        -> Skill(s)
        -> Role
        -> policy hints
```
~~~~

#### Complete current counterpart

~~~~markdown
## Declared Model

```txt
Workflow
  -> step graph
    -> step operations
      -> TaskSpec
      -> Skill(s)
      -> Role
      -> policy hints
```

Current Workflow definitions normalize operations directly
(`src/workflow/definition.mjs:81-109`). No separately shipped Stage Protocol,
CoordinationProtocol or FlowDefinition engine sits between steps and operations.
~~~~

### claim_5acd6c3b2aaf7f55b6a7fea7713295dd

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-6` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `1571c801405554789b25bc8a8d2bc3fda183369bf53165399b302af5fa69f459`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#declared-model`; native digest `54d3b4be1e06f2ac02712f7b8774bc763c5f411f5d40bd0bbc61c3e0256889ff`; whole shown digest `4b916660fb807c4637f821f7754d1fbb4f9c639fddc3fbb71338b68165f5fe22`.

Rationale: Supersede the complete unheaded-block-6 historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#declared-model. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "The same hard-and-soft shape may be used by a standalone Coordination Protocol". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
The same hard-and-soft shape may be used by a standalone Coordination Protocol
when repeatability, auditability, or reusable doctrine justifies a predeclared
graph. A session is not required to select this model.
~~~~

#### Complete current counterpart

~~~~markdown
## Declared Model

```txt
Workflow
  -> step graph
    -> step operations
      -> TaskSpec
      -> Skill(s)
      -> Role
      -> policy hints
```

Current Workflow definitions normalize operations directly
(`src/workflow/definition.mjs:81-109`). No separately shipped Stage Protocol,
CoordinationProtocol or FlowDefinition engine sits between steps and operations.
~~~~

### claim_ad1c305fe8b9ab3274ebe83e92cd0510

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-7` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `abc22b88ed9d6c86a2f5efec953fbb9486c18cc849ed8a99a085ef10a5779a97`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split`; native digest `b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a`; whole shown digest `7de8ebfc59729ad701b9f0b39f5d1f1ece8aecedd72c48f1accfbb11eb6c36cd`.

Rationale: Supersede the complete unheaded-block-7 historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "| Element | Responsibility |". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
| Element | Responsibility |
|---|---|
| Workflow/graph | Legal stage transitions and structural boundaries. |
| Stage Protocol | Coordination doctrine active in one stage. |
| Stage Operation | Legal semantic action selectable by the driver. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |
~~~~

#### Complete current counterpart

~~~~markdown
## Responsibility Split

| Element | Responsibility |
|---|---|
| Workflow/graph | Step dependencies, gates and sequencing boundaries. |
| Step | A declared node in the Workflow graph. |
| Step operation | Semantic action declared by the definition. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |

Agent-led callers supply a bounded Unit or validated inline contract. Current
inline fields and normalization are implemented by
`src/runner/dispatch/execution-contract.mjs:180-200,295-340`, rather than left
as an open schema question. Domain-specific validators must be checked against
their registered implementation; this extension model does not imply research
and marketing harnesses already ship.
~~~~

### claim_cfaa373787b1c74aea1a67094101edd2

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-8` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `0d894dbefdac385fc550b8f1f161ec3f3e9335813dc1dcbbdd74c963e69129cb`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split`; native digest `b279b9ea1b355531ab48f2f3c849c20e2c95cdf4c6f18b7786adda380a0bf57a`; whole shown digest `7de8ebfc59729ad701b9f0b39f5d1f1ece8aecedd72c48f1accfbb11eb6c36cd`.

Rationale: Supersede the complete unheaded-block-8 historical source unit with docs/platform/agent-coordination/architecture/protocol-model.md#responsibility-split. The current counterpart replaces the retired standalone coordination protocol model with Workflow operation selection and domain harness responsibilities; it preserves the mandatory Work compatibility/non-weakening obligation while distinguishing legal-operation helpers from automatic enforcement. Source-specific changed wording: "For agent-led planning, the coordinator supplies adaptive planning and proposes". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
For agent-led planning, the coordinator supplies adaptive planning and proposes
a dynamic execution contract. Foundation policy and any selected domain harness
validate its objective, bounds, mutation, evidence, capability, privacy, and
budget fields before Assignment construction. The exact inline contract schema
remains an open contract-design question.
~~~~

#### Complete current counterpart

~~~~markdown
## Responsibility Split

| Element | Responsibility |
|---|---|
| Workflow/graph | Step dependencies, gates and sequencing boundaries. |
| Step | A declared node in the Workflow graph. |
| Step operation | Semantic action declared by the definition. |
| TaskSpec | Machine-readable inputs, outputs, gates, mutation, and evidence contract. |
| Skill | Adaptive judgment and procedural guidance. |
| Role | Semantic responsibility and capability expectation. |
| Policy hints | Inputs to governed provider/model/tier/mechanism resolution. |

Agent-led callers supply a bounded Unit or validated inline contract. Current
inline fields and normalization are implemented by
`src/runner/dispatch/execution-contract.mjs:180-200,295-340`, rather than left
as an open schema question. Domain-specific validators must be checked against
their registered implementation; this extension model does not imply research
and marketing harnesses already ship.
~~~~

### claim_13ba760cbd7bfff5dc1cf25ecf5cee25

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#7-agent-facing-contract` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `1cb1d66403936899fc740314bac6d2dd4a93e508490cb274c57330e35929a96e`.

Target: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#7-agent-facing-contract`; native digest `f43922000c0d8ab8c4ab4814a5143f5094c806042c6299c08bd8ae700572e086`; whole shown digest `be21db86a80480f5f57642a14c600d6450259758f86a6b492314f9a647b83ad2`.

Rationale: Supersede the complete 7-agent-facing-contract historical source unit with docs/platform/agent-coordination/architecture/runtime-recovery-design.md#7-agent-facing-contract. The current counterpart describes the actually shipped dispatch recovery boundary and the result/status/cancel publishers instead of claiming that the full proposed watcher/recovery contract and proof matrix are implemented. Source-specific changed wording: "Extend the existing `coordination run` request door with a proposed recovery". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 7. Agent-Facing Contract

Extend the existing `coordination run` request door with a proposed recovery
request variant: `{contract, coordinationId, writerId, intent: recover,
target?: {assignmentId}, budgetGrantRef?: string}`. Omitted target scans the
session; engine chooses one eligible action and returns progress. `show --json`
exposes the same typed recommendation without refreshing/writing runtime facts.
The headless adapter calls the same use case. These are proposed request fields,
not commands/features available in the current release. A fresh controller may
omit `writerId` only when the session manifest supplies a replacement-driver
grant; otherwise the request returns `needs-input` with the exact identity
requirement. Recovery executes exactly the planner's selected action. It does
not unconditionally call close-after-steps; close is invoked only when the
selected action is `close-session`.

Return `{outcome: applied | already-applied | waiting | needs-input | refused,
action, subjectRefs, reasonCode, evidenceRefs, nextCheckAt?}`. A repeated recover
call recomputes facts and resumes a durable pending action. It never uses a
worker-supplied child ID, task key, supersession boolean or ownership assertion.
`needs-input` names the exact missing semantic decision/grant; it is not the
default for ordinary concurrency, a slow observer or already-applied action.
Blocked targets remain individually visible; another eligible independent target
may progress. Stable ordering prevents one parked target monopolizing the scan.
~~~~

#### Complete current counterpart

~~~~markdown
## 7. Agent-Facing Contract

The current door is `fgos dispatch recover <runId>`, without `--action` for
read-only observation. It builds a snapshot of the Run, visibility, outbox,
controller evidence, real control epoch and settled signal, then returns a
recommendation, `needs-input` or `park`. The intent is `resume` or `reassign`;
the default is defined by the CLI/use case, not by a coordination-session scan.

Resume requires explicit non-fresh driver-liveness evidence; fresh or unknown
freshness parks. Reassignment requires replacement-authority evidence naming a
driver, read from controller-owned state, never worker-writable outbox claims.
Unknown evidence parks; a settled Run has nothing to recover. A recommendation
contains `snapshotHash`, `expectedControlEpoch`, `actionKey`, `evidenceIds`,
`action`, `expiresAt` and `reason`; the default lifetime is five minutes.

Apply uses the same door with `--action`, `--expected-snapshot`,
`--expected-control-epoch`, `--expected-expires-at` and `--action-key`.
It re-reads facts, checks action-key binding, snapshot, epoch, expiry and
present legality, then acquires real Run control and checks settlement again.
Stale/expired plans, missing authority and held live control are refused or
parked rather than overridden. Repeating a consumed action key returns the
recorded `already-applied` outcome.

Successful apply records the recovery command, updates the control-epoch
projection and attempts the applicable dispatch-claim clear. It does not itself
launch a replacement worker, close a session or advance a Workflow. Dormant
session-ownership checks still refuse `resume-driver` for old session-owned
Assignments; this is not a claim that the retired coordination door exists.

Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,
243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.
Read the [area portal](../README.md) and [runner spec](../../../specs/runner.md)
for the wider execution boundary; recovery here does not own Work lifecycle.
~~~~

### claim_65b380d92e76cf66bcbff80eba5b918e

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-14` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `bf271555e5896946f4460a8c4f0b5606bc316c4d4385dd44095744ffecc579e4`.

Target: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-12`; native digest `eb464ad4bcc6c521f6b0c5d435c1477899f37e122184bdb2e8277b560a3b5e06`; whole shown digest `eb464ad4bcc6c521f6b0c5d435c1477899f37e122184bdb2e8277b560a3b5e06`.

Rationale: Supersede the complete unheaded-block-14 historical source unit with docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-12. The current counterpart describes the actually shipped dispatch recovery boundary and the result/status/cancel publishers instead of claiming that the full proposed watcher/recovery contract and proof matrix are implemented. Source-specific changed wording: "Result scanning wins before any new execution, including after budget exhaustion". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Result scanning wins before any new execution, including after budget exhaustion
or cancellation. Read/collect is not admission. Cancellation bars retry and
automatic continuation of the cancelled intent, but does not discard late results.
An explicit new user intent is a new request, not an escape through continuation.
~~~~

#### Complete current counterpart

~~~~markdown
Proposed cancellation/budget rule: result collection would remain available after
budget exhaustion or cancellation, without admitting another execution; a new
intent would require a new request. This is not implemented cancellation precedence:
current Herdr/cli reconciliation returns `cancel-unsupported` before scanning
results (`herdr-reconcile.mjs:351-355`, `reconcile-cli-spawn.mjs:38-47`).
~~~~

### claim_c4de8768ad9142c80e9ded5358a1704a

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-22` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `eeb6e618c42173cadfd1b2036d760c50c8c53b1ee5f58e9fbf48d1fd792614b1`.

Target: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-19`; native digest `8b0822d6aee06fb803ed5f4d5ee08be2d6971c66153ef18b4707e7cd8f327e11`; whole shown digest `8b0822d6aee06fb803ed5f4d5ee08be2d6971c66153ef18b4707e7cd8f327e11`.

Rationale: Supersede the complete unheaded-block-22 historical source unit with docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-19. The current counterpart describes the actually shipped dispatch recovery boundary and the result/status/cancel publishers instead of claiming that the full proposed watcher/recovery contract and proof matrix are implemented. Source-specific changed wording: "Publication uses a fully written/fsynced temp file in the same directory,". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Publication uses a fully written/fsynced temp file in the same directory,
followed by atomic non-overwriting publication (local filesystem hard-link on
the initial Linux adapter), then directory fsync. State replacement uses
temp+rename+directory fsync under the owning lock. This retains exclusive-create
semantics while avoiding empty-lock and conditional-unlink races seen in P12.
Implemented (Phase 02 H3) for the mutable Run/Assignment artifacts named in
the contract doc (`result.json`, `run.json`, the effective-execution-contract
projection, and the per-attempt dispatch-bookkeeping marker) via
`publishMutableProjection`/`publishMarkerOnce`; a resume that finds an
existing `result.json` which fails to parse refuses rather than relaunching
over unreadable evidence. Unsupported filesystem guarantees refuse mutation
with a named diagnostic;
doctor must probe them before this writer profile is enabled. No distributed
lease, background renew service or TTL-only takeover is required by default.
~~~~

#### Complete current counterpart

~~~~markdown
The proposed durability profile requires a fully written/fsynced temp file in
the same directory, atomic non-overwriting publication and directory fsync.
It calls for temp+rename+directory fsync under the owning lock for replacement.
Those are design requirements; the implementation's best-effort directory
fsync and other limits are stated below, not silently promoted to guarantees.
Current terminal `result.json` is published by `publishImmutableProof`
(`settlement.mjs:434`), not the mutable writer. `run.json` updates, the
effective-execution-contract projection and bookkeeping markers use their
mutable/marker writers. An unreadable existing result refuses relaunch rather
than overwriting evidence. The proof helper fsyncs the file, hard-links it
without overwrite, treats `EEXIST` as an existing proof and rethrows other link
errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
A dedicated unsupported-filesystem diagnostic/doctor probe is a design
requirement, not an implemented check. No distributed lease, background
renewal service or TTL-only takeover is required by this local design.
~~~~

### claim_114999eb22b4a2af22df9fe3f8b9cb2b

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-23` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `1289cb23be8c139e2279838f8575e142606646e62b2c1afce03b40de10749017`.

Target: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#7-agent-facing-contract`; native digest `f43922000c0d8ab8c4ab4814a5143f5094c806042c6299c08bd8ae700572e086`; whole shown digest `be21db86a80480f5f57642a14c600d6450259758f86a6b492314f9a647b83ad2`.

Rationale: Supersede the complete unheaded-block-23 historical source unit with docs/platform/agent-coordination/architecture/runtime-recovery-design.md#7-agent-facing-contract. The current counterpart describes the actually shipped dispatch recovery boundary and the result/status/cancel publishers instead of claiming that the full proposed watcher/recovery contract and proof matrix are implemented. Source-specific changed wording: "Extend the existing `coordination run` request door with a proposed recovery". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Extend the existing `coordination run` request door with a proposed recovery
request variant: `{contract, coordinationId, writerId, intent: recover,
target?: {assignmentId}, budgetGrantRef?: string}`. Omitted target scans the
session; engine chooses one eligible action and returns progress. `show --json`
exposes the same typed recommendation without refreshing/writing runtime facts.
The headless adapter calls the same use case. These are proposed request fields,
not commands/features available in the current release. A fresh controller may
omit `writerId` only when the session manifest supplies a replacement-driver
grant; otherwise the request returns `needs-input` with the exact identity
requirement. Recovery executes exactly the planner's selected action. It does
not unconditionally call close-after-steps; close is invoked only when the
selected action is `close-session`.
~~~~

#### Complete current counterpart

~~~~markdown
## 7. Agent-Facing Contract

The current door is `fgos dispatch recover <runId>`, without `--action` for
read-only observation. It builds a snapshot of the Run, visibility, outbox,
controller evidence, real control epoch and settled signal, then returns a
recommendation, `needs-input` or `park`. The intent is `resume` or `reassign`;
the default is defined by the CLI/use case, not by a coordination-session scan.

Resume requires explicit non-fresh driver-liveness evidence; fresh or unknown
freshness parks. Reassignment requires replacement-authority evidence naming a
driver, read from controller-owned state, never worker-writable outbox claims.
Unknown evidence parks; a settled Run has nothing to recover. A recommendation
contains `snapshotHash`, `expectedControlEpoch`, `actionKey`, `evidenceIds`,
`action`, `expiresAt` and `reason`; the default lifetime is five minutes.

Apply uses the same door with `--action`, `--expected-snapshot`,
`--expected-control-epoch`, `--expected-expires-at` and `--action-key`.
It re-reads facts, checks action-key binding, snapshot, epoch, expiry and
present legality, then acquires real Run control and checks settlement again.
Stale/expired plans, missing authority and held live control are refused or
parked rather than overridden. Repeating a consumed action key returns the
recorded `already-applied` outcome.

Successful apply records the recovery command, updates the control-epoch
projection and attempts the applicable dispatch-claim clear. It does not itself
launch a replacement worker, close a session or advance a Workflow. Dormant
session-ownership checks still refuse `resume-driver` for old session-owned
Assignments; this is not a claim that the retired coordination door exists.

Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,
243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.
Read the [area portal](../README.md) and [runner spec](../../../specs/runner.md)
for the wider execution boundary; recovery here does not own Work lifecycle.
~~~~

### claim_5aeca43617b977fa79fdb9fd60a20e2c

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-24` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `b5104854e5852006e0a118ab4bd69bbfbcdef9750c437c95c8173fd29f02a612`.

Target: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#7-agent-facing-contract`; native digest `f43922000c0d8ab8c4ab4814a5143f5094c806042c6299c08bd8ae700572e086`; whole shown digest `be21db86a80480f5f57642a14c600d6450259758f86a6b492314f9a647b83ad2`.

Rationale: Supersede the complete unheaded-block-24 historical source unit with docs/platform/agent-coordination/architecture/runtime-recovery-design.md#7-agent-facing-contract. The current counterpart describes the actually shipped dispatch recovery boundary and the result/status/cancel publishers instead of claiming that the full proposed watcher/recovery contract and proof matrix are implemented. Source-specific changed wording: "Return `{outcome: applied | already-applied | waiting | needs-input | refused,". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Return `{outcome: applied | already-applied | waiting | needs-input | refused,
action, subjectRefs, reasonCode, evidenceRefs, nextCheckAt?}`. A repeated recover
call recomputes facts and resumes a durable pending action. It never uses a
worker-supplied child ID, task key, supersession boolean or ownership assertion.
`needs-input` names the exact missing semantic decision/grant; it is not the
default for ordinary concurrency, a slow observer or already-applied action.
Blocked targets remain individually visible; another eligible independent target
may progress. Stable ordering prevents one parked target monopolizing the scan.
~~~~

#### Complete current counterpart

~~~~markdown
## 7. Agent-Facing Contract

The current door is `fgos dispatch recover <runId>`, without `--action` for
read-only observation. It builds a snapshot of the Run, visibility, outbox,
controller evidence, real control epoch and settled signal, then returns a
recommendation, `needs-input` or `park`. The intent is `resume` or `reassign`;
the default is defined by the CLI/use case, not by a coordination-session scan.

Resume requires explicit non-fresh driver-liveness evidence; fresh or unknown
freshness parks. Reassignment requires replacement-authority evidence naming a
driver, read from controller-owned state, never worker-writable outbox claims.
Unknown evidence parks; a settled Run has nothing to recover. A recommendation
contains `snapshotHash`, `expectedControlEpoch`, `actionKey`, `evidenceIds`,
`action`, `expiresAt` and `reason`; the default lifetime is five minutes.

Apply uses the same door with `--action`, `--expected-snapshot`,
`--expected-control-epoch`, `--expected-expires-at` and `--action-key`.
It re-reads facts, checks action-key binding, snapshot, epoch, expiry and
present legality, then acquires real Run control and checks settlement again.
Stale/expired plans, missing authority and held live control are refused or
parked rather than overridden. Repeating a consumed action key returns the
recorded `already-applied` outcome.

Successful apply records the recovery command, updates the control-epoch
projection and attempts the applicable dispatch-claim clear. It does not itself
launch a replacement worker, close a session or advance a Workflow. Dormant
session-ownership checks still refuse `resume-driver` for old session-owned
Assignments; this is not a claim that the retired coordination door exists.

Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,
243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.
Read the [area portal](../README.md) and [runner spec](../../../specs/runner.md)
for the wider execution boundary; recovery here does not own Work lifecycle.
~~~~

### claim_4eeffbb74710aa62461cc1903dbbfa69

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-30` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `157e984f508d4ca3863cb3f03edd4d73ed28ef731058eb503058f7489ab564fc`.

Target: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#10-proof-matrix`; native digest `f376450edf5fe0f9938c58636ed160d27c633ebdfa090046b7f0ab5ea4d9bce5`; whole shown digest `462d084eb74c6822220e81c61976d5152c478503aaeb3076da7a5a55ff714fc6`.

Rationale: Supersede the complete unheaded-block-30 historical source unit with docs/platform/agent-coordination/architecture/runtime-recovery-design.md#10-proof-matrix. The current counterpart describes the actually shipped dispatch recovery boundary and the result/status/cancel publishers instead of claiming that the full proposed watcher/recovery contract and proof matrix are implemented. Source-specific changed wording: "These are required executable scenarios, not tests claimed to have passed.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
These are required executable scenarios, not tests claimed to have passed.
Initial implementation places them in the existing runner/verbs test families;
fixtures record inputs, injected interruption, durable state and expected result.
~~~~

#### Complete current counterpart

~~~~markdown
## 10. Proof Matrix

These are required design scenarios, not tests claimed to have passed.
Run/control scenarios have current owners, but X03/X05/X06/X07/X10 require
additional result-link, inherited-edit, transfer or runtime-version guarantees.
They do not describe a shipped session-recovery contract.

| ID | One primary verifiable scenario |
|---|---|
| F-a | Reused pane locator with stale handle/incarnation: destructive control refused; unrelated pane unchanged. |
| F-b | Coordinator dies after bind; recovery finds live worker, same Run, zero new spawn. |
| F-c | Caller timeout while worker present/working: stale observation, no failure settlement or new Run. |
| F-d | Provider pause through automated cleanup and retryAfter: preserve pane, inspect only. |
| F-e | Worker-liveness branch is explicit: live/working writer yields partial or deferred capture; dead writer after quiescence yields preserved capture; unknown liveness parks. Zero stdout never infers launch failure or completion. |
| F-f | Two callers race admission through launch/bind, including injected crash: one admitted launch identity and no duplicate resource. |
| F-g | In-flight refusal identifies Run/handle when known, explicit pre-bind/ambiguous cause otherwise. |
| E-a | Real zero-output ceiling shape: reconcile workspace/effects; fallback only after proven eligibility, not by stdout heuristic. |
| E-b | Handshake unknown: reconcile or park; proven not-delivered branch uses next candidate within the same Assignment cap. |
| E-c | Quota line with/without parseable reset: park same Run, preserve line, no timed relaunch. |
| E-d | Observer timeout with nonterminal ladder and live worker: wait, no fallback/cooldown. |
| E-e | Candidate rejected by capability/governance/confinement cannot launch; next eligible candidate retains original constraints. |
| E-f | Table-driven config failure, launch failure and semantic rejection remain distinct; semantic rejection does not trigger infra fallback. |
| X01 | Pause live lock holder past TTL, race acquire/release: no successor until release; dead generation takeover cannot delete successor. |
| X02 | Crash after control send but before ack: reconcile the pending command; Herdr may resend only while the adapter reports ready and no ack, and must not resend after ack/working. Unknown delivery remains unknown. |
| X03 | Delayed superseded result before/after new link: retained per Run, never becomes current authoritative link. |
| X04 | Capture half-edited file and untracked artifact after writer quiescence: replacement sees exact manifest or explicit incomplete coverage. |
| X05 | Writable/inherited-acceptance profile: Run Result Evaluator attributes preserved failed-attempt edits as inherited and independently verifies final acceptance. Read-only/isolated profiles use per-Run delta evaluation and do not claim X05. |
| X06 | Cancel during admission/control/transfer: ordering documented, no later unauthorized attempt; late result retained. |
| X07 | Crash at each transfer step: resume through public request; no manual claim-file deletion or second child. |
| X10 | Unknown state version or foreign owning runtime: explicit refusal; unchanged schema-1 requests retain behavior. |
~~~~

### claim_4a4e9b6ec382f6e6bf2872bd125816c9

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-33` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `4e738024bef0fa77ab626479e21257efde2ff73b8d0652c1ce7f275de488949c`.

Target: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits`; native digest `f6ec1b1abedc5d95a19c2ac05833d7230c918b3f63ee0c5ab09436f31d83d1ba`; whole shown digest `a3746d2025b01bf82d4b8069758e72856b14b35524072ac909e6e10af4772afd`.

Rationale: Supersede the complete unheaded-block-33 historical source unit with docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits. The current counterpart describes the actually shipped dispatch recovery boundary and the result/status/cancel publishers instead of claiming that the full proposed watcher/recovery contract and proof matrix are implemented. Source-specific changed wording: "Distributed leases, live partial session transfer, shared chain-budget allocation,". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Distributed leases, live partial session transfer, shared chain-budget allocation,
health store/scoring and generic effect ledger are unsupported in the first writer
profile. Their absence returns typed unsupported/unknown, never silently widens
authority. No temporal estimate or successful live proof is asserted here.
~~~~

#### Complete current counterpart

~~~~markdown
## 11. Review Finding Resolution And Limits

| Findings | Design response |
|---|---|
| R01/R02 | Run amendment specifies exact supersession identity, serialized admit/publish, pending declaration recovery and launch reconciliation. |
| R03 | Section 6 and RunHandle specify no TTL theft, immutable lock generation and pending remote-control handling. |
| R04/R05/R06 | Retired session continuation design; preserved in the complete historical snapshot, not a current contract. |
| R07/R08/R09 | Fallback defines one default, ceiling/spawn mapping, budget arithmetic and typed effect eligibility. |
| R10 | Historical session-policy proof correction; not a current engine implementation claim. |
| R11/R12/R13 | RunHandle separates liveness/progress, defines transitions/control coverage and one visibility binding source. |
| R14/R15 | Ownership table, shared mutation door, versioned rollout and dependency gates. |

No distributed lease, live session transfer, shared chain-budget allocator,
health scoring store or generic business-effect ledger is implemented here.
Current recovery plans park or request authority for unsafe/unknown cases;
do not infer a universal typed unsupported enum from this design.

The current Herdr launch identity uses normalized
`fgos-<runId>-<launchCommandId>`, with a persisted random launch command, not
runId alone. The standalone reassign action is a fenced controller-epoch
record with a checked authority input; it does not launch a replacement
worker or execute the retired session `driver-replaced` continuation door.

Operation-specific grants/effect policies must be supplied by their owner;
no adapter may infer permission to duplicate external effects. Live-process
force-release is not a current local-lock capability.

R3 may add an audited force-release door. Until then every control critical
section must release its token in `finally` and append a release marker, even
when the controlled process remains alive.
~~~~

### claim_a5635111215eb0e0862917d1658db254

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-34` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `d00a98ac29267f7fefda5343b52e11ebec9212c6042187f6d6cbda7fa1dd9983`.

Target: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits`; native digest `f6ec1b1abedc5d95a19c2ac05833d7230c918b3f63ee0c5ab09436f31d83d1ba`; whole shown digest `a3746d2025b01bf82d4b8069758e72856b14b35524072ac909e6e10af4772afd`.

Rationale: Supersede the complete unheaded-block-34 historical source unit with docs/platform/agent-coordination/architecture/runtime-recovery-design.md#11-review-finding-resolution-and-limits. The current counterpart describes the actually shipped dispatch recovery boundary and the result/status/cancel publishers instead of claiming that the full proposed watcher/recovery contract and proof matrix are implemented. Source-specific changed wording: "Profile decisions are now fixed: a terminal parent refuses transfer; the first". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Profile decisions are now fixed: a terminal parent refuses transfer; the first
Herdr adapter uses deterministic `runId` naming while retaining registry-lookup
semantics; repeat mode is explicit in the operation/protocol contract; driver
replacement requires a `driver-replaced` door; and live-process force-release is
not available in Node/R1-R2. Operation-specific grants or business effect
policies must be supplied by that operation's owner; a runtime adapter cannot
infer permission to duplicate an external effect from this design.
~~~~

#### Complete current counterpart

~~~~markdown
## 11. Review Finding Resolution And Limits

| Findings | Design response |
|---|---|
| R01/R02 | Run amendment specifies exact supersession identity, serialized admit/publish, pending declaration recovery and launch reconciliation. |
| R03 | Section 6 and RunHandle specify no TTL theft, immutable lock generation and pending remote-control handling. |
| R04/R05/R06 | Retired session continuation design; preserved in the complete historical snapshot, not a current contract. |
| R07/R08/R09 | Fallback defines one default, ceiling/spawn mapping, budget arithmetic and typed effect eligibility. |
| R10 | Historical session-policy proof correction; not a current engine implementation claim. |
| R11/R12/R13 | RunHandle separates liveness/progress, defines transitions/control coverage and one visibility binding source. |
| R14/R15 | Ownership table, shared mutation door, versioned rollout and dependency gates. |

No distributed lease, live session transfer, shared chain-budget allocator,
health scoring store or generic business-effect ledger is implemented here.
Current recovery plans park or request authority for unsafe/unknown cases;
do not infer a universal typed unsupported enum from this design.

The current Herdr launch identity uses normalized
`fgos-<runId>-<launchCommandId>`, with a persisted random launch command, not
runId alone. The standalone reassign action is a fenced controller-epoch
record with a checked authority input; it does not launch a replacement
worker or execute the retired session `driver-replaced` continuation door.

Operation-specific grants/effect policies must be supplied by their owner;
no adapter may infer permission to duplicate external effects. Live-process
force-release is not a current local-lock capability.

R3 may add an audited force-release door. Until then every control critical
section must release its token in `finally` and append a release marker, even
when the controlled process remains alive.
~~~~

### claim_966a448be6530851e8b1fd7b72d75d4e

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#consequences` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `328be77f0ac22778cd8a7aae995cb320df8286c72eced2c6fd845719201d26f3`.

Target: `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#consequences`; native digest `c491b01f041338f5d863d88928183788353c2e9d4d75dfb1aff97b00043825cb`; whole shown digest `b95a28a283aca9b6317f79aaa961cd399bec323b137cd84c8b02d0632f1138dc`.

Rationale: Supersede the complete consequences historical source unit with docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#consequences. The complete Consequences counterpart now qualifies legacy CLI/assignment ownership against the shipped dispatch CLI and assignment boundary. Source-specific changed wording: "- Standalone coordination no longer fabricates a coding Stage; the Vision's". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## Consequences

- Standalone coordination no longer fabricates a coding Stage; the Vision's
  two-consumer proof becomes testable.
- Declared operations gain an explicit, inspectable mutation/evidence snapshot
  without parsing TaskSpec Markdown.
- Result interpretation becomes contract-driven and testable per field.
- A mutating inline path, session references, and dynamic task graphs remain
  future decisions and must not be implied by this ADR.
~~~~

#### Complete current counterpart

~~~~markdown
## Consequences

- Standalone Unit execution does not fabricate a coding Work stage.
- A registered domain harness is not proof that every proposed domain ships.
- Declared operations gain an explicit, inspectable mutation/evidence snapshot
  without parsing TaskSpec Markdown.
- Result interpretation becomes contract-driven and testable per field.
- Session references and dynamic session task graphs are historical/deferred
  vocabulary; Unit-run mutation is current and must not be called universally
  deferred just because the generic inline stamp gate remains.
~~~~

### claim_b29336161c4c0f8135cbc1e646ce2b16

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#unheaded-block-5` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `89152814fa184a4e1fafedc63902ba18f8f88b7d61791f7ae7d14c16dd3d04bb`.

Target: `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#consequences`; native digest `c491b01f041338f5d863d88928183788353c2e9d4d75dfb1aff97b00043825cb`; whole shown digest `b95a28a283aca9b6317f79aaa961cd399bec323b137cd84c8b02d0632f1138dc`.

Rationale: Supersede the complete unheaded-block-5 historical source unit with docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#consequences. The complete Consequences counterpart now qualifies legacy CLI/assignment ownership against the shipped dispatch CLI and assignment boundary. Source-specific changed wording: "- Standalone coordination no longer fabricates a coding Stage; the Vision's". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
- Standalone coordination no longer fabricates a coding Stage; the Vision's
  two-consumer proof becomes testable.
- Declared operations gain an explicit, inspectable mutation/evidence snapshot
  without parsing TaskSpec Markdown.
- Result interpretation becomes contract-driven and testable per field.
- A mutating inline path, session references, and dynamic task graphs remain
  future decisions and must not be implied by this ADR.
~~~~

#### Complete current counterpart

~~~~markdown
## Consequences

- Standalone Unit execution does not fabricate a coding Work stage.
- A registered domain harness is not proof that every proposed domain ships.
- Declared operations gain an explicit, inspectable mutation/evidence snapshot
  without parsing TaskSpec Markdown.
- Result interpretation becomes contract-driven and testable per field.
- Session references and dynamic session task graphs are historical/deferred
  vocabulary; Unit-run mutation is current and must not be called universally
  deferred just because the generic inline stamp gate remains.
~~~~

### claim_e415506235b575bc5eb32b225a758f5b

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `29ff28ddd20131ed5005890937b9ad9fa2928b73bd2ff3d818e09f2515f6cda1`.

Target: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector`; native digest `f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a`; whole shown digest `5438778e2e47a3b8b1ae4508b5d31eb532f2250e72471fc8bb045249ba64304d`.

Rationale: Whole-unit replacement, not a structural move or promotion: The complete selector section keeps caller input versus mechanism, all selector families and the nativeTask prohibition; its implementation note is replaced by decide-then-positional-execute and the actual Node binding boundary. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Current implementation note: `execute --for` already resolves through the
capability-aware path that honors `capabilities.<name>.prefer`.
`decide --for` still uses the older `for` scan. Item 0 below exists to
remove that split.
~~~~

#### Complete current counterpart

~~~~markdown
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
~~~~

### claim_d245d70ae94106a208d95b6bfa6b6152

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `487d6dc9830b4078de9fcf7e7f1ce51780128d71b448e9e6da14721302c36222`.

Target: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan`; native digest `1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0`; whole shown digest `fa0931df22b0c3241d4b8629f862c9299f7157357028c85aef26bc1fb227f6d3`.

Rationale: Whole-unit replacement, not a structural move or promotion: The whole policy section keeps specificity, governance and provider independence, while replacing constraint union, broad fallback append, minTier/risk and the execution wrapper with their current exact counterparts. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | union, then fail closed if unsatisfied |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | preserve ordered list from the most specific layer, with broader fallbacks appended if useful |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
role reviewer requires minTier=standard
operation validate-plan prefers persona=code-reviewer
work risk=high raises minTier=critical
assignment prefers executor=claude
governance checks effective egress
```

The resulting `DispatchPlan.execution` carries the concrete model and adapter.
The workflow does not need to hardcode a provider to prove team coordination.
~~~~

#### Complete current counterpart

~~~~markdown
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | operation constraints override the assignment-skills base (`assignment-policy.mjs:459-462`), not a union |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | only the most specific declared list is recorded; reserved-not-executed here, with no broader append (`assignment-policy.mjs:380-388`) |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
operation reviewer requires rigor=standard
operation validate-plan prefers persona=code-reviewer
work.rigor=critical raises the effective rigor
assignment prefers executor=claude
governance checks effective egress
```

The current compiled plan exposes policy-derived `tier`, `model`, `providerModel`, `provenance` and `policy` alongside the resolved `invocation`; there is no `DispatchPlan.execution` wrapper.
The workflow does not need to hardcode a provider to prove team coordination.
~~~~

### claim_f0b558c805f1b274d2df72fb6083acfb

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `62560b47d9fa2b2476a7fa7e720d96e46041d6fe047e76c8bb14ca498a5f9487`.

Target: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow`; native digest `cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b`; whole shown digest `c3b100684b202fdb32e4617eea7f7189e363712124574625c545c8076eb50f88`.

Rationale: Whole-unit replacement, not a structural move or promotion: The full provider-proof policy becomes dated recommendations rather than current defaults: each operation remains, the old implementation pin is explicitly historical, and current transport/binding replaces the historical cli-spawn-first restriction. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Use these as defaults for the first team-dispatch proof, not permanent hard
bindings.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | `agy-cli` / Gemini `gemini-3.6-flash-medium` | current repo config already pins `fgos-coding-implement` to the stable headless agy path |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

Do not use `agy-herdr`, `codex-herdr`, or other interactive Herdr paths as the
authority for the first team proof. They can be tried later as visibility
adapters after cli-spawn assignment execution and evidence handling are stable.
~~~~

#### Complete current counterpart

~~~~markdown
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.

The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
~~~~

### claim_ab8a87d8a586e83cc0df72070e1c438f

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-42` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `7f4a913cd40a582883a10dce9a4fcab6023b655dd4ab28fc88a4ae43d0c0f717`.

Target: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector`; native digest `f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a`; whole shown digest `5438778e2e47a3b8b1ae4508b5d31eb532f2250e72471fc8bb045249ba64304d`.

Rationale: Whole-unit replacement, not a structural move or promotion: The whole old execute/decide split note is replaced by the actual refused execute --for, resolved positional executor and Node-versus-Rust boundary. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
Current implementation note: `execute --for` already resolves through the
capability-aware path that honors `capabilities.<name>.prefer`.
`decide --for` still uses the older `for` scan. Item 0 below exists to
remove that split.
~~~~

#### Complete current counterpart

~~~~markdown
### 6.2 Selector

The selector is caller input, not the mechanism result.

Allowed selector types:

- `work` - dispatch decision for a lifecycle work item.
- `purpose` - dispatch decision for a named capability/purpose.
- `executor` - dispatch decision for a concrete executor id.
- `assignment` - dispatch decision for an actual Assignment or its id.
- `adHocAgent` - dispatch decision for a runtime-composed agent assignment.

Do not add `nativeTask` as a selector. Native/in-process is an output mechanism, not an input category.

Legacy `decide --for` resolves a purpose first; `execute --for` is refused.
Execution uses the resolved executor ID positionally (`dispatch/cli.mjs:1081-1096`).
The Node Execution Core uses `bind()`; the Rust host does not directly call this
JavaScript resolver. Do not equate this proposal with every host representation.
~~~~

### claim_29768201e6d5a5c215e3a7e4a25873c3

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-64` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c`.

Target: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan`; native digest `1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0`; whole shown digest `fa0931df22b0c3241d4b8629f862c9299f7157357028c85aef26bc1fb227f6d3`.

Rationale: Whole-unit replacement, not a structural move or promotion: The complete model/adapter and provider-independence claim is replaced by actual flattened compiled fields plus resolved invocation; no DispatchPlan.execution wrapper is asserted. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
The resulting `DispatchPlan.execution` carries the concrete model and adapter.
The workflow does not need to hardcode a provider to prove team coordination.
~~~~

#### Complete current counterpart

~~~~markdown
### 7.2 Policy Resolution Before DispatchPlan

Team dispatch adds one layer before `DispatchPlan`: an effective execution
policy resolver.

```txt
stage operation + role + persona + work + assignment + human override
  -> effective dispatch policy
  -> DispatchPlan
  -> governance
  -> transport
```

This policy resolver must not become a second dispatch mechanism. It prepares
the selector and execution hints that the existing dispatch resolver already
understands.

Canonical specificity order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Stage operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Different fields resolve differently:

| Field family | Rule |
|---|---|
| Constraints | operation constraints override the assignment-skills base (`assignment-policy.mjs:459-462`), not a union |
| Provider / executor preference | highest-specificity wins |
| Fallback executors | only the most specific declared list is recorded; reserved-not-executed here, with no broader append (`assignment-policy.mjs:380-388`) |
| Tier / rigor | strongest required tier wins |
| Model name | resolve from provider/model policy after effective provider and tier are known |
| Literal model name | assignment or human/CLI override only |
| Governance / egress | final gate, never bypassed by policy |

Example:

```txt
operation reviewer requires rigor=standard
operation validate-plan prefers persona=code-reviewer
work.rigor=critical raises the effective rigor
assignment prefers executor=claude
governance checks effective egress
```

The current compiled plan exposes policy-derived `tier`, `model`, `providerModel`, `provenance` and `policy` alongside the resolved `invocation`; there is no `DispatchPlan.execution` wrapper.
The workflow does not need to hardcode a provider to prove team coordination.
~~~~

### claim_3bffcfe4496d0fec611c2d4cdfbf9149

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-66` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773`.

Target: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow`; native digest `cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b`; whole shown digest `c3b100684b202fdb32e4617eea7f7189e363712124574625c545c8076eb50f88`.

Rationale: Whole-unit replacement, not a structural move or promotion: Every stage/operation recommendation remains in its dated table; the implementation row no longer asserts an obsolete current model/executor/headless pin. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | `agy-cli` / Gemini `gemini-3.6-flash-medium` | current repo config already pins `fgos-coding-implement` to the stable headless agy path |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |
~~~~

#### Complete current counterpart

~~~~markdown
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.

The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
~~~~

### claim_f07d01d9479baf2c23835b14f4038768

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-67` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2`.

Target: `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow`; native digest `cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b`; whole shown digest `c3b100684b202fdb32e4617eea7f7189e363712124574625c545c8076eb50f88`.

Rationale: Whole-unit replacement, not a structural move or promotion: The whole historical cli-spawn-first transport restriction is replaced by dated proof context and current configured/bound transport; Herdr visibility is still not semantic completion evidence. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
Do not use `agy-herdr`, `codex-herdr`, or other interactive Herdr paths as the
authority for the first team proof. They can be tried later as visibility
adapters after cli-spawn assignment execution and evidence handling are stable.
~~~~

#### Complete current counterpart

~~~~markdown
### 7.3 Recommended V1 Provider Policy For Coding Feature Flow

Historical recommendations for the first proof, not current config defaults or
globally required execution order. The table's `pi`, `agy-cli` and old model
names are dated examples. Current checked project configuration declares
`claude`, `glm`, `gitnexus`, `herdr`, `openai`, `gemini`, `xai`, `deepseek`,
`claude-herdr`, `glm-herdr`; coding implementation prefers `gemini` with the
named invocation `agy-herdr-mucdong`. Effective global/project merge and
binding, not this table, decide a live request.

The table records dated proof recommendations only. It supplies neither current
defaults nor live bindings; use effective configuration and binding for execution.

| Stage | Operation | Preferred execution | Rationale |
|---|---|---|---|
| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the current stable default path |
| planning | `resolve-question` | `pi` / OpenAI-Codex `gpt-5.5` | independent consult benefits from provider diversity; `pi` has a verified JSON cli-spawn path |
| planning | `scout-blast-radius` | `gitnexus`, then `pi` if synthesis is needed | graph/tool evidence should precede model judgment |
| planning | `validate-plan` | `claude` / `sonnet`, raise to `opus` for critical work | review/proving should be evidence-first and may need stronger rigor |
| executing | `implement-item` | dated `agy-cli` / Gemini example | original proof recommendation; not the current project executor id or headless-path claim |
| executing | `review-item` | `claude` / `sonnet`, raise to `opus` for critical work | separate reviewer from implementation provider where possible |
| executing | `fix-verify-red` | `claude` for diagnosis, `agy-cli` for bounded edits | root-cause work and mechanical fix work have different execution needs |
| executing | `scoped-subtask` | `agy-cli` or `pi` | bounded helper work should use a cheaper/fast executor when evidence gates are clear |

The original cli-spawn-first proof restriction is historical. Current transport
selection follows configuration/bind and the authorized proof track; Herdr
visibility does not become semantic completion evidence.
~~~~

### claim_d3a92a158a268eb159e378a2da19b98f

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `22db4399faf5c8e4da26cc7d03176ddc181d096d2d13a1660ac55af5b57696ba`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose`; native digest `686ca168b65f0f7cdb20ef555957a6662aa1daa93df0e6448262cb4ba1b01c07`; whole shown digest `4cf850b1c98febefb237699ad7350778cad5b202e53c293f59d6dd4120a9f662`.

Rationale: Supersede the complete 1-purpose historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "This proposal describes a Work-attached coding-domain protocol and one early". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
~~~~

#### Complete current counterpart

~~~~markdown
## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal retains communication doctrine for Work-attached coding activity.
The early standalone prototype was retired; current standalone execution uses
Unit/CollaborationPattern or Workflow. A predeclared Workflow is not required
for every bounded Unit request, but validated contracts and governance remain.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> recorded workflowStep
    -> legal step operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
~~~~

### claim_7f793c412e8771ef3ad910df37d99001

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#10-coding-domain-stage-protocols` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `8051e328585855662bb82c42e463bbaeee0fda38e5910ef661b1a6f49e5d9c0b`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#10-coding-domain-workflow-step-operations`; native digest `ce8fd21d766fc1023f3662cde1da980d774512faa2cee1f15727b2d916d958a5`; whole shown digest `505315c4a3888b72de02b8c8a964a87fd0e39e13ed1766fcfa51d52e61c96ff2`.

Rationale: Supersede the complete 10-coding-domain-stage-protocols historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#10-coding-domain-workflow-step-operations. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "## 10. Coding-Domain Stage Protocols". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 10. Coding-Domain Stage Protocols
~~~~

#### Complete current counterpart

~~~~markdown
## 10. Coding-Domain Workflow Step Operations
~~~~

### claim_77a56ab8d154627187035bdf07a5b15a

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `a32da2a40fc59ea38a00ff09b180f64ad0bb3281b1d0f446947d084623ce237e`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning`; native digest `286da397570ef708e22713d69313855865d24e617ca25730cefd92ce2d67eea1`; whole shown digest `3c79c92349fb4f59b0987f61f4f38ea8f421aa112efaf3c207e16d6d56495877`.

Rationale: Supersede the complete 103-planning historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "The stage owner may write the plan directly, but validation should move toward". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
~~~~

#### Complete current counterpart

~~~~markdown
### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The current coding Workflow already declares `shape-plan` and reviewer
`validate-plan`; adopting a future Step 05 is not a prerequisite for that
operation (`domains/coding/workflows/feature.yaml:64-100`).

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
~~~~

### claim_23ed879031c62dae36299ec71ca605fd

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `95f4ea9308c760a480d86ad7fe94b52149b823f305ba9fd73a602eb5e4c401fb`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness`; native digest `c0d64a86d73bfde404d65fadaa6e35b423daa0450a779678408d3219ab4caef8`; whole shown digest `9193a323393770e9f3dcd417809b76a102d17ca3eeaddbb3199c227581e093ab`.

Rationale: Supersede the complete 11-coordination-operating-harness historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "it is not a runtime dependency gate for standalone coordination.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.
~~~~

#### Complete current counterpart

~~~~markdown
## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for current Unit/Workflow execution.
~~~~

### claim_0db106f41cd28c543735740b7b37e012

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `234e7809041addddb6fd8d96381c01b8d2bafc785a7fa0a368a00b91c813981b`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries`; native digest `69df95123739c341b70ac683f5191086425ea3bd6a02af26a8dd86eb02a2d6a2`; whole shown digest `3dad7e4132c159bab6079fb6829f3b0ccb1e825bf2756c6c904f4392d54e9ca4`.

Rationale: Supersede the complete 2-non-negotiable-boundaries historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "Mission is a lightweight team envelope.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
~~~~

#### Complete current counterpart

~~~~markdown
## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is reserved/deferred vocabulary, not a current team-envelope runtime.
workflowStep records Work's position.
Step operations are declared semantic actions, not a second Stage Protocol engine.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
~~~~

### claim_90afe255012eb59e488ba8a1ccf06ecf

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `b96e0701c207fbb231703bf12e312a7c5b8398718386a33555215a3db76409f0`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles`; native digest `d472469ec9d5dbb20c57cf3e3bb26bdf1324fa107d3206368ef57fbe99a15b99`; whole shown digest `4e338054970776795888933f5ce966e459dd7236249ca392e2d8cfd62957efdf`.

Rationale: Supersede the complete 3-roles historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "Role is not stage owner. A stage owner may dispatch an Assignment to another". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.
~~~~

#### Complete current counterpart

~~~~markdown
## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not Workflow step owner. A step owner may dispatch an Assignment to
another role while Work remains at the same `workflowStep`.
~~~~

### claim_ed40360e4032897654f2d67aad57111d

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `ba8994eb7e1780802f7f5207871f5dc76833d6b08818f4b1a52073e8acb1bdd4`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes`; native digest `6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549`; whole shown digest `eceb9cef405695a8c6a8bcc095ec34c9abe5264cee938ff330f37b781a63c09b`.

Rationale: Supersede the complete 4-communication-modes historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "`sync` does not mean invisible. It still needs a recorded handoff or Assignment". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |

`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
~~~~

#### Complete current counterpart

~~~~markdown
## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Bounded contribution; caller continues at the same Workflow step. | `work.call-summary` records the call; holder is untouched. | The role-call record alone is not RunResult proof; executed Assignments require their normal evidence. |
| `async` | Role handoff governed by the current role graph. | `work.handoff` records holder change and checkpoint; it does not itself invent a status transition. | Actual handoff/answer context plus any independently required execution evidence. |

`src/state/store.mjs:1497-1562` chooses the event from the matched edge's mode,
not a caller override. Sync call summaries do not consume the async callstack.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
~~~~

### claim_7156a782087fad156dafcf4ddd462abf

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `4ce2e36ae12ae6b2607e202b4df1b4a12d078182bc00c7b0a9ec3a5bfe99ce2e`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract`; native digest `0eb0e748178bcb38d9e72ca7337e97a9c0802f273260de260a06b9dc82b3efe9`; whole shown digest `7dad632677a52b6234a0e582014305e9f614e9e80f7244652451d2fd8b82321f`.

Rationale: Supersede the complete 6-assignment-message-contract historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "- Write JSON to <runDir>/agent-result.json". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.
~~~~

#### Complete current counterpart

~~~~markdown
## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write structured JSON to the effective claim path supplied in the prompt.
- Read-only: also write the required companion agent-report.md beside the claim.
- Mutating: a human-readable report is optional; required external evidence remains.
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.
~~~~

### claim_15cac2a9bbfbbffc9af1c2dc16b5415a

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `b62841ac251963f3384c9cb2db74e6c3df5579d39869c29fe4a96fa25b5dd47a`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema`; native digest `b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f`; whole shown digest `cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920`.

Rationale: Whole-unit replacement, not a structural move or promotion: The complete result-schema section retains claim-versus-proof, statuses and evidence/lifecycle distinctions, with actual v2 assessment/validator rules and explicitly proposed legal-only recommendations whose driver-verification obligation is restored. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
~~~~

#### Complete current counterpart

~~~~markdown
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
~~~~

### claim_78f79863a6eafd66861e3199b4a554f0

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `b930743c66d1a445599637265e539d903ae758f754be54c8a992ce2eaf080872`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence`; native digest `df9d32cf08bb1d1ad7eeb00936e175005cfd2305b9de8a713672fbc3c690039e`; whole shown digest `7aa709fd3f5866327701b3f8c010b77cc7f3db49e7fa7fbbfb7e8db8baf1782e`.

Rationale: Supersede the complete 8-runresult-confidence historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#8-runresult-confidence. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "## 8. RunResult Confidence". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
~~~~

#### Complete current counterpart

~~~~markdown
## 8. RunResult Confidence

RunResult status and confidence are control-plane judgments.

Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |

The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
~~~~

### claim_2957b3b08f36bc10d20de1db3c9fd753

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-13` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `0f8cf844c97de3526eee2ec61054ff6f1f020149ef271b99a4047051ecdfefcc`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles`; native digest `d472469ec9d5dbb20c57cf3e3bb26bdf1324fa107d3206368ef57fbe99a15b99`; whole shown digest `4e338054970776795888933f5ce966e459dd7236249ca392e2d8cfd62957efdf`.

Rationale: Supersede the complete unheaded-block-13 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#3-roles. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "Role is not stage owner. A stage owner may dispatch an Assignment to another". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Role is not stage owner. A stage owner may dispatch an Assignment to another
role while the Work item stays at the same stage.
~~~~

#### Complete current counterpart

~~~~markdown
## 3. Roles

The coding domain starts with the roles already declared in the role graph:

| Role | Responsibility | Typical operation family |
|---|---|---|
| `implementer` | Owns the current Work item, edits repo state, invokes engine verbs, and coordinates legal sub-calls. | `judge-ambiguity`, `shape-plan`, `implement-item`, `fix-verify-red` |
| `researcher` | Gathers evidence and facts. It may read repo context, run approved research tools, or inspect docs. | `resolve-question`, `scout-blast-radius` |
| `reviewer` | Finds correctness, feasibility, regression, and test risks. | `validate-plan`, `review-item` |
| `helper` | Performs an independent scoped piece whose footprint does not collide with the driver's active edit surface. | `scoped-subtask` |
| `advisor` | Answers product, scope, priority, or human-intent questions that cannot be settled from machine evidence. | `answer-question`, selected `advise` interactions |

Role is not executor. A reviewer can run on Codex, Claude, agy, pi, or a future
executor if policy and governance allow it.

Role is not Workflow step owner. A step owner may dispatch an Assignment to
another role while Work remains at the same `workflowStep`.
~~~~

### claim_a42ca40e2aab443cf11e13ff5d270ac5

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-15` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `e648f0d7dce1322214f40a89a0fd813bbdb8389e26d00f53bc9ce3f4fe1f4fd5`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes`; native digest `6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549`; whole shown digest `eceb9cef405695a8c6a8bcc095ec34c9abe5264cee938ff330f37b781a63c09b`.

Rationale: Supersede the complete unheaded-block-15 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "| Mode | Meaning | Lifecycle effect | Required evidence |". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Caller waits for a bounded finding or work product, then continues in the same stage. | Work usually stays claimed by the caller; holder may be logged but returns immediately. | Structured result artifact for read-only calls; git/artifact delta for mutating helper work. |
| `async` | Caller cannot continue without another actor or human-adjacent answer. | Work may park, or holder may move until a future reclaim. | A recorded question, answer, review verdict, or blocker with context refs. |
~~~~

#### Complete current counterpart

~~~~markdown
## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Bounded contribution; caller continues at the same Workflow step. | `work.call-summary` records the call; holder is untouched. | The role-call record alone is not RunResult proof; executed Assignments require their normal evidence. |
| `async` | Role handoff governed by the current role graph. | `work.handoff` records holder change and checkpoint; it does not itself invent a status transition. | Actual handoff/answer context plus any independently required execution evidence. |

`src/state/store.mjs:1497-1562` chooses the event from the matched edge's mode,
not a caller override. Sync call summaries do not consume the async callstack.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
~~~~

### claim_ad26893bab59a122a491834bd033c772

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-16` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `da909120a851450c745f09b1b2ede09591abbb5881d013a1fb1dc0587c369569`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes`; native digest `6cdb64c2bba9565b9069f599bd600b68e8f949ad27d44b5187662ba5fd2a6549`; whole shown digest `eceb9cef405695a8c6a8bcc095ec34c9abe5264cee938ff330f37b781a63c09b`.

Rationale: Supersede the complete unheaded-block-16 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#4-communication-modes. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "`sync` does not mean invisible. It still needs a recorded handoff or Assignment". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
`sync` does not mean invisible. It still needs a recorded handoff or Assignment
RunResult when the result matters to later decisions.
~~~~

#### Complete current counterpart

~~~~markdown
## 4. Communication Modes

The role graph's `mode` field has protocol meaning:

| Mode | Meaning | Lifecycle effect | Required evidence |
|---|---|---|---|
| `sync` | Bounded contribution; caller continues at the same Workflow step. | `work.call-summary` records the call; holder is untouched. | The role-call record alone is not RunResult proof; executed Assignments require their normal evidence. |
| `async` | Role handoff governed by the current role graph. | `work.handoff` records holder change and checkpoint; it does not itself invent a status transition. | Actual handoff/answer context plus any independently required execution evidence. |

`src/state/store.mjs:1497-1562` chooses the event from the matched edge's mode,
not a caller override. Sync call summaries do not consume the async callstack.

`async` does not mean a new Work item. It becomes Work only when the request
needs independent lifecycle, approval, merge, or backlog visibility.
~~~~

### claim_caf321abd5b296259f9b3a76411c1123

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-19` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `d166987d5a39d4670bddb33f721e6ac4075dc8df339d1af80110991e117c1171`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#5-workflow-step-operation-selection`; native digest `fabc9e94c67820f5472177487d55f406c9396fd74a625f5cd9e63b480cf9f44a`; whole shown digest `cbe5c2d0b702412cd06446c3d3450815b5e0684b68e1e20d4e1be4195dd7ca19`.

Rationale: Supersede the complete unheaded-block-19 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#5-workflow-step-operation-selection. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "1. Prefer the primary operation when the stage's normal owner work remains the". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Selection rules:

1. Prefer the primary operation when the stage's normal owner work remains the
   next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the stage without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.
~~~~

#### Complete current counterpart

~~~~markdown
## 5. Workflow Step Operation Selection

`src/workflow/steps.mjs:70-85` provides
`operationsForStep(wf, stepId, { defaultRole })`; the domain wrapper
`src/state/domain-registry.mjs:254-257` also accepts
`operationsForStep(domain, step, kind)`. Both are current APIs; do not call the
domain wrapper historical merely because the Workflow helper has another signature.

Selection rules:

1. Prefer the primary operation when the current step's owner work is still
   the next required action.
2. Choose a secondary operation when a bounded role contribution would unblock
   the step without creating lifecycle-bearing child work.
3. Create child Work only when the contribution needs its own claim, branch,
   verify, approval, merge, or backlog visibility.
4. Route discovery unresolved ambiguity to `exploring`; discovery must not ask
   the human directly.
5. Refuse operations marked `dispatch: human-only` from cli-spawn assignment
   execution.
6. Refuse synthetic compatibility operations from runtime dispatch unless their
   task-spec file resolves and the caller explicitly accepts compatibility
   dispatch.

Examples:

| Stage | Situation | Operation |
|---|---|---|
| `discovery` | Need machine evidence for ambiguity. | `resolve-question` to `researcher`, then owner decides `clear` or `unclear`. |
| `planning` | Plan is written and needs proof before the edge to executing. | `validate-plan` to `reviewer`. |
| `planning` | A symbol's blast radius is unknown. | `scout-blast-radius` to `researcher`. |
| `executing` | Implementation needs a separate non-overlapping edit. | `scoped-subtask` to `helper`. |
| `executing` | Returned diff needs independent review. | `review-item` to `reviewer`. |
| `executing` | Review or verify reports a concrete red issue. | `fix-verify-red` to `implementer`. |
~~~~

### claim_118e0ddaa1e41b6b91ed214f60184d71

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-23` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `20e1ef602b061c806eb838f203169426d8fbd7222a39e702e08e1db5c490c50f`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract`; native digest `0eb0e748178bcb38d9e72ca7337e97a9c0802f273260de260a06b9dc82b3efe9`; whole shown digest `7dad632677a52b6234a0e582014305e9f614e9e80f7244652451d2fd8b82321f`.

Rationale: Supersede the complete unheaded-block-23 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#6-assignment-message-contract. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "- Write JSON to <runDir>/agent-result.json". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write JSON to <runDir>/agent-result.json
- Optionally write Markdown to <runDir>/agent-report.md
```
~~~~

#### Complete current counterpart

~~~~markdown
## 6. Assignment Message Contract

Every assignment prompt must provide the worker with enough information to
produce a usable result without learning fgOS internals.

Required prompt fields:

```txt
Assignment: <assignmentId>
Work: <workId or (none)>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: <task-spec path>
Objective: <bounded request>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write structured JSON to the effective claim path supplied in the prompt.
- Read-only: also write the required companion agent-report.md beside the claim.
- Mutating: a human-readable report is optional; required external evidence remains.
```

The prompt must say that the worker should not call Work lifecycle verbs unless
the task-spec explicitly says the worker is the lifecycle driver. Ordinary
Assignment workers return artifacts; the driver interprets them.

The prompt must pass refs, not embedded large docs, diffs, transcripts, or
secrets.
~~~~

### claim_5216f2e514a9fc25e63e226774cddf86

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-27` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `ce53d4284a859f9d95baf033102595aead78608a6a58c872b777da4dcd35e6a2`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema`; native digest `b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f`; whole shown digest `cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920`.

Rationale: Supersede the complete unheaded-block-27 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "\"nextRecommendedOperation\": null". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
Minimal schema:

```json
{
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "nextRecommendedOperation": null
}
```
~~~~

#### Complete current counterpart

~~~~markdown
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
~~~~

### claim_58e446ab5b192ee42614c7494b719819

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-28` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `17e9dc29da21e0e2df5f6e5e004fbe6b74a1cc0c9d34284c1dcdddc41e3e048c`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-30`; native digest `17e9dc29da21e0e2df5f6e5e004fbe6b74a1cc0c9d34284c1dcdddc41e3e048c`; whole shown digest `17e9dc29da21e0e2df5f6e5e004fbe6b74a1cc0c9d34284c1dcdddc41e3e048c`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Allowed status values:
~~~~

#### Complete current counterpart

~~~~markdown
Allowed status values:
~~~~

### claim_b5d805fde6d9cb5e47a21f6da03883ba

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-29` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `5c43b0ba58e8b4ea86373ea1aae4b7c01a96ac7a88d4738a8e84814ca4b1b93d`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-31`; native digest `5c43b0ba58e8b4ea86373ea1aae4b7c01a96ac7a88d4738a8e84814ca4b1b93d`; whole shown digest `5c43b0ba58e8b4ea86373ea1aae4b7c01a96ac7a88d4738a8e84814ca4b1b93d`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |
~~~~

#### Complete current counterpart

~~~~markdown
| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |
~~~~

### claim_614bf32047335842400474fda96f5eed

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-3` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `b3b8e691ec81ad84fd588ef1c9a6981f747952acfe367d9958d9f29c8f4887ad`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose`; native digest `686ca168b65f0f7cdb20ef555957a6662aa1daa93df0e6448262cb4ba1b01c07`; whole shown digest `4cf850b1c98febefb237699ad7350778cad5b202e53c293f59d6dd4120a9f662`.

Rationale: Supersede the complete unheaded-block-3 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "This proposal describes a Work-attached coding-domain protocol and one early". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
This proposal describes a Work-attached coding-domain protocol and one early
standalone prototype. It is not the universal entry model for Agent
Coordination. Per the [Agent Coordination Foundation Vision](../vision.md), an
agent-led session may coordinate through validated dynamic execution contracts
without a predeclared Workflow/Stage graph.
~~~~

#### Complete current counterpart

~~~~markdown
## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal retains communication doctrine for Work-attached coding activity.
The early standalone prototype was retired; current standalone execution uses
Unit/CollaborationPattern or Workflow. A predeclared Workflow is not required
for every bounded Unit request, but validated contracts and governance remain.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> recorded workflowStep
    -> legal step operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
~~~~

### claim_20d4ca5d44e210c040dc15545e72b9ad

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-30` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `9ef607d56f86c6bc94be4ced0016146ed19fb944f589fc01ce349378ad84a384`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32`; native digest `9ef607d56f86c6bc94be4ced0016146ed19fb944f589fc01ce349378ad84a384`; whole shown digest `9ef607d56f86c6bc94be4ced0016146ed19fb944f589fc01ce349378ad84a384`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Required fields by status:
~~~~

#### Complete current counterpart

~~~~markdown
Required fields by status:
~~~~

### claim_2bb820a8ff1c1a570b53e7c159213ba2

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-31` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `fd36ed4ee645f1e8a36bd3a20ac076a9c70d7bc1c89c2b3488edcb551816a21b`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema`; native digest `b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f`; whole shown digest `cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920`.

Rationale: Supersede the complete unheaded-block-31 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "| Status | Required fields |". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
| Status | Required fields |
|---|---|
| `done` | `summary`; at least one `evidenceRefs` entry or a companion `agent-report.md` for read-only work; external git/artifact evidence for mutating work. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |
~~~~

#### Complete current counterpart

~~~~markdown
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
~~~~

### claim_742532532aa9e696db78cb285b8b2178

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `546c59ef10ff886d2fd256b488c6193c117c59d5e82632dbb8c14b30cd072efc`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema`; native digest `b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f`; whole shown digest `cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920`.

Rationale: Whole-unit replacement, not a structural move or promotion: The whole optional nextRecommendedOperation clause is restored: legal stage operation only, recommendation only, and driver legality verification before action; its existing proposed/unconsumed status and the current legal-selection carrier are stated explicitly. The genuine historical source witness and its claim identity stay unchanged. The corrected truth was independently accepted in 9351a257f; this carriage-label correction remains pending for the A23 targeted check, without inherited approval.

#### Complete pinned source unit

~~~~markdown
Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
~~~~

#### Complete current counterpart

~~~~markdown
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
~~~~

### claim_a277b4049236bc5574145bac059711c1

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37`; native digest `f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f`; whole shown digest `f9a43ac823ac553c41f0f8734a247e9e88404201676f68476f9b003961fd475f`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
RunResult status and confidence are control-plane judgments.
~~~~

#### Complete current counterpart

~~~~markdown
RunResult status and confidence are control-plane judgments.
~~~~

### claim_63156a6026de7a0ff7fbad44aa1b4281

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-34` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `09432ca4e37e6469053ef9ae2f7931a444dd0b05c9d58a2fe25d34daede483f6`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38`; native digest `21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e`; whole shown digest `21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e`.

Rationale: Supersede the complete older confidence-ladder unit with the real current confidence table, not its introductory sentence. All five confidence classes are addressed in the replacement; the reported row and failed row now state the accepted blocked/read-only/findings branches, their evidence and separate status boundaries against run-result.mjs:1250-1285. Those claim-bearing corrections replace the old unconditional reported/explicit-failure statements; they are not a structural-only move. A24 authorizes this inherited semantic retarget and label correction. Source witness and identity remain pinned; no approval carries, and whole-unit replacement remains pending independent review.

#### Complete pinned source unit

~~~~markdown
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
~~~~

#### Complete current counterpart

~~~~markdown
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |
~~~~

### claim_84b7cd3e67c87c553e30f60243f2aaa9

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39`; native digest `9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a`; whole shown digest `9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
~~~~

#### Complete current counterpart

~~~~markdown
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
~~~~

### claim_91283c9936f0e12201b89acc09109179

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-40`; native digest `45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269`; whole shown digest `45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
~~~~

#### Complete current counterpart

~~~~markdown
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
~~~~

### claim_3b5dc416320d1a6d45c254067dcb819d

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-37` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41`; native digest `5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd`; whole shown digest `5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
~~~~

#### Complete current counterpart

~~~~markdown
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
~~~~

### claim_cc49bf43e6fe30f0fb858e49ddd7ae81

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42`; native digest `d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f`; whole shown digest `d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
~~~~

#### Complete current counterpart

~~~~markdown
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
~~~~

### claim_377b337b7f62374e0380bde37a235300

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43`; native digest `dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a`; whole shown digest `dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Discovery is machine-alone.
~~~~

#### Complete current counterpart

~~~~markdown
Discovery is machine-alone.
~~~~

### claim_78aa83e3a51cd866a2ac2bede23cbeb9

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-40` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44`; native digest `538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8`; whole shown digest `538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
~~~~

#### Complete current counterpart

~~~~markdown
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
~~~~

### claim_9a9308ce7c8e42934677d8cb5eabe705

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45`; native digest `b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565`; whole shown digest `b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
~~~~

#### Complete current counterpart

~~~~markdown
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
~~~~

### claim_f34be39fff111922b3bcfdececd9cbf5

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46`; native digest `8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63`; whole shown digest `8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Exploring is the human-adjacent decision-locking stage.
~~~~

#### Complete current counterpart

~~~~markdown
Exploring is the human-adjacent decision-locking stage.
~~~~

### claim_0d2ea8d781366940476e413ce92981e3

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47`; native digest `6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013`; whole shown digest `6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
~~~~

#### Complete current counterpart

~~~~markdown
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
~~~~

### claim_7db5dc11f77d14fd3727322fc55d3f93

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48`; native digest `6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2`; whole shown digest `6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
~~~~

#### Complete current counterpart

~~~~markdown
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
~~~~

### claim_c57b759ed7febdde453483cdaa751b47

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49`; native digest `14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9`; whole shown digest `14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Planning has two main operation families:
~~~~

#### Complete current counterpart

~~~~markdown
Planning has two main operation families:
~~~~

### claim_d9b5b1e4e476d7f6ef0b7d48d006e733

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50`; native digest `f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0`; whole shown digest `f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
~~~~

#### Complete current counterpart

~~~~markdown
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
~~~~

### claim_b9aa2904f915f73edd84bc53b688efb6

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `65d8bf9a4c4dda65972648dcc3f44641abb8680b909df0e588967a43d489b362`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning`; native digest `286da397570ef708e22713d69313855865d24e617ca25730cefd92ce2d67eea1`; whole shown digest `3c79c92349fb4f59b0987f61f4f38ea8f421aa112efaf3c207e16d6d56495877`.

Rationale: Supersede the complete unheaded-block-47 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#103-planning. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "The stage owner may write the plan directly, but validation should move toward". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
The stage owner may write the plan directly, but validation should move toward
a reviewer Assignment once Step 05 adopts operation choice.
~~~~

#### Complete current counterpart

~~~~markdown
### 10.3 Planning

Planning has two main operation families:

- `shape-plan` by implementer;
- `validate-plan` by reviewer.

The current coding Workflow already declares `shape-plan` and reviewer
`validate-plan`; adopting a future Step 05 is not a prerequisite for that
operation (`domains/coding/workflows/feature.yaml:64-100`).

`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
~~~~

### claim_01076329b1d1de03c55e36f8f6083888

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52`; native digest `999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e`; whole shown digest `999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
~~~~

#### Complete current counterpart

~~~~markdown
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
~~~~

### claim_706f2bd1b37418db859990fb08c94d7c

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53`; native digest `62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b`; whole shown digest `62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Executing has the richest team protocol:
~~~~

#### Complete current counterpart

~~~~markdown
Executing has the richest team protocol:
~~~~

### claim_9fd07336436513827c0662dd5a28ad34

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-5` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `978a58e97f57c8fd35a307893f95258075982cf4c2a5b0c90cced1dd574b7b0d`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose`; native digest `686ca168b65f0f7cdb20ef555957a6662aa1daa93df0e6448262cb4ba1b01c07`; whole shown digest `4cf850b1c98febefb237699ad7350778cad5b202e53c293f59d6dd4120a9f662`.

Rationale: Supersede the complete unheaded-block-5 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#1-purpose. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "-> current workflow stage". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
```txt
Work position
  -> current workflow stage
    -> legal stage operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```
~~~~

#### Complete current counterpart

~~~~markdown
## 1. Purpose

Team Dispatch V1 needs a communication protocol, but it must stay smaller than
a mailbox, daemon, or second lifecycle system.

This proposal retains communication doctrine for Work-attached coding activity.
The early standalone prototype was retired; current standalone execution uses
Unit/CollaborationPattern or Workflow. A predeclared Workflow is not required
for every bounded Unit request, but validated contracts and governance remain.

The protocol defines how roles communicate while `Work` remains the lifecycle
authority:

```txt
Work position
  -> recorded workflowStep
    -> legal step operations
      -> selected Assignment
        -> one Run
          -> one RunResult
            -> driver chooses the next legal operation or engine verb
```

The protocol is not a meeting scheduler. It is the set of rules that make one
role's message usable by another role without trusting terminal text or agent
say-so as proof.
~~~~

### claim_b1ac27062ecb3e38aa015468ddde00f3

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54`; native digest `3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca`; whole shown digest `3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
~~~~

#### Complete current counterpart

~~~~markdown
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
~~~~

### claim_f5547cd37d69dfb14b002eefc64466ab

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55`; native digest `3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962`; whole shown digest `3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
~~~~

#### Complete current counterpart

~~~~markdown
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
~~~~

### claim_6f97739eb139794268dacb8d60dde14e

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56`; native digest `99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3`; whole shown digest `99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
Multi-agent implementation benefits from a durable operating harness:
~~~~

#### Complete current counterpart

~~~~markdown
Multi-agent implementation benefits from a durable operating harness:
~~~~

### claim_fa6023902614373a29e9bd46d7ffdee5

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-57`; native digest `3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f`; whole shown digest `3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
~~~~

#### Complete current counterpart

~~~~markdown
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
~~~~

### claim_fac890b2535c30ea85082981768e751f

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58`; native digest `68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264`; whole shown digest `68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
~~~~

#### Complete current counterpart

~~~~markdown
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
~~~~

### claim_7ed1b25376986d3b14af32de5a42bade

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `b8fff28ad65a1ca9989c3692ee032020c172e1f2e2f5f538da0f73b13482312e`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness`; native digest `c0d64a86d73bfde404d65fadaa6e35b423daa0450a779678408d3219ab4caef8`; whole shown digest `9193a323393770e9f3dcd417809b76a102d17ca3eeaddbb3199c227581e093ab`.

Rationale: Supersede the complete unheaded-block-55 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#11-coordination-operating-harness. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "it is not a runtime dependency gate for standalone coordination.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for standalone coordination.
~~~~

#### Complete current counterpart

~~~~markdown
## 11. Coordination Operating Harness

Multi-agent implementation benefits from a durable operating harness:

```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```

This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.

The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for current Unit/Workflow execution.
~~~~

### claim_2b93e5dd494194b949188f9b77ceae8a

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-63` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-61`; native digest `734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5`; whole shown digest `734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
The protocol is ready for driver adoption when:
~~~~

#### Complete current counterpart

~~~~markdown
The protocol is ready for driver adoption when:
~~~~

### claim_2898e0b9ca684155967180fa0230b8ae

Disposition: move; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-64` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-62`; native digest `aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae`; whole shown digest `aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae`.

Rationale: The complete historical source unit is retained byte-identically by this unique real current native unit. A24 corrects an inherited ordinal binding that instead pointed at another paragraph; the frozen native digest and heading ancestry now name the actual source-text carrier. The earlier approval is not carried: the corrected binding requires independent full-unit verification. Source identity and committed source witness remain unchanged; no claim is dropped.

#### Complete pinned source unit

~~~~markdown
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~

#### Complete current counterpart

~~~~markdown
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~

### claim_d64648495877bd05b5ef3ba2f5c799cc

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-7` at `d23045c2de83e3508fda8fd2580b43ece2e1e046`; native digest `5d24354554fdf1aed4c4baad1294475bb1d44e0b36c912743d7122764454c240`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries`; native digest `69df95123739c341b70ac683f5191086425ea3bd6a02af26a8dd86eb02a2d6a2`; whole shown digest `3dad7e4132c159bab6079fb6829f3b0ccb1e825bf2756c6c904f4392d54e9ca4`.

Rationale: Supersede the complete unheaded-block-7 historical source unit with docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#2-non-negotiable-boundaries. The current counterpart replaces stage/coordination-engine execution claims with current Workflow-step roles and real RunResult status/confidence validation; future-driver legality and blocked-evidence obligations remain explicitly proposed rather than falsely auto-enforced. Source-specific changed wording: "Mission is a lightweight team envelope.". The pinned complete source and actual complete current unit are retained in the targeted packet; A23 whole-unit vocabulary and A24 same-batch inherited-label authorization apply. Independent review must check every clause; no approval carries.

#### Complete pinned source unit

~~~~markdown
```txt
Work is lifecycle authority.
Mission is a lightweight team envelope.
Stage is workflow position.
Stage Operation is one legal task-shaped action inside a stage.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```
~~~~

#### Complete current counterpart

~~~~markdown
## 2. Non-Negotiable Boundaries

```txt
Work is lifecycle authority.
Mission is reserved/deferred vocabulary, not a current team-envelope runtime.
workflowStep records Work's position.
Step operations are declared semantic actions, not a second Stage Protocol engine.
Assignment is a semantic request.
Run is a runtime attempt.
RunResult is normalized result plus evidence.
Herdr is visibility only.
```

Do not introduce `Job` in V1. `Job` remains reserved for a future queue,
scheduler, lease, cancellation, or worker-pool design.

Do not let an Assignment mutate Work lifecycle state by itself. Work moves only
through existing engine verbs such as `fgos discover`, `fgos plan`, `fgos
return`, `fgos ask`, `fgos answer`, and approval/merge verbs.
~~~~

### claim_3817494a9443f5b9be5b1b3aa22613ad

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-15` at `eefe3c4e73012ad439010196d6690d546ca87c8e`; native digest `4173ec263ab82dbec1cc0138083b9a13debc8821030f94a08e26c81680068e0c`.

Target: `docs/platform/agent-coordination/architecture/protocol-model.md#compatibility`; native digest `83aa85a06907fe314ff287f9c63d0d67417933bd0af40a8426180ee499369f64`; whole shown digest `a0a50b9e5327a33e11548c30917dac1b43360b9cf2e8932cb762ef7c1829fb8c`.

Rationale: The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23.

#### Complete pinned source unit

~~~~markdown
This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it.
~~~~

#### Complete current counterpart

~~~~markdown
## Compatibility

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
~~~~

### claim_69b011aac8a371496f54e1c681286bfd

Disposition: supersede; physical review state: pending

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-32` at `a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2`; native digest `eb3336c5f0bc349a94bf04af7437d8fd2eefcf6e62208fe4a904b90187900a96`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33`; native digest `ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56`; whole shown digest `ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56`.

Rationale: The existing supersede whole-unit carriage decision is retained; the authorized precision/obligation correction changes the shown target bytes, not the source identity or historical carriage. This current counterpart is bound by the frozen native unit digest and real heading ancestry. Exact byte equality and earlier approval are not asserted for the corrected target; the changed binding is pending independent targeted review under A22/A23.

#### Complete pinned source unit

~~~~markdown
| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`; `evidenceRefs` when any evidence exists. |
| `failed` | `summary`; `error`. |
| `no-evidence` | `summary`; reason why evidence is absent. |
~~~~

#### Complete current counterpart

~~~~markdown
| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
~~~~

### claim_424bbeb8e8fe53a80b03440fb53ae248

Disposition: supersede; physical review state: reviewed

Source: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35` at `a4e132ccd01e2b20a0e6c874ec5b4d6fbb5781e2`; native digest `09432ca4e37e6469053ef9ae2f7931a444dd0b05c9d58a2fe25d34daede483f6`.

Target: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38`; native digest `21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e`; whole shown digest `21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e`.

Rationale: Pending successor accounting under A13 shape and the explicit A22 authorization: the authorized section correction in f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f replaces the former unit with this code-checked counterpart. Every claim remains accounted; unchanged whole-source historical carriage retains the old text. Source/target shown texts and native digests are pinned; independent targeted review is required with no approval carry.

#### Complete pinned source unit

~~~~markdown
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | Structured claim plus a worker-produced report for read-only consult/review work. | May feed driver judgment, but should not close mutating work. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid schema, or explicit failure. | Must not advance Work. |
~~~~

#### Complete current counterpart

~~~~markdown
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |
~~~~

## Current-unit classification receipts

Use independent committed classification reports with `Reviewer`, `Author session` and `Receipt commit: e3989e217d932ced11b99f40f7cfd9c9097c6c31`. Content table: `| Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest |`; frame table omits the evidence-digest column. Check every content statement against code, including explicit proposal/manual/retired boundaries. Accepting a digest alone is not a truth verdict.

### claim_1d32168fc40f00b8ff103f6e494ca6f0

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-29`; native digest `27f108554ecf59440195ac0aa398fd624fdc03ba28e7bc518131e02832b36b31`; shown digest `27f108554ecf59440195ac0aa398fd624fdc03ba28e7bc518131e02832b36b31`; evidence digest `88cdc7db6cbf6795a938722a4295ccd56f5a36d883ed18abd8cd8766bfba12da`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded component-internal-ownership evidence; no previous classification approval is carried.

~~~~markdown
1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
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
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "test/runner/dispatch-reconciliation-import-graph.test.mjs",
      "startLine": 434,
      "endLine": 443,
      "blobSha": "1028a7279ac95a48f6075d239f36f5cf250ec58f"
    },
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "startLine": 500,
      "endLine": 528,
      "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
    },
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "startLine": 1419,
      "endLine": 1438,
      "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
    },
    {
      "path": "src/runner/dispatch/resolve.mjs",
      "startLine": 25,
      "endLine": 66,
      "blobSha": "2049c05b94a245826c0b630ab22305369cab4301"
    },
    {
      "path": "src/runner/dispatch/resolve.mjs",
      "startLine": 269,
      "endLine": 310,
      "blobSha": "2049c05b94a245826c0b630ab22305369cab4301"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_c70a8a1ffd7d36e49b31d6296cc31356`, `claim_3917668d815f67336de99ba9a7f2e81a`

### claim_f2b49dde03982181f6b70e8673696528

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-9`; native digest `38517e6c917bb4e21624a0e07b496579d6190b6adb9983f5fe18e16c3526eeb8`; shown digest `38517e6c917bb4e21624a0e07b496579d6190b6adb9983f5fe18e16c3526eeb8`; evidence digest `84caa73c14e06d68ca3506ee5cfc8f08782e2411c8facef2f0a19bcac15c5b9a`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 2-production-ladder-semantics evidence; no previous classification approval is carried.

~~~~markdown
A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/liveness.mjs",
      "startLine": 211,
      "endLine": 302,
      "blobSha": "79d5e65792adb72fe23ee03ca3c3058f53946411"
    },
    {
      "path": "src/runner/dispatch/herdr-round.mjs",
      "startLine": 341,
      "endLine": 359,
      "blobSha": "2a31f0e1bd7eb571f1fbe130fbc8c2a399772074"
    },
    {
      "path": "src/runner/recovery.mjs",
      "startLine": 105,
      "endLine": 112,
      "blobSha": "a2272b4a665b8d366932129cd91fd5f3b6f4014f"
    },
    {
      "path": "src/runner/dispatch/liveness.mjs",
      "startLine": 93,
      "endLine": 109,
      "blobSha": "79d5e65792adb72fe23ee03ca3c3058f53946411"
    },
    {
      "path": "src/runner/dispatch/liveness.mjs",
      "startLine": 238,
      "endLine": 246,
      "blobSha": "79d5e65792adb72fe23ee03ca3c3058f53946411"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_c26b6c8149e0b5bc78dab2b6e1fb6e0a`, `claim_ad392d3c304da7625a3e2f75aa0753e6`

### claim_d2ccffd941fae05969fc134130f7237a

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-14`; native digest `dda2de3ff221e2646b7a686c931fe6dfeb234cfd913cd8a7487bf437415f7785`; shown digest `dda2de3ff221e2646b7a686c931fe6dfeb234cfd913cd8a7487bf437415f7785`; evidence digest `0ad35fc7e9207b41e51d90fa2a79aa50a706aae85967a4564c22e54dee2ddc78`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded compatibility evidence; no previous classification approval is carried.

~~~~markdown
`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/state/domain-registry.mjs",
      "startLine": 244,
      "endLine": 258,
      "blobSha": "79871e4e1c675b5a371707d719dbc2318f71f112"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 180,
      "endLine": 240,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    },
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 43,
      "endLine": 85,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/runner/operation-choice.mjs",
      "startLine": 733,
      "endLine": 761,
      "blobSha": "7ccfd74c289cc74fb7f7122ea4a7b545a9101156"
    },
    {
      "path": "src/runner/dispatch/assignment.mjs",
      "startLine": 328,
      "endLine": 345,
      "blobSha": "b252e866575596b5de51ef94d6f1967c94d5ef91"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140"
  ]
}
~~~~

Historical reference trace: `claim_aa0e400354f9f0b2a32e90249880fa78`, `claim_a0dbbb8526785c8cf1c8bc658d6d38b5`

### claim_18a3cfd6a8ea03de8c4fedbb261d68ea

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-17`; native digest `9719376eb7ba87c28d95d4dae1fa9da87b9972532fbb3eda1872cccca07a153f`; shown digest `9719376eb7ba87c28d95d4dae1fa9da87b9972532fbb3eda1872cccca07a153f`; evidence digest `07acde21c8230db8cb6101d0b79f156e29d2985ba15e055e54a93cbc27937b09`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded standalone-coordination evidence; no previous classification approval is carried.

~~~~markdown
The former session/FlowDefinition profile is historical, not the Workflow operation contract. See the complete historical snapshot linked above.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/state/domain-registry.mjs",
      "startLine": 244,
      "endLine": 258,
      "blobSha": "79871e4e1c675b5a371707d719dbc2318f71f112"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 180,
      "endLine": 240,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140"
  ]
}
~~~~

Historical reference trace: `claim_18a3cfd6a8ea03de8c4fedbb261d68ea`, `claim_18a3cfd6a8ea03de8c4fedbb261d68ea`

### claim_8583ddde780e3b33f160facfa96d595a

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#6-local-concurrency-and-durability`; native digest `b54abb5801b4e539ddd8dc29f1135d06a751a9833cd45a7fd27e72aff7b63cd6`; shown digest `097936745e3bd24722d05d5c02697903f13d2e8a95e1e7c7cee804833dfdaf68`; evidence digest `c23f368159aa8d1c6372da40766028e5b17a716d7f4c2bcb16e77065dcf32d9b`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 6-local-concurrency-and-durability evidence; no previous classification approval is carried.

~~~~markdown
## 6. Local Concurrency And Durability

Control acquisition must not reclaim a live process merely because TTL expired.
Holder identity is `{hostId, bootId, pid, processStartTime}` of the process doing
control, not a guessed Rust parent. Unknown liveness is not dead. A dead holder
may leave a remotely queued command: successor first reconciles pending control.

Implemented (Phase 02 H1, `src/runner/dispatch/run-lock.mjs`): holder identity
is `{id, pid, bootId, processStartTime, host}` (`buildRunControlHolder`,
`host` in place of this section's `hostId`), and `resolveHolderLiveness`
encodes the reclaim decision above as a table — a live pid, a pid whose
liveness cannot be disproven (unreadable `/proc/<pid>/stat`), or a pre-H1
holder record with no `processStartTime` to cross-check all resolve to
`held`, never `dead`; only a genuinely dead pid, a pid reused by a different
process (`processStartTime` mismatch), or a `bootId` predating the current
boot resolve to `dead`.

Recommended local implementation for safe reclaim without unlink races:
one per-scope lock directory containing immutable generation records and
token-specific release markers. Contenders publish generation `g+1` only after
`g` is released or its exact process identity is proven dead. Exactly one wins
exclusive publication. Never unlink/overwrite an earlier generation during
acquire/release, so a delayed release cannot delete its successor. A live holder
never self-recognizes a second concurrent acquisition as reentrant. Generation
records are retained with the runtime/session artifacts; compaction is offline
only after the scope is quiescent.

The proposed durability profile requires a fully written/fsynced temp file in
the same directory, atomic non-overwriting publication and directory fsync.
It calls for temp+rename+directory fsync under the owning lock for replacement.
Those are design requirements; the implementation's best-effort directory
fsync and other limits are stated below, not silently promoted to guarantees.
Current terminal `result.json` is published by `publishImmutableProof`
(`settlement.mjs:434`), not the mutable writer. `run.json` updates, the
effective-execution-contract projection and bookkeeping markers use their
mutable/marker writers. An unreadable existing result refuses relaunch rather
than overwriting evidence. The proof helper fsyncs the file, hard-links it
without overwrite, treats `EEXIST` as an existing proof and rethrows other link
errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
A dedicated unsupported-filesystem diagnostic/doctor probe is a design
requirement, not an implemented check. No distributed lease, background
renewal service or TTL-only takeover is required by this local design.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/run-lock.mjs",
      "startLine": 306,
      "endLine": 412,
      "blobSha": "d44e2aef594ad322fa5496601501431b6ce216b3"
    },
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "startLine": 895,
      "endLine": 945,
      "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
    },
    {
      "path": "src/runner/dispatch/settlement.mjs",
      "startLine": 420,
      "endLine": 445,
      "blobSha": "00fbe59dc5a30eccd4b39e027e4dbd33587a9e22"
    },
    {
      "path": "src/runner/dispatch/proof-helpers.mjs",
      "startLine": 73,
      "endLine": 125,
      "blobSha": "ec8e9f6ab9406cea6eb7ff9ab1edf4fe962862ca"
    },
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "startLine": 999,
      "endLine": 1022,
      "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_8583ddde780e3b33f160facfa96d595a`, `claim_8583ddde780e3b33f160facfa96d595a`

### claim_d8a077877f29a3795a186e52b7c20cb7

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#decision`; native digest `5622c06276f32ad74efed999035410c8d752835bbe3f671d5ac3368f4555384c`; shown digest `860625505af248f5e4da75b5c8abbf0ca2d3732123931ab1947a70daa834164a`; evidence digest `74a8e6484854e118385b9ff633ea2ff74be20d6ad3d487e4dafa82d46be9f48c`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded decision evidence; no previous classification approval is carried.

~~~~markdown
## Decision

1. **Three current provenance kinds, one execution path.** Declared and inline
   builders stamp `contractPolicyVersion`, `normalizerVersion` and validator
   provenance (`assignment.mjs:456-459,663-666`). The Unit door separately writes
   `provenance.kind: unit-run` with its Unit-run context (`execution/run.mjs:334-338`);
   do not assert every kind has the declared builder's identical shape.
   - `declared`: Workflow step/operation/TaskSpec validation and normalization.
   - `inline`: foundation contract validation, the applicable registered domain
     harness and caller provenance.
   - `unit-run`: the Unit execution door and its computed binding/admission.
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   use operation tables with role/mutation-derived fallbacks for unmapped
   operations (`assignment-normalizer.mjs:95-124`); inline contracts must declare
   mutation/evidence explicitly. Missing required inline values fail validation.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Declared `resultKind` and optional `onAdvance` use the
   normalizer tables, with advisory/work-product fallback from mutation
   (`assignment-normalizer.mjs:120-143`). These are not arbitrary accepted
   inline-contract fields.
4. **Validated inline fields.** `objective`, `contextRefs`, `constraints`,
   `expectedOutputs`, `mutation`, `evidence`, required `role` and `budget`;
   optional `capabilities`, `supports`, `contractTemplate` and narrow `policy`.
   Budget requires positive integer `timeoutMs` and `maxRuns`; optional `tokens`
   is telemetry, not an enforced limit (`execution-contract.mjs:345-346,371-382`);
   inline policy accepts only
   `tier`, not a full PolicyPatch. Caller fields are validated separately
   (`execution-contract.mjs:180-240,295-340`). Unknown fields are rejected.
5. **Same execution governance.** Declared, inline and Unit-run requests
   converge on Assignment execution and Run/RunResult normalization rather than
   private dispatch or stores that bypass governance.
6. **Current mutation admission, not the retired first slice.** Generic inline mutation validation still requires the reserved protocol-operation stamp (`execution-contract.mjs:327-334`, `assignment-normalizer.mjs:173-175`), but the engine that produced that stamp was retired. The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3058. Do not present the dormant stamp path as a current general session-runtime door.

7. **Retire the standalone read-only heuristic.** Once no declared caller
   passes `workId: null`, the `missionId || workId === null => read-only`
   clauses are removed; read-only status comes only from the stamped
   `mutation` field.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/execution/run.mjs",
      "startLine": 331,
      "endLine": 340,
      "blobSha": "98ab4b4c2124285530c3ff676e6eb2864c6baef2"
    },
    {
      "path": "src/runner/dispatch/assignment-normalizer.mjs",
      "startLine": 95,
      "endLine": 144,
      "blobSha": "192664dc4272d0e99e5b1bd91b9102ab6a4758a1"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 180,
      "endLine": 240,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    },
    {
      "path": "src/runner/dispatch/assignment-normalizer.mjs",
      "startLine": 164,
      "endLine": 188,
      "blobSha": "192664dc4272d0e99e5b1bd91b9102ab6a4758a1"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 337,
      "endLine": 384,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "docs/specs/runner.md:3058"
  ]
}
~~~~

Historical reference trace: `claim_d8a077877f29a3795a186e52b7c20cb7`, `claim_d8a077877f29a3795a186e52b7c20cb7`

### claim_23d876a3d8a3d6065303317b2200500c

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#unheaded-block-5`; native digest `997fca8d11fa5a0c89d56f91a578fd3c10ea4aeffdca29e97643c7d9d8fbd237`; shown digest `997fca8d11fa5a0c89d56f91a578fd3c10ea4aeffdca29e97643c7d9d8fbd237`; evidence digest `74a8e6484854e118385b9ff633ea2ff74be20d6ad3d487e4dafa82d46be9f48c`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded decision evidence; no previous classification approval is carried.

~~~~markdown
1. **Three current provenance kinds, one execution path.** Declared and inline
   builders stamp `contractPolicyVersion`, `normalizerVersion` and validator
   provenance (`assignment.mjs:456-459,663-666`). The Unit door separately writes
   `provenance.kind: unit-run` with its Unit-run context (`execution/run.mjs:334-338`);
   do not assert every kind has the declared builder's identical shape.
   - `declared`: Workflow step/operation/TaskSpec validation and normalization.
   - `inline`: foundation contract validation, the applicable registered domain
     harness and caller provenance.
   - `unit-run`: the Unit execution door and its computed binding/admission.
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   use operation tables with role/mutation-derived fallbacks for unmapped
   operations (`assignment-normalizer.mjs:95-124`); inline contracts must declare
   mutation/evidence explicitly. Missing required inline values fail validation.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Declared `resultKind` and optional `onAdvance` use the
   normalizer tables, with advisory/work-product fallback from mutation
   (`assignment-normalizer.mjs:120-143`). These are not arbitrary accepted
   inline-contract fields.
4. **Validated inline fields.** `objective`, `contextRefs`, `constraints`,
   `expectedOutputs`, `mutation`, `evidence`, required `role` and `budget`;
   optional `capabilities`, `supports`, `contractTemplate` and narrow `policy`.
   Budget requires positive integer `timeoutMs` and `maxRuns`; optional `tokens`
   is telemetry, not an enforced limit (`execution-contract.mjs:345-346,371-382`);
   inline policy accepts only
   `tier`, not a full PolicyPatch. Caller fields are validated separately
   (`execution-contract.mjs:180-240,295-340`). Unknown fields are rejected.
5. **Same execution governance.** Declared, inline and Unit-run requests
   converge on Assignment execution and Run/RunResult normalization rather than
   private dispatch or stores that bypass governance.
6. **Current mutation admission, not the retired first slice.** Generic inline mutation validation still requires the reserved protocol-operation stamp (`execution-contract.mjs:327-334`, `assignment-normalizer.mjs:173-175`), but the engine that produced that stamp was retired. The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3058. Do not present the dormant stamp path as a current general session-runtime door.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/execution/run.mjs",
      "startLine": 331,
      "endLine": 340,
      "blobSha": "98ab4b4c2124285530c3ff676e6eb2864c6baef2"
    },
    {
      "path": "src/runner/dispatch/assignment-normalizer.mjs",
      "startLine": 95,
      "endLine": 144,
      "blobSha": "192664dc4272d0e99e5b1bd91b9102ab6a4758a1"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 180,
      "endLine": 240,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    },
    {
      "path": "src/runner/dispatch/assignment-normalizer.mjs",
      "startLine": 164,
      "endLine": 188,
      "blobSha": "192664dc4272d0e99e5b1bd91b9102ab6a4758a1"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 337,
      "endLine": 384,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "docs/specs/runner.md:3058"
  ]
}
~~~~

Historical reference trace: `claim_d04f3528ac32bc6a0a67ecc6153e7879`, `claim_90f9d9a811588a6b3372cc53001045e1`

### claim_4c0c970dae43e8703d7a3cb196d0abff

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-33`; native digest `ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56`; shown digest `ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56`; evidence digest `49e11fd32fed2fa03d142b25ff263dbdbdb82db492949c078829452ea4402813`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 7-agent-result-schema evidence; no previous classification approval is carried.

~~~~markdown
| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "startLine": 1245,
      "endLine": 1330,
      "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 5,
      "endLine": 30,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 52,
      "endLine": 90,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 70,
      "endLine": 79,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/operation-choice.mjs",
      "startLine": 747,
      "endLine": 761,
      "blobSha": "7ccfd74c289cc74fb7f7122ea4a7b545a9101156"
    },
    {
      "path": "src/runner/dispatch/assignment.mjs",
      "startLine": 328,
      "endLine": 345,
      "blobSha": "b252e866575596b5de51ef94d6f1967c94d5ef91"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_241d8e8d42387c28dc30179f1bad66cb`

### claim_78039339074d6cb799f0cc05212bc1b2

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-51`; native digest `6607ab2663e1528b4881d574a6a1c7c6a25d65603f61d9c7631e01152e89c16a`; shown digest `6607ab2663e1528b4881d574a6a1c7c6a25d65603f61d9c7631e01152e89c16a`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 103-planning evidence; no previous classification approval is carried.

~~~~markdown
The current coding Workflow already declares `shape-plan` and reviewer
`validate-plan`; adopting a future Step 05 is not a prerequisite for that
operation (`domains/coding/workflows/feature.yaml:64-100`).
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_78039339074d6cb799f0cc05212bc1b2`, `claim_94f214f5722011ac862fa96484a2e26a`

### claim_75b676acfa47fb48346fdb41a14eb88b

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-59`; native digest `4b4919e773a62ee697078975dd8b356c3cddb449ce8b52b82098cdd61c141a9c`; shown digest `4b4919e773a62ee697078975dd8b356c3cddb449ce8b52b82098cdd61c141a9c`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 11-coordination-operating-harness evidence; no previous classification approval is carried.

~~~~markdown
The harness should be used where it reduces implementation drift, but dogfooding
it is not a runtime dependency gate for current Unit/Workflow execution.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_75b676acfa47fb48346fdb41a14eb88b`, `claim_1ab27a36fa860ce8e0ed9c1b5911979e`

### claim_d8b4cce034d24c66cc78b3b542a08754

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-60`; native digest `d7526645b493fa257553cc2e45338792d83be617562b8e5e8be20e62c9e5bff0`; shown digest `d7526645b493fa257553cc2e45338792d83be617562b8e5e8be20e62c9e5bff0`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 12-standalone-read-only-coordination evidence; no previous classification approval is carried.

~~~~markdown
The former session-engine runtime path is historical. Current standalone execution uses Unit/CollaborationPattern, not that protocol profile. The manual operating harness in section 11 remains current by owner decision.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_d8b4cce034d24c66cc78b3b542a08754`, `claim_d8b4cce034d24c66cc78b3b542a08754`

### claim_ad21fc833125360407f6b23ca8a6d951

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership`; native digest `2733a56fe75fb75ffd77892a1cbc0937340927f3c7727df7cc59446f24be91ce`; shown digest `0c74651edd5b7e919916e16bb79bbe5536883eb24333911502d943c37f14d833`; evidence digest `88cdc7db6cbf6795a938722a4295ccd56f5a36d883ed18abd8cd8766bfba12da`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded component-internal-ownership evidence; no previous classification approval is carried.

~~~~markdown
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
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
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "test/runner/dispatch-reconciliation-import-graph.test.mjs",
      "startLine": 434,
      "endLine": 443,
      "blobSha": "1028a7279ac95a48f6075d239f36f5cf250ec58f"
    },
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "startLine": 500,
      "endLine": 528,
      "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
    },
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "startLine": 1419,
      "endLine": 1438,
      "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
    },
    {
      "path": "src/runner/dispatch/resolve.mjs",
      "startLine": 25,
      "endLine": 66,
      "blobSha": "2049c05b94a245826c0b630ab22305369cab4301"
    },
    {
      "path": "src/runner/dispatch/resolve.mjs",
      "startLine": 269,
      "endLine": 310,
      "blobSha": "2049c05b94a245826c0b630ab22305369cab4301"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_ad21fc833125360407f6b23ca8a6d951`

### claim_4206c1d35ff143014142819046d69771

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics`; native digest `21295b47dae8583ef4b70ea406ad45275bdb1902af772589db488dafa179f7c8`; shown digest `a35fb469efa3a059e4b81b4abc4cf83ce4f35ea323bb4a311e8f380003086bdc`; evidence digest `84caa73c14e06d68ca3506ee5cfc8f08782e2411c8facef2f0a19bcac15c5b9a`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 2-production-ladder-semantics evidence; no previous classification approval is carried.

~~~~markdown
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/liveness.mjs",
      "startLine": 211,
      "endLine": 302,
      "blobSha": "79d5e65792adb72fe23ee03ca3c3058f53946411"
    },
    {
      "path": "src/runner/dispatch/herdr-round.mjs",
      "startLine": 341,
      "endLine": 359,
      "blobSha": "2a31f0e1bd7eb571f1fbe130fbc8c2a399772074"
    },
    {
      "path": "src/runner/recovery.mjs",
      "startLine": 105,
      "endLine": 112,
      "blobSha": "a2272b4a665b8d366932129cd91fd5f3b6f4014f"
    },
    {
      "path": "src/runner/dispatch/liveness.mjs",
      "startLine": 93,
      "endLine": 109,
      "blobSha": "79d5e65792adb72fe23ee03ca3c3058f53946411"
    },
    {
      "path": "src/runner/dispatch/liveness.mjs",
      "startLine": 238,
      "endLine": 246,
      "blobSha": "79d5e65792adb72fe23ee03ca3c3058f53946411"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_4206c1d35ff143014142819046d69771`

### claim_ebaa71c8fb1db8ef94dc08f83f51807f

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/protocol-model.md#compatibility`; native digest `83aa85a06907fe314ff287f9c63d0d67417933bd0af40a8426180ee499369f64`; shown digest `a0a50b9e5327a33e11548c30917dac1b43360b9cf2e8932cb762ef7c1829fb8c`; evidence digest `0ad35fc7e9207b41e51d90fa2a79aa50a706aae85967a4564c22e54dee2ddc78`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded compatibility evidence; no previous classification approval is carried.

~~~~markdown
## Compatibility

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/state/domain-registry.mjs",
      "startLine": 244,
      "endLine": 258,
      "blobSha": "79871e4e1c675b5a371707d719dbc2318f71f112"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 180,
      "endLine": 240,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    },
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 43,
      "endLine": 85,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/runner/operation-choice.mjs",
      "startLine": 733,
      "endLine": 761,
      "blobSha": "7ccfd74c289cc74fb7f7122ea4a7b545a9101156"
    },
    {
      "path": "src/runner/dispatch/assignment.mjs",
      "startLine": 328,
      "endLine": 345,
      "blobSha": "b252e866575596b5de51ef94d6f1967c94d5ef91"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140"
  ]
}
~~~~

Historical reference trace: `claim_ebaa71c8fb1db8ef94dc08f83f51807f`

### claim_56c5cdf17d45ca7bc8a06b045cd7ef6a

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-15`; native digest `f058552f4b52d313e8f86aca9c70ac756a42145757a31ba6b58099f5945534be`; shown digest `f058552f4b52d313e8f86aca9c70ac756a42145757a31ba6b58099f5945534be`; evidence digest `0ad35fc7e9207b41e51d90fa2a79aa50a706aae85967a4564c22e54dee2ddc78`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded compatibility evidence; no previous classification approval is carried.

~~~~markdown
This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/state/domain-registry.mjs",
      "startLine": 244,
      "endLine": 258,
      "blobSha": "79871e4e1c675b5a371707d719dbc2318f71f112"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 180,
      "endLine": 240,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    },
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 43,
      "endLine": 85,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/runner/operation-choice.mjs",
      "startLine": 733,
      "endLine": 761,
      "blobSha": "7ccfd74c289cc74fb7f7122ea4a7b545a9101156"
    },
    {
      "path": "src/runner/dispatch/assignment.mjs",
      "startLine": 328,
      "endLine": 345,
      "blobSha": "b252e866575596b5de51ef94d6f1967c94d5ef91"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140"
  ]
}
~~~~

Historical reference trace: `claim_3817494a9443f5b9be5b1b3aa22613ad`

### claim_747e62e56c75416974d865f34776dc1b

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/protocol-model.md#unheaded-block-16`; native digest `1336340eee4a4baf5590bfd842f9ba0d8c3bd0c08e501ed16e6742ede9b06088`; shown digest `1336340eee4a4baf5590bfd842f9ba0d8c3bd0c08e501ed16e6742ede9b06088`; evidence digest `0ad35fc7e9207b41e51d90fa2a79aa50a706aae85967a4564c22e54dee2ddc78`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded compatibility evidence; no previous classification approval is carried.

~~~~markdown
The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/state/domain-registry.mjs",
      "startLine": 244,
      "endLine": 258,
      "blobSha": "79871e4e1c675b5a371707d719dbc2318f71f112"
    },
    {
      "path": "src/runner/dispatch/execution-contract.mjs",
      "startLine": 180,
      "endLine": 240,
      "blobSha": "ac3a26083e375666764c7c722d615c308032e99b"
    },
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 43,
      "endLine": 85,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    },
    {
      "path": "src/runner/operation-choice.mjs",
      "startLine": 733,
      "endLine": 761,
      "blobSha": "7ccfd74c289cc74fb7f7122ea4a7b545a9101156"
    },
    {
      "path": "src/runner/dispatch/assignment.mjs",
      "startLine": 328,
      "endLine": 345,
      "blobSha": "b252e866575596b5de51ef94d6f1967c94d5ef91"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140"
  ]
}
~~~~

Historical reference trace: `claim_747e62e56c75416974d865f34776dc1b`

### claim_1c28dede124fbc48e2aed31bcb6bb448

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md#unheaded-block-19`; native digest `8b0822d6aee06fb803ed5f4d5ee08be2d6971c66153ef18b4707e7cd8f327e11`; shown digest `8b0822d6aee06fb803ed5f4d5ee08be2d6971c66153ef18b4707e7cd8f327e11`; evidence digest `c23f368159aa8d1c6372da40766028e5b17a716d7f4c2bcb16e77065dcf32d9b`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 6-local-concurrency-and-durability evidence; no previous classification approval is carried.

~~~~markdown
The proposed durability profile requires a fully written/fsynced temp file in
the same directory, atomic non-overwriting publication and directory fsync.
It calls for temp+rename+directory fsync under the owning lock for replacement.
Those are design requirements; the implementation's best-effort directory
fsync and other limits are stated below, not silently promoted to guarantees.
Current terminal `result.json` is published by `publishImmutableProof`
(`settlement.mjs:434`), not the mutable writer. `run.json` updates, the
effective-execution-contract projection and bookkeeping markers use their
mutable/marker writers. An unreadable existing result refuses relaunch rather
than overwriting evidence. The proof helper fsyncs the file, hard-links it
without overwrite, treats `EEXIST` as an existing proof and rethrows other link
errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
A dedicated unsupported-filesystem diagnostic/doctor probe is a design
requirement, not an implemented check. No distributed lease, background
renewal service or TTL-only takeover is required by this local design.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/run-lock.mjs",
      "startLine": 306,
      "endLine": 412,
      "blobSha": "d44e2aef594ad322fa5496601501431b6ce216b3"
    },
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "startLine": 895,
      "endLine": 945,
      "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
    },
    {
      "path": "src/runner/dispatch/settlement.mjs",
      "startLine": 420,
      "endLine": 445,
      "blobSha": "00fbe59dc5a30eccd4b39e027e4dbd33587a9e22"
    },
    {
      "path": "src/runner/dispatch/proof-helpers.mjs",
      "startLine": 73,
      "endLine": 125,
      "blobSha": "ec8e9f6ab9406cea6eb7ff9ab1edf4fe962862ca"
    },
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "startLine": 999,
      "endLine": 1022,
      "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_ba5969519e30f006a6eb0174c94d49b9`

### claim_36b0160e2c6b33c6b3b6958486805043

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema`; native digest `b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f`; shown digest `cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920`; evidence digest `49e11fd32fed2fa03d142b25ff263dbdbdb82db492949c078829452ea4402813`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 7-agent-result-schema evidence; no previous classification approval is carried.

~~~~markdown
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "startLine": 1245,
      "endLine": 1330,
      "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 5,
      "endLine": 30,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 52,
      "endLine": 90,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 70,
      "endLine": 79,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/operation-choice.mjs",
      "startLine": 747,
      "endLine": 761,
      "blobSha": "7ccfd74c289cc74fb7f7122ea4a7b545a9101156"
    },
    {
      "path": "src/runner/dispatch/assignment.mjs",
      "startLine": 328,
      "endLine": 345,
      "blobSha": "b252e866575596b5de51ef94d6f1967c94d5ef91"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_36b0160e2c6b33c6b3b6958486805043`

### claim_820ca8318df78e7426ab81c938a0d83a

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-36`; native digest `ced47404abe27dcf3984b8d1b62c02e37787e2654eeb7af864d3272a2b9284e0`; shown digest `ced47404abe27dcf3984b8d1b62c02e37787e2654eeb7af864d3272a2b9284e0`; evidence digest `49e11fd32fed2fa03d142b25ff263dbdbdb82db492949c078829452ea4402813`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 7-agent-result-schema evidence; no previous classification approval is carried.

~~~~markdown
Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "startLine": 1245,
      "endLine": 1330,
      "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 5,
      "endLine": 30,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 52,
      "endLine": 90,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/dispatch/agent-result-claim-contract.mjs",
      "startLine": 70,
      "endLine": 79,
      "blobSha": "20c9d63d1e0795bb4860ef1298037cc467d92095"
    },
    {
      "path": "src/runner/operation-choice.mjs",
      "startLine": 747,
      "endLine": 761,
      "blobSha": "7ccfd74c289cc74fb7f7122ea4a7b545a9101156"
    },
    {
      "path": "src/runner/dispatch/assignment.mjs",
      "startLine": 328,
      "endLine": 345,
      "blobSha": "b252e866575596b5de51ef94d6f1967c94d5ef91"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_442970a9228617f16af5de16883fad2d`

### claim_4c05b748365100a7b2cb1fd5daa040d2

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-38`; native digest `21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e`; shown digest `21cfbd22dd0b30278cfb44f38652360d02071c1a40a437cf07a59415fc28e29e`; evidence digest `2b40509e2ac50704e096d68f37f9760838d618671ea1f8117ca08a0707657d3b`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 8-runresult-confidence evidence; no previous classification approval is carried.

~~~~markdown
Confidence ladder:

| Confidence | Meaning | Allowed use |
|---|---|---|
| `verified` | Structured claim plus post-run external evidence such as a new commit, new changed file, test artifact, or verified result file. | May feed lifecycle decisions that require proof. |
| `reported` | A blocked claim, even without a companion report; or a read-only done claim with a worker report; or a failed findings verdict with a report and exit 0 (`run-result.mjs:1261-1278`). | May feed driver judgment, but should not close mutating work; status remains separate from confidence. |
| `inferred` | Post-run external evidence exists but no structured claim exists. | May be surfaced for inspection; driver should avoid automatic lifecycle movement. |
| `no-evidence` | Process settled without proof. | Must not advance Work. |
| `failed` | Timeout, nonzero exit, signal, invalid claim, read-only mutation, or a failed claim not qualifying for the reported findings branch (`run-result.mjs:1250-1271`). | Must not advance Work; an explicit failure is not always failed confidence. |
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "startLine": 1245,
      "endLine": 1330,
      "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
    },
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "startLine": 1250,
      "endLine": 1285,
      "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_424bbeb8e8fe53a80b03440fb53ae248`

### claim_d12a88745c6473898f8e3946bfd6a282

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-39`; native digest `9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a`; shown digest `9b769b73c2920816c9da55624eb71f9c6704bb633a32db6a0ba27d71aaef2e6a`; evidence digest `2b40509e2ac50704e096d68f37f9760838d618671ea1f8117ca08a0707657d3b`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 8-runresult-confidence evidence; no previous classification approval is carried.

~~~~markdown
The driver must treat `done/no-evidence` as not done. It may retry, ask for a
proper artifact, or route to a different legal operation.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "startLine": 1245,
      "endLine": 1330,
      "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
    },
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "startLine": 1250,
      "endLine": 1285,
      "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": []
}
~~~~

Historical reference trace: `claim_d12a88745c6473898f8e3946bfd6a282`

### claim_03e3bf1a24b5712d6df990d5af622dcd

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-40`; native digest `45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269`; shown digest `45448dcaa1ce69055f61288526e27178ab68b9657ad3c6ea0471592547570269`; evidence digest `232a1b7e2a49fc922359fc991dc1fa6759f15246705f9f37a4a1f31c7e936491`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 9-handoff-versus-assignment evidence; no previous classification approval is carried.

~~~~markdown
Use `handoff` when the interaction is a short role-axis record around work the
current session already performed or directly observed.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/state/store.mjs",
      "startLine": 1497,
      "endLine": 1562,
      "blobSha": "418f3d688929b78bae26607a8eb624737e0ead25"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_03e3bf1a24b5712d6df990d5af622dcd`

### claim_97229569942e2e64f1f92b89a23bd513

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-41`; native digest `5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd`; shown digest `5e110b497e1da92942a6973ad6b43884d4085ad25ae9ee9a6d23c44d8c63b6bd`; evidence digest `232a1b7e2a49fc922359fc991dc1fa6759f15246705f9f37a4a1f31c7e936491`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 9-handoff-versus-assignment evidence; no previous classification approval is carried.

~~~~markdown
Use Assignment when:

- another executor, provider, role, or tool performs the action;
- the result will be read by a later driver turn;
- the result needs Run/RunResult evidence;
- the interaction may fail independently;
- a read-only consult/review needs an artifact rather than a one-line summary.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/state/store.mjs",
      "startLine": 1497,
      "endLine": 1562,
      "blobSha": "418f3d688929b78bae26607a8eb624737e0ead25"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_97229569942e2e64f1f92b89a23bd513`

### claim_1c7027aa91b45aed495eaff739ad27a5

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-42`; native digest `d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f`; shown digest `d804ea47af68c0aa6bcdc1058abb3dd934cfe47cfbc766e23bbed4772b98ad1f`; evidence digest `232a1b7e2a49fc922359fc991dc1fa6759f15246705f9f37a4a1f31c7e936491`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 9-handoff-versus-assignment evidence; no previous classification approval is carried.

~~~~markdown
`handoff` remains useful for visibility and role-holder truth. It is not enough
evidence for a Team Dispatch operation once the result influences a lifecycle
decision.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/state/store.mjs",
      "startLine": 1497,
      "endLine": 1562,
      "blobSha": "418f3d688929b78bae26607a8eb624737e0ead25"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_1c7027aa91b45aed495eaff739ad27a5`

### claim_1fa64800fce6ec3602dc783078b1daef

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-43`; native digest `dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a`; shown digest `dce623d34c1aae45bf2a55698fd5befa24dafd26b62ff898bf34fee1e683896a`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 101-discovery evidence; no previous classification approval is carried.

~~~~markdown
Discovery is machine-alone.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_1fa64800fce6ec3602dc783078b1daef`

### claim_9ccb2418b7aec6f7f91493359b13f7cb

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-44`; native digest `538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8`; shown digest `538e8cefb7885ba1fd52c8a4b9dc39cdd9b13edc851f8b83dd1b48a0670fd4c8`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 101-discovery evidence; no previous classification approval is carried.

~~~~markdown
Allowed behavior:

- owner reads existing Work context;
- owner consults researcher helpers for evidence;
- owner logs consult interactions;
- owner chooses `clear` or `unclear`;
- `clear` can route to planning;
- `unclear` routes to exploring.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_9ccb2418b7aec6f7f91493359b13f7cb`

### claim_4a4bddcbf0fc4ffa406c51d5df8d5623

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-45`; native digest `b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565`; shown digest `b343cb615e796f69b45669066da04a200bb366f9071bba646a4b1a546a9ce565`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 101-discovery evidence; no previous classification approval is carried.

~~~~markdown
Forbidden behavior:

- asking the human directly;
- parking as `awaiting-human`;
- treating a helper's unsupported answer as proof;
- opening a new Work item just to answer a bounded evidence question.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_4a4bddcbf0fc4ffa406c51d5df8d5623`

### claim_9b3f9c72ffb5b9fbe4bfda4d054139c2

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-46`; native digest `8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63`; shown digest `8be1c52fac778e783278a3fa17f78a4cf05b675f7111d46bc5930dd19a2bce63`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 102-exploring evidence; no previous classification approval is carried.

~~~~markdown
Exploring is the human-adjacent decision-locking stage.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_9b3f9c72ffb5b9fbe4bfda4d054139c2`

### claim_223b98d1f2a5e3b6828b08b8e4370931

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-47`; native digest `6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013`; shown digest `6c2c64a1d48e2d1dca430f0811e612771eda3379e19731d984b3c5ea8b042013`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 102-exploring evidence; no previous classification approval is carried.

~~~~markdown
Allowed behavior:

- advisor interaction for material, grounded, answerable product questions;
- researcher consult for repo or external facts;
- lock decisions into CONTEXT.md.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_223b98d1f2a5e3b6828b08b8e4370931`

### claim_f842daa15a1440ce53c57b28b577a61d

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-48`; native digest `6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2`; shown digest `6e5cc24269ba7cf4ebfdf5bb8062990d284cd999b1d8462e36c55d28713910f2`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 102-exploring evidence; no previous classification approval is carried.

~~~~markdown
Exploring may ask a human. It should ask only after machine evidence has been
gathered and the question is self-contained.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_f842daa15a1440ce53c57b28b577a61d`

### claim_80dd38236997a4794fe26e44e1dcfcad

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-49`; native digest `14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9`; shown digest `14807360bce011d160261d7194fbcc2cf445f6a0722f072d50101af54d78d3b9`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 103-planning evidence; no previous classification approval is carried.

~~~~markdown
Planning has two main operation families:
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_80dd38236997a4794fe26e44e1dcfcad`

### claim_19eb3db5e5020a16b00678f6a1912c64

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-50`; native digest `f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0`; shown digest `f40aa8cbca5552bcf674388b44a555d1c431f1abab5c218961744a0c77968db0`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 103-planning evidence; no previous classification approval is carried.

~~~~markdown
- `shape-plan` by implementer;
- `validate-plan` by reviewer.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_19eb3db5e5020a16b00678f6a1912c64`

### claim_e47495f1bcf3abc217aa128346ffe56b

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-52`; native digest `999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e`; shown digest `999fd62d2ac5bba2d830abbc5aa0e3057ed2a35f727a9ef390bdffe41c60714e`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 103-planning evidence; no previous classification approval is carried.

~~~~markdown
`validate-plan` is a real reviewer-role operation when dispatched through
Assignment. Prose that says validating is only an implementer function must be
reconciled before driver adoption.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_e47495f1bcf3abc217aa128346ffe56b`

### claim_988e3a8a6c0362f62381f07d896adee4

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-53`; native digest `62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b`; shown digest `62f1292eb44e2dd4af3c1ccde7a1a7247ae0febf11739444e8b377e233d40a1b`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 104-executing evidence; no previous classification approval is carried.

~~~~markdown
Executing has the richest team protocol:
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_988e3a8a6c0362f62381f07d896adee4`

### claim_f97e179a706fe5ce55a5ce146e23fb59

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-54`; native digest `3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca`; shown digest `3db147178920207776ed26ad024fdfc3cb509d1839901116d0693f322f8f6bca`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 104-executing evidence; no previous classification approval is carried.

~~~~markdown
- implementer owns the main edit path;
- researcher may answer blast-radius or API/pattern questions;
- helper may take independent scoped work;
- reviewer may review returned diffs or candidate fixes;
- advisor handles product/scope questions that exceed locked decisions.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_f97e179a706fe5ce55a5ce146e23fb59`

### claim_b80a6e9ecbbe65bdc1b568c9635c76fe

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-55`; native digest `3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962`; shown digest `3c902b0dddbee64c10302bbe2fa05b431d4ee1236b7c925bf4ba6d10a1859962`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 104-executing evidence; no previous classification approval is carried.

~~~~markdown
The implementer remains responsible for Work lifecycle. Helper/reviewer
assignments return artifacts and recommendations unless explicitly promoted to
child Work.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_b80a6e9ecbbe65bdc1b568c9635c76fe`

### claim_a3282845dc3dfd02de60631741d5f4fa

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-56`; native digest `99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3`; shown digest `99fd2729268c130f3b988b8833fb4ec10dedeb48094339156e687cba619bebb3`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 11-coordination-operating-harness evidence; no previous classification approval is carried.

~~~~markdown
Multi-agent implementation benefits from a durable operating harness:
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_a3282845dc3dfd02de60631741d5f4fa`

### claim_c5d72d517bde5f2eadf2afee05649af7

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-57`; native digest `3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f`; shown digest `3136bedc9eac77f08874328886bc22baa033ea44009227abad3fe36e05878c8f`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 11-coordination-operating-harness evidence; no previous classification approval is carried.

~~~~markdown
```txt
trace/index.md
trace/current-cell.md
trace/<cell>.md
prompt templates
review and red-team gates
live proof capture
```
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_c5d72d517bde5f2eadf2afee05649af7`

### claim_5906c3d46cacca0ac1ad8aae963a8304

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-58`; native digest `68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264`; shown digest `68cb00b63900ec23e263a0a39ed605cf5e1f2a3a841467c8632d7f06e99f4264`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 11-coordination-operating-harness evidence; no previous classification approval is carried.

~~~~markdown
This harness is documented in
[coordination-operating-harness.md](../playbooks/coordination-operating-harness.md). It is
supporting engineering practice, not Step 07 runtime infrastructure and not a
lifecycle system. Its job is to keep coordinator, doer, reviewer, and red-team
sessions aligned while preserving token budget and proof traceability.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_5906c3d46cacca0ac1ad8aae963a8304`

### claim_d0a734e0e2ffe167a8576cd898e4279d

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-61`; native digest `734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5`; shown digest `734cc0979352c1a8d01a9e6c05a6fd4d544665459d9c6bdc8a3e71b9622321d5`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 13-acceptance-criteria-for-v1-protocol evidence; no previous classification approval is carried.

~~~~markdown
The protocol is ready for driver adoption when:
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_d0a734e0e2ffe167a8576cd898e4279d`

### claim_8de909df847b8689807abcfe156b704a

Class: candidate-native-content

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-62`; native digest `aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae`; shown digest `aaded8bcb540dd65483aeec1913efc98975a6a30b92a0e1dbcd6505a5f03e4ae`; evidence digest `954a747fd250a5fbcf8de79c6aee4942f3675cf02dfddb717325f4fe1ce7dd70`.

This genuine current native unit replaces the listed stale/changed/ordinal receipt references. Its complete shown text and current implementation/design/retirement boundaries require independent targeted verification against the recorded 13-acceptance-criteria-for-v1-protocol evidence; no previous classification approval is carried.

~~~~markdown
- every runtime assignment receives an explicit result artifact path;
- malformed or missing structured claims cannot produce `verified` or
  `reported`;
- dirty-before files cannot be counted as post-run evidence;
- read-only operations can return `reported` only through worker artifacts;
- mutating operations require post-run external evidence;
- stage skills agree on when Assignment is used versus direct invocation;
- `validate-plan` role prose is consistent across skill and task-spec docs;
- discovery remains machine-alone.
~~~~

Code evidence (full immutable metadata):

~~~~markdown
{
  "commit": "3378386db450cf0b8e366f3b95b093314b03800c",
  "finding": "true-and-current",
  "citations": [
    {
      "path": "src/workflow/steps.mjs",
      "startLine": 40,
      "endLine": 86,
      "blobSha": "90c81d9d050c8494ba92c3b64c92a0b83a50ba15"
    }
  ],
  "scope": "The reviewer verifies the complete shown unit against this unchanged current code, including its explicit proposed/manual/retired boundaries. This evidence does not claim live execution or implementation of labelled design. The section-level proof and any supporting context references are separately shown.",
  "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
  "supportingContextReferences": [
    "domains/coding/workflows/feature.yaml:12-140",
    "domains/coding/registry.yaml:3-64"
  ]
}
~~~~

Historical reference trace: `claim_8de909df847b8689807abcfe156b704a`

### claim_978add6195798b64b599b1a2050ca2b2

Class: structural-frame

Unit: `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-35`; native digest `6c1793d59cb3c61a400cb26b3109fbe4e57b594df0002ec9a159a372536b97a6`; shown digest `6c1793d59cb3c61a400cb26b3109fbe4e57b594df0002ec9a159a372536b97a6`; evidence digest not applicable.

This newly introduced primitive only frames the proposed legality obligation below; it makes no additional current-runtime claim. Its actual text/digest and frame class require independent review.

~~~~markdown
For this proposed extension, the legality obligation remains:
~~~~

Historical reference trace: 

## Six changed current sections

Check all current-state sentences against the named unchanged code/evidence; especially mandatory Work primary compatibility, optional unconsumed recommendation fields, blocked-evidence obligation vs validation, confidence branches, pane-retention defaults, and status/idleness not being result truth. A section-level report is required separately from classification verdicts.

### docs/platform/agent-coordination/architecture/dispatch-control-plane.md#component-internal-ownership

Native digest: `2733a56fe75fb75ffd77892a1cbc0937340927f3c7727df7cc59446f24be91ce`; whole shown digest `0c74651edd5b7e919916e16bb79bbe5536883eb24333911502d943c37f14d833`.

Evidence: `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`, `src/runner/dispatch/assignment-runner.mjs:500-528`, `src/runner/dispatch/assignment-runner.mjs:1419-1438`, `src/runner/dispatch/resolve.mjs:25-66`, `src/runner/dispatch/resolve.mjs:269-310`

~~~~markdown
## Component-Internal Ownership

The Dispatch And Execution Engine owns exactly these authorities. No other
component performs any of them; this control plane performs none of the
Component-Outer Boundary Note's responsibilities.

1. **Request normalizer (design)** — the normalized target/policy/provenance
   boundary is proposed; current inputs are the compiler options above.
2. **Capability binding resolver** — `resolveExecutorAndOverrides` binds literal
   executor IDs/defaults or capability `prefer`; aliases and executor `for[]`
   inform capability labels separately in `resolveCapabilityDetailsFromHints`
   (`resolve.mjs:25-66,269-310`), not this binding resolver.
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
~~~~

### docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#2-production-ladder-semantics

Native digest: `21295b47dae8583ef4b70ea406ad45275bdb1902af772589db488dafa179f7c8`; whole shown digest `a35fb469efa3a059e4b81b4abc4cf83ce4f35ea323bb4a311e8f380003086bdc`.

Evidence: `src/runner/dispatch/liveness.mjs:211-302`, `src/runner/dispatch/herdr-round.mjs:341-359`, `src/runner/recovery.mjs:105-112`, `src/runner/dispatch/liveness.mjs:93-109`, `src/runner/dispatch/liveness.mjs:238-246`

~~~~markdown
## 2. Production Ladder Semantics

The order and behavior in `src/runner/dispatch/liveness.mjs` are ported:
1. Worker result file beats all runtime readings; it still requires normalization.
2. Blocked beats timeout in the ladder, but the Herdr adapter maps `blocked` to `worker-timeout` (`herdr-round.mjs:346-357`); the recovery matrix may retry it (`src/runner/recovery.mjs:105-107`). Answering the existing question without retry is the proposed correction, not current end-to-end behavior.
3. Death requires consecutive absent readings (default 3); unknown/present reset.
4. Absolute ceiling follows truth/blocked/death and is not reduced by blind time.
5. Idle/stale evaluation subtracts blind time; working is progress even with
   zero stdout. Screen reads are requested at the stale boundary, and an early
   credential probe also runs after fifteen seconds of non-working idle time
   (`liveness.mjs:267-299`). Thus screen reads are not stale-only.

A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).

Zero output is a fact orthogonal to outcome. A 35-minute zero-output incident can
be timed-out-ceiling, as dogfood P08 records; it is not renamed timed-out-idle.
Handshake timeout with unknown delivery is not proof of launch failure.
The ladder supplies the matching screen line, not a parsed retryAfter timestamp.
An adapter may parse a known provider reset format, preserving the original line;
otherwise retryAfter is absent. RetryAfter only schedules inspection.
~~~~

### docs/platform/agent-coordination/architecture/runtime-recovery-design.md#6-local-concurrency-and-durability

Native digest: `b54abb5801b4e539ddd8dc29f1135d06a751a9833cd45a7fd27e72aff7b63cd6`; whole shown digest `097936745e3bd24722d05d5c02697903f13d2e8a95e1e7c7cee804833dfdaf68`.

Evidence: `src/runner/dispatch/run-lock.mjs:306-412`, `src/runner/dispatch/assignment-runner.mjs:895-945`, `src/runner/dispatch/settlement.mjs:420-445`, `src/runner/dispatch/proof-helpers.mjs:73-125`, `src/runner/dispatch/assignment-runner.mjs:999-1022`

~~~~markdown
## 6. Local Concurrency And Durability

Control acquisition must not reclaim a live process merely because TTL expired.
Holder identity is `{hostId, bootId, pid, processStartTime}` of the process doing
control, not a guessed Rust parent. Unknown liveness is not dead. A dead holder
may leave a remotely queued command: successor first reconciles pending control.

Implemented (Phase 02 H1, `src/runner/dispatch/run-lock.mjs`): holder identity
is `{id, pid, bootId, processStartTime, host}` (`buildRunControlHolder`,
`host` in place of this section's `hostId`), and `resolveHolderLiveness`
encodes the reclaim decision above as a table — a live pid, a pid whose
liveness cannot be disproven (unreadable `/proc/<pid>/stat`), or a pre-H1
holder record with no `processStartTime` to cross-check all resolve to
`held`, never `dead`; only a genuinely dead pid, a pid reused by a different
process (`processStartTime` mismatch), or a `bootId` predating the current
boot resolve to `dead`.

Recommended local implementation for safe reclaim without unlink races:
one per-scope lock directory containing immutable generation records and
token-specific release markers. Contenders publish generation `g+1` only after
`g` is released or its exact process identity is proven dead. Exactly one wins
exclusive publication. Never unlink/overwrite an earlier generation during
acquire/release, so a delayed release cannot delete its successor. A live holder
never self-recognizes a second concurrent acquisition as reentrant. Generation
records are retained with the runtime/session artifacts; compaction is offline
only after the scope is quiescent.

The proposed durability profile requires a fully written/fsynced temp file in
the same directory, atomic non-overwriting publication and directory fsync.
It calls for temp+rename+directory fsync under the owning lock for replacement.
Those are design requirements; the implementation's best-effort directory
fsync and other limits are stated below, not silently promoted to guarantees.
Current terminal `result.json` is published by `publishImmutableProof`
(`settlement.mjs:434`), not the mutable writer. `run.json` updates, the
effective-execution-contract projection and bookkeeping markers use their
mutable/marker writers. An unreadable existing result refuses relaunch rather
than overwriting evidence. The proof helper fsyncs the file, hard-links it
without overwrite, treats `EEXIST` as an existing proof and rethrows other link
errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
A dedicated unsupported-filesystem diagnostic/doctor probe is a design
requirement, not an implemented check. No distributed lease, background
renewal service or TTL-only takeover is required by this local design.
~~~~

### docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#decision

Native digest: `5622c06276f32ad74efed999035410c8d752835bbe3f671d5ac3368f4555384c`; whole shown digest `860625505af248f5e4da75b5c8abbf0ca2d3732123931ab1947a70daa834164a`.

Evidence: `src/runner/execution/run.mjs:331-340`, `src/runner/dispatch/assignment-normalizer.mjs:95-144`, `src/runner/dispatch/execution-contract.mjs:180-240`, `src/runner/dispatch/assignment-normalizer.mjs:164-188`, `src/runner/dispatch/execution-contract.mjs:337-384`, `docs/specs/runner.md:3058`

~~~~markdown
## Decision

1. **Three current provenance kinds, one execution path.** Declared and inline
   builders stamp `contractPolicyVersion`, `normalizerVersion` and validator
   provenance (`assignment.mjs:456-459,663-666`). The Unit door separately writes
   `provenance.kind: unit-run` with its Unit-run context (`execution/run.mjs:334-338`);
   do not assert every kind has the declared builder's identical shape.
   - `declared`: Workflow step/operation/TaskSpec validation and normalization.
   - `inline`: foundation contract validation, the applicable registered domain
     harness and caller provenance.
   - `unit-run`: the Unit execution door and its computed binding/admission.
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   use operation tables with role/mutation-derived fallbacks for unmapped
   operations (`assignment-normalizer.mjs:95-124`); inline contracts must declare
   mutation/evidence explicitly. Missing required inline values fail validation.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Declared `resultKind` and optional `onAdvance` use the
   normalizer tables, with advisory/work-product fallback from mutation
   (`assignment-normalizer.mjs:120-143`). These are not arbitrary accepted
   inline-contract fields.
4. **Validated inline fields.** `objective`, `contextRefs`, `constraints`,
   `expectedOutputs`, `mutation`, `evidence`, required `role` and `budget`;
   optional `capabilities`, `supports`, `contractTemplate` and narrow `policy`.
   Budget requires positive integer `timeoutMs` and `maxRuns`; optional `tokens`
   is telemetry, not an enforced limit (`execution-contract.mjs:345-346,371-382`);
   inline policy accepts only
   `tier`, not a full PolicyPatch. Caller fields are validated separately
   (`execution-contract.mjs:180-240,295-340`). Unknown fields are rejected.
5. **Same execution governance.** Declared, inline and Unit-run requests
   converge on Assignment execution and Run/RunResult normalization rather than
   private dispatch or stores that bypass governance.
6. **Current mutation admission, not the retired first slice.** Generic inline mutation validation still requires the reserved protocol-operation stamp (`execution-contract.mjs:327-334`, `assignment-normalizer.mjs:173-175`), but the engine that produced that stamp was retired. The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3058. Do not present the dormant stamp path as a current general session-runtime door.

7. **Retire the standalone read-only heuristic.** Once no declared caller
   passes `workId: null`, the `missionId || workId === null => read-only`
   clauses are removed; read-only status comes only from the stamped
   `mutation` field.
~~~~

### docs/platform/agent-coordination/architecture/protocol-model.md#compatibility

Native digest: `83aa85a06907fe314ff287f9c63d0d67417933bd0af40a8426180ee499369f64`; whole shown digest `a0a50b9e5327a33e11548c30917dac1b43360b9cf2e8932cb762ef7c1829fb8c`.

Evidence: `src/workflow/steps.mjs:40-86`, `src/state/domain-registry.mjs:244-258`, `domains/coding/workflows/feature.yaml:12-140`, `src/runner/dispatch/execution-contract.mjs:180-240`, `src/workflow/steps.mjs:43-85`, `src/runner/operation-choice.mjs:733-761`, `src/runner/dispatch/assignment.mjs:328-345`

~~~~markdown
## Compatibility

`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.

This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.

The exact normalized contract is defined in
[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md).
~~~~

### docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#7-agent-result-schema

Native digest: `b4795ed4e9d009f97e13c46b1802463563b2be105e68f19856392ca56c8d8c4f`; whole shown digest `cc9aaee50766d26c7a5bf53b41ac3ed918fdc0c6de50489280857b2d672a7920`.

Evidence: `src/runner/dispatch/run-result.mjs:1245-1330`, `src/runner/dispatch/agent-result-claim-contract.mjs:5-30`, `src/runner/dispatch/agent-result-claim-contract.mjs:52-90`, `src/runner/dispatch/agent-result-claim-contract.mjs:70-79`, `src/runner/operation-choice.mjs:747-761`, `src/runner/dispatch/assignment.mjs:328-345`

~~~~markdown
## 7. Agent Result Schema

`agent-result.json` is the worker's structured claim. It is not proof by
itself.

Minimal v2 reviewer claim (reviewer/red-team and recheck contexts require
`assessment.verdict`; agent-result-claim-contract.mjs:5-30,81-85):

```json
{
  "contract": { "id": "agent-result-claim", "version": 2 },
  "status": "done",
  "summary": "One concise result sentence.",
  "findings": [],
  "evidenceRefs": [],
  "assessment": { "verdict": "pass" }
}
```

Allowed status values:

| Status | Meaning |
|---|---|
| `done` | The worker believes the assignment objective is complete. |
| `blocked` | The worker could not complete because a named blocker remains. |
| `failed` | The worker attempted the assignment and produced an error or invalid output. |
| `no-evidence` | The worker can report context but cannot support a completion claim. |

Required fields by status:

| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |

`nextRecommendedOperation` is a proposed optional extension, not a current
validated schema field or a field the Work-layer caller presently consumes.

For this proposed extension, the legality obligation remains:

Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
~~~~

