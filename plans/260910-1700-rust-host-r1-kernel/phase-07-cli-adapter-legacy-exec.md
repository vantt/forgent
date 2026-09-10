# Phase 07 — CLI Adapter Legacy Exec

Depends on: Phase 06 merged; Phase 01–Phase 03 (Node compatibility lane)
merged.

## Objective

Make `apps/fgos` a real CLI: recognize the checked selector, exec the Node
payload unchanged for every `legacy-cli` selector, and route a `native`
selector (only `version`, wired fully in Phase 08) through
`InvocationService`. Before Phase 08 lands, dispatching `version` correctly
fails closed with the kernel's `no binding` `SelectionRefused` — that is the
expected, tested proof that the fail-closed path works, not a placeholder.
**Full-suite gate**: `FULL_TEST` from `plan.md`'s Execution Inputs must be
green at the end of this phase.

## Requirements

- R1: `apps/fgos/src/main.rs` scans `args_os` for host-global options only.
  No host-global option is recognized in R1 — `--help` and `--json` are
  payload-owned for every `legacy-cli` selector and forwarded unchanged; the
  first positional token is always the selector.
- R2: `main.rs` embeds `packages/host-runtime/contracts/command-routes.json`
  (produced by Phase 01) via `include_str!` and parses it once (lazily) into
  a selector -> `CommandRouteDescriptor` lookup.
- R3: An unlisted selector fails closed, mapped to the same exit code Node
  uses for "unknown verb" today — `EXIT_CODES.validation = 4`
  (`src/state/store.mjs`, thrown as a `StoreError('validation', ...)` at
  `bin/fgos.mjs`'s `default:` dispatch arm). Exit `4`, not a generic `1`.
- R4: For `route_kind == legacy-cli`, `apps/fgos/src/legacy_exec.rs` resolves
  the active release path from `FGOS_ACTIVE_RELEASE_PATH` and the manifest at
  `FGOS_ACTIVE_MANIFEST_PATH` (Phase 04's dev-host contract; a staged release
  uses the same two names, Phase 09's concern), then computes
  `join(activeReleasePath, components.legacyNode.root,
  components.legacyNode.entry)` — never `PATH`, never cwd, never a hardcoded
  path.
- R5: `legacy_exec.rs` spawns `node <resolved entry> <remaining OsString
  argv>` with inherited stdin/stdout/stderr/cwd/env, forwards SIGINT/SIGTERM
  on Unix, and propagates the child's exit code or terminating signal
  unchanged. It sets one private recursion-marker env var
  (`FGOS_RUST_HOST_RECURSION_GUARD=1`) on the child; if that var is already
  set when `apps/fgos` starts, it fails closed instead of spawning `node`
  again.
- R6: For `route_kind == native`, `main.rs` builds a `HostInvocation` +
  `OperationRequest` and calls `fgos-host-runtime`'s `InvocationService`
  against a `RegistrySnapshot` assembled at this composition root via
  `registry::build_snapshot` (Phase 05) — populated in this phase with only
  the in-crate `test.fixture.echo` provider (Phase 06). Calling it for
  `version` before Phase 08 registers the distribution provider must return
  the kernel's `no binding` `SelectionRefused`, mapped to a clear non-zero
  exit — this is a required, asserted test case, not a workaround.
- R7: Exactly one invocation record is written per legacy exec, through the
  same lifecycle recorder `InvocationService` uses for native operations
  (Phase 06) — `legacy_exec.rs` calls the same public recorder entry point,
  never a second, apps/fgos-local logging path. The recorder sink writes one
  JSON-lines record per invocation to the path named by
  `FGOS_INVOCATION_RECORD_PATH` when set (the P02 harness sets it), and is a
  no-op when unset.
- R8: A header comment lands at the top of `bin/fgos.mjs` (and a matching
  note in root `AGENTS.md`) stating it is the `legacy-node` payload and
  naming the canonical editing boundary — the Phase 00 output, applied here
  per `plan.md`'s Shared-File Lease Rule note. No behavior change to the file
  otherwise.
- R9: Every `legacy-cli` selector passes the Phase 02 harness Node-vs-Rust
  comparison on the coverage floor, using `FGOS_HARNESS_ENTRY=bin:<path to
  the built apps/fgos binary>`.
- R10: A recursion trap test proves a payload that tries to spawn `fgos`
  again is detected and fails closed rather than recursing.
- R11: A process-spy test proves exactly one `node` child process per legacy
  invocation.

## Files

Likely touch:

- `apps/fgos/src/main.rs`, `cli_projector.rs`, `cli_presenter.rs`,
  `legacy_exec.rs`
- `apps/fgos/Cargo.toml`
- `bin/fgos.mjs` (header comment only — top of file)
- `AGENTS.md` (ownership note only)
- `packages/host-runtime/rust/src/invocation_service.rs` (only if the
  recorder entry point needs its visibility widened to `pub` for
  `legacy_exec.rs` to call — no logic change)

Do not touch:

- `src/**` besides the `bin/fgos.mjs` header
- `test/rust-host/**` (Phase 01–03 lease — run it, never edit it)
- `scripts/export-command-selectors.mjs`, `scripts/explain-command-route.mjs`
- `herdr-plugin/**`
- `packages/distribution/rust/**`
- `packages/host-runtime/rust/src/{contracts,catalog,registry,operation_provider_router,authority_gate}.rs`

## Verification

```sh
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo test --manifest-path herdr-plugin/Cargo.toml
```

- `FGOS_HARNESS_ENTRY=bin:apps/fgos/target/debug/fgos node --test
  test/rust-host/*.test.mjs` — every `legacy-cli` selector passes on the
  coverage floor.
- `./target/debug/fgos not-a-real-selector`; `echo $?` prints `4`.
- `./target/debug/fgos version`; `echo $?` is non-zero and stderr names a
  `no binding` / selection-refused failure (pre-Phase-08 expected state).
- The recursion trap test and the one-`node`-child process-spy test both
  pass and are named explicitly in `cargo test --workspace -- --list`.
- The alias-ban grep from `plan.md`'s Constraints, run over `apps/fgos`,
  returns nothing.

Capability annotation for this cell: `code:implement`.
