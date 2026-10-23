# Phase 01: Addon `yaml` namespace and the shared `marshal` helper

Depends on 00 (and D phase 11 landed, or rebase: same `lib.rs` and `Cargo.toml`). Suggested executor: sonnet. Caps: `yaml.rs` 70 lines, `marshal.rs` 80. Impact analysis on `versions` first. Landing A, branch `cfg/slice-c-yaml`.

## Context

YAML Document spec section 10: the addon gains a `yaml` namespace; objects reach JavaScript with define semantics; a panic never crosses the boundary (a panic in a synchronous N-API call aborts the Node process, and the runner, the run supervisor and the gateway parse YAML in process); a caught panic prints nothing. `fgos-yaml-doc` already seals its public functions with `guard::guard` (`packages/yaml-doc/rust/src/lib.rs:4-17`, panic hook silent inside a guard), so what is left for the addon is the entry-point wrapper and the marshalling.

## Files it may touch

`packages/git/node-addon/src/yaml.rs` (new, about 25 base lines), `packages/git/node-addon/src/marshal.rs` (new; also used by phase 06), `packages/git/node-addon/src/lib.rs` (two module lines and `"yaml": 1` in `versions()`), `packages/git/node-addon/Cargo.toml` (`fgos-yaml-doc = { path = "../../yaml-doc/rust" }`).

## Design

- **One entry:** `yaml.parse(text: string, filename?: string) -> { json: string, special: Array<[Array<string|number>, 'nan'|'inf'|'-inf']> }` under `#[napi(namespace = "yaml")]`, pattern of `session_identity.rs`. It calls `fgos_yaml_doc::parse(text.as_bytes(), Profile::Tool, filename)` and `Document::value()`; the `tool` profile only (config uses its own namespace and `strict-config`).
- **JSON text, not napi objects (C2).** The value is serialised with `serde_json` from `Document::value()`; a float with no JSON form (`.nan`, `.inf`, `-.inf`) is emitted as `null` in `json` and listed in `special` with its path (this is what `Document::to_json` refuses at `document.rs:227`, so the addon walks `Value` itself, about 12 lines). Integers past 2^53 and `-0` are written as JSON numbers: `JSON.parse` yields the nearest double, which is what js-yaml gave ("converted as today", `parse.v1.json` case `numbers-edge-tool`).
- **`marshal.rs`** (shared by the `yaml` and `config` namespaces): `Failure { id, file?, line?, column?, rule? }` serialised as the message JSON of the `napi::Error` (the shape `durable_file.rs` uses, so `door.mjs` already knows how to read it); `pub fn guarded<T>(f: impl FnOnce() -> Result<T, Failure> + UnwindSafe) -> Result<T, Failure>` wrapping `catch_unwind` and mapping a panic to `Failure { id: "yaml-internal-error" }` without printing (the crate's hook is already silent inside its own guards; the addon wrapper covers the addon's own code, so nothing the addon does can abort Node); `fn json_text(&serde_json::Value) -> String`. A refusal from `fgos_yaml_doc` is mapped to `Failure` with its rule, file, line, column and never a value (the crate guarantees it, `lib.rs:18-21`).
- `versions()` gains `"yaml": 1`; the marker check in `door.mjs` is phase 02.
- Every entry calls `check()?` first, like the others, and returns an error, never a panic, for a non-UTF-8 argument.

## Steps

1. Merge `origin/main`; `impact` on `versions`; list its other consumers (doctor rows `rust-host-*`, `native-addon.json` generation) and confirm one more key breaks none.
2. `marshal.rs` first with its unit tests, then `yaml.rs`, then `lib.rs` and `Cargo.toml`. Build with `CARGO_BUILD_JOBS=4`.
3. Unit tests in `marshal.rs`: `guarded` returns the closure's value; a closure that panics gives `yaml-internal-error` and the panic message does not reach stderr (run the case in a child test process capturing stderr, the way `packages/yaml-doc/rust/tests/api_seal.rs` does); a `Failure` round-trips through its JSON; a non-finite float is listed in `special` with the right path (this one belongs to `yaml.rs`'s inner pure function `to_parts(text, filename) -> Result<(String, Vec<Special>), Failure>`, kept public in the crate so the test needs no N-API).
4. `cargo test -p fgos-node-addon --jobs 4`, `cargo clippy -p fgos-node-addon --jobs 4 -- -D warnings`, `cargo fmt --check`; line counts against the caps.

## Owning proofs

Parse semantics: Slice A's `parse.v1.json` runner (136 cases, not copied). Panic capture and failure shape: `marshal.rs` tests. The one Node wiring proof is phase 02.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| The addon's JSON text differs from what js-yaml returned for a corner (key order of integer-like keys, `-0`) | L x M | JavaScript objects order integer-like keys first in both; the parity run over every tracked YAML in phase 02 compares old and new results (`828 documents, 13 rejected by both` is the 2026-10-16 baseline) |
| Two `catch_unwind` layers hide a bug | L x L | the addon layer only maps to the named id; the crate's own guard stays authoritative |
| Release builds set `panic = "abort"` | L x H | `packages/yaml-doc/rust/tests/api_seal.rs` already checks the manifests; extend its check to the addon's manifest in this phase |

## Rollback

Revert: the namespace, the two module lines and the dependency go together; nothing calls the namespace until phase 02.
