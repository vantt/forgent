# Agent Coordination System Context

Document type: Architecture
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: system purpose, actors, layers, and top-level boundaries

## Purpose

fgOS coordinates semantic work across agents, providers, models, tiers, roles,
and execution mechanisms while preserving one authoritative Work lifecycle and
independently verifiable runtime evidence.

Per the [Agent Coordination Foundation Vision](../vision.md), this is a
domain-neutral foundation. Work, a predeclared Workflow, and a predeclared
Coordination Protocol are optional integration or augmentation layers, not
prerequisites for coordination.

## Context

```txt
Human/operator
  -> objective / Mission / Work intake
  -> lifecycle decisions where Work exists
  -> optional workflow/protocol/domain configuration

fgOS control plane
  -> coordinator / launcher / router / driver
  -> agent-led, declared, or domain-assisted planning
  -> validated semantic execution-contract construction
  -> dispatch governance
  -> Run and RunResult storage

Optional augmentation
  -> declared Workflow or Coordination Protocol
  -> domain knowledge / doctrine / Skills
  -> planning, resource, isolation, and evidence harnesses
  -> organization-specific policy / roles / souls

Execution environment
  -> provider/model/executor/CLI
  -> structured result and artifacts

Visibility
  -> Herdr panes/process observation
```

## Accepted Boundaries

- Agent Coordination is usable without Work and without a predeclared graph.
- Work is the only delivery lifecycle authority.
- Workflow and protocol definitions constrain legal operations when selected.
- Agent-led execution still requires a validated semantic contract and cannot
  bypass authority, budget, dispatch, mutation, or evidence policy.
- Planning may be agent-led, declared, domain-assisted, or composed.
- Assignment expresses semantic intent.
- Dispatch selects governed execution infrastructure.
- Run records one attempt.
- RunResult normalizes claims, evidence, artifacts, and failure.
- Herdr is visibility, not truth or evidence.
- Job is reserved for a future queue/scheduler and is absent from V1.
- Domain-specific problem-solving rules augment the foundation rather than
  becoming universal core policy.

## Runtime Profiles

The implemented baseline is Work-attached Team Dispatch plus a read-only
mission-lite prototype. The accepted target direction supports:

```txt
Standalone, agent-led
  objective -> dynamic semantic tasks/Assignments -> dispatch/runtime

Standalone, declared
  objective -> optional Coordination Protocol -> tasks/Assignments

Work-attached
  Work Stage Operation -> optional CoordinationSession -> tasks/Assignments

Domain-assisted
  any profile -> domain context/plan/resource/evidence augmentation
```

A generalized CoordinationSession/AdhocTask runtime and the exact dynamic
execution-contract shape remain under discussion in
[Step 07](../proposals/step-07-coordination-session-adhoc-task.md). Optional
standalone protocol packages and agent-led adoption remain under discussion in
[Step 08](../proposals/step-08-standalone-coordination-protocols.md).

## Trust Boundaries

- Agent prose is untrusted until normalized and checked against TaskSpec and
  evidence policy, or against the equivalent validated inline execution
  contract when no TaskSpec is selected.
- Executor output cannot grant Work lifecycle authority.
- Provider/model selection must pass dispatch governance.
- Coordinator prose cannot grant itself mutation, budget, privacy, or dispatch
  authority.
- Terminal/process visibility cannot establish semantic completion.
- Synthesis cannot strengthen weak evidence by repetition or consensus.
