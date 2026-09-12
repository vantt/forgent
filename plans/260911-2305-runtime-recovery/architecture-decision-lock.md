# Runtime Recovery Architecture Decision Lock

**Status:** DESIGN-LOCKED; implementation authorization follows the reviewed cell manifest  
**Date:** 2026-09-11  
**Scope:** runtime recovery track S0-S5 and its code-panel handoff

## Purpose

This document freezes the architectural choices now stable enough to shape
phase designs. It is not an implementation plan, API specification, or
permission to dispatch a code panel. A phase may enter implementation only
after its detailed design, failure matrix, ownership map, and acceptance proof
have been reviewed.

## Locked Decisions

| ID | Decision | Boundary / consequence |
|---|---|---|
| AD-01 | `CoordinationSession` and its event/replay store remain the session authority. | Recovery adds ports and use-case orchestration; it does not create a fourth authority or generic recovery manager. |
| AD-02 | `Assignment` is durable work identity; each attempt is a distinct `Run`. | `attempt` fences supersession between Runs. A separate monotonic `controlEpoch` plus unique `controlToken` fences successive controller acquisitions of the same Run. Herdr `agentSession.value` is conversation correlation, not worker incarnation. Worker or Herdr observation never decides Run truth. |
| AD-03 | First profile is Node-first and conservative. | S0 freezes behavior; S1 fences admission; S2L covers default local `cli-spawn`; S2H extends the lifecycle to Herdr observe/park. Unknown evidence parks or refuses. |
| AD-04 | B04 blocks S2 for every profile. | Reconcile-before-launch must find an orphan worker after coordinator loss and prevent duplicate spawn. Read-only does not waive this requirement. |
| AD-05 | Parent-terminal transfer is refused in the first profile. | `transfer-unavailable` includes remedy `open fresh session` and records the premature-close hazard for X11. B01 blocks S5, not S0-S4. Re-run BL1 after `tsk-5qj` closes. |
| AD-06 | Herdr deterministic names are lookup aids only. | Resource control requires an adapter-proven `resourceIncarnation` such as host/boot plus pid/start-time or an equivalent gateway resource id. `agentSession` remains conversation correlation. Missing or mismatched incarnation never proves absence and parks destructive control. |
| AD-07 | Writable takeover is an opt-in future profile. | No implicit workspace owner or grant issuer. Same-workspace writable takeover remains parked until grant provenance, quiescence and inherited-lineage evaluation prove X05. B02/B03 gate that profile only. |
| AD-08 | Repeatability is explicit and effect-scoped. | `repeatMode` is declared by operation/protocol. Provider allowlist derives from executor `DispatchPlan`/`providerModel`; filtered provider-only execution may be eligible. Unlisted sinks park unless repeatability and dedup identity are proven. Assignment mutation alone is not an effect guarantee. |
| AD-09 | Driver replacement is a separately gated door. | Current profile requires trusted-config operator authorization, one human-turn provenance reference consumed once via `invocationKey`, and scope limited to recover/observe/collect/close. Authorize, disposition and continue require re-authorization. Replay does not read mutable config. |
| AD-10 | Control recovery is epoch/token fenced, never TTL-only. | The filesystem mutex protects only synchronous CAS publication; it never spans adapter I/O. Commands carry the current control token, and stale release cannot delete a successor epoch. Missing marker never proves death. Reclaim requires PID-dead evidence or effect-side token enforcement; force-release is deferred to R3. |
| AD-11 | Hexagonal/SRP shape is mandatory, with an explicit complexity budget. | Domain decisions live in pure evaluators/planners; ports exist only at external authority boundaries; adapters own Herdr/filesystem/CLI details; write doors remain the only mutation boundary. No generic recovery manager, checkpoint framework, health store or effect ledger is introduced. |
| AD-12 | Runtime Recovery is adapter-profiled and has no fgOS web-gateway prerequisite. | Core must cover the default `cli-spawn` adapter with a local supervisor/binding profile. Herdr uses its existing CLI and a separate observe/park profile. HTTP or future adapters without reconciliation contracts return unsupported/park. A web/mobile gateway is not Run authority. |

## Design Gates Still Required

These are design tasks, not unresolved architecture direction:

1. **S1:** event/schema shape, atomic admission transaction, generation fencing,
   and crash-window matrix.
2. **S2:** launch-identity port, gateway lookup/reconcile protocol, locator
   persistence ordering, and incarnation/no-resurrection tests.
3. **S3:** `DispatchPlan` provider derivation, effect attestation shape,
   repeatable sink declaration and park reasons.
4. **S4:** pure evaluator contracts, planner input/output schema, stale-plan
   token and read/write parity.
5. **S5:** terminal refusal is already settled by CP section 6; remaining work
   is the prepared/gated-child/committed transaction, driver replacement and
   single-use transfer grant.
6. **Writable profile:** workspace grant issuer, quiescence proof, material
   lineage and cumulative evaluator. This profile is disabled by default.
7. **Closeout:** migration, setup/doctor registration, capability matrix and
   documentation evidence.

## Entry Rule For Code-Panel

The manifest is intentionally blocked. A phase becomes dispatchable only when
its brief links to this lock and contains owned symbols/files, port contracts,
normal and crash paths, typed outcomes, negative cases, focused tests, and an
independent review/red-team decision. No panel may infer these from chat
history or from this document alone.

## Evidence

- [Runtime recovery architecture](../../docs/architect/agent-coordination/architecture/runtime-recovery-design.md)
- [Run handle contract](../../docs/architect/agent-coordination/architecture/run-handle.md)
- [Continuation recovery](../../docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md)
- [Executor health and fallback](../../docs/architect/agent-coordination/architecture/executor-health-and-fallback.md)
- [Detailed design review response](../reports/design-review-response-260911-2305-runtime-recovery.md)
