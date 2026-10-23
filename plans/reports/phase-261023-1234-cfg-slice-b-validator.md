# Phase 04b report: adopt the JSON Schema validator

Date 2026-10-23 (Asia/Saigon). Branch `cfg/slice-b`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-b`. Plan `plans/261023-1018-yaml-config-slice-b-config-crate/`.

## Status: DONE_WITH_CONCERNS (source-line tripwire crossed; see Budget)

`jsonschema =0.60.0` (`default-features = false`) adopted per the owner decision of 2026-10-23 12:30. Gates green: `cargo test -p fgos-config` (13 test binaries, 0 failed, run twice), `-p fgos-canonical-json` unchanged, clippy `-D warnings`, `cargo fmt --check`, `cargo deny ... check advisories bans sources` exit 0.

## Budget (decision needed)

| Count | Lines |
|---|---|
| Crate src before 04b | 986 |
| Crate src now (`find packages/config/rust/src -name '*.rs' \| xargs wc -l`) | **1,230** (tripwire 1,150 crossed by 80; ceiling 1,500) |
| `src/validate.rs` | 176 (was a 1-line stub) |
| Other src deltas | `lint.rs` +53 (meta rules, `standard-invalid`, split of `lint` into `meta` + `cross_node`), `schema.rs` +9, `standard.rs` +7, `lib.rs` 0 net |
| Rust test lines (all `tests/*.rs` + `common`) | 1,052 (new in 04b: `validator_acceptance.rs`, `golden_meta.rs`, `golden_validate.rs` = 220) |

Per the stop instruction I added no Rust after crossing it; only data, docs and this report followed. Planned split for the rest of the slice (06: 110, 07: 110, 08: 90, 09: 230, 10: 190, 11: 50) is about 780 lines, which would put the slice near 2,000 against the 1,500 ceiling. 04b itself is 244 lines against the 164 left under the tripwire; the 80-line excess is the validator port (176 with 25 lines of doc), meta wiring in lint and the `standard-invalid` check. Owner decision needed on the remaining phases' budget before 06 starts.

## What landed

1. **Port** `src/validate.rs`: only file naming the crate. `Checker::new(schema, registered)` and `check(instance)` take `fgos_yaml_doc::Value` only (type-level; converted to JSON inside), schemas registered in memory by `$id`, no retriever, Draft 2020-12 explicit, `options().build()` never the panicking free functions. Findings are `Violation { path, keyword, schema_path }` built from error kind, instance path (index vs key decided by walking the instance; `required` adds the missing key) and the absolute keyword location; never the crate's text (so `masked()` is not needed), sorted and deduped. Whole call guarded by yaml-doc's panic guard (a panic becomes a refusal). `Schemas::validate(&effective)` compiles the composite once (`OnceLock` in `Schemas`).
2. **Meta rule mapping (04a's open question):** the Rust crate does report the `$defs` location: `absolute_keyword_location()` gives `urn:fgos:config-schema-meta:v1#/$defs/<rule>[.part]/...`; the id is the name up to the first dot. Anything failing inside the official 2020-12 meta-schema maps to `schema-dialect`. One consequence: the helper `described` was renamed `schema-description-missing.described` so its failures map to the rule.
3. **Two rules as data** in `config-schema.meta.v1.json`: `schema-pattern-length` (pattern at most 256 characters; F2) and `schema-object-comparison` (`const` and `enum` members hold no object, also nested in arrays; `uniqueItems: true` needs `items` with a scalar `type`; F3). Six new meta fixtures (21 total, 15 before).
4. **Acceptance tests** (`tests/validator_acceptance.rs`): official suite draft 2020-12, 16 files vendored verbatim at commit `89e83a74014617ffbe79a56d83d14d054cd11417` in `contracts/fixtures/json-schema-suite/` (README, LICENSE), one known failure (F3 case) pinned in `KNOWN_FAILURES` and fails if fixed, groups needing `localhost:1234` skipped (1 group); F1, F2, F3 regression tests each reproduce the defect against the crate and state in the comment what a future fix means; F1 also proves through the port that `1e400` arrives as null, and strict-config refuses it. `golden_meta.rs` runs `meta.v1.json`. `standard-invalid` is two cases in `lint.v1.json` (wrong type at line 3 col 3; `required` ignored for the standard). `golden_validate.rs` + `validate.v1.json` (10 cases + a no-value test) cover the wiring.
5. `packages/config/upgrade-record.md` with the sign-off line as given; `docs/specs/distribution.md` RUL107 and one dated history line; `plans/reports/` carries the two earlier reports.
6. Deny: exit 0 (advisories, bans, sources ok; existing `duplicate syn` warning). `Cargo.lock`: 55 added entries, 0 changed.

## Findings and deviations

- **Dev-dependency feature set.** `-p fgos-config` alone has neither `preserve_order` nor `arbitrary_precision`, so F1 and F3 do not reproduce there. `[dev-dependencies] serde_json` enables both (the product's feature set, with a comment), so the tests run as the product runs.
- **`Schemas::undescribed` order depended on the feature set** (sorted keys without `preserve_order`, source order with it). Fixed by sorting the result by path; `golden_schema` caught it.
- **`lint` split:** `lint()` now = `meta()` + `cross_node()`. `golden_lint` cases run `cross_node` (their inputs were written without the per-node rules); `bundled_set_is_clean` still runs the full `lint`. `golden_meta` runs `meta`.
- `fixture_shape.rs` skips the vendored suite directory (third-party format).
- `failure-codes.v1.json`: `standard-invalid` added to the `standard-` prefix meaning. Fixtures README updated (meta and validate owners, suite).
- F2 has no upstream issue (owner filed F1 #1790, F3 #1791); the record says so.
- The F2 timing test asserts a 4x pattern takes more than 8x the time (quadratic growth would be 16x, linear 4x; the margin was not measured separately); it could flake on a very loaded machine in the safe direction only if the crate became faster, which is the case it is meant to flag.
- GitNexus impact analysis inactive per the task; not run.
- The new rule id RUL107 in `distribution.md` is mine (last used was RUL106); rename if another lane claims it. CHANGELOG not touched (no user-visible change).

## Unresolved questions

1. Rust budget for phases 06 to 11 given 1,230 now (see Budget).
2. Should an F2 upstream issue be filed?
