# Phase 08 — Native `version`

Depends on: Phase 07 merged; Phase 03 merged (envelope vectors and
serialization corpus).

## Objective

Serve `version` natively end to end: `fgos-distribution` implements
`distribution.build.show`, the composition root at `apps/fgos` binds it into
the real `RegistrySnapshot`, and the CLI presenter emits exactly one
byte-compatible `fgos.v1` envelope with no Node process spawned. Both
performance budgets from the Decisions table are measured here, not assumed.

## Requirements

- R1: `packages/distribution/rust` defines a typed request/outcome for
  `distribution.build.show` with fields `package_version: String`,
  `git_commit: Option<String>`, `verbs: Vec<String>` (sorted) — matching
  `src/cli/version.mjs`'s `resolveCliVersionInfo()` shape
  (`{packageVersion, gitCommit, verbs}`) field-for-field.
- R2: A built-in `OperationProvider` impl in `fgos-distribution` resolves
  `package_version` from the root `package.json`'s `"version"` field (embed
  via `include_str!` and parse with `serde_json`; do not hardcode a version
  string that can drift from `package.json`).
- R3: `git_commit` mirrors `version.mjs`'s own logic exactly: `git rev-parse
  --short HEAD` against the product root, `None` (never an error) when it
  fails or the tree isn't a checkout — no panic path.
- R4: `verbs` comes from `fgos-distribution`'s own embedded copy of
  `packages/host-runtime/contracts/command-routes.json` (Phase 01 artifact;
  embed via `include_str!` — do not read it through `apps/fgos` at runtime),
  sorted, matching the same 73+1 selector set Node's `COMMAND_REGISTRY`
  produces.
- R5: `apps/fgos`'s composition-root snapshot assembly (Phase 07's R6 call
  site) is extended — same `registry::build_snapshot` call, same file — to
  include `fgos-distribution`'s provider alongside the Phase 06 fixture
  provider. `fgos-host-runtime` gains no new dependency; the binding happens
  only where both crates are already path-dependencies (Phase 04 R2).
- R6: `apps/fgos/src/cli_projector.rs` maps the `version` selector (no
  further arguments recognized) to an `OperationRequest` for
  `distribution.build.show`. `apps/fgos/src/cli_presenter.rs` wraps the
  resulting `ProviderOutcome` in exactly one `fgos.v1` envelope: `contract:
  "fgos.v1"`, `generated_at` (ISO 8601), `data_hash` = sha256 hex of the
  compact-JSON bytes of `data` (matching `src/state/envelope.mjs`'s
  `JSON.stringify(data)` semantics, including object key insertion order),
  `data`; printed 2-space pretty JSON with a trailing newline — one envelope,
  never a second wrap.
- R7: Serialization uses an insertion-order-preserving JSON representation
  (`serde_json` with the `preserve_order` feature, added narrowly to whatever
  crate builds the envelope) so `data_hash` and the pretty-printed body match
  Node byte-for-byte per the Phase 03 differential corpus (insertion order,
  integer limits, negative zero, exponent formatting, Unicode/control
  characters, nesting, null/bool) and the golden `version --json` vectors
  under `test/rust-host/vectors/**`.
- R8: A process-spy test proves running `version` through the Rust host
  spawns zero `node` child processes.
- R9: The Phase 02 harness measures both Decisions-table performance
  budgets warm on the reference target (`x86_64-unknown-linux-gnu`, this
  machine): legacy exec overhead p50 ≤ 25 ms, native `version` p50 ≤ 10 ms.
  Results are written to
  `plans/260910-1700-rust-host-r1-kernel/reports/p08-performance.json`
  (both measured values, sample count, machine identity). A miss is recorded
  as a finding in that file and reported to the Lead — never silently
  rounded, dropped, or waived.

## Files

Likely touch:

- `packages/distribution/rust/src/lib.rs` and new modules under it
- `packages/distribution/rust/Cargo.toml` (feature additions only, within
  Phase 04's pinned dependency versions)
- `apps/fgos/src/cli_projector.rs`, `cli_presenter.rs` (native-`version`
  branch only — `legacy_exec.rs` is not touched)
- `apps/fgos/src/main.rs` (composition-root snapshot assembly, R5)
- `plans/260910-1700-rust-host-r1-kernel/reports/p08-performance.json` (new)

Do not touch:

- `apps/fgos/src/legacy_exec.rs` (Phase 07 lease — no changes)
- `packages/host-runtime/rust/src/**` (kernel stays provider-agnostic; no
  new dependency on `fgos-distribution`)
- `test/rust-host/vectors/**`, `test/rust-host/harness.mjs` (Phase 03/02
  lease — consume, never edit)
- `herdr-plugin/**`
- `src/cli/version.mjs`, `src/state/envelope.mjs` (read-only ground truth for
  parity; this phase never edits the Node source)

## Verification

```sh
npm test
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo test --manifest-path herdr-plugin/Cargo.toml
```

- `cargo test -p fgos-distribution` and the `apps/fgos` version-presenter
  tests consume `test/rust-host/vectors/**` and pass byte-for-byte.
- `node bin/fgos.mjs version --json` vs `./target/debug/fgos version` —
  `data` fields equal, `data_hash` equal, full envelope byte-identical except
  `generated_at` (checked by shape/range, per architecture doc §4).
- A process-spy test (named in `cargo test --workspace -- --list`) proves
  zero `node` children for `version`.
- `plans/260910-1700-rust-host-r1-kernel/reports/p08-performance.json`
  exists, contains both measured p50 values, and both are within threshold
  (or the file names the miss explicitly as a finding).
- The alias-ban grep from `plan.md`'s Constraints, run over
  `packages/distribution/rust` and `apps/fgos`, returns nothing.

Capability annotation for this cell: `code:implement`.
