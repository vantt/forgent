# Future Constraints

```txt
Document type: Architecture
Audience: Architect, maintainer, implementation agent
Purpose: Preserve future constraints that packaging-distribution must not block
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/architect/packaging-distribution/future-constraints.md
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Purpose

This document records future constraints. It is not current delivery scope.

## 2. Shared Gateway Constraint

A future shared gateway or dashboard may serve many projects from one process. Packaging-distribution must not require a single global active fgOS runtime for all projects.

The gateway should select a project/workspace, then invoke the appropriate project-local runtime boundary.

## 3. Project Runtime Adapter Constraint

The future adapter should treat packaging-distribution records as authority for runtime identity:

- workspace activation binding;
- release manifest;
- stable shim/entry path;
- project/work-state topology binding.

It should not infer runtime identity from `PATH` alone.

## 4. MCP/Substrate Constraint

Global substrate services may exist later, but they should not own project workflow semantics or mutate project-visible projections directly.

## 5. Current Scope Boundary

Current packaging-distribution work focuses on:

- native `fgctl`;
- release artifacts;
- project-local activation;
- legacy Node compatibility;
- doctor/fix readiness.

Shared web/gateway delivery belongs to a later architecture slice.


## Retained Future Constraints Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/future-constraints.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

### Future Constraints: Shared Gateway, Adapter, And Substrate

```txt
Legacy status: Promoted architecture source
Promoted to: docs/platform/packaging-distribution/architecture/future-constraints.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original future-constraints source
Do not use this legacy file for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active promoted future-constraints document is
> [docs/platform/packaging-distribution/architecture/future-constraints.md](future-constraints.md).
> Keep this file only as discussion-era source context.

**Status:** Historical future-constraints source, not active delivery scope.
**Date:** 2026-09-04.

The promoted delivery target is packaging/distribution correctness and Rust
`fgos` CLI readiness. Shared web/gateway and MCP/substrate work should still
not be implemented from this historical file. The active constraint text lives
in [docs/platform/packaging-distribution/architecture/future-constraints.md](future-constraints.md).

#### 1. Shared Web And Gateway Position

The intended long-horizon shape is:

```txt
shared web dashboard
  -> shared gateway front door
  -> select registered project
  -> call project-local runtime adapter out of process
  -> local project fgOS runtime owns semantics
```

One dashboard should eventually manage many projects on a machine. The gateway
front door may also be shared, but it must not become a global fgOS runtime
that owns every project's schema and business/workflow semantics.

#### 2. Project Runtime Adapter Constraint

A project runtime adapter is versioned with the local project fgOS release.
Its job is narrow:

- report runtime identity and supported adapter protocol;
- negotiate capabilities;
- accept a stable UI/chat command envelope;
- project that envelope into local runtime operations;
- return stable result/progress/error envelopes.

It must not become a second provider router. Provider selection stays inside
the selected local runtime.

V1 deployment, when needed later, should be out of process:

```txt
gateway
  -> spawn adapter subprocess
  -> bounded stdin/stdout protocol
  -> sanitized environment
  -> explicit actor/project/payload/idempotency context
```

In-process loading is rejected because adapter code is project-local versioned
code and should not share the gateway's trust boundary.

#### 3. Future Gateway Safety Constraints

Before shared gateway supports mutations across multiple projects, it needs:

- opaque registered project IDs, not arbitrary filesystem paths from callers;
- actor × project × operation authorization;
- payload digest attestation before adapter execution;
- idempotency key on mutating requests;
- deadline, cancellation, output limits, and completion-unknown semantics;
- cache invalidation keyed to activation/runtime digest.

Until those exist, a shared multi-project gateway should be read-only or
diagnostic-only.

#### 4. MCP / Global Substrate Constraint

MCP/global daemonization is allowed as substrate, not as "all fgOS verbs become
global tools."

Good global substrate candidates:

- project registry;
- read-model/cache acceleration;
- event/signal/mailbox/bus;
- process/session supervision;
- notification fanout.

Project workflow verbs such as submit, pick, approve, move, plan, or
run-workflow remain safe only through the selected project's local runtime.
