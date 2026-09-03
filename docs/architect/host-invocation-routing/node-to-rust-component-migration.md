# Node To Rust Component Migration

**Status:** Selected migration direction, not an implementation plan.
**Date:** 2026-09-01.
**Selected direction (2026-09-03):** ship the Rust `fgos` host first, delegate
complete legacy operations to Node, then replace them one component at a time
with native Rust providers. Runtime loading remains for external extensions.
**Source:** Product-owner planning and follow-up component-boundary discussion.

This document discusses only migration options, ordering, transition stages,
cutover, and rollback. The stable host model, peer CLI/remote host use cases,
Operation Provider Router, provider mechanics, protocols, plugin registry,
authority, and technical tradeoffs live in
[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).
The executable work breakdown lives in
[Rust CLI And Proof Components Implementation Plan](./rust-cli-and-proof-components-plan.md).

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
  -> delegate each unmigrated operation intact to Node
  -> move one complete operation/component to native Rust
  -> remove its Node path after proof
```

This establishes the permanent composition root first. It keeps the initial
Rust change narrow and lets boundary extraction happen only when a component is
actually migrated.

### Option C: Big-Bang Rust Rewrite

```txt
reimplement parser + use cases + state + distribution
  -> switch everything at once
```

This has no safe parity or rollback gradient. It mixes host replacement,
component redesign, authority movement, and distribution into one release and
is rejected.

### Selected Option

Option B is selected. The first Rust release is an intentionally small host and
legacy dispatcher, not an immediate rewrite of all Node semantics.

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

## 5. Stage 0: Freeze Existing Behavior

Before changing the installed entry point:

1. Capture Node command, output, error, and exit behavior in executable
   compatibility fixtures.
2. Export the current command registry deterministically for the Rust host.
3. Add cross-runtime `fgos.v1` envelope/hash golden vectors.
4. Build one harness that can run the same case through Node or Rust.
5. Establish a process-spy assertion so native completion is proven directly,
   not inferred from timing.

Exit condition: the harness can identify a behavior difference before any
native component is introduced.

## 6. Stage 1: Land The Rust Outer Host

The Rust executable becomes the candidate product entry point and delegates
every existing operation to Node without reinterpreting provider-owned flags.

Required steps:

1. Package a thin Rust executable and resolve its legacy Node payload relative
   to the installation, never relative to caller cwd.
2. Identify the operation while preserving the remaining argv/stdin/stdout/
   stderr behavior.
3. Delegate the entire invocation to the current Node entry.
4. Propagate success, typed failure exit codes, signals, and public output.
5. Run the Stage 0 matrix against both entry points.

Exit condition: all existing commands can enter through Rust with no intentional
semantic change, and the Node CLI remains independently runnable for rollback.

## 7. Stage 2: Establish The Shared Host Path

Connect the Rust CLI host use case to the common host/router architecture and
prove the remote host use case is a peer consumer of the same semantic path.

Required steps:

1. Register every current command as a legacy operation.
2. Add deterministic provider selection and diagnostics.
3. Exercise one in-memory operation from CLI and remote host use cases.
4. Prove each host applies its own public presentation.
5. Add a test-only external provider to prove the extension route without
   migrating a production component.

Exit condition: built-in, legacy, and test external providers are distinguishable
through one router, and neither host use case calls the other.

## 8. Stage 3: Migrate Small Read-Only Proofs

Migrate two operations before touching state writes.

### Proof 1: `version`

Use `version` to prove the Rust binary, generated command metadata, build/commit
identity, native result presentation, and `fgos.v1` parity. It requires no
`.fgos` store.

Exit condition: `fgos version` produces equivalent data through Rust and a
process spy proves Node was not started.

### Proof 2: `gate-bypass`

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
model migration. It is a good later read-side slice after the two small proofs.

## 9. Stage 4: Repeat By Component Boundary

For each subsequent component:

1. Name responsibility, semantic operations, authority, state, and side
   effects.
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

## 10. Stage 5: Migrate Read Models Before Writers

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

## 11. Stage 6: Migrate State-Writing Components

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

## 12. Stage 7: Connect The Production Remote Host

After the common host path and native proofs are stable:

1. replace the gateway's CLI/Node-shelling chokepoint with its peer
   `remote-host-use-case`;
2. keep REST/MCP authentication and presentation in the remote adapter;
3. let the common router select legacy or native providers;
4. compare CLI and remote semantic outcomes for migrated reads;
5. retain transport-specific response/error tests.

This stage changes how the existing gateway reaches fgOS semantics, so it gets a
separate blast-radius review from the initial CLI proof.

## 13. Stage 8: Distribution Cutover

The Rust host becomes the installed default only after its distribution path is
reproducible. The transition package contains the Rust executable plus the Node
payload/runtime needed by remaining legacy operations.

Required steps:

1. define supported build targets;
2. produce tested, checksummed release artifacts;
3. update distribution vision/spec before changing the current GitHub npm
   installation mechanism;
4. prove clean install, upgrade, rollback, and uninstall outside this repo;
5. register all new binaries, payloads, manifests, config, and health checks in
   setup/doctor;
6. update user-visible install documentation and changelog;
7. retain the previous install path through a named compatibility window.

Do not require a Rust toolchain on consuming projects and do not hide a native
build or download inside an existing no-lifecycle-script installation path.

## 14. Stage 9: Remove Node

Remove the Node runtime/payload only when:

- no built-in operation routes to the legacy provider;
- all events written by the final Node version replay correctly in Rust;
- all public commands and supported hosts pass contract tests;
- setup/doctor reports no remaining legacy dependency;
- release rollback no longer depends on shipping Node;
- obsolete Node facades, manifests, test adapters, and distribution entries are
  removed in the same cleanup series.

Node removal is a consequence of zero remaining routes, not a calendar target.

## 15. Rollback Rules

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

## 16. Verification Gates

Every stage must leave a reproducible gate:

| Stage | Minimum proof |
|---|---|
| 0 | Node baseline, manifest drift, envelope golden fixtures |
| 1 | whole-command Rust-to-Node parity across stdout/stderr/exit/stdin |
| 2 | one router, peer CLI/remote hosts, built-in/legacy/external fixture selection |
| 3 | `version` and `gate-bypass` native with no Node process |
| 4 | per-component semantic parity and explicit rollback |
| 5 | Rust replay/frontier determinism against Node fixtures |
| 6 | writer atomicity, recovery, concurrency, and cross-version replay |
| 7 | production remote-host contract and gateway regression suite |
| 8 | external install/upgrade/rollback/uninstall on every supported target |
| 9 | zero legacy routes and zero setup/doctor/runtime dependency on Node |

Repository-wide proof remains `npm test` plus the new Rust workspace's
`cargo test --workspace` until Node tests are retired deliberately.

## 17. Remaining Migration Decisions

1. Which supported target matrix gates the first distributed Rust host?
2. Which post-npm release/install mechanism owns native artifacts?
3. How long is the provider rollback observation window?
4. Which Work Lifecycle read operation follows the two small proofs?
5. Which state-writing component is the first eligible writer after Rust replay
   parity exists?
