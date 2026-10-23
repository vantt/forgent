# fgos-config validator crate upgrade record

Status: **`jsonschema` =0.60.0 (`default-features = false`) adopted, with the F2 and F3 meta-schema rules and the yaml-doc-only port. Owner sign-off 2026-10-23 12:30.**

- Evaluated: 2026-10-23 (Asia/Saigon), toolchain `cargo 1.97.1`, Linux x86_64.
- Scope: the one crate that judges a value against a section schema under `fgos-config` (`src/validate.rs` is the only file that names it). Contract: `docs/platform/config/spec.md` section 4.
- Evidence (kept in this repo, read these before a bump): `plans/reports/research-261023-1109-json-schema-validator-crate-choice.md` (choice among candidates) and `plans/reports/review-261023-1145-jsonschema-supply-chain-review.md` (source read, transitive crates, audit coverage, findings F1 to F3).

## 1. Chosen version and why

`jsonschema = { version = "=0.60.0", default-features = false }` in the root `[workspace.dependencies]`; `fgos-config` uses `jsonschema.workspace = true`. No `resolve-*`, `macros`, `pyo3`, `magnus`, `jsonb` or `arbitrary-precision` feature: nothing in the build opens a file, a socket or a process, and a `$ref` outside the registered set is an error, never a fetch.

Why this one: full draft 2020-12 with `$ref`/`$defs`/`$dynamicRef` (the meta-schema needs it), errors that carry the keyword, the instance path and the absolute keyword location (so fgOS builds its own text and maps a meta-schema failure to its rule id), passes the official suite for every keyword fgOS schemas use (section 5), and no `unsafe` in the compiled build. Ranked against `boon` and the same crate with `arbitrary-precision` in the review (options 1 to 3); `arbitrary-precision` was rejected because it trades a loud panic for a CPU hang on `1e999999` against `multipleOf`.

The release was about 27 hours old when adopted (one publisher account on crates.io, 139 prior releases). The owner accepted that.

## 2. What was read

Compiled production code of the four same-author crates, per dep-info of a real `default-features = false` build:

| Crate | Compiled lines | Read line by line | Scanned mechanically |
|---|---|---|---|
| jsonschema-regex 0.60.0 | 1,054 | all | all |
| jsonschema-value 0.60.0 | 2,250 | `lib.rs`, `serde_json.rs`, `serde_number.rs`, `unique.rs`, `cmp.rs`, `numeric.rs` (non-bignum), `build.rs` | all |
| jsonschema 0.60.0 | 53,527 | `regex.rs`, `retriever.rs`, `http.rs` parts, `lib.rs` parts; every panic site triaged | all |
| referencing 0.60.0 | 5,433 | none line by line | all |

Not achieved: a full line-by-line read of `jsonschema` and `referencing`. Compensation: whole-tree scans for `unsafe`, FFI, file, network, process, clock, thread and global state; each crates.io tarball diffed against the public git commit `316613f2...` (identical `src/`). Not read: `canonical/` (24k lines, compiled, never called by building a validator), the bignum module (inactive), keyword validators. A deliberate backdoor in unread keyword code cannot be excluded, only made unlikely.

## 3. Transitive crates and audit coverage

Adding the crate adds **55 entries to `Cargo.lock` and changes none** (`serde_json` stays 1.0.151); 43 are compiled on x86_64 Linux, 12 are lock-only (wasm, redox, uefi). Eight host crates have a `build.rs` (none touches network or runs more than `rustc --version`) and two are proc-macro crates (`ref-cast-impl`, `strum_macros`). The four family crates and ten others have **no public audit of any version** (`jsonschema`, `-regex`, `-value`, `referencing`, `borrow-or-share`, `email_address`, `fancy-regex`, `fluent-uri`, `fraction`, `micromap`, `outref`, `unicode-general-category`, `uuid-simd`, `vsimd`); the rest are covered or have other versions audited by Mozilla, Google, Bytecode Alliance, Embark, Zcash or ISRG. Audit matching was a script, not `cargo-vet`. The per-crate table is in the review report; all 55 pass an allow-list of MIT, Apache-2.0, Unicode-3.0, Zlib, MIT-0, Unlicense, BSD-2-Clause (the repo's deny config has no `[licenses]` section).

## 4. Deny result

`cargo deny --config .github/cargo-deny.toml check advisories bans sources` (cargo-deny 0.20.2) run on this tree after adding the crate, 2026-10-23: exit 0, "advisories ok, bans ok, sources ok"; one existing `duplicate syn` warning (2.x and 3.x).

## 5. Acceptance tests (in this package, `packages/config/rust/tests/`)

| Test | Proves |
|---|---|
| `validator_acceptance.rs` `official_suite_...` | the official JSON-Schema-Test-Suite draft 2020-12 files for `type`, `enum`, `const`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `minLength`, `maxLength`, `pattern`, `properties`, `additionalProperties`, `required`, `items`, `$defs`, `$ref` pass (vendored in `contracts/fixtures/json-schema-suite/`, commit recorded in its README); one known failure (F3), groups needing a remote document skipped |
| `validator_acceptance.rs` F1, F2, F3 tests | each defect below still reproduces against the crate, and the guard holds |
| `golden_meta.rs` | every meta-schema rule fires on its case and only there (`contracts/fixtures/meta.v1.json`, 21 cases) |
| `golden_lint.rs` | `standard-invalid` and that `required` is the merge's to judge |
| `golden_validate.rs` | the wiring: section lookup, paths, `required` on the merged value, null, sorted output, no input value in a finding |

The tests run under serde_json's `preserve_order` and `arbitrary_precision`, the feature set a product build has (`apps/fgos`, `work-state` and `distribution` turn them on and Cargo unifies them). A per-package build of `fgos-config` alone does not have them; the dev-dependency line in `packages/config/rust/Cargo.toml` makes the tests run as the product runs.

## 6. Known defects and their guards

Each was reproduced under the product feature set. All are upstream assuming default serde_json features; none is malicious.

| # | Defect | Guard | Upstream |
|---|---|---|---|
| F1 | A number with no `f64` (`1e400`, possible once `arbitrary_precision` is on) reaches `unreachable!()` in `jsonschema-value` (`cmp.rs`, `types.rs`) and `keywords/minmax.rs`; `const`, `enum`, `minimum`, `maximum`, `exclusiveMinimum` in a schema or `type: integer` on an instance panic. | `validate.rs` takes only `fgos_yaml_doc::Value` (finite floats and `i64`; `Value::from_json` maps an unrepresentable number to null) and turns it to JSON itself, so no such number can enter; a panic is caught by the YAML Document guard and becomes a refusal. | https://github.com/Stranger6667/jsonschema/issues/1790 |
| F2 | A schema `pattern` compiles in more than linear time (`jsonschema-regex` re-parses the pattern once per `\d`, `\s`, `\w`): a 4 KB `\d` pattern took 0.9 s, 16 KB 16 s, strict-config allows 64 KB scalars. | Meta-schema rule `schema-pattern-length`: `pattern` at most 256 characters (data, `config-schema.meta.v1.json`). | no issue filed yet (see below) |
| F3 | With `preserve_order`, objects with the same members in another key order compare unequal in `const`, `enum`, `uniqueItems` (official suite: 1254 pass instead of 1257). A wrong verdict, no crash. | Meta-schema rule `schema-object-comparison`: `const` and `enum` members hold no object (also not inside an array), and `uniqueItems: true` needs `items` of scalar `type`. | https://github.com/Stranger6667/jsonschema/issues/1791 |

F2 upstream: issues exist for F1 and F3 only. Add the F2 link here when one is filed.

Each regression test states what its failure means: when a bump makes it fail, upstream fixed the defect; review whether the guard can go, and update this table.

## 7. `float_roundtrip` effect

`jsonschema` and `jsonschema-value` enable `serde_json/float_roundtrip`. `fgos-canonical-json` already enables it, so every workspace build has it today; the crate newly turns it on only for per-package builds that do not contain `fgos-canonical-json`. Measured in the review: with the feature `fgos-canonical-json`, `fgos-yaml-doc` and `fgos-observe` pass (106 tests); without it `fgos-canonical-json` `shared_vectors` fails by one ULP (`333333333.33333325` against `333333333.3333333`). Effect of this crate: none observed; slightly slower float parsing in per-package builds.

## 8. Bump procedure

1. Change the pin in the root `Cargo.toml` (`jsonschema = "=<new>"`); never a range.
2. `cargo test -p fgos-config --jobs 4`. A failure of an F1, F2 or F3 test means upstream changed that defect: act on its comment. A failure of the suite test means a keyword changed meaning: stop.
3. Read the source diff of the four family crates between the versions (`cargo vendor` or the tarballs against the public git tag); repeat the scans of section 2 on the changed files; re-check the transitive crate list (new entries in `Cargo.lock`) and rerun `cargo deny --config .github/cargo-deny.toml check advisories bans sources`.
4. Update this record: version, read scope, crate table, deny result, F1 to F3 rows, sign-off line.
5. Owner sign-off, then the bump lands. A bump with any step missing does not land.

## 9. Owner sign-off

jsonschema =0.60.0 with the F2/F3 meta-schema rules and the yaml-doc-only port, owner 2026-10-23 12:30.
