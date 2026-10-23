# Phase 04a report: schema loader, resolve, standard, meta-schema, cross-node lint

Status: DONE. Supersedes the earlier "stopped at the line gate" version of this report; the coordinator
directed per-node rules into data (decision 2026-10-23 11:55) and the crate is back under the gate.

## Line counts (`cat packages/config/rust/src/*.rs | wc -l`, comments and blanks included)

- Crate `src` total: 986 (was 453 before 04a; the first draft with hand-written lint was 1,180).
- `lint.rs` 139 (first draft 322; target "well under 120" missed: rustfmt widens the long closures), `schema.rs` 272 (283), `standard.rs` 77, `bundle.rs` 40.
- Tests/fixtures (not counted): 828 lines of Rust tests (all test files, not only the new ones), plus JSON fixtures; the plan budgeted about 1,000 for the whole slice.
- The count command in plan.md names `packages/durable-file/rust/src/open_beneath.rs`, which is now `beneath.rs`; the figure above is the config crate only.

## Delivered

- `contracts/config-schema.meta.v1.json`: JSON Schema 2020-12 over the schema document; `$ref`s the official
  meta-schema, applies to every subschema through `$dynamicRef` (the subschema entry is its own resource because
  `$dynamicAnchor` must sit on a resource root). One `$defs` entry per rule, named after the id (root rules and
  `<id>.node` rules; id is the name up to the first dot): schema-dialect, schema-default-forbidden,
  schema-annotation-unknown, schema-annotation-value, schema-id, schema-owner, schema-description-missing,
  schema-scope-implicit, schema-scope-both-unjustified, schema-file-placement. Checked here with python
  `jsonschema` 4.19 (scratch, not committed): each bad fixture fails on its own rule, the three good ones pass.
- `contracts/fixtures/meta.v1.json`: 14 cases (3 valid, 11 one-per-rule). Runner is 04b's.
- `src/lint.rs` keeps only: `schema-id` section equals file stem, `schema-dialect` for a dangling or looping `$ref`
  (walk-based), `schema-scope-conflict`, `schema-absent-conflict`, `standard-orphan`, `standard-forbidden-key`.
- `src/schema.rs`: `$ref` pointer walk now uses `serde_json::Value::pointer`; one shared `descend` walker serves `undescribed` and the standard lint. Kept: `resolve` (one door), annotation inheritance.
- Loader, standard, `bundle`, `ConfigRefusal` boxed payload (clears `result_large_err`, grammar.rs allow removed), annotations contract cut to five.
- Tests: `golden_schema` (14 cases + bundle-lists-match-core test), `golden_standard` (7), `golden_lint` (15 + `bundled_set_is_clean`); `fixture_shape` now skips the `version` check for JSON Schema documents. `failure-codes` prefixes `schema-` and `standard-`. Full `cargo test -p fgos-config`, clippy `-D warnings`, fmt: green.

## What the meta-schema cannot express (stays code) and its limits

- `$id` section equals the file stem (needs the file name): lint.
- A `$ref` that dangles or loops: not a schema-validation fact; the meta-schema only pins `$ref` to `#...` or `urn:fgos:config-schema:` (local to the bundled set).
- Scope conflict (ancestor), absent conflict and the standard rules read other nodes or files: lint.
- Behaviour change to flag: meta rules see only what a node states itself, not inheritance. So `schema-scope-both-unjustified` and `schema-file-placement` look at the node's own sensitivity, scope and type (a token or accounts node must state its own scope `global-only`; before, an inherited one passed). A node that is only a `$ref` is treated as described (the target's description is not checked by the meta-schema).

## Open points for 04b

- Map a validator error's schema location to the rule id: the `$defs` name up to the first dot; confirm the Rust validator reports the resolved path (python reports keyword paths without def names; the `instance` path and keyword suffice to tell rules apart in the fixtures).
- Cross-section `$ref` in a `$ref` into an array uses Key segments in positions (positions only; resolution is by pointer).

Status: DONE
