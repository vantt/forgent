# Phase 07: Public API seal: panic never escapes, no unsafe, no value in an error

Depends on phase 06. Small. Suggested executor: sonnet.

## Context

Spec sections 8 and 10. A panic in a synchronous N-API call aborts the Node process, and the runner, supervisor and gateway parse YAML in process. The Rust side must therefore promise: no public function panics; every failure is a named `Refusal`. Errors never carry a scalar value or a source snippet.

## Files it may touch

`tests/api_seal.rs`; doc comments in `src/lib.rs`; mechanical fixes in other `src/*.rs` only where this audit finds a public function that bypasses `guard` or an error that prints a value.

## Steps

1. Enumerate every `pub` function and method of the crate (`cargo doc -p fgos-yaml-doc --no-deps --jobs 4` item list, or `rg -n "pub fn"`), put the list in the test as a table of names; each entry must go through `guard` (reviewed by reading, then pinned by the test below).
2. `rg -n "panic = " Cargo.toml packages/*/rust/Cargo.toml apps/*/Cargo.toml packages/git/node-addon/Cargo.toml`: if any release profile sets `abort`, `catch_unwind` is moot; stop and report (it would be a spec section 10 blocker for Slice B, not for A).
3. `rg -n "unwrap\(\)|expect\(|\[.*\]|unreachable!|panic!|as usize|as i64" packages/yaml-doc/rust/src` and review each hit: indexing and arithmetic are replaced by checked forms where input-dependent; remaining ones carry a one-line comment saying why they cannot fail.
4. Error text audit: `Refusal` Display and Debug print rule id, file name, path, line, column only. Test feeds documents whose scalars and comments contain a unique marker string (`SECRET-VALUE-7731`) through every refusal fixture and asserts the marker never appears in `Display` or `Debug` output.
5. Adversarial corpus: all `parse.v1.json` and `edit.v1.json` inputs mutated deterministically (truncate at every 7th byte, flip each 13th byte, repeat a line 1,000 times, wrap in 40 flow brackets) fed through every public entry; asserts only "returns, never panics, never exceeds the limit time of 2 s each". Seeds from fixtures; this is the stable-toolchain stand-in for the permanent fuzz (phase 09), not a second copy of fixture cases.

## Owning proofs

| Behaviour | Owner |
|---|---|
| `guard` converts a panic to `yaml-internal-error` (closure that panics, direct call to `guard`: a test of the function, not a switch in production code) | `tests/api_seal.rs` |
| No public entry bypasses `guard` | the table in the same file (fails when a new `pub fn` is added without a row) |
| No value in error text | same file, marker test |
| No panic on adversarial input | same file, corpus test |
| `forbid(unsafe_code)` | compiler (`#![forbid(unsafe_code)]` in `lib.rs`, from phase 02) |

## Validation

`cargo test -p fgos-yaml-doc --jobs 4 --test api_seal`, then the whole crate, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Table goes stale | M x L | the test compares the table with the actual public list through a doc-listing step run by the test (via `include_str!` of `lib.rs` re-exports and a grep-like parse); if that proves brittle, a `pub` surface that is one module (`api.rs`) and only that module is listed |
| A parser dependency panics inside a thread | L x M | guard is on the calling thread; the crate spawns no threads |

## Rollback

Revert; guard still exists from phase 05.
