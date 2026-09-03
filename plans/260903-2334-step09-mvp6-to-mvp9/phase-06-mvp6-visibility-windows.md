# Phase 06 - MVP6 Visibility Windows

## Objective

Add fail-closed, replayable visibility legality without weakening exact context
grants or existing isolation fixtures.

## Candidate Contract

- `spec.profile.topology.visibilityWindows[]`
- `visibilityWindows[].id`
- `visibilityWindows[].opensAfter.milestone: listed-results-linked`
- `visibilityWindows[].opensAfter.operationRefs[]`
- `visibilityWindows[].permits.sourceOperationRefs[]`
- `visibilityWindows[].permits.delivery: artifact-refs`
- `graph.nodes[].operations[].contextAccess.visibilityWindowRef`

Concrete authority remains:

- `operation-authorized.grantedContextRefs`
- `assignment-created.contextGrant.refs`

## Cells

### P06.1 Definition Schema And Validation

- Add only CoordinationProtocol-profile visibility fields.
- Reject unknown windows, dangling operation refs, duplicate ids, illegal
  delivery values, and Workflow-profile use.
- Leave definitions with no windows byte/behavior compatible.

### P06.2 Runtime, Grant Enforcement, And Replay

- Derive milestone state from listed `result-linked` events.
- Keep the window closed for missing, late, or failed source obligations.
- Allow an accepted `actor-replaced` lineage to satisfy the original source
  obligation without rewriting history.
- At authorization and dispatch, require every granted ref to satisfy both
  same-session ownership and active-window legality.
- Persist no duplicate `visibility-window-applied` truth.

### P06.3 Proof And Promotion

- Positive opt-in post-independent-pass fixture.
- Negative pre-window, unlisted source, foreign-session, missing/failed source,
  unknown window, Workflow profile, terminal authorization, and crash/resume
  cases.
- Run unchanged isolation-heavy fixtures and MVP1-MVP5 regressions.
- Promote only implemented/proved contract text.

## Exit

- FlowDefinition explains what may be granted.
- Authorization/Assignment provenance explains what was granted.
- Replay independently reaches the same legality decision.
- No anonymization, aggregate transformation, or partial-window exception was
  introduced.
