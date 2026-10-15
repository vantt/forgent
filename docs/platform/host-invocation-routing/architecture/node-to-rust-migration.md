# Architecture: Node To Rust Migration

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the selected Node-to-Rust migration sequence and constraints
Design status: Draft
Canonical: Yes, after review
Owner: Host invocation
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/architecture/release-boundaries.md
- docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md
Implementation: R1/R2/R3 implemented preview plus remaining component migrations
Provenance: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md
Writer type: Original writer attribution not recorded; retained source provenance
Canonical for: Candidate scope: Preserve the selected Node-to-Rust migration sequence and constraints; authority follows transitional switchboard
Use this when: Preserve the selected Node-to-Rust migration sequence and constraints
Do not use this for: Authority beyond the declared scope or implementation truth without the cited verification
Supersedes: None; legacy sources remain in place during migration
Superseded by: None recorded
```

## 1. Selected Direction

The selected direction is Rust host first, with Node as legacy payload/lane until each complete component or use-case boundary is ready to move. Repository-wide Node thinning first and big-bang rewrite are rejected.

## 2. Migration Rules

- Preserve current commands, `fgos.v1`, errors, state authority, install behavior, and rollback until each replacement is proven.
- Migrate complete operation/use-case boundaries rather than private helpers.
- Read-only operations come before complex writers.
- Never dual-run a write for shadow comparison.
- A native provider never blocks on human input; it returns `parked`.
- Node removal follows zero remaining routes and proof, not a calendar date.

## 3. Readiness Categories

The old source's near-thin, partly-thin, and not-thin command lists are preserved in [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md). They are ordering signals and need a fresh implementation scan before execution.

## 4. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Rust host first is selected. | `implemented preview` | [source migration §2](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Preview Rust host exists and is the installed/default preview entry. Stable/default graduation remains a release-owner decision. |
| Read models before writers. | `current partial` | [source migration §10](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | `version`, `gate-bypass`, and remote `/runtime` are read proofs. Future read routes should migrate before writes. |
| Writer migration has atomicity/replay/mutual-exclusion gates. | `planned` | [source migration §11](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | Future writer proof. |
| Session Identity is the single writer-identity authority in Rust. | `implemented preview` | [Session Identity spec](../../session-identity/spec.md), [packages/session-identity/rust](../../../../packages/session-identity/rust), [plans/261015-2102-identity-resolver-rust-crate](../../../../plans/261015-2102-identity-resolver-rust-crate/plan.md) | Node resolver deleted; Node calls `fgos identity` directly with no fallback. Activation needs the claim drain runbook in the plan's phase 06. |
| Observe is first component fully in Rust. | `implemented complete` | [Observe Spec](../../observe/spec.md), [packages/observe/rust](../../../../packages/observe/rust), [plans/260929-1501-metrics-friction-rust-native](../../../../archive/plans/260929-1501-metrics-friction-rust-native/plan.md) | Observe migrated completely into Rust native without Node fallback; covers metrics and friction writers with native routing and writer shards. |

## 5. Related Files

| Relationship | File |
| --- | --- |
| release boundaries | [release-boundaries.md](release-boundaries.md) |
| R1 proof | [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) |
| source migration | [../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) |

## Retained selected source material

Added in candidate: the following is the pinned September design/migration source, not a fresh certification of current code, route counts, release posture or measured performance. Prior status labels remain dated provenance. Registered details split to their mapped owners are linked below; the separate restore notes state the checked implementation limits. Source: `docs/architect/host-invocation-routing/node-to-rust-component-migration.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`.

### Node To Rust Component Migration

**Status:** Selected migration direction, not an implementation plan.
**Date:** 2026-09-01.
**Revised:** 2026-09-10 (see
plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).
**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the
distributable Rust `fgos` CLI host in R1, with every unmigrated selector
resolved by the CLI adapter to the legacy-cli lane and exec'd straight to the
Node payload, never entering the kernel; prove external process providers in
R2 and the production remote peer in R3; then replace semantic operations one
component at a time with native Rust providers.
**Source:** Product-owner planning and follow-up component-boundary discussion.


Added in candidate: this retained source detail is carried verbatim in [the dropped-012 restoration](release-boundaries.md#restored-scope).


#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/node-to-rust-migration.md](node-to-rust-migration.md),
[architecture/release-boundaries.md](release-boundaries.md),
[verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../history/host-invocation-baseline.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.

#### 1. Migration Question

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
owned by the Node payload — identity `legacy-node`, the npm package as
`package.json` `files` defines it, unmoved in the source tree and staged whole
under the release manifest's `components.legacyNode.root` — so `bin/fgos.mjs`
is a file inside that payload, no longer a public name. The generated command-route
descriptor tells a contributor whether a selector is `legacy-cli` or `native`,
its owner path, and its required compatibility tests. A selector cannot be
made native merely by changing a Rust parser; its descriptor and complete
provider binding change together.

#### 2. Options Considered

##### Option A: Thin The Entire Node Host First


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).



##### Option B: Rust Host First, Node As Legacy Provider

```txt
thin Rust host/router
  -> CLI adapter execs every unmigrated selector straight to the Node payload
  -> move one complete operation/component to native Rust
  -> remove its Node path after proof
```

This establishes the permanent composition root first. It keeps the initial
Rust change narrow without making a disposable wrapper. R1 already has the CLI
adapter's legacy-cli exec lane and the kernel's native-selector shape that can
survive a long migration; boundary extraction still happens only when a
component is actually migrated. See
[Legacy CLI Transition](legacy-cli-transition.md) for the exec mechanics.

##### Option C: Big-Bang Rust Rewrite


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).



##### Selected Option

Option B is selected. The first Rust release is an intentionally small,
distributable host/router; the CLI adapter execs every unmigrated selector
straight to the Node payload by default, not an immediate rewrite of all Node
semantics.


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).



Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).




#### 4. Current Migration Readiness

The current CLI thinness is an ordering signal, not a prerequisite to refactor
all Node code first.

##### Near-Thin Candidates

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

##### Partly Thin Candidates

- `submit` still composes title derivation, ID generation, defaults, domain
  entry, acceptance parsing, and add.
- `discover` still owns verdict parsing, stage/domain preconditions, config,
  and classification patching.
- `plan` still owns validation branching, stage checks, verdict parsing, and
  child parsing.
- `init` and `doctor` still compose rc wiring, hooks, defaults, fixes, checks,
  and presentation.
- `check`, `rollup`, and `evolve` still compose their read models and output.

Their migration slice must first isolate a complete use case. That happens per
component rather than in one repository-wide Node-thinning phase.

##### Not-Thin Candidates

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

#### 5. Release R1: Distributable Rust CLI Host

R1 is the smallest honest meaning of “ship the Rust host”. It is not merely a
binary that passes repository tests. The installed product entry becomes Rust,
all unmigrated CLI selectors retain transparent whole-invocation Node
compatibility, `fgos-runner` remains a separately proven Node public entry, and
`version` proves one typed built-in operation.

The migration order is:

1. adopt the packaging stream's settled install/activation/rollback contract
   (`fgctl` + release store + workspace activation binding; see
   [Runtime Identity And Activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md)
   §11–§13); confirm the supported target matrix;
2. name the Node payload `legacy-node` in the release manifest
   (`components.legacyNode.root`/`entry`) without moving or renaming any file;
   add the ownership header to `bin/fgos.mjs` and the root `AGENTS.md` note;
3. freeze executable Node compatibility evidence and the checked command-route
   descriptor, including the owner and test suite for every selector;
4. land the Rust invocation kernel with immutable static bindings and the
   two-stage authority path;
5. wire the CLI adapter to read the checked `CommandRouteDescriptor` for every
   current selector: a `legacy-cli` selector execs straight to the Node
   payload with argv preserved, never entering `InvocationService`; only a
   `native` selector builds an `OperationRequest`. See
   [Legacy CLI Transition](legacy-cli-transition.md);
6. migrate `version` to native `distribution.build.show`;
7. prove the install/activation/rollback contract through `fgctl init` on an
   external temp project from a staged release, followed by the active
   runtime's `fgos init` → `doctor --fix` → `doctor`, on every supported
   target;
8. flip the installed default only after the compatibility and distribution
   gates pass.

External-process discovery, WASM, chat, and production gateway adoption do not
block R1. They prove later parts of the permanent architecture without delaying
the first usable release.

Exit condition: every existing CLI invocation still reaches Node unchanged (via
the CLI adapter's legacy-cli exec lane) or an explicitly native provider,
`version` creates no Node process, and the proof runs through `fgctl init` on
an external temp project from a staged release, followed by the active
runtime's `fgos init` → `doctor --fix` → `doctor`, with the previous release
remaining a named rollback channel through `fgctl`. For every legacy selector,
`explain-command-route` identifies the canonical Node owner and required
parity suite; no contributor must infer ownership from a stale `bin/fgos.mjs`
reference. The activated Rust host, legacy payload, and Node runner always
come from one versioned release artifact; no release mixes them across
versions.

#### 6. Release R2: External Process Provider Preview

R2 proves runtime extension after R1 has established the host. The framed
protocol, discovery manifest shape, and process adapter contract live in
[External Provider Protocol](external-provider-protocol.md); this section
only orders the migration proof.

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

#### 7. Release R3: Production Remote Host

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

The production remote host in R3 is the project-local gateway (the current
Herdr crate, released alongside the runtime) composing the host-runtime crate
in-process. A future shared multi-project gateway is a different component: it
reaches a selected project runtime only through the out-of-process Project
Runtime Adapter
([Future Constraints](../../packaging-distribution/architecture/future-constraints.md) §2),
never by loading a project runtime in-process itself.

Chat becomes a peer host only when a real chat adapter and its own contracts
exist. Host extensibility is preserved meanwhile; a speculative chat proof is
not a release gate.

#### 8. Migrate The Next Small Read-Only Proof

Migrate one more read-only operation before touching state writes.

##### `gate-bypass`

Port only the read of the configured bypass level. This proves a real project
filesystem/config path, precedence over the legacy standalone file, malformed
input handling, and fail-closed default behavior without moving write authority.

Do not include approval-policy calculation or risk-keyword evaluation in this
slice.

Exit condition: existing positive and malformed/missing-file cases are
equivalent and the operation performs no writes or Node spawn.

##### Why `ready` Is Not A First Proof

`ready` appears small at the CLI but depends on event loading, replay, domain
stage mapping, lineage/dependency semantics, and effective runtime claims.
Porting it first would silently turn a host proof into a Work Lifecycle read
model migration. It is a good later read-side slice after `version` and
`gate-bypass`.

#### 9. Repeat By Component Boundary


Added in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).



Near-thin read-only operations come before complex write owners. File size alone
does not choose order.

A native provider never blocks waiting for a person. An operation that needs
human input returns a `parked` outcome and is re-invoked by the work
lifecycle, not by a provider-side wait. This must hold before any
`ask`/`answer`-shaped operation migrates.

#### 10. Migrate Read Models Before Writers

The next meaningful proof after the small operations should be a Work Lifecycle
read-side component, potentially the dependencies needed by `ready`.


Added in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).



This creates reusable Rust read models before any event writer moves.

#### 11. Migrate State-Writing Components

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

#### 12. Remove Node

Remove the Node runtime/payload only when:

- no built-in operation routes to the legacy provider;
- all events written by the final Node version replay correctly in Rust;
- all public commands and supported hosts pass contract tests;
- `init`/`doctor` reports no remaining legacy dependency;
- release rollback no longer depends on shipping Node;
- obsolete Node facades, manifests, test adapters, and distribution entries are
  removed in the same cleanup series.

Node removal is a consequence of zero remaining routes, not a calendar target.

#### 13. Rollback Rules

Config can never replace a built-in provider (host doc open question 2 closed
as "prohibit"). A provider binding is not a runtime-selectable switch, so
rollback of a native operation in R1–R2 is a release rollback through `fgctl`:
`ActivationRecord.previousArtifactDigest` + the preserved release directory +
a state-schema compatibility check (see
[Runtime Identity And Activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md)
§11). The previous release still contains both the native provider and the
Node payload during the operation's observation window, so a release rollback
restores the legacy path without restoring the old outer executable by hand.


Added in candidate: this retained source detail is carried verbatim in [the dropped-015 restoration](../contracts/component-protocol.md#restored-rollback-bullets).


#### 14. Verification Gates

Every stage must leave a reproducible gate:

| Stage | Minimum proof | Performance gate |
|---|---|---|
| R1 Rust CLI | Node baseline; invocation kernel; transparent CLI fallback parity across argv/stdin/stdout/stderr/cwd/env/exit/signal; native `version`; `fgctl` install/upgrade/rollback/uninstall from a staged release; `fgos init` / `doctor --fix` / `doctor` on every supported target | legacy passthrough overhead vs direct `node` entry and native `version` latency measured against the thresholds fixed in the plan's P1 harness |
| R2 process preview | framed-protocol conformance, manifest-without-execution discovery, bounded cancel/backpressure, crash/completion-unknown mapping, vendor fixture through the common router | — |
| R3 remote peer | at least one native semantic route through the production gateway, transport-specific contract suite, and no internal `fgos.v1` parsing on migrated routes | — |
| Next read proof | `gate-bypass` or another authority-confirmed read runs natively with no Node process and no writes | — |
| Work read model | Rust event decode/replay/frontier determinism against Node fixtures | — |
| First writer | atomicity, recovery, concurrency, mutual exclusion, idempotency, and cross-version replay | — |
| Node removal | zero compatibility bindings and zero init/doctor/runtime dependency on Node | — |

Repository-wide proof remains `npm test` plus the new Rust workspace's
`cargo test --workspace` until Node tests are retired deliberately.

#### 15. Remaining Migration Decisions

1. Which supported target matrix gates the first distributed Rust host?
2. How long is the provider rollback observation window?
3. Does `gate-bypass` remain the next proof after its component ownership is
   confirmed, or should an already-settled component read replace it?
4. Which state-writing component is the first eligible writer after Rust replay
   parity exists?

The former "which post-npm release/install mechanism owns native artifacts"
decision is settled: the packaging stream owns it (`fgctl` + release store +
workspace activation binding), see
[Runtime Identity And Activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md).
