# Legacy CLI Transition

**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.
**Date:** 2026-09-10.
**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).

This document depends on the kernel contract in [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — read it first, in particular "Transitional CLI Lane" under §4 and `CommandRouteDescriptor` in the §3 name table. The kernel has exactly one input (`OperationRequest`) and one output (`ProviderOutcome`); everything in this document is CLI-adapter-local scaffolding that disappears once Node migration completes. Nothing here introduces a second kernel input or output type — the legacy lane never reaches the Router or `InvocationService` at all (see §1 below).

## 1. Two Distinct Adapters

Node transition needs two adapters with different contracts. Treating them as one provider would create the false impression that captured CLI output is a semantic result.

**`LegacyCliPassthroughProvider`** — CLI-only. Receives preserved `OsString` argv, inherited stdin, cwd/environment, and signal context; returns pre-rendered stdout/stderr bytes plus process exit/signal termination. It never returns `ProviderOutcome` and is never reachable from remote or chat hosts. This is the only adapter most legacy commands need: the CLI adapter looks up `CommandRouteDescriptor[selector]`, and for `route_kind == legacy-cli` execs the Node payload directly (argv preserved, signal forwarding) and writes one invocation record through the shared recorder — without ever building an `OperationRequest` or calling `InvocationService`/Router.

**`LegacySemanticProvider`** — receives and returns real versioned semantic contracts (`OperationRequest`/`ProviderOutcome`). Its Node bridge calls an extracted Node use case directly, never `bin/fgos.mjs` and never an envelope parser. It can serve any admitted host and is introduced per operation only when a non-CLI host needs Node behavior before the native provider exists. Unlike the passthrough, this adapter *is* a normal `OperationProvider` participant in the kernel pipeline (admit -> select -> grant -> invoke -> normalize -> record) — it is "legacy" only in that its implementation still calls into Node.

Capturing stdout/stderr in a supervised child improves CLI cancellation and tracing but remains passthrough presentation; it never becomes the bridge used by a remote host.

Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a component contract already defines locking, atomicity, recovery, and authority at that boundary.

The adapters resolve the legacy payload relative to the installed host, never from the caller's cwd, and invoke the Node entry/bridge directly rather than spawning `fgos` recursively. The CLI parent forwards termination consistently; Unix signal equivalence and Windows process-tree behavior are explicit target-specific compatibility tests, not an undocumented `exit.code()` guess.

## 2. Legacy Payload Identity, Ownership, And Repair Path

Three things are separated that the name `bin/fgos.mjs` currently conflates:

| | Today | After R1 |
|---|---|---|
| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |
| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |
| File location | `bin/fgos.mjs` at the repo root | unchanged |

**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../component-boundary/repo-layout-vision.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as "legacy"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.

The public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"`; a staged release declares `root: "libexec/legacy-node"`, `entries.fgos: "bin/fgos"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md) §5).

`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.

**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of "where is `fgos`?": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new("node")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.

Every selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:

```txt
selector               # canonical command/subcommand selector
route_kind             # legacy-cli | native
operation_id           # required only for native semantic routing
legacy_payload         # required only for legacy-cli; named payload identity
owner_path             # canonical implementation boundary to edit
compatibility_tests    # named parity/vector suites required for a repair
```

`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.

The descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.

**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no "roll back by changing provider selection" mechanism; none is promised anywhere in this stack.

## 3. Command Metadata And Parser Ownership

The router needs operation identity and provider metadata but does not need to parse every host's full input grammar. Metadata separates into: host-visible identity, summary, namespace, and provider mapping; host-owned projection from CLI/REST/MCP input to an operation request; provider-owned semantic validation; transitional provider-owned CLI parsing for legacy-cli selectors.

While a CLI verb is legacy, the Rust CLI recognizes only a checked command selector and forwards every provider-owned `OsString` unchanged. The selector routes under a reserved, CLI-only compatibility contract; it does not mint an implementation-shaped `legacy.<verb>` semantic `OperationId`. When a command becomes native, its option grammar and typed request conversion move together and its projection points at the component-owned operation — this avoids two independent parsers accepting subtly different inputs.

A deterministic generated command descriptor may bridge the current Node registry into the Rust host during migration. Generated metadata is validated for drift; it is not a second manually edited source of truth.

## 4. Public Presentation Versus Semantic Outcome

`fgos.v1` belongs to the CLI presenter, not to the provider protocol. Likewise, HTTP status and MCP tool results belong to the remote presenter.

Native providers return `ProviderOutcome`; the calling presenter wraps it once. Transparent legacy output (from `LegacyCliPassthroughProvider`) is already a public presentation and passes through unchanged — it must never be parsed and wrapped in a second `fgos.v1` envelope.

Current `fgos.v1` hashes compact `JSON.stringify(data)` bytes but prints the final envelope using two-space pretty JSON. Cross-runtime compatibility tests therefore separate: semantic data equality, compact hash input, hash output, envelope order/pretty rendering, timestamp shape, trailing newline, stdout/stderr, and exit/signal mapping.

Golden vectors are necessary but not sufficient. A Node-generated differential corpus covers object insertion order, integer limits, negative zero, floating exponent formatting, Unicode/control characters, nested arrays/maps, null and booleans. Timestamp values are checked for shape/range rather than equality. Generic byte parity is not inferred from the narrow `version` payload.

## 5. Rust Host First: Benefit And Cost

Making Rust the host before migrating components places the final composition root, peer host use cases, provider registry, and plugin seam in their permanent runtime immediately. Every native migration then removes a `LegacyNode` edge instead of building more infrastructure into a temporary Node host.

The cost is temporary: a legacy CLI call pays both the small Rust launcher and Node startup, distribution must ship both runtimes, and compatibility failures can occur before any command becomes faster. The architecture only pays off if the first Rust host remains thin and forwards legacy behavior rather than rewriting every parser and use case at once.

## Related Documents

- [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — kernel contract this document depends on.
- [External Provider Protocol](./external-provider-protocol.md)
- [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md) — owns the legacy payload's actual on-disk location, `fgctl` rollback mechanics, and the `fgos init` / `fgos doctor --fix` split that replaces the removed `setup` verb.
