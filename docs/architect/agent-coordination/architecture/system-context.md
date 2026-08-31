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

## Context

```txt
Human/operator
  -> Work intake and lifecycle decisions
  -> workflow/protocol configuration

fgOS control plane
  -> launcher/router/driver
  -> stage operation selection
  -> Assignment construction
  -> dispatch governance
  -> Run and RunResult storage

Execution environment
  -> provider/model/executor/CLI
  -> structured result and artifacts

Visibility
  -> Herdr panes/process observation
```

## Accepted Boundaries

- Work is the only delivery lifecycle authority.
- Workflow and protocol definition constrain legal operations.
- Assignment expresses semantic intent.
- Dispatch selects governed execution infrastructure.
- Run records one attempt.
- RunResult normalizes claims, evidence, artifacts, and failure.
- Herdr is visibility, not truth or evidence.
- Job is reserved for a future queue/scheduler and is absent from V1.

## Runtime Profiles

The implemented baseline is Work-attached Team Dispatch. A generalized
CoordinationSession/AdhocTask runtime and Work-independent protocols are under
discussion in [Step 07](../proposals/step-07-coordination-session-adhoc-task.md)
and [Step 08](../proposals/step-08-standalone-coordination-protocols.md).

## Trust Boundaries

- Agent prose is untrusted until normalized and checked against TaskSpec and
  evidence policy.
- Executor output cannot grant Work lifecycle authority.
- Provider/model selection must pass dispatch governance.
- Terminal/process visibility cannot establish semantic completion.
- Synthesis cannot strengthen weak evidence by repetition or consensus.
