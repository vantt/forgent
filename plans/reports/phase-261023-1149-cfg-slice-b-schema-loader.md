# Phase 04a report: schema loader, resolve, lint, standard (stopped at the 1,000-line gate)

Status: BLOCKED by the line gate, not by a defect. The code is written, compiles and is clippy-clean
(`-D warnings`, all targets), but is NOT committed and has NO tests/fixtures yet. The brief said to stop
and report if the crate total would pass 1,000 lines after 04a.

## Count (rule: `find packages/config/rust/src ... | xargs wc -l`, comments and blanks included)

- Before: 453 lines in `packages/config/rust/src`.
- After: 1,180 (+727 added/changed). Per file: schema.rs 283, lint.rs 322, standard.rs 77, bundle.rs 40, error.rs +11.
- The `open_beneath.rs` path in the plan's count command does not exist (the file is now elsewhere in
  `packages/durable-file/rust/src`); the figure above is the config crate only.
- Phase 04 was budgeted at about 300 lines; 04a alone is 2.4x that, before 04b (about 80 more) and before tests.

## What exists (uncommitted, in the worktree `packages/config/`)

- `src/schema.rs`: `Schemas::{parse, bundled, section, resolve, undescribed}`, `Resolved` with the five
  inherited annotations (referrer then `$ref` target, nearest ancestor wins, then contract default), local and
  cross-section `$ref` by `$id`. Reuses yaml-doc `parse` (StrictConfig), `to_json`, `span_of`.
- `src/bundle.rs`: empty `SCHEMAS`/`STANDARD` lists (no real files yet), order-independent length-prefixed sha256 digest.
- `src/standard.rs`: `Standard::{parse, bundled, value, value_at, span_of}`; files ordered by schema set and
  merged with yaml-doc `merge` (no new merge code).
- `src/lint.rs`: all 14 04a rule ids (`standard-invalid` is 04b), findings `{id, file, path, line, column}`, no values.
- `src/error.rs`: `ConfigRefusal.yaml` is now `Option<Box<Refusal>>` plus `ConfigRefusal::parse(yaml)`; this
  clears `clippy::result_large_err`, so grammar.rs's local allow is removed (phase 09 coordinator note done). files.rs/grammar.rs adjusted.
- `contracts/annotations.v1.json`: cut to the five annotations with their allowed values and defaults (the old
  file still listed suggestion, justification, owner, version, which the amended spec removed).
- `src/lib.rs`: bundle, lint, schema, standard are now `pub mod`.

## Not done

Fixtures `schema/lint/standard.v1.json`, `tests/golden_{schema,lint,standard}.rs`, the bundle-completeness test,
`schema-` ids appended to `failure-codes.v1.json`, CHANGELOG (none needed yet: no user-visible change), commit.
Tests were not started because the gate says stop first.

## Projection

At the end of 04 (plus 04b, about 80) the crate is about 1,260. Phases 06 (110), 09 (230), 10 (190), 11 (50)
are still ahead: about 1,840, plus about 100 for `open_beneath` in Durable File: about 1,940 against the 1,500 ceiling.

## Decision question

What is happening: the schema/lint/standard slice costs 727 Rust lines, not about 300, and the slice projects to about 1,940.
Cause: the amended spec kept 14 lint rules, `$ref` following with annotation inheritance, per-file positions and
the standard loader; each is small, together they are not. Lines are counted with comments and blanks (about 90 doc comment lines in the new files).
Options:
1. Raise the Rust ceiling to about 2,000 and continue (cost: owner re-agrees the budget; no behaviour lost). Recommended: every rule traces to the spec, cuts would drop spec behaviour.
2. Keep 1,500 and cut: drop `undescribed` (about 25), `schema-absent-conflict`, `schema-scope-conflict` and `schema-file-placement` lint rules to doctor later (about 60), cross-section `$ref` (about 15); still about 1,700, so this alone does not meet 1,500; phases 09/10 would also need cuts.
3. Trim formatting-driven length only (rustfmt widens the long closures): saves perhaps 40 lines, not enough.
Scope of the answer: the whole slice budget, phases 04b through 11.

Status: BLOCKED
