# Node To Rust Component Migration

**Status:** Selected migration direction, not an implementation plan.
**Date:** 2026-09-01.
**Selected direction (2026-09-03; revised 2026-09-04):** ship the distributable
Rust `fgos` CLI host in R1, with every unmigrated selector routed to the
CLI-only legacy Node compatibility provider; prove external process providers
in R2 and the production remote peer in R3; then replace semantic operations
one component at a time with native Rust providers.
**Source:** Product-owner planning and follow-up component-boundary discussion.

This document discusses only migration options, ordering, transition stages,
cutover, and rollback. The stable host model, peer CLI/remote host use cases,
Operation Provider Router, provider mechanics, protocols, plugin registry,
authority, and technical tradeoffs live in
[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).
Component ownership, authority boundaries, and the physical placement compass
for files/crates/components live in
[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);
every native migration slice must read it before choosing where a provider or
component module lives.
The executable work breakdown lives in
[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md).

## 1. Migration Question

The current harness is mostly Node and `bin/fgos.mjs` still combines entry,
dispatch, use-case orchestration, and policy. The system cannot move to Rust in
one rebuild.

The migration question is:

```txt
How can Rust become the permanent fgos host first while every existing Node
operation keeps working until its complete component boundary is ready to move?
```

The migration must preserve current commands, `fgos.v1`, errors, state
authority, install behavior, and rollback until each replacement is proven.

It must also preserve a visible repair path: an unmigrated selector remains
owned by the named Node payload at
`packages/legacy-node/node/fgos.mjs` (installed as
`libexec/fgos/legacy-node/fgos.mjs`), not by an ambiguous historical
`bin/fgos.mjs` path. The generated command-route descriptor tells a
contributor whether a selector is `legacy-cli` or `native`, its owner path,
and its required compatibility tests. A selector cannot be made native merely
by changing a Rust parser; its descriptor and complete provider binding change
together.

## 2. Options Considered

### Option A: Thin The Entire Node Host First

```txt
large Node-thinning refactor
  -> stable Node component ports
  -> Rust implementations behind those ports
  -> replace the outer host last
```

This makes each later port explicit, but invests heavily in a composition root
that is scheduled for removal. It also delays the final Rust plugin/host seam
until after substantial Node restructuring.

### Option B: Rust Host First, Node As Legacy Provider

```txt
thin Rust host/router
  -> default every unmigrated CLI selector to Node compatibility
  -> move one complete operation/component to native Rust
  -> remove its Node path after proof
```

This establishes the permanent composition root first. It keeps the initial
Rust change narrow without making a disposable wrapper. R1 already has the
router and compatibility shape that can survive a long migration;
boundary extraction still happens only when a component is actually migrated.

### Option C: Big-Bang Rust Rewrite

```txt
reimplement parser + use cases + state + distribution
  -> switch everything at once
```

This has no safe parity or rollback gradient. It mixes host replacement,
component redesign, authority movement, and distribution into one release and
is rejected.

### Selected Option

Option B is selected. The first Rust release is an intentionally small,
distributable host/router with CLI-only Node compatibility as the default for
unmigrated selectors, not an immediate rewrite of all Node semantics.

## 3. Why The Sequence Is Selected

The sequence provides a monotonic migration:

- the final host exists before component replacement begins;
- each completed slice removes one Node dependency;
- untouched operations continue on their current execution path;
- rollback changes one provider selection instead of reverting the host;
- external extension work can target the permanent host boundary;
- Node cleanup follows demonstrated removal rather than forecasted ownership.

Its temporary cost is accepted: legacy operations may start slightly slower
because Rust delegates to Node, and the installed product carries both runtimes
until migration completes. The detailed technical consequences belong to the
host architecture document.

## 4. Current Migration Readiness

The current CLI thinness is an ordering signal, not a prerequisite to refactor
all Node code first.

### Near-Thin Candidates

- `version` already delegates to version resolution.
- `review`, `approve`, `reject`, `catchup`, `sync-root`, and
  `promote-to-component` delegate substantial behavior to
  `src/verbs/merge/*`.
- `gateway start|stop|status` delegates to gateway lifecycle control.
- `session start|end|list|gc` mostly delegates to the session component.
- `triage` delegates to impact ranking.
- `goal` mostly delegates to focus/set/show functions.

These need less boundary extraction, but risk and authority still determine
their order.

### Partly Thin Candidates

- `submit` still composes title derivation, ID generation, defaults, domain
  entry, acceptance parsing, and add.
- `discover` still owns verdict parsing, stage/domain preconditions, config,
  and classification patching.
- `plan` still owns validation branching, stage checks, verdict parsing, and
  child parsing.
- `setup` and `doctor` still compose rc wiring, hooks, defaults, fixes, checks,
  and presentation.
- `check`, `rollup`, and `evolve` still compose their read models and output.

Their migration slice must first isolate a complete use case. That happens per
component rather than in one repository-wide Node-thinning phase.

### Not-Thin Candidates

- `take`, `pick`, and `return` combine pull-door policy, git/worktree behavior,
  verification, claims, and advisory checks.
- `move` owns multiple lifecycle guards and decision logging.
- `add` and `edit` own substantial parsing, normalization, and validation.
- `uninstall`, `preflight`, `unlock`, `main-checkout-reset`, and
  `resync-worktree` mix host/system policy with control flow.
- knowledge, documentation, and registry verbs still combine reporting and
  orchestration in the CLI switch.

These remain whole legacy operations until their transaction and authority
boundaries can move together.

## 5. Release R1: Distributable Rust CLI Host

R1 is the smallest honest meaning of “ship the Rust host”. It is not merely a
binary that passes repository tests. The installed product entry becomes Rust,
all unmigrated CLI selectors retain transparent whole-invocation Node
compatibility, `fgos-runner` remains a separately proven Node public entry, and
`version` proves one typed built-in operation.

The migration order is:

1. decide the supported target matrix, archive/install mechanism, upgrade and
   rollback channels;
2. relocate the Node CLI to its named legacy payload and retain only a thin,
   temporary source-tree compatibility shim at `bin/fgos.mjs`;
3. freeze executable Node compatibility evidence and the checked command-route
   descriptor, including the owner and test suite for every selector;
4. land the Rust invocation kernel with immutable static bindings and the
   two-stage authority path;
5. route every current CLI selector through the CLI-only legacy passthrough
   provider unless it has an explicit native binding;
6. migrate `version` to native `distribution.build.show`;
7. prove build, install, setup/doctor, upgrade, rollback, and uninstall from an
   external temp project on every supported target, using a staged artifact
   rather than a source checkout;
8. flip the installed default only after the compatibility and distribution
   gates pass.

External-process discovery, WASM, chat, and production gateway adoption do not
block R1. They prove later parts of the permanent architecture without delaying
the first usable release.

Exit condition: every existing CLI invocation still reaches Node unchanged or
an explicitly native provider, `version` creates no Node process, the Rust host
is reproducibly installed as the default, and the previous Node entry remains a
named rollback channel. For every legacy selector, `explain-command-route`
identifies the canonical Node owner and required parity suite; no contributor
must infer ownership from a stale `bin/fgos.mjs` reference. The activated Rust
host, legacy payload, and Node runner always come from one versioned artifact
manifest; no release mixes them across versions.

## 6. Release R2: External Process Provider Preview

R2 proves runtime extension after R1 has established the host:

1. freeze the framed component protocol and conformance fixtures;
2. implement bounded process supervision, handshake, cancellation, crash and
   completion-unknown behavior;
3. validate a static test/dev manifest without executing it during discovery;
4. invoke one vendor-scoped fixture operation through the same router;
5. expose provider/registry diagnostics through an explicit diagnostics
   surface, never compatibility output.

Full marketplace/signature policy, core replacement, WASM, and broad
project/global discovery UX remain separate ecosystem work. R2 exits when the
process adapter and protocol are real and fail closed, not when every future
plugin product concern is solved.

## 7. Release R3: Production Remote Host

Adopt the common invocation service route by route:

1. inventory current gateway routes by semantic operation and side effect;
2. replace `VerbGateway` for one native read with a remote projector and
   presenter calling the shared invocation service;
3. keep REST/MCP authentication and transport presentation in the gateway;
4. for a route that must remain on Node, build a real per-operation Node
   semantic bridge or leave that route on the old chokepoint during its named
   rollback window;
5. never parse `fgos.v1` or captured CLI stdout as the remote internal API;
6. delete the CLI-shelling chokepoint after no route uses it.

Captured/supervised legacy CLI output is not a semantic provider outcome and
cannot serve this stage. This stage gets a separate blast-radius review because
the current Herdr crate combines gateway, TUI, Axum, MCP, auth, and web concerns.

Chat becomes a peer host only when a real chat adapter and its own contracts
exist. Host extensibility is preserved meanwhile; a speculative chat proof is
not a release gate.

## 8. Migrate The Next Small Read-Only Proof

Migrate one more read-only operation before touching state writes.

### `gate-bypass`

Port only the read of the configured bypass level. This proves a real project
filesystem/config path, precedence over the legacy standalone file, malformed
input handling, and fail-closed default behavior without moving write authority.

Do not include approval-policy calculation or risk-keyword evaluation in this
slice.

Exit condition: existing positive and malformed/missing-file cases are
equivalent and the operation performs no writes or Node spawn.

### Why `ready` Is Not A First Proof

`ready` appears small at the CLI but depends on event loading, replay, domain
stage mapping, lineage/dependency semantics, and effective runtime claims.
Porting it first would silently turn a host proof into a Work Lifecycle read
model migration. It is a good later read-side slice after `version` and
`gate-bypass`.

## 9. Repeat By Component Boundary

For each subsequent component:

1. Read
   [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md)
   and name responsibility, semantic operations, authority, state, side
   effects, component class, and physical placement.
2. Select a complete operation/use-case boundary rather than private helpers.
3. Capture current Node behavior as shared fixtures.
4. Extract only the Node boundary needed for this migration slice.
5. Implement the corresponding native Rust provider.
6. Run both providers against the same semantic fixtures.
7. Shadow only side-effect-free reads.
8. Switch the operation from legacy to native after parity proof.
9. Observe the rollback window.
10. Remove the Node implementation in a later cleanup change.

Near-thin read-only operations come before complex write owners. File size alone
does not choose order.

## 10. Migrate Read Models Before Writers

The next meaningful proof after the small operations should be a Work Lifecycle
read-side component, potentially the dependencies needed by `ready`.

Sequence it internally:

1. event/schema decode fixtures;
2. deterministic replay fixtures;
3. domain/stage projection fixtures;
4. frontier calculation fixtures;
5. effective claim overlay;
6. CLI `ready` parity and pagination;
7. remote semantic parity.

This creates reusable Rust read models before any event writer moves.

## 11. Migrate State-Writing Components

Move a writer only when all of these are explicit and tested:

- sole authority owner;
- event/schema version compatibility;
- lock and concurrency behavior;
- atomicity and fsync/rename expectations;
- idempotency and retry policy;
- crash recovery and partial-write detection;
- typed error/exit mapping;
- Node/Rust mutual exclusion during cutover;
- rollback compatibility with events written by Rust.

Never dual-run a write for shadow comparison. Use fixtures, isolated temp stores,
and replay equivalence instead.

## 12. Remove Node

Remove the Node runtime/payload only when:

- no built-in operation routes to the legacy provider;
- all events written by the final Node version replay correctly in Rust;
- all public commands and supported hosts pass contract tests;
- setup/doctor reports no remaining legacy dependency;
- release rollback no longer depends on shipping Node;
- obsolete Node facades, manifests, test adapters, and distribution entries are
  removed in the same cleanup series.

Node removal is a consequence of zero remaining routes, not a calendar target.

## 13. Rollback Rules

- Keep legacy and native implementations side by side only for the observation
  window of their operation.
- Roll back by changing provider selection, not by restoring the old outer
  executable.
- Never delete a Node writer before proving it can read/recover state last
  written by the Rust implementation, or explicitly declaring the cutover
  irreversible with migration evidence.
- Remove rollback code per component after its window; do not accumulate a
  permanent second implementation tree.
- The Rust host itself rolls back through the distribution mechanism, while the
  legacy Node entry remains directly invocable during early releases.

## 14. Verification Gates

Every stage must leave a reproducible gate:

| Stage | Minimum proof |
|---|---|
| R1 Rust CLI | Node baseline; invocation kernel; transparent CLI fallback parity across argv/stdin/stdout/stderr/cwd/env/exit/signal; native `version`; external install/upgrade/rollback/uninstall; setup/doctor on every supported target |
| R2 process preview | framed-protocol conformance, manifest-without-execution discovery, bounded cancel/backpressure, crash/completion-unknown mapping, vendor fixture through the common router |
| R3 remote peer | at least one native semantic route through the production gateway, transport-specific contract suite, and no internal `fgos.v1` parsing on migrated routes |
| Next read proof | `gate-bypass` or another authority-confirmed read runs natively with no Node process and no writes |
| Work read model | Rust event decode/replay/frontier determinism against Node fixtures |
| First writer | atomicity, recovery, concurrency, mutual exclusion, idempotency, and cross-version replay |
| Node removal | zero compatibility bindings and zero setup/doctor/runtime dependency on Node |

Repository-wide proof remains `npm test` plus the new Rust workspace's
`cargo test --workspace` until Node tests are retired deliberately.

## 15. Remaining Migration Decisions

1. Which supported target matrix gates the first distributed Rust host?
2. Which post-npm release/install mechanism owns native artifacts?
3. How long is the provider rollback observation window?
4. Does `gate-bypass` remain the next proof after its component ownership is
   confirmed, or should an already-settled component read replace it?
5. Which state-writing component is the first eligible writer after Rust replay
   parity exists?
