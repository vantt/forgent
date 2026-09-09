# Agent-Coordination Foundation — Capability, Dispatch, and Team Cognition Plan

## Purpose

Stabilize the reusable coordination foundation so agents can work across
providers, models, and tiers with two explicit primitives:

1. dispatch-execution: choose the executor by a canonical capability at the
   execution boundary;
2. team cognition: activate and coordinate multiple agents through the
   existing `fgos-group-thinking` skill, CoordinationSession, and registered
   group-thinking protocols;
3. research support: make research a first-class skill/workflow that can use
   dispatched capabilities (browser/web, repository search, impact analysis,
   and other evidence tools) or be coordinated as a group-thinking round when
   the question benefits from several agents/providers.

This plan covers P1–P4 only. State/root-resolution work is deliberately
separate in `docs/history/agent-coordination-state-root/prompt.md`.

## Locked direction

- Planning records a canonical capability for each independently executable
  unit; it does not record provider, model, tier, or executor.
- Execution uses `decide-before-execute`: call the existing dispatch `decide`
  primitive before executing each unit. The result controls inline,
  in-process, or out-of-process execution.
- `decide-before-dispatch` is legacy terminology, not a second gate.
- Capability is not a Work lifecycle field in this slice.
- Group-thinking uses the existing public `fgos coordination run/show` doors.
  A declared protocol must be explicitly selected from
  `core/protocol-packs/group-thinking.json`; no new protocol-selection
  mechanism is introduced here.

## Existing foundation to consume

- `src/runner/dispatch.mjs` and `src/runner/dispatch/` — decide/execute
  control plane and executor adapters.
- `src/runner/coordination/` and `src/verbs/coordination/` — session runtime,
  assignments, authorizations, dispositions, fan-out, and replay.
- `core/protocol-packs/group-thinking.json` — registered RFC-review-lite,
  nominal-group-lite, and Delphi-feedback-lite protocols.
- `fgos-group-thinking` — explicit protocol membership gate.
- `fgos coordination launch-master-loop` — existing master-loop launcher for
  the standalone coordination fixture.

## Work sequence

### P2-foundation — capability vocabulary and catalog

Establish one canonical identity vocabulary before broadening planner prose.

Deliverables:

- a shared capability catalog/reference defining generic and domain-scoped
  forms (`implement`, `review`, `test`, `debug`, `code:implement`, etc.);
- rules for choosing generic versus `domain:capability`;
- semantics, examples, and fallback behavior for each registered capability;
- an ontology boundary: `fgos-researching` is a skill/workflow, not a
  capability. Research chooses the concrete capabilities it needs, such as
  browser/web access, repository search, symbol/context lookup, or
  impact-analysis;
- capability execution guidance: a capability may be served by an agent
  executor, an MCP/tool provider, or another registered adapter. Dispatch
  selects the provider of the capability; it does not assume every capability
  is an agent-shaped executor;
- a clear statement that catalog entries never pin provider/model/executor;
- setup/doctor/config registration only for capabilities with real configured
  executors.

Candidate existing work to reconcile, not blindly duplicate:

- `tsk-4lc`, `tsk-49o`, `tsk-492`, `tsk-9tu`, `tsk-5x7-1`, `tsk-fli`,
  `tsk-5fn`, `tsk-62w`.
- research/coordination consumers must also be inventoried before adding a
  new capability: existing `fgos-researching`, browser/web tooling,
  GitNexus impact-analysis/search, coordination operation-step, and
  group-thinking items are candidates for reuse, not new parallel paths.

Acceptance:

- two independent agents choose the same canonical identity for the same
  operation;
- `code:implement` remains backward-compatible with current config;
- no new resolver or Work schema is required merely to read the catalog.

### P1 — global planning capability awareness

Add a shared planning instruction layer consumed by every domain planner.

Required behavior:

```text
decompose a plan into execution units
→ assign one canonical capability to each independent unit
→ use capability boundaries as a decomposition signal
→ leave executor/provider/model selection to execution time
```

The coding planner remains a domain specialization and maps implementation to
`code:implement`; it must not be the only place where this rule exists.

Acceptance:

- a non-coding planner also emits capability annotations;
- plans with missing capability are identifiable before execution;
- capability annotations do not create Work items or lifecycle transitions.

### P2-runtime — expand useful capabilities

After the catalog and shared planning rule are stable, add capabilities by
observed frequency:

1. `code:review`
2. `code:test`
3. `code:debug`
4. `code:refactor`

For each capability, prove at least one configured executor path and one
unavailable fallback path. Reconcile related dispatch items rather than
creating parallel implementations.

### P3 — planning harness and selective enforcement

Start with a read-only/static harness:

- every independent execution unit has one canonical capability;
- capability syntax is valid and domain scope is coherent;
- plans contain no provider/model/executor pinning;
- referenced capabilities are registered or explicitly marked unresolved.

Only after dogfood shows repeated non-compliance, add an execution-boundary
guard. The guard may refuse an execution unit with no capability, but must not
turn capability into a Work lifecycle primitive or block unrelated lifecycle
operations.

### P4 — observability and terminology cleanup

Record and surface, for each execution:

- requested capability;
- dispatch decision and mechanism;
- selected executor/provider/model/tier when known;
- inline fallback and reason;
- completion/unknown outcome.

Update active instructions to use `decide-before-execute` consistently and
mark `decide-before-dispatch` as historical terminology only.

## Team-cognition integration

The activation surface for team cognition is the existing
`fgos-group-thinking` skill. It is the convenient agent-facing entrypoint;
the skill must remain a thin gate and launcher, not a second coordination
engine. Use the existing master-prompt/coordination doors for multi-agent
work:

- invoke `fgos-group-thinking` when a task needs deliberation, independent
  research passes, cross-provider review, or synthesis by several agents;
- make the caller name a protocol registered in
  `core/protocol-packs/group-thinking.json`;
- let the skill build/forward the request to `fgos coordination run --file`,
  preserving per-actor executor/model/tier overrides;
- use `fgos-researching` for a single-agent evidence question. That skill may
  dispatch concrete research capabilities (for example browser/web or
  GitNexus impact-analysis) even when no agent executor is involved;
- use group-thinking to coordinate multiple research contributions,
  objections, responses, or synthesis; do not duplicate the researcher
  implementation or relabel the research skill itself as a capability;
- use `fgos coordination launch-master-loop` only for its existing fixture
  contract;
- use `fgos coordination run --file` for declared operations, per-actor
  executor/model/tier overrides, fan-out, authorization, and disposition;
- use `fgos coordination show` as the replay/truth surface.

Do not embed protocol semantics in new skill prose, invent a second
group-thinking activation mechanism, spawn agents directly outside the
coordination door, or hardcode one provider for a whole session.

## Parallel worktree contract

This plan is independently executable from the P0 prompt. The implementing
agent must use its own worktree and must not edit `.fgos/` state from another
worktree. Shared source/doc changes must be committed before handoff. Any
conflict with state/root behavior is reported and deferred to the P0 stream.

## Evidence and exit criteria

- catalog and shared planner instruction are readable by a stranger agent;
- at least one multi-provider group-thinking run is replayable through
  `coordination show`;
- the `fgos-group-thinking` skill can be invoked by an agent without knowing
  provider/model/tier details, while still requiring an explicit registered
  protocol;
- at least one research question is handled through `fgos-researching` using
  one or more concrete dispatched capabilities, and at least one multi-agent
  research question is coordinated through the group-thinking skill with
  contributions and replayable synthesis;
- at least one coding execution proves `code:implement` resolution;
- tests cover canonical capability validation and decide-before-execute
  behavior;
- no active instruction describes `decide-before-dispatch` as an independent
  policy gate.

## Outstanding questions

None for the bounded foundation slice. Any new question about state roots,
distribution, or isolation belongs to the separate P0 prompt.
