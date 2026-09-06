# Future Constraints: Shared Gateway, Adapter, And Substrate

**Status:** Future architecture constraints, not current delivery scope.
**Date:** 2026-09-04.

The current delivery target is packaging/distribution correctness and Rust
`fgos` CLI readiness. Shared web/gateway and MCP/substrate work should not be
implemented now. They remain constraints so the project-local runtime model
does not paint the future architecture into a corner.

## 1. Shared Web And Gateway Position

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

## 2. Project Runtime Adapter Constraint

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

## 3. Future Gateway Safety Constraints

Before shared gateway supports mutations across multiple projects, it needs:

- opaque registered project IDs, not arbitrary filesystem paths from callers;
- actor × project × operation authorization;
- payload digest attestation before adapter execution;
- idempotency key on mutating requests;
- deadline, cancellation, output limits, and completion-unknown semantics;
- cache invalidation keyed to activation/runtime digest.

Until those exist, a shared multi-project gateway should be read-only or
diagnostic-only.

## 4. MCP / Global Substrate Constraint

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

