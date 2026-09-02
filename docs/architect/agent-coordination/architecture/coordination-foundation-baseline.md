# Coordination Foundation Baseline

Document type: Architecture
Design status: Accepted
Implementation: Implemented for Steps 00-08 delivered surface; deferred items named below
Last reviewed: 2026-09-02
Canonical for: accepted Step 00-08 Agent Coordination foundation shape after promotion from roadmap/proposal history

Related: [Vision](../vision.md), [Runtime Model](runtime-model.md),
[Protocol Model](protocol-model.md), [Work Integration](work-integration.md),
[CoordinationSession Contract](../contracts/coordination-session.md),
[FlowDefinition Contract](../contracts/flow-definition.md),
[Team Dispatch V1 roadmap history](../roadmap/team-dispatch-v1/README.md),
[Step 07 proposal history](../proposals/step-07-coordination-session-adhoc-task.md),
[Step 08 proposal history](../proposals/step-08-standalone-coordination-protocols.md),
[Team Dispatch V1 verification](../verification/team-dispatch-v1/index.md),
[Step 08 verification](../verification/step-08-standalone-coordination/index.md)

## Purpose

This document is the promoted, readable baseline after the Agent Coordination
redesign reached Step 08. It records the accepted shape from Steps 00-08
without carrying rollout detail, prompts, obsolete branches, or proof logs.

The Step 00-06 roadmap files and Step 07/08 proposal files remain useful
history. They are not the canonical design surface.

## Promotion Map

| Step | Historical source | Promoted canonical output |
|---|---|---|
| 00 | Team Dispatch V1 overview | Foundation boundary, vocabulary, rollout shape, and non-goals captured by Vision, architecture, contracts, and ADRs. |
| 01 | Rollout plan | Implementation sequence retained in roadmap; not a runtime contract. |
| 02 | Workflow Stage Operations | [Protocol Model](protocol-model.md) and [Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md). |
| 03 | Assignment, Run, RunResult | [Runtime Model](runtime-model.md) and [Assignment, Run, And RunResult Contract](../contracts/assignment-run-runresult.md). |
| 04 | Evidence hardening | [Evidence And Results](evidence-and-results.md) plus RunResult confidence/evidence contract. |
| 05 | Coding driver operation choice | [Dispatch Control Plane](dispatch-control-plane.md), runtime model, and Work Integration boundary. |
| 06 | Work-attached team adoption | [Work Integration](work-integration.md), evidence rules, and Team Dispatch V1 verification. |
| 07 | CoordinationSession and planning boundary proposal | CoordinationSession identity, session-blind Assignment membership, and deferred AdhocTask/inline-contract questions. |
| 08 | Standalone coordination and optional protocols proposal | CoordinationSession persistence, FlowDefinition IR, declared CoordinationProtocol profile, standalone CLI/headless runtime, and final deferral audit. |

## Accepted Shape

```txt
objective
  -> CoordinationSession
    -> agent-led execution or declared CoordinationProtocol
      -> Assignment
        -> governed dispatch
          -> Run
            -> RunResult + evidence
    -> synthesis / terminal session status
```

The foundation supports standalone coordination without requiring a Work item.
Work integration is optional context/profile, not the identity of
coordination.

## Accepted Invariants

- Work remains the sole delivery lifecycle authority.
- CoordinationSession is the executable and recovery root for V1 standalone
  coordination.
- Mission is deferred; no `missionId` appears in V1 session schemas.
- Assignment stays session-blind; session membership is one-way from the
  CoordinationSession manifest/event log to Assignment ids.
- FlowDefinition is the shared graph/operation/policy IR beneath both
  Workflow and CoordinationProtocol typed profiles.
- Workflow nodes remain Stages; CoordinationProtocol nodes are Phases.
- A predeclared protocol is optional. Agent-led standalone coordination remains
  legal.
- Every dynamic or declared execution still lowers into Assignment, governed
  dispatch, Run, RunResult, and evidence.
- Coordination may reference Work as read-only context, but coordination verbs
  may not move Work status/stage, approve, merge, or mutate Work lifecycle.
- Interactive CLI and headless adapter invoke the same coordination engine.
- Headless parity is an implementation property to prove, not a second runtime.
- Evidence immutability, governance-final dispatch, budget caps, and mutation
  exclusivity remain kernel-hard.

## Delivered Surface

Step 08 delivered these accepted capabilities:

- persistent `.fgos/coordination/` session manifest and append-only event log;
- direct removal/cutover of the old `mission-lite` prototype;
- shared session engine for dynamic consult and declared protocols;
- FlowDefinition schema, Workflow projection, and CoordinationProtocol loader;
- declared consult, research fan-out/fan-in, and Group Cognition fixtures;
- deterministic cohort planning;
- bounded partial completion policy;
- governed retry and actor replacement;
- cancellation and crash-safe idempotent resume;
- uniform hard-budget enforcement across dispatch paths;
- path-safe `coordinationId` validation;
- foreign-evidence rejection at write time;
- static export-surface protection against coordination owning Work mutation;
- public `fgos coordination run/show` CLI;
- headless adapter using the same engine as CLI;
- live parity proof from a real external consuming project.

## Deliberately Not Promoted

These Step 07/08 topics remain deferred or unaccepted:

- Mission as a first-class grouping object;
- AdhocTask as a durable session-local task graph;
- generalized AgentMessage/thread protocol;
- provider scoring/router;
- organization overlays;
- telemetry/herdr coordination UI;
- Work-attached mutation from coordination;
- broad dynamic peer communication beyond declared topology;
- runtime topology deviation such as adding edges during a session;
- richer group-cognitive methods beyond the hardened V1 fixtures.

Deferring these does not mean they are rejected. The active architecture-wide
intent is tracked in [Architecture Intent](../../architecture-intent.md), and
coding-domain adoption is tracked in the Step 09 architect-level proposals.

## Reading Rule

Use this document for the accepted Step 00-08 foundation summary. Use the
contracts for exact schema and behavior. Use proposal history only to understand
why rejected or deferred alternatives existed.
