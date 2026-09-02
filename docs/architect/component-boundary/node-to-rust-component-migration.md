# Node To Rust Component Migration

**Status:** Vision / migration advisory, not a locked platform law and not an
implementation plan.
**Date:** 2026-09-01.
**Source:** Product-owner planning discussion during component-boundary work.

This note records the migration shape for gradually replacing fgOS's current
Node harness internals with Rust components while keeping the existing `fgos`
binary and user-facing contracts stable.

## 1. Question

Today the harness is mostly Node. The current `fgos` binary acts as the host
surface and dispatches into service modules that the component-boundary vision
is trying to separate into clearer components.

The long-term direction may be mostly or fully Rust, but the system cannot move
there in one rebuild. The practical question is:

```txt
How can one component at a time be implemented in Rust while current fgos
callers, commands, envelopes, and lifecycle contracts do not change?
```

## 2. Migration Principle

Keep `fgos` stable as a host surface. Replace implementation behind stable
component ports.

The migration boundary should not be a JavaScript import path or a Rust crate
layout. It should be an explicit component contract:

```txt
request schema
  -> component port
  -> response schema / fgos.v1 envelope / typed error category
```

Node and Rust implementations are interchangeable only when they satisfy the
same contract tests and preserve the same authority boundary.

## 3. Current fgos Thinness Reading

`fgos` is not yet a pure thin binary. It is currently both the host surface and
a composition root that still contains several use-case and domain-policy
clusters.

The clean target is not to jump directly from this shape to Rust. The safer
intermediate target is:

```txt
make fgos thin while still Node
  -> then replace selected Node component implementations with Rust
```

This keeps the first refactor focused on component boundaries and caller
contracts. Rust then becomes an implementation choice behind those contracts,
not the thing that defines the boundary.

### Already Thin Or Near-Thin

These parts of `fgos` mostly route to another module and are closer to the
desired host-surface shape:

- `version` routes to version resolution.
- `review`, `approve`, `reject`, `catchup`, `sync-root`, and
  `promote-to-component` already delegate substantial behavior to
  `src/verbs/merge/*` use cases, with the CLI mostly parsing flags and
  constructing context.
- `gateway start|stop|status` routes to gateway lifecycle control.
- `session start|end|list|gc` mostly routes to the session component, with
  light payload shaping.
- `triage` delegates to impact ranking.
- `goal` mostly delegates to focus/set/show functions.

These are useful precedents: the CLI is still the command surface, but the
component behavior mostly lives behind a named module.

### Partly Thin

These parts already have extracted helpers or core modules, but the CLI still
performs meaningful orchestration:

- `submit` uses intake helpers, but `submitWork` still lives in the CLI and
  composes title derivation, id generation, default verify, domain entry stage,
  acceptance parsing, and the final add operation.
- `discover` delegates to `resolveDiscovery`, but the CLI still owns verdict
  parsing, stage/domain preconditions, config loading, and classification patch
  application.
- `plan` delegates to `resolvePlan`, but the CLI still owns validation-mode
  branching, stage checks, verdict parsing, and child JSON parsing.
- `setup` and `doctor` have `src/setup/*` primitives, but the CLI still owns
  much of the sequence: rc wiring, hook install, shared config defaults, fixes,
  checks, and pretty rendering.
- `check`, `rollup`, and `evolve` use report/evolve helpers, but the CLI still
  composes read-model shape and output payloads.

These should usually be thinned in Node before any Rust implementation is
introduced.

### Not Thin Yet

These parts still carry clear component logic inside the CLI body:

- `take`, `pick`, and `return` carry pull-door policy, git/worktree source
  distinction, clean-tree checks, branch/main return paths, verification,
  attestation, claim settlement, and advisory checks.
- `move` is more than a raw FSM route; it owns guard logic such as delivered
  overrides, return-guard bypass, and decision logging.
- `add` and `edit` still carry substantial field parsing, normalization, and
  validation composition.
- `uninstall`, `preflight`, `unlock`, `main-checkout-reset`, and
  `resync-worktree` still mix host/system policy with CLI control flow.
- Knowledge, docs, and registry verbs still have reporting and registry
  orchestration in the CLI switch.

These are the best candidates for a Node-only thinness pass before Rust
migration. The priority should follow component risk and authority clarity, not
file length alone.

## 4. Transitional Shape

During migration, each extracted component should expose a thin Node facade.
The rest of the harness imports the facade, not the implementation.

```txt
bin/fgos.mjs
  -> host/use-case layer
      -> component facade / port
          -> current Node implementation
          -> or Rust binary adapter
          -> or Rust service adapter
```

The facade is the compatibility layer. It lets `fgos` keep the same CLI verbs,
same output envelope, same exit-code taxonomy, and same caller expectations
while the implementation behind the port changes.

## 5. Preferred Rust Boundaries

### Rust Binary Adapter

Use first for most migrations.

A Rust binary gives a clear process boundary, simple rollback, independent
build/test ownership, and explicit JSON/stdin/stdout contracts. It fits
components that perform bounded work and return a result to the Node host.

The Node facade is responsible for spawning the binary, applying timeouts,
normalizing failures into fgOS error categories, and preserving the caller's
existing contract.

### Rust Service Adapter

Use when the component naturally wants to be long-lived.

A Rust service or gateway fits runtime control planes, dashboards, MCP/REST
surfaces, or components that benefit from shared in-memory state and repeated
requests. The current dispatch architecture already has an HTTP adapter
precedent, but production config/resolution should be completed deliberately
before treating `via: "api"` as a default component migration path.

### Direct Rust Library Binding

Treat as a later optimization, not the default migration path.

N-API, WASM, or similar direct bindings can be useful for pure compute logic
with stable schemas and no lifecycle side effects. They are a poor first
migration boundary for authority-owning components because packaging, setup,
doctor checks, ABI compatibility, and rollback become harder than a binary or
service boundary.

## 6. Authority Rule

Moving implementation to Rust must not silently move authority.

If a Rust component only replaces calculation or evaluation logic, it should
return a result, recommendation, proof, or normalized error. The existing owner
still applies lifecycle transitions and writes state.

Examples:

- Work Lifecycle authority remains with the Work Lifecycle Engine until a
  separate spec/contract migration explicitly moves it.
- A Run Result Evaluator may compute confidence, but it does not decide the
  Work item's next lifecycle transition.
- A Dispatch And Execution component may launch and observe a Run, but it does
  not invent the semantic operation being dispatched.
- A Coding Domain component may own repository/worktree/merge semantics, but
  those semantics should not leak into domain-agnostic Work lifecycle code.

The safe migration rule is:

```txt
implementation can move behind a port;
authority moves only when the owning spec and contract say it moved.
```

## 7. Compatibility Requirements

For each component migration slice:

- preserve the public `fgos` command shape;
- preserve `fgos.v1` envelope semantics where the caller currently receives an
  envelope;
- preserve typed error categories and exit-code behavior;
- keep `.fgos` writes behind the current authorized write door unless the slice
  explicitly migrates write authority;
- add contract tests that run the same fixtures against Node and Rust
  implementations;
- make setup/doctor aware of any new binary, service, directory, config default,
  or build dependency introduced by the Rust implementation;
- keep rollback possible by selecting the Node implementation through the same
  facade until the Rust path has enough proof.

## 8. Suggested Rollout Pattern

Use a two-phase strangler pattern, one component at a time.

Phase A: make the boundary thin while still Node.

1. Name the component boundary and authority owner.
2. Extract a Node facade with a narrow request/response contract.
3. Add contract tests around the existing Node behavior.
4. Move current in-CLI logic behind that facade without changing public command
   shape, envelope, exit codes, or state authority.

Phase B: replace the implementation behind the port.

1. Implement the Rust binary or service behind the same facade.
2. Run both implementations against the same fixtures.
3. Flip default only after parity proof is stable.
4. Retire the Node implementation in a later cleanup slice.

This keeps the migration aligned with the component-boundary vision without
requiring a full rewrite before the platform can benefit from Rust.
