# Repo Layout Vision: Apps And Packages

**Status:** Vision / direction, not a locked platform law and not a full spec.
**Date:** 2026-08-26.
**Source:** Product-owner direction.

This document records a physical repo-layout direction for separating thin
entrypoints from reusable implementation packages. It does not change runtime
behavior by itself.

The locked target in this document is the Rust/web slice around
`herdr-plugin/`. The Node side is intentionally left for a later discussion.

## 1. Decision Summary

Move the current single `herdr-plugin/` package shape toward:

```txt
apps/       thin binaries and entrypoints
packages/   reusable implementation libraries
```

For the Rust/web slice:

- split the current `herdr-fgos` binary into two binaries with names that match
  their default behavior: `apps/gateway` and `apps/herdr-tui`;
- move real gateway, MCP, cockpit, UI, fgos-port, and web-dashboard logic into
  `packages/*`;
- keep the web dashboard served by the gateway from an embedded static bundle;
- keep `apps/*` thin: each app wires packages together and starts one runtime.

## 2. Current Problem

`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:

- no argument: TUI mode;
- `gateway` argument: daemon REST/MCP/web mode.

The current launch path confirms the mismatch:

```txt
src/runner/gateway-control.mjs:295
spawn(binaryPath, ['gateway'])
```

The binary name does not describe its default behavior, and gateway mode is a
separate launch path hidden behind an argument.

The code already has a cleaner hexagonal boundary than the folder layout shows:

- `ports.rs` defines the important ports: `WorkItemSource`, `PaneRegistry`,
  `PaneOrchestrator`, `VerbGateway`, and `TerminalUi`;
- `gateway.rs` and `mcp.rs` depend on `VerbGateway`, not on TUI internals;
- gateway logic is already separate from `app.rs`, `ui.rs`, `layout.rs`,
  `pane_scan.rs`, and `pick.rs`;
- the gateway already hosts static web assets through `rust_embed`.

The layout should make those existing boundaries visible.

## 3. Target Layout

Scope of this target tree: Rust plus web only. Node packages are not decided in
this document.

```txt
forgentX/
  Cargo.toml
    # workspace members:
    # - apps/gateway
    # - apps/herdr-tui
    # - packages/gateway
    # - packages/mcp
    # - packages/herdr-core
    # - packages/herdr-ui
    # - packages/fgos-ports

  apps/
    gateway/
      Cargo.toml
      build.rs
      src/main.rs
      static/

    herdr-tui/
      Cargo.toml
      src/main.rs

  packages/
    gateway/
    mcp/
    herdr-core/
    herdr-ui/
    fgos-ports/
    web-dashboard/
```

## 4. App Boundaries

`apps/gateway` is a thin binary:

- wires `packages/gateway` and `packages/mcp`;
- starts the Axum server;
- serves embedded static files from `static/`;
- runs as gateway by default, without a `gateway` argument.

`apps/herdr-tui` is a thin binary:

- wires `packages/herdr-core` and `packages/herdr-ui`;
- starts the terminal dashboard loop;
- runs as TUI by default.

App packages should not own reusable domain logic. They assemble ports,
adapters, config, and runtime startup.

## 5. Package Boundaries

`packages/gateway`

- owns REST route handlers and gateway-specific middleware;
- includes `cf_access.rs` for now;
- mounts web serving behavior but does not own the web-dashboard source.

`packages/mcp`

- owns the MCP surface;
- is mounted by `apps/gateway` into the same Axum process;
- keeps the current "same process" contract.

`packages/herdr-core`

- owns cockpit application state and operation-pane logic;
- includes `app.rs`, `layout.rs`, `pane_scan.rs`, and `pick.rs`;
- keeps pane scanning and pick logic together unless a clearer split emerges.

`packages/herdr-ui`

- owns terminal rendering;
- keeps crossterm/TUI drawing separate from cockpit domain state.

`packages/fgos-ports`

- owns shared ports and the fgos CLI adapter;
- includes `ports.rs`, `fgos.rs`, and shared settings;
- is the place where gateway and TUI agree on their boundary to fgOS.

`packages/web-dashboard`

- owns the Vite/TypeScript/React/Tailwind dashboard source;
- is not a Cargo crate;
- builds into `apps/gateway/static` for embedding and serving.

## 6. Execution Blast Radius

The following edits would be mechanical when this vision is implemented:

- `src/runner/gateway-control.mjs:240`: update the compiled binary path to the
  new `apps/gateway` binary;
- `src/runner/gateway-control.mjs:273`: change the release build command from
  `cargo build --release --bin herdr-fgos` to the new gateway package target;
- `src/runner/gateway-control.mjs:295`: remove the extra `gateway` argument
  from the spawned process;
- `herdr-plugin/web/package.json`: change the bundle output from `../static`
  to `../../apps/gateway/static`;
- `herdr-plugin.toml`: update any binary or package path assumptions;
- docs, tests, CI, and setup references to `herdr-plugin/`: update paths where
  they describe the physical layout;
- upstream Herdr plugin integration: update any path that loads the TUI binary.

This list describes known blast radius, not a complete implementation plan.

## 7. Out Of Scope For This Document

The Node side is deliberately not designed here:

- `packages/core`;
- `packages/config`;
- `packages/state`;
- `packages/shared`;
- `packages/orchestrator`;
- the thin-entry location for Node CLI/orchestrator binaries.

`packages/orchestrator` is reserved vocabulary. It must continue to match the
existing fgOS meaning: the T0 composition layer around dispatch/runner. It must
not be confused with the unrelated Rust setting name `herdr_orchestrator`.

## 8. Open Questions

- Should Node thin entries stay under root `bin/`, or move under an `apps/cli`
  shape when the Node side is designed?
- Should `cf_access.rs` remain inside `packages/gateway`, or become a separate
  `packages/cf-access` package if another consumer appears?
- Should `pane_scan.rs` and `pick.rs` remain inside `packages/herdr-core`, or
  split later if cockpit-core becomes too broad?
