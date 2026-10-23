# Rust JSON Schema validator for fgOS Config: `jsonschema` vs `boon`

Date: 2026-10-23 (Asia/Saigon). Scratch evidence: `/home/vantt/projects/forgent/.fgos/runtime/tmp/jsonschema-eval/` (own workspaces `js/`, `boon/`; harness + probes in `src/main.rs`, `src/bin/probe.rs`; `deny.txt`; suite clone in `suite/`). Nothing inside the repo Cargo workspace; repo `Cargo.lock` untouched.

## TL;DR

Pick **`jsonschema` 0.60.0, `default-features = false`, exact-pinned (`=0.60.0`)**. Reasons: passes every 2020-12 suite case that does not need a remote fetch (1257/1257), does zero I/O with defaults off (verified, strace shows no network syscalls), no ICU tree, offers `kind().keyword()` + instance/schema paths + `masked()` Display, and is actively maintained. Cost: 42 new crates (vs 38 for boon), fast-moving pre-1.0 API (11 minors in 9 weeks), and we must cap nesting depth ourselves (both crates abort on stack overflow).

`boon` 0.6.1 is a credible runner-up (smaller family, no `unsafe`, same suite pass rate) but: default file I/O must be disabled by hand, pulls the ICU/idna/url tree (19 `Unicode-3.0` crates, 5 proc-macros), no ECMA lookaround/backrefs in `pattern`, error text echoes values, library idle since 2025-01 (last repo commit 2026-02-23).

No third candidate added: nothing else found that is clearly better and well adopted (I did not benchmark others; `jsonschema` has 1585 reverse deps, the next-best pure-Rust option is `boon` with 34).

## Comparison

| Dimension | `jsonschema` 0.60.0 (`default-features=false`) | `boon` 0.6.1 |
|---|---|---|
| Draft 2020-12 suite (top-level `tests/draft2020-12/*.json`, `is_valid` verdict only) | 1257 pass / 45 fail | 1253 pass / 49 fail |
| Failures | all need remote fetch (refRemote, 5 dynamicRef groups, 1 custom-metaschema vocab case); every one is a clean build error, no panic | same remote-fetch set + 2 vocab groups (4 more tests); no panic |
| Crates in `cargo tree -e normal` (host target) | 63 | 55 |
| New crate names vs repo Cargo.lock | 42 (incl. `jsonschema`, `jsonschema-regex`, `jsonschema-value`, `referencing`; `regex`, `serde`, `serde_json`, `memchr`, `aho-corasick` already in repo) | 38 (incl. 19 ICU/idna/url-family) |
| Crates with new build.rs | ahash, getrandom, jsonschema-value (only a pyo3 cfg, empty by default), num-traits, parking_lot_core, ref-cast, unicode-general-category, zerocopy | ahash, getrandom, icu_normalizer_data, icu_properties_data, ref-cast, zerocopy |
| New proc-macro crates | ref-cast-impl, strum_macros | displaydoc, ref-cast-impl, yoke-derive, zerofrom-derive, zerovec-derive |
| `cargo deny check advisories bans sources` (repo `.github/cargo-deny.toml`) | exit 0, "advisories ok, bans ok, sources ok"; one `duplicate syn` warning (syn 2 + 3; repo lock already carries both) | exit 0, all ok, no warnings |
| Licenses of new crates | MIT; deps MIT/Apache/Zlib/Unlicense/MIT-0 | MIT OR Apache-2.0; ICU crates `Unicode-3.0` (repo has no `[licenses]` section, check any future one allows it) |
| `unsafe` in crate's own compiled code | 0 (`rg` hits only in doc comments; `jsonschema-value` pyo3/magnus modules have ~148 but are feature-gated off) | 0 (one commented-out line) |
| I/O by default | None with defaults off: https/http `$ref` -> build error "`resolve-http` feature or custom resolver required"; `file://` -> "`resolve-file` ... required"; relative ref -> "No base URI". strace: no network syscalls | File loader ON: `$ref: file:///...` was read and compiled; relative refs under a `file://` base reach any path (`../../etc/hostname` attempted). http(s) fails ("error loading"). Fix: `Compiler::use_loader(deny-all)` (source-verified, replaces loader wholesale) |
| `x-fgos-*` unknown keywords | accepted at root and in subschemas, any value shape (object, nested arrays, null, bare `x-fgos-`) | accepted, same cases |
| Local `$ref`/`$defs`, `$ref` cycle | works; cyclic `$ref` builds and validates in 692 ns (no hang) | works; cycle builds, validates false in 3 us (RefCycle kind exists) |
| Invalid regex in schema | build `Err` (no panic), 4 ms | build `Err` ("not valid against metaschema" - message does not name the pattern) |
| Huge / bomb pattern (10 MB literal; `((a{1000}){1000}){1000}`) | 10 MB literal: build Err after 2.4 s; nested-count: Err in 8 ms | Err "regex exceeds size limit 10485760" after 1.6 s / 12 ms (message wrongly says "bug in compiler") |
| ReDoS-style pattern at validate time | `(a+)+$` etc. 10 us (regex-crate path); backreference pattern hits fancy-regex backtrack limit in ~14 ms and reports it as a pattern failure, 40 and 2000-char inputs alike | Linear `regex` only; `(a+)+$` 26 us; backrefs/lookaround rejected at build |
| ECMA features in `pattern` | lookahead/lookbehind/backrefs/`\p{L}` work (fancy-regex) | `\p{L}` works; `(?!..)` and `\1` rejected at build |
| Deep nesting (release, 8 MB main stack) | schema depth 3000 ok, 4000 aborts; instance depth 10000 ok, 30000 aborts. `fatal runtime error: stack overflow` = process abort, not catchable | schema depth 700 ok (build cost grows ~quadratic: 264 ms at 700), 1000 aborts; instance 1000 ok, 3000 aborts |
| Error API | `ValidationError`: `kind()` + `kind().keyword()` -> `"type"`, `"enum"`, `"minLength"`...; `instance_path()` (iterable `LocationSegment::Property/Index`, `.to_string()` = JSON Pointer); `schema_path()` (canonical, no `$ref` hops); `evaluation_path()`; `instance()` (the value, we never call it) | `ValidationError{schema_url, instance_location.tokens (Prop/Item), kind: ErrorKind, causes}`; tree of nested causes (Group/Schema/Reference wrappers) that we must flatten; no keyword string - derive from `ErrorKind` variant or `schema_url` fragment tail; `output.rs` has a `keyword_path()` helper |
| Display echoes instance value | Yes by default: `"SECRET123" is not of type "integer"`, `999999 is greater than ...`. `e.masked()` gives `value is not of type "integer"`: tested on type, enum, pattern, minLength, maximum, anyOf, oneOf, `$ref` minLength: none leaked | Mixed: type/enum/const/length messages value-free; `pattern` leaks (`'SECRET123' does not match pattern`), `maximum` leaks (`got 999999`); top-level Display and `Debug` both leak. Would need per-kind own messages |
| Config key names in messages | additionalProperties message names the offending key (`extra_SECRETKEY`) - key, not value; also in masked output | same |
| Error ordering | not schema order (observed: anyOf, arr, const, enum, i, ...) - sort ourselves | similar (tree order) |
| Maintenance | 139 releases; 0.50 (2026-08-20) -> 0.60 (2026-10-22); last commit 2026-10-22; 8 open issues (+9 PRs), 13 issues closed in last 90 days; ~830 stars; MIT; single main maintainer (Stranger6667) but ~30 contributors | 13 releases; lib 0.6.1 on 2025-01-07, repo last commit 2026-02-23; 9 open issues, 0 closed in 90 days; ~120 stars; dual MIT/Apache; one maintainer |
| Adoption | 107.7 M total, 32.4 M recent downloads; 1585 reverse deps (secondary signal) | 0.64 M total, 0.24 M recent; 34 reverse deps |
| Breaking-change history | High churn pre-1.0: e.g. 0.60 changed `ValidationErrorKind::Enum/Constant` to `Arc<Value>`; CLI + regex semantics changes each week. 0.59 fixed a real bug where unfinished regex matches were counted as non-matches so `not`/`patternProperties` accepted invalid instances | Low churn, API stable since 0.6.0 (2024-05); stagnation is the risk |

## Evidence notes

- Suite: JSON-Schema-Test-Suite `tests/draft2020-12` (cloned 2026-10-23, HEAD dated 2026-10-21), custom harness building each group with draft 2020-12 and comparing `valid`. Required keywords covered with zero failures in both crates: type (80), enum (53), const (54), minimum/maximum, exclusive*, minLength/maxLength, pattern, properties, additionalProperties, required, items/prefixItems, `$defs`/ref (79), oneOf/anyOf/allOf/not, if-then-else, unevaluated*. `optional/` directory not run (format/bignum edge cases not needed).
- "fail" numbers include `refRemote.json` (31), `dynamicRef` remote-using groups (13) and vocabulary. Those need `localhost:1234` remotes by design; failing them is the required behaviour for fgOS (no remote fetching).
- Feature minimisation: with `default-features=false` on `jsonschema`, `reqwest`, `rustls`, `aws-lc-rs`, `idna`, file resolver all disappear. The remaining 13 direct deps are not optional in 0.60 (fancy-regex, ahash, uuid-simd, email_address, fraction/num-*, referencing...). `fraction`+`num` and `email_address`/`uuid-simd` exist for `format` and big-number support we do not need but cannot drop.
- Side effect to know: `jsonschema` enables `serde_json/float_roundtrip` (feature unification applies across the whole fgOS workspace, slightly slower float parsing, exact round-trip). Check this with whoever owns yaml-doc number handling.
- boon `idna`/`url` -> ICU is mandatory (no feature to drop); this is why its tree has ICU data crates with build.rs.
- Stack overflow behaviour is identical in kind for both crates (abort, so `catch_unwind` is useless). `catch_unwind` around build/validate was installed in the suite harness: zero panics across 1302 cases for both.

## Security posture summary

| Requirement | jsonschema (minimal) | boon |
|---|---|---|
| No panic on hostile input (tested: invalid regex, regex bombs, cycles, 1302 suite cases) | pass; stack overflow abort on extreme depth | pass; stack overflow abort at lower depth |
| No I/O by default | pass | FAIL by default (file://), fixable with 1 line |
| Few transitive crates | 42 new | 38 new, but ICU family |
| No build.rs/proc-macro surprises | 8 new build.rs, 2 new proc-macros (all common ecosystem crates; none are the validator itself except harmless `jsonschema-value`) | 6 new build.rs, 5 new proc-macros |
| cargo deny clean (advisories, bans, sources) | yes | yes |

## Recommendation (ranked)

1. **`jsonschema =0.60.0`, `default-features = false`** (Cargo: `jsonschema = { version = "=0.60.0", default-features = false }`). Bump deliberately, one version at a time, rerun fgOS's own conformance fixtures on each bump.
2. **`boon 0.6.1`** only if minimal crate count/low churn outweighs maintenance: choose it if fgOS refuses a 0.x library that releases weekly. Requires deny-all `UrlLoader`, own message formatting for every kind, ICU licence allowance.
3. Rejected: hand-rolled validator (violates KISS, the suite has ~1300 cases for the keywords we need).

Adoption risk of #1: pre-1.0 API churn (error-kind variants change), single maintainer. Mitigation: exact pin + wrap behind one fgOS port (`validate(schema, instance) -> Vec<ConfigIssue{path, keyword, expected}>`) so a swap to boon touches one file.

## What fgOS must still do itself

1. **Own messages, never `Display`.** Map `(error.kind() variant, instance_path)` to fgOS text. Do not call `e.to_string()`, `{:?}`, or `e.instance()`; if a fallback is wanted use `e.masked()` (verified value-free). Schema-side values (enum options, const, pattern, limits) are safe to print; config key names (additionalProperties) appear in messages, allowed only if fgOS rule treats keys as non-values.
2. **Depth cap before validation** on both schema and instance (e.g. reject > 64-128 levels, well under the measured abort points 700 for boon / 3000 for jsonschema), since stack overflow aborts the process. serde_json's own 128 limit does not apply to `Value`s built by yaml-doc; confirm yaml-doc caps depth (I did not find a depth check by grep in `packages/yaml-doc/rust/src`; verify).
3. **Disable/forbid refs outside the document**: keep jsonschema default features off, optionally pre-scan schema `$ref` for non-`#`-prefixed targets and give a clearer error; with `$id` set and no registry, remote refs already fail at build.
4. **Map instance path to file/line** (YAML span lookup from `LocationSegment::Property/Index`), and sort errors deterministically (path, then keyword), since iteration order is not schema order.
5. **Validate the schema itself** (the builder already rejects invalid schemas, e.g. invalid regex returned `Err` in the probe; exact metaschema-validation API not verified) and report schema-build errors without echoing pattern text if patterns could hold secrets.
6. **Regex posture**: decide whether to allow lookaround/backrefs (fancy-regex backtracking, bounded by a 1M step limit, ~14 ms in the worst probe). Note pattern semantics are ECMA-262-ish, not exactly Rust `regex`.
7. **Format keyword**: leave format assertions off (2020-12 default); do not enable `format` validation for config without a deliberate decision.
8. Register the dependency per AGENTS.md gates: `cargo deny` allowlist check, add Cargo.lock review, CHANGELOG line if user visible, spec entry before code (new module).

## Limitations

- Conformance measured by `is_valid` verdicts only; no annotation/output-format checks, no `optional/` suite, no draft-04..2019-09.
- Stack-depth thresholds measured on release builds, 8 MB main thread, one machine; embedded threads (2 MB) will abort earlier. Cap must be well below.
- Counts based on Linux host `cargo tree -e normal`; other targets (wasm, windows) add crates. Repo Cargo.lock comparison by crate name; 5-6 existing crates would also get version bumps (serde_json 1.0.151 -> 1.0.154 resolves in a fresh lock only; in the real workspace the existing lock decides).
- `unsafe` count covers the crate's own sources, not transitive crates (ahash, zerocopy, regex, fancy-regex all contain unsafe).
- No fuzzing run; no benchmarking (performance irrelevant for config-size inputs).
- Maintenance figures from crates.io API and GitHub API on 2026-10-23; download counts are weak evidence.

## Unresolved questions

- Does yaml-doc cap nesting depth, and at what number? (Determines the cap placement.)
- Is a config key name inside an error message acceptable under "no error contains a config value"? (jsonschema and boon both include the offending additionalProperties key.)
- Is `serde_json/float_roundtrip` feature unification acceptable for the rest of the workspace?
- Allow ECMA lookaround/backreferences in config schemas (requires the fancy-regex path), or restrict authors to the linear subset?
