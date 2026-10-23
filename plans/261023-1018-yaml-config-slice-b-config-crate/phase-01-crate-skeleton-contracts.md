# Phase 01: Crate skeleton, contract files, failure codes

Depends on 00. Suggested executor: haiku (mechanical), sonnet to review the contract wording. Lands first among the code phases.

## Context

Layout follows `packages/yaml-doc` (`rust/` + `contracts/` + fixtures with one runner per file). The crate must exist before any module can land in parallel; every module is declared up front as a stub so later phases never edit `src/lib.rs` or the root manifest.

## Files it may touch

- Root `Cargo.toml`: one line in `members`: `packages/config/rust`.
- `packages/config/rust/Cargo.toml`: name `fgos-config`, `version.workspace`, `edition.workspace`; dependencies `fgos-yaml-doc`, `fgos-durable-file`, `fgos-holder-lock`, `fgos-identity` (default features, no `provider`), `serde_json.workspace`, `sha2.workspace`, `thiserror.workspace`, `libc` under `cfg(unix)`. No new third-party crate; the validator crate is added by phase 04b only after the owner signs phase 03.
- `packages/config/rust/src/lib.rs` (module declarations, crate doc with the seal sentences: `#![deny(unsafe_code)]` with exactly one allowed module (`files::sys`, phase 07, decision D17), no panic across the public API (every public entry runs through `fgos_yaml_doc`'s guard pattern or is total), refusals carry no value), `src/error.rs` (the `ConfigRefusal` type: closed `code`, optional wrapped yaml refusal, file, path, line, column, schema path; `Display` and `Debug` never print a value), empty stub files for every later module (`schema`, `bundle`, `lint`, `validate`, `standard`, `scope`, `files`, `grammar`, `snapshot`, `cache`, `detect`, `write`, `redact`, `locks`).
- `packages/config/contracts/failure-codes.v1.json`, `annotations.v1.json`, `fixtures/README.md`.
- `packages/config/rust/tests/fixture_shape.rs`.

## Contract files

`failure-codes.v1.json` is the closed list of ids the crate can produce, each with the spec section that names it: spec-named verbatim (`config-legacy-shadowed`, `config-write-conflict`, `config-comment-reason-required`, `config-write-confined`, `config-path-symlink`, `config-key-in-wrong-file`, `config-accounts-unavailable-confined`), chosen here (D12: `config-parse`, `config-schema`, `config-key-out-of-scope`, `config-format-legacy-json`, `config-platform-unsupported`), and the lint rule ids (filled by phase 04, listed here as reserved prefixes `schema-` and `standard-`). The yaml-doc rule ids pass through unchanged and are not copied here (one list owns them: `packages/yaml-doc/contracts/refusal-rules.v1.json`). Codes the crate cannot produce (addon missing) are listed under `not-produced-here` with the slice that owns them.

`annotations.v1.json` is the machine-readable form of spec section 4's `x-fgos-` annotation table: annotation name, allowed values, where it may appear (root only, any node), the closed list of five (`scope`, `sensitivity`, `file`, `merge`, `absent`; D5), with the `$id` and `$comment` conventions (`owner:`, `justification:`) stated beside it. Phase 04's lint reads it, so the closed list is stated once. The JSON Schema keywords themselves are the standard's and are not copied here.

`fixtures/README.md`: file-to-runner table (filled as phases land), the case shape (`id`, `why`, `input`, `expect`), the rule "a case belongs to exactly one runner".

## Steps

1. Merge `origin/main`. Create the files; the stubs contain only a module comment naming the owning phase.
2. `fixture_shape.rs` owns fixture integrity only: every JSON under `contracts/` parses, ids are unique across files, every `expect.code` is in `failure-codes.v1.json` or is a yaml-doc rule id read from the yaml-doc contract file, and `not-produced-here` ids never appear in an `expect`. It proves no behaviour.
3. `cargo build -p fgos-config --jobs 4`; confirm the dependency tree adds no crate beyond the workspace's existing lock (`cargo tree -p fgos-config -e normal --jobs 4` compared with `cargo tree -p fgos-yaml-doc`); `Cargo.lock` changes only by the new package entry.

## Owning proofs

Fixture integrity: `tests/fixture_shape.rs` (the one proof of "the contract files are well formed"). The annotation table has no second reader test; phase 04's lint runner exercises it.

## Validation

`cargo test -p fgos-config --jobs 4`; `cargo clippy -p fgos-config --jobs 4 -- -D warnings`; `cargo fmt --check -p fgos-config`; `cargo test --workspace --no-run --jobs 4` still builds (workspace member added). Sequential gates only at phase 14.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| `fgos-identity` default features pull more than needed | L x L | verify `cargo tree` shows no `fgos-host-runtime`; if it does, depend with `default-features = false` |
| Dependency cycle with `fgos-holder-lock` or `fgos-identity` | L x M | neither depends on config (`rg "fgos-config"` in manifests shows none); `identity` has an optional `fgos-holder-lock` edge only |

## Rollback

Revert the commit: removes the member line and the new directory; nothing links the crate.
