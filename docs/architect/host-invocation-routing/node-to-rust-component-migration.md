# Node To Rust Component Migration

**Status:** Vision / migration advisory, not a locked platform law and not an
implementation plan.
**Date:** 2026-09-01.
**Selected direction (2026-09-03):** ship the Rust `fgos` host first, delegate
complete legacy operations to Node, then replace them one component at a time
with statically linked Rust providers. Runtime loading is reserved for external
extensions.
**Source:** Product-owner planning and follow-up component-boundary discussion.

This document describes only the staged replacement of fgOS's current Node
implementation by Rust while keeping caller-visible contracts stable. The
general host/router architecture, including peer CLI and remote host use cases,
provider kinds, plugin discovery, and capability routing, lives in
[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).
The first executable proof is scoped in
[Rust CLI And Proof Components Implementation Plan](./rust-cli-and-proof-components-plan.md).

## 1. Migration Question

Today the harness is mostly Node and `bin/fgos.mjs` is both an entry surface and
a composition root containing several use-case and policy clusters. The system
cannot move to Rust in one rebuild.

The migration question is:

```txt
How can Rust become the permanent fgos host first, while each existing Node
operation keeps working until its whole component boundary is ready to move?
```

The answer is a Rust-shell-first strangler:

```txt
fgos Rust host
  -> LegacyNode for an unmigrated operation
  -> NativeRust for a migrated built-in operation
```

Provider selection follows the architecture defined in
[Host Invocation And Provider Routing](./host-invocation-provider-routing.md).
This migration document defines how an operation moves from the first provider
kind to the second.

## 2. Migration Principles

### Rust Host First

The Rust executable becomes the stable product entry point before built-in
components are ported. It initially behaves as a small bootstrap/router rather
than a rewrite of all CLI semantics.

### Whole Operation Fallback

An unmigrated verb stays intact on the Node side. Its parser, orchestration,
state transaction, `fgos.v1` rendering, stderr, and exit-code behavior move
together or remain together.

### Contract Before Replacement

The migration boundary is not a JavaScript import path or a Rust crate. It is an
explicit component operation contract:

```txt
request schema
  -> component port
  -> semantic result / typed error
  -> host-specific presentation
```

Node and Rust implementations are interchangeable only when they pass the same
contract fixtures and preserve the same authority boundary.

### Built-In Rust Means In-Process

Once migrated, a foundation component is normally a Rust crate statically
linked into the Rust host and called through a typed trait. It does not retain a
cross-process boundary merely because Node previously required one.

### External Extensibility Is Separate

Runtime discovery and no-recompile installation belong to external extensions,
not built-in migration. Process/WASM plugin mechanics must not impose their ABI
or latency on statically linked foundation components.

## 3. Current `fgos` Thinness Reading

The current Node CLI is not thin. This inventory determines migration order; it
does not create a prerequisite to thin the entire Node host before Rust lands.

### Already Thin Or Near-Thin

These parts mostly route to another module and are closer to the desired port:

- `version` routes to version resolution.
- `review`, `approve`, `reject`, `catchup`, `sync-root`, and
  `promote-to-component` delegate substantial behavior to
  `src/verbs/merge/*` use cases.
- `gateway start|stop|status` routes to gateway lifecycle control.
- `session start|end|list|gc` mostly routes to the session component.
- `triage` delegates to impact ranking.
- `goal` mostly delegates to focus/set/show functions.

These are candidates for early native-provider slices because the host-facing
adapter and component behavior are already partly separated.

### Partly Thin

These parts have extracted helpers but the CLI still performs meaningful
orchestration:

- `submit` uses intake helpers, but `submitWork` still composes title derivation,
  ID generation, default verify, domain entry stage, acceptance parsing, and
  the final add operation.
- `discover` delegates to `resolveDiscovery`, but still owns verdict parsing,
  stage/domain preconditions, config loading, and classification patching.
- `plan` delegates to `resolvePlan`, but still owns validation-mode branching,
  stage checks, verdict parsing, and child JSON parsing.
- `setup` and `doctor` have `src/setup/*` primitives, but the CLI still owns rc
  wiring, hook installation, shared defaults, fixes, checks, and rendering.
- `check`, `rollup`, and `evolve` use report/evolve helpers, but still compose
  read-model and output payloads in the CLI.

Their individual migration slice must first extract a coherent use-case port.
That extraction happens only when the owning component is being migrated.

### Not Thin Yet

These parts still carry clear component logic inside the CLI body:

- `take`, `pick`, and `return` carry pull-door policy, git/worktree source
  distinctions, clean-tree checks, verification, attestation, claim settlement,
  and advisory checks.
- `move` owns guards such as delivered overrides, return-guard bypass, and
  decision logging.
- `add` and `edit` carry substantial parsing, normalization, and validation.
- `uninstall`, `preflight`, `unlock`, `main-checkout-reset`, and
  `resync-worktree` mix host/system policy with CLI control flow.
- Knowledge, docs, and registry verbs still combine reporting and registry
  orchestration inside the CLI switch.

These remain whole `LegacyNode` routes until their use-case, transaction, and
authority boundaries can move as one slice. Priority follows risk and authority
clarity, not file length.

## 4. Bootstrap The Rust CLI

The first Rust `fgos` release should own only concerns that remain stable across
the migration:

- executable bootstrap and install-level resolution;
- host-global CLI options needed before provider selection;
- command identity lookup;
- invocation tracing, timeout, cancellation, and provider diagnostics;
- routing to `LegacyNode` or `NativeRust`;
- external plugin routing as defined by the host architecture.

It should not immediately reimplement every Node parser, validation branch, or
use-case orchestration.

### Transparent Launcher Mode

The smallest bootstrap recognizes an unmigrated command and forwards its argv
and inherited stdio to the current Node CLI. This preserves byte-level behavior
and lets Node continue producing `fgos.v1` and its existing exit code.

This mode proves packaging and command parity, but the Rust host cannot yet
observe a semantic result. It is a compatibility step, not the final port.

### Legacy Bridge Mode

The next step gives the Node entry point a framed invocation mode. It returns a
structured legacy outcome containing stdout, stderr, exit status, and provider
diagnostics without changing the public output bytes.

The Rust host gains timeout, cancellation, tracing, and lifecycle control while
Node still owns the whole legacy operation. The bridge starts Node at most once
per ordinary CLI invocation.

A persistent Node worker beyond the CLI lifetime is justified only for a
long-running host, interactive session, or one invocation making repeated
legacy calls. It otherwise introduces daemon lifecycle without eliminating
meaningful per-command work.

## 5. Avoid Double Parsing

The Rust host needs enough metadata to identify an operation and choose a
provider, but the same legacy verb must not acquire two independently maintained
option parsers.

Command descriptors distinguish:

- host-visible command identity, namespace, summary, and provider;
- provider-owned option grammar and semantic validation;
- fully migrated typed request schemas owned by the component contract.

During fallback, Rust recognizes only command identity and forwards the rest of
argv unchanged. When an operation becomes native, its option grammar and
request conversion move to Rust together. A generated/shared command descriptor
may later remove duplicated help metadata, but it is not a prerequisite for the
bootstrap launcher.

## 6. Migration Boundary And Granularity

Routing changes at whole-verb or whole-use-case granularity:

```txt
OperationId -> LegacyNode

becomes

OperationId -> NativeRust
```

A mutating workflow must not be split so Rust performs half a transaction and
Node performs the other half unless an existing port already defines atomicity,
locking, recovery, and authority. Delegate the whole write operation, then move
that authority as one tested slice.

Multiple verbs may eventually call one component port. The port must expose
semantic operations, not private helper calls copied from the Node module graph.
A Rust component must not recursively spawn `fgos` or the legacy Node CLI to
reach another component.

## 7. Authority Rule

Moving implementation to Rust must not silently move authority.

If a Rust component replaces only calculation or evaluation logic, it returns a
result, recommendation, proof, or typed error. The existing owner still applies
lifecycle transitions and writes state.

Examples:

- Work Lifecycle authority remains with the Work Lifecycle Engine until a
  separate spec/contract migration explicitly moves it.
- A Run Result Evaluator computes confidence but does not choose the Work
  item's next lifecycle transition.
- Dispatch And Execution launches and observes a Run but does not invent the
  semantic operation being dispatched.
- Coding Domain may own repository/worktree/merge semantics, but those
  semantics do not leak into domain-agnostic Work lifecycle code.

The migration invariant is:

```txt
implementation moves behind a port;
authority moves only when the owning spec and contract say it moved.
```

## 8. Per-Component Strangler Slice

For each component:

1. Name its responsibility, semantic operations, authority, and state writes.
2. Capture current Node behavior as request/result/error fixtures.
3. Extract the smallest transport-neutral port needed for those operations.
4. Move inline Node orchestration behind the port without changing behavior.
5. Implement the Rust provider as a crate linked into the Rust host.
6. Run Node and Rust providers against identical conformance fixtures.
7. Shadow only side-effect-free reads; never dual-run state mutation.
8. Flip the provider table from `LegacyNode` to `NativeRust` after parity proof.
9. Keep explicit rollback temporarily, then delete that Node path in a later
   cleanup slice.

Read-only or mechanical operations should prove the pattern first. State-writing
components move later because their locking, atomicity, crash recovery,
idempotency, and error mapping need stronger evidence.

## 9. Compatibility Requirements

Every migration slice preserves:

- public `fgos` command and option shape;
- `fgos.v1` success-envelope semantics;
- typed error categories, stderr behavior, and exit-code mapping;
- `.fgos` writes behind the authorized write door;
- project-over-global configuration precedence;
- caller-visible ordering, idempotency, and cancellation behavior;
- setup/doctor coverage for new binaries, payloads, directories, config, and
  build/runtime dependencies;
- rollback through the provider table until the native path has enough proof.

Contract tests run the same semantic fixtures against both implementations.
CLI compatibility tests additionally compare presentation bytes and exit codes
where the existing contract requires exact behavior.

## 10. Communication Cost During Migration

Cross-process communication is acceptable for the temporary Rust-to-Node edge
when each call represents a complete operation. It is not suitable for a chatty
private-helper boundary.

### Cold Legacy Invocation

An unmigrated command pays Rust startup, Node startup, Node initialization, and
Node work. A local spot check during this discussion put empty Node startup at
roughly tens of milliseconds and `fgos version --json` at roughly a tenth of a
second. These observations are environment-specific, not a benchmark or SLO,
but they show that Rust-outer-first initially creates architectural leverage,
not a latency improvement.

### Persistent Bridge

Persistent framed stdio or a local socket removes repeated runtime startup when
one process performs many legacy operations. Use it for gateway/interactive or
other genuinely long-lived execution, not automatically for every shell
invocation.

### Native Completion

After an operation becomes `NativeRust`, communication with its built-in crate
is a direct typed call in the same process. Its transition is therefore:

```txt
legacy:   Rust startup + Node startup + Node operation
native:   Rust startup + direct Rust operation
external: Rust startup + plugin transport + plugin operation
```

External plugin transport remains by design; the internal migration tax
disappears component by component.

## 11. Distribution And Rollback

During transition, the installed product contains:

- the Rust `fgos` executable;
- the Node legacy payload and its runtime requirement;
- the provider/command descriptors needed to select legacy versus native;
- any independently installed external plugins.

`fgos setup` and `fgos doctor` verify both built-in runtimes, show which provider
serves an operation, and distinguish a missing legacy runtime from a missing
external plugin.

Rollback changes the provider selection for a migrated operation back to
`LegacyNode` while the Node implementation remains packaged. Once no operation
references `LegacyNode`, remove the Node payload, runtime checks, bridge, and
rollback entries in one distinct release.

The migration must never hardcode whether a global or project install is
active. Project config continues to override global config, and both remain
diagnosable.

## 12. Physical Migration Layout

Physical placement is component-first and language-second. A component's
contract, conformance fixtures, and temporary dual implementations stay
together so removing Node does not require another top-level reorganization.

```txt
apps/
  fgos/                         # permanent Rust CLI adapter/binary
  fgos-node-legacy/             # transitional Node entry/provider
  gateway/                      # remote host adapter

packages/
  host-runtime/                 # architecture defined in companion document
  component-protocol/
    rust/
    node/
  work-lifecycle/
    contracts/
    conformance/
    rust/
    node/                       # removed after this component migrates
  dispatch-execution/
    contracts/
    conformance/
    rust/
    node/

domains/
  coding/
    workflows/
    task-specs/
    skills/
    harness/
      rust/
      node/
```

The source tree's `plugins/` area, if present, is for bundled examples and
development fixtures. Runtime plugin installation is owned by the distribution
and registry architecture, not inferred from source layout.

## 13. Full Selected Sequence

1. Package the Rust `fgos` executable as the permanent entry point on every
   supported platform.
2. Route current commands through byte-compatible whole-operation `LegacyNode`
   fallback.
3. Establish provider descriptors, diagnostics, setup/doctor integration, and
   the external plugin registry in the Rust host.
4. Select the first read-only or mechanical component and define its operation
   contract, authority, and conformance fixtures.
5. Implement it as a statically linked Rust crate.
6. Prove parity and flip its operation to `NativeRust`.
7. Repeat at component boundaries, moving state-writing authority only after
   its full failure and recovery contract is explicit.
8. Keep external process/WASM provider support permanently; it is the ecosystem
   seam, not migration residue.
9. Remove the Node payload only when no built-in operation references it and
   public CLI, setup/doctor, rollback, and evidence requirements are complete.

This sequence is monotonic: the permanent host exists first, and every
component migration removes one legacy edge without introducing a new internal
process boundary.

## 14. Remaining Migration Questions

1. Which operation is the first migration proof?
2. What parity, latency, and supported-platform evidence is required before the
   Rust launcher replaces the current installed entry point?
3. When does transparent launcher mode graduate to the structured legacy
   bridge?
4. How long must a migrated Node implementation remain packaged for rollback?
5. Which state-owning component is safe to migrate first after read-only slices
   establish the pattern?
