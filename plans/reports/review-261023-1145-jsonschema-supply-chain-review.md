# Supply-chain review: `jsonschema` =0.60.0 (default-features = false)

Date 2026-10-23 (Asia/Saigon). Scratch: `/home/vantt/projects/forgent/.fgos/runtime/tmp/jsonschema-eval/{ap,ws}` (probes, deny output, test logs). Repo untouched except this file. Prior work: `plans/reports/research-261023-1109-json-schema-validator-crate-choice.md`.

## Verdict: NOT CLEAN as chosen. Owner reopen clause (3) is triggered. Stop and decide.

Supply chain itself is clean: no unsafe, no I/O, no network, no unexpected build.rs, deny clean, tarballs = public git. But the crate **misbehaves under fgOS's real serde_json feature set**, which the 1109 evaluation did not test (it used default serde_json). Three findings, each reproduced:

| # | Finding | Trigger | Covered by our limits? |
|---|---|---|---|
| F1 | `unreachable!()` panics in jsonschema-value `cmp.rs:100`, `types.rs:255`, jsonschema `keywords/minmax.rs:453/465/478`. Code assumes `serde_json::Number::as_f64()` always `Some` when jsonschema's own `arbitrary-precision` is off. But `apps/fgos`, `work-state`, `distribution` already turn on `serde_json/arbitrary_precision`, and Cargo unifies it. A number like `1e400` then has no f64. Reproduced: `const`/`enum`/`minimum`/`maximum`/`exclusiveMinimum` with `1e400` in the schema, `type: integer` with `1e400` in the instance, all panic. | Out-of-f64-range number literal parsed from JSON text. | YES for YAML-origin data: yaml-doc builds Numbers only via `Number::from_f64` (finite) or `i64` (`model.rs:49`, `document.rs:243`); non-finite is refused. NO if any JSON-text value ever reaches the validator. |
| F2 | Schema `pattern` compile time is quadratic or worse. `jsonschema-regex::to_rust_regex` re-parses the whole pattern once per `\d`/`\s`/`\w` (one replacement per round, `\s` expands to ~10 ranges). Measured (machine was loaded, scaling is the point): `^(\d){n}$`: 4 KB 0.86 s, 8 KB 3.9 s, 16 KB 16 s. `^(\s?){n}$`: 3 KB 3 s, 6 KB 13 s, 12 KB >60 s. | Schema-controlled only (`pattern`; `patternProperties` keys are capped at 1 KB by `key_bytes`, ~70 ms). | NO. yaml-doc `strict-config` allows 64 KB scalars (`limits.v1.json`), so a 64 KB `pattern` means minutes to hours of CPU. Pure CPU, no panic, regex-size limits do not help (loop runs before the engine). |
| F3 | `cmp::equal_objects` zips map iterators, so it assumes sorted keys. With serde_json `preserve_order` (already on in `observe`, `work-state`, `distribution`, `apps/fgos`) objects with the same members in a different order compare NOT equal. Official 2020-12 suite: 1257 pass without `preserve_order`, 1254 with it (`const` "same object with different property order", 2x `uniqueItems`). Wrong verdict, no crash. | Object values inside `const` / `enum` / `uniqueItems`. | n/a (correctness). Rare in config schemas; real if enum-of-objects is ever used. |

None of F1-F3 is malicious; all are upstream assuming default serde_json features. Output-side facts (masked errors, no I/O, depth aborts at ~4000/30000 vs our 32/64) from the 1109 report still hold.

## What was read (honest scope)

Compiled files per `.d` dep-info of a real `default-features=false` build (so feature-gated code is excluded), tests trimmed at first `#[cfg(test)]`:

| Crate | Compiled files / lines (prod) | Read line by line | Mechanically scanned |
|---|---|---|---|
| jsonschema-regex 0.60.0 | 2 / 1054 | ALL (`lib.rs` 547, `syntax.rs` 507) | all |
| jsonschema-value 0.60.0 | 8 / 2250 | `lib.rs`, `serde_json.rs`, `serde_number.rs`, `unique.rs`, `cmp.rs` fully; `numeric.rs` L1-400 (all non-bignum); `build.rs` (4 lines) | all; `types.rs`, `numeric_check.rs` only via panic-site grep |
| jsonschema 0.60.0 | 92 / 53,527 (70.9k with tests) | `regex.rs` L1-200, `retriever.rs` L1-60/140-215/290-348, `http.rs` L1-80, `lib.rs` L2370-2460 and L3540-3550; every `unwrap/expect/panic!/unreachable!` site outside `canonical/` listed and triaged | all |
| referencing 0.60.0 | 27 / 5,433 (7.4k with tests) | none line by line (`meta.rs`/`small_map.rs`/`registry/build.rs` only at panic and pointer sites) | all |

**Not achieved: a full line-by-line read of jsonschema (53k) and referencing (5k) prod code.** Compensation: whole-tree scans (all compiled files, cfg branches included) for `unsafe`, `transmute`, `*_unchecked`, `MaybeUninit`, `Box::leak`, `extern`, `#[link]`, `static mut`, `#[used]`, `link_section`, `asm!`, `env!`, `std::fs/net/process/env`, `Command`, sockets, clocks, `thread::spawn`, `libloading`, base64/hex blobs, statics/OnceLock/thread_local/Mutex, panic sites. Also not read: `canonical/` (24k lines of unused schema algebra, compiled but never called by `build()`), bignum module (only active with `arbitrary-precision`), keyword validators, `jsonschema-macros{,-core}` (inactive, 13.6k lines, scanned only).

Provenance check: each crates.io tarball (`.cargo_vcs_info.json` sha `316613f2...`, "chore(rust): Release 0.60.0", 2026-10-22) diffed against a fresh fetch of `github.com/Stranger6667/jsonschema` at that sha: `src/`, tests, benches identical; `Cargo.toml.orig` identical; only `README.md` (symlink) differs. No tarball-only code.

## Findings per family crate

All six same-author crates published 2026-10-22 08:23-08:43 UTC by `Stranger6667`, sole owner on crates.io, MIT, none yanked. 0.60.0 is about 27 h old with ~4.9k downloads: freshness and single-account risk (note, not a defect).

- **jsonschema**: `unsafe` 0 (2 hits are doc-comment text, `lib.rs:1103`). Lint is `unsafe_code = "warn"`, not `forbid`. Zero fs/net/env/process in the compiled build; `std::fs::File::open`, `reqwest`, `tokio` exist only behind `resolve-file`/`resolve-http`/`resolve-async`, all off; http/https/file `$ref` return a clear `Err` (`retriever.rs:296-348`). Global state: `LazyLock` for default base URI and content checks, thread-locals (`LOCATION_BUFFER`, `MATCHES`), and one `RwLock` + `Box::leak` meta-validator cache (`lib.rs:2436-2460`): bounded, one entry per JSON representation type, no unbounded growth. Pointer-address-as-`usize` identity keys (`compiler.rs`, `node.rs`) are safe Rust, valid while the schema outlives compile. Panics: `regex.rs` wraps matching in `catch_unwind` (regex-automata bug rust-lang/regex#1344); `.expect` on internal invariants only; the free functions `is_valid/validate` `.expect("Invalid schema")` so use `options().build()`, never those. Findings F1 (minmax), F2 (via jsonschema-regex).
- **jsonschema-regex**: 0 unsafe, 0 I/O, 0 globals, 0 `unwrap`; 9 `.expect` on peeked iterators. `syntax.rs` ECMA checker is iterative (Vec of frames, no recursion), position arithmetic stays on char boundaries, `\N` parsed with `unwrap_or(u64::MAX)`, no overflow path. Named-group duplicate check is O(n^2) in group count (20k groups: 123 ms, fine). Finding F2 is in `to_rust_regex` (`lib.rs:20-85`): loop re-parses once per replaced perl class.
- **jsonschema-value**: compiled build has 0 unsafe. `magnus.rs`/`pyo3.rs` carry ~148 unsafe and FFI statics but are `cfg(feature)` gated off (verified not in dep-info). `build.rs` only calls `pyo3_build_config` under the pyo3 feature (empty otherwise). Findings F1 (`cmp.rs`, `types.rs`), F3 (`cmp.rs equal_objects`). Number math checked (`checked_mul/pow`, divisor guards, `% (multiple as u64)` only when `0 < multiple <= 2^53`); no overflow or div-by-zero path found. f64-range stress: 81 extreme-number cases (`1.797e308`, `5e-324`, `2^53+1`, `u64::MAX+1`, `i64::MIN-1`, with multipleOf/min/max/const/enum/type/uniqueItems) all returned in <=6 ms with 0 panics, with and without `arbitrary-precision`.
- **referencing**: 0 unsafe, no I/O (embedded meta-schemas via `include_bytes!`; `Retrieve` default errors for external URIs), `parking_lot::RwLock` cache and `LazyLock` registries. `unreachable!` at `small_map.rs:50/75/83`, `spec/draft202012.rs:95` are internal enum invariants. Not read line by line.
- **jsonschema-macros / -core** (same author, proc-macro): do not enter the build with the chosen line, and do not enter `Cargo.lock` either. They appear in the lock only if `arbitrary-precision` is enabled (weak dep; the lock then gains 8 lock-only crates: these two, `proc-macro-crate`, `toml_edit`, `toml_datetime`, `toml_parser`, `winnow`).

## Transitive crates vs `/home/vantt/projects/forgent/Cargo.lock`

Method: copied the repo `Cargo.lock` into the scratch crate and let Cargo add only what is missing. Result: **55 new lock entries, 0 existing versions changed** (serde_json stays 1.0.151). **43 are compiled on x86_64-linux** (incl. the 4 family crates), 12 are lock-only (wasm/redox/uefi targets, `rustversion`, `zerocopy-derive`). The 1109 report's "42" differs by one only because it resolved without the repo lock.

`cargo deny --config .github/cargo-deny.toml check advisories bans sources` (cargo-deny 0.20.2, advisory DB commit 2026-10-22): **exit 0, "advisories ok, bans ok, sources ok"**; one pre-existing `duplicate syn` warning (2.x + 3.x already in repo lock). No yanked crate flagged. Repo config has no `[licenses]` section, so I ran an ad-hoc allow-list (MIT, Apache-2.0, Unicode-3.0, Zlib, MIT-0, Unlicense, BSD-2-Clause, LLVM-exception): all 55 pass (only the scratch crate itself is "unlicensed").

Audit coverage: `cargo-vet` NOT installed (not needed). I fetched `audits.toml` of Mozilla, Google, Bytecode Alliance (wasmtime), Embark, ZcashFoundation (zebra), plus ISRG (libprio-rs) over https and matched name+version myself: full audits, delta chains (treated as bidirectional), `safe-to-deploy` criterion, and trusted/wildcard publisher entries only when the publisher user-id matched crates.io `published_by` and the version's publish date fell inside the window (checked via crates.io API). Crude versus real cargo-vet (no criteria implication graph beyond deploy implies run), but conservative.

Legend, audit column: **COV** = covers this exact version at safe-to-deploy; **RUN** = safe-to-run only; **OTHER** = other versions audited by listed orgs, not this one; **EXP** = publisher window expired or user mismatch; **NONE** = no public audit of any version.

| Crate | Version | build.rs | proc-macro | Audit coverage | License |
|---|---|---|---|---|---|
| jsonschema | 0.60.0 | no | no | NONE | MIT |
| jsonschema-regex | 0.60.0 | no | no | NONE | MIT |
| jsonschema-value | 0.60.0 | yes (pyo3 cfg only) | no | NONE | MIT |
| referencing | 0.60.0 | no | no | NONE (google audited another version) | MIT |
| ahash | 0.8.12 | yes (cfg probes) | no | OTHER (mozilla, google, bytecode) | MIT OR Apache-2.0 |
| allocator-api2 | 0.2.21 | no | no | OTHER (mozilla, bytecode) | MIT OR Apache-2.0 |
| autocfg | 1.5.1 | no | no | OTHER (mozilla, google) | Apache-2.0 OR MIT |
| bit-set | 0.8.0 | no | no | COV (mozilla delta chain) | Apache-2.0 OR MIT |
| bit-vec | 0.8.0 | no | no | COV (mozilla delta chain) | Apache-2.0 OR MIT |
| borrow-or-share | 0.2.4 | no | no | NONE | MIT-0 |
| bytecount | 0.6.9 | no | no | OTHER (google) | Apache-2.0/MIT |
| data-encoding | 2.11.1 | no | no | OTHER (mozilla, google) | MIT |
| email_address | 0.2.9 | no | no | NONE | MIT |
| fancy-regex | 0.19.2 | no | no | NONE | MIT |
| fluent-uri | 0.4.1 | no | no | NONE | MIT |
| foldhash | 0.2.0 | no | no | OTHER (mozilla, google, bytecode, zcash) | Zlib |
| fraction | 0.17.0 | no | no | NONE | MIT OR Apache-2.0 |
| getrandom | 0.3.4 | yes (rustc --version probe) | no | OTHER (mozilla, google, bytecode, isrg) | MIT OR Apache-2.0 |
| heck | 0.5.0 | no | no | RUN (google) | MIT OR Apache-2.0 |
| lock_api | 0.4.14 | no | no | EXP (mozilla/bytecode windows end 2024; published 2025-10-03) | MIT OR Apache-2.0 |
| micromap | 0.3.0 | no | no | NONE | MIT |
| num | 0.4.3 | no | no | COV (mozilla trusted, cuviper) | MIT OR Apache-2.0 |
| num-bigint | 0.4.8 | no | no | COV (mozilla trusted, cuviper) | MIT OR Apache-2.0 |
| num-cmp | 0.1.0 | no | no | RUN (google) | MIT/Apache-2.0 |
| num-complex | 0.4.6 | no | no | COV (mozilla trusted, cuviper) | MIT OR Apache-2.0 |
| num-integer | 0.1.47 | no | no | OTHER (mozilla, google, isrg) | MIT OR Apache-2.0 |
| num-iter | 0.1.46 | no | no | OTHER (mozilla, google, isrg) | MIT OR Apache-2.0 |
| num-rational | 0.4.2 | no | no | COV (google full) | MIT OR Apache-2.0 |
| num-traits | 0.2.19 | yes (autocfg) | no | COV (google, bytecode full) | MIT OR Apache-2.0 |
| outref | 0.5.2 | no | no | NONE | MIT |
| parking_lot | 0.12.5 | no | no | COV (mozilla trusted, Amanieu, window to 2026-04-29) | MIT OR Apache-2.0 |
| parking_lot_core | 0.9.12 | yes (tsan cfg) | no | EXP (windows end 2024) | MIT OR Apache-2.0 |
| percent-encoding | 2.3.2 | no | no | OTHER (mozilla, google, bytecode) | MIT OR Apache-2.0 |
| ref-cast | 1.0.27 | yes (rustc --version, writes OUT_DIR) | no | COV (mozilla trusted, dtolnay; window ends the publish day 2026-08-19) | MIT OR Apache-2.0 |
| ref-cast-impl | 1.0.27 | no | YES | COV (same) | MIT OR Apache-2.0 |
| scopeguard | 1.2.0 | no | no | COV (mozilla, bytecode, isrg trusted) | MIT OR Apache-2.0 |
| smallvec | 1.16.3 | no | no | EXP (mozilla window is user 2017; 1.16.3 published by user 2396) | MIT OR Apache-2.0 |
| strum | 0.28.0 | no | no | OTHER (mozilla, google, embark) | MIT |
| strum_macros | 0.28.0 | no | YES | OTHER (mozilla, google, embark) | MIT |
| unicode-general-category | 1.1.0 | yes (generates table into OUT_DIR from in-crate data, no I/O elsewhere) | no | NONE | Apache-2.0 |
| uuid-simd | 0.8.0 | no | no | NONE | MIT |
| vsimd | 0.8.0 | no | no | NONE | MIT |
| zerocopy | 0.8.63 | yes (rustc --version, reads own Cargo.toml) | no | OTHER (mozilla, google) | BSD-2-Clause OR Apache-2.0 OR MIT |

Summary of the 43 host crates: COV 11, RUN 2, OTHER 13, EXP 3, NONE 14 (the 4 family crates + borrow-or-share, email_address, fancy-regex, fluent-uri, fraction, micromap, outref, unicode-general-category, uuid-simd, vsimd). Several of the NONE crates are small single-author crates in the number/URI/regex path (fluent-uri, email_address, fraction, fancy-regex are the biggest). Not read by me: they get only deny + the build.rs read below.

Lock-only (not compiled on Linux; 12): bumpalo 3.20.3 (build ok, COV bytecode wildcard), js-sys 0.3.106, wasm-bindgen{,-macro,-macro-support,-shared} 0.2.129 (publisher user-id absent on crates.io, i.e. trusted publishing, so cargo-vet could not match; window dates fit mozilla), wasip2 1.0.4 (COV bytecode wildcard), wit-bindgen 0.57.1 (build.rs; window fits, publisher unverifiable), rustversion 1.0.23 (build.rs + proc-macro, COV mozilla), r-efi 5.3.0 (MIT OR Apache-2.0 OR LGPL-2.1-or-later, OR so fine; OTHER mozilla), redox_syscall 0.5.18 (OTHER mozilla), zerocopy-derive 0.8.63 (proc-macro, OTHER mozilla/google).

build.rs of the 8 host crates inspected: none opens network, none execs anything but `rustc --version`/`RUSTC_WRAPPER` probes (getrandom, ref-cast, zerocopy), none reads outside its own package, writes only to `OUT_DIR`. proc-macro crates on host: `ref-cast-impl`, `strum_macros` (2). Total host build.rs 8, proc-macro 2.

## float_roundtrip effect

Source: `jsonschema` and `jsonschema-value` each declare `serde_json = { features = ["float_roundtrip"] }`. **Already forced on today**: `packages/canonical-json/rust/Cargo.toml:9` enables the same feature, so any build graph that contains `fgos-canonical-json` (every `--workspace` build, `apps/fgos`, `event-store`, `run-supervisor`, `git/node-addon`) has it. Adding jsonschema adds nothing there; it newly turns it on only for per-package builds such as `-p fgos-yaml-doc`.

Measured, scratch copy of the workspace (`ws/`, fixtures copied), `cargo test --jobs 4 --no-fail-fast -p fgos-canonical-json -p fgos-yaml-doc -p fgos-observe`:

| Config | Result |
|---|---|
| Feature ON (as repo) | 106 passed, 0 failed |
| Feature OFF (removed from canonical-json, nothing else enables it) | 102 passed, **1 failed: `fgos-canonical-json` `tests::shared_vectors`: `333333333.33333325` vs expected `333333333.3333333`** (1-ULP float parse) |

So byte output changes only without the feature, and canonical-json itself is what needs it. yaml-doc and observe pass identically in both. Effect of jsonschema turning it on workspace-wide: none observed; slightly slower float parsing in per-package builds. `arbitrary_precision` crates (`apps/fgos`, `work-state`, `distribution`) keep numbers as text, so the feature is moot there.

## Required guards if the owner proceeds (all in fgOS's own thin wrapper, no fork)

- M1 (F2): before `build()`, walk the schema and refuse any `pattern` longer than 512 bytes (22 ms at 502 bytes), and cap total pattern bytes. One pass, KISS.
- M2 (F3): validate against clones passed through `Value::sort_all_objects()` for schema and instance, or lint schemas to forbid `const`/`enum`/`uniqueItems` with object values. Sorting is one call under `preserve_order`.
- M3 (F1): invariant plus one test: every `Number` given to the validator comes from `yaml-doc` `to_json` (finite f64 or i64). If JSON text ever reaches the validator, switch to the `arbitrary-precision` feature (see option ranking) and add a numeric exponent guard.
- Use `jsonschema::options().with_draft(...).build()`, never the `is_valid`/`validate` free functions (they `expect` on bad schemas). Do not enable `resolve-*`, `macros`, `pyo3`, `magnus`, `jsonb`.

## Options, ranked

1. **Keep `jsonschema =0.60.0`, `default-features = false`, plus M1-M3.** Smallest surface (55 new lock entries, 0 changed), failure mode of F1 is a loud catchable panic (profile has no `panic = "abort"`), M3 makes it unreachable today. Recommended if the owner accepts guards.
2. Same crate with `features = ["arbitrary-precision"]`: removes the F1 panics and makes big-integer compare exact (verified: 0 panics, same suite result 1257 w/o preserve_order), but the lock gains 8 lock-only crates (incl. same-author `jsonschema-macros`, `-core`, plus `toml_edit`, `winnow`, `proc-macro-crate`) and a new failure mode: CPU hang for JSON numbers like `1e999999` against `multipleOf 0.1` (>100 s, 15 MB RSS; exponents >=1e7 are short-circuited at ~1 ms). Hang is worse than a panic. Not preferred. F2 and F3 unchanged.
3. Reopen: `boon` 0.6.1 from the 1109 report. NOT evaluated here for F1-F3-class issues (preserve_order, arbitrary_precision unification, pattern compile cost), so choosing it needs the same probes first.

## Exact dependency line (option 1)

Root `Cargo.toml`, `[workspace.dependencies]`:

```toml
jsonschema = { version = "=0.60.0", default-features = false }
```

Consuming crate: `jsonschema.workspace = true`. If option 2 is chosen instead: `jsonschema = { version = "=0.60.0", default-features = false, features = ["arbitrary-precision"] }`.

## Limitations

- No full line-by-line read of jsonschema (53k) and referencing (5k) prod code; see read table. A deliberate backdoor hidden in unread keyword code cannot be excluded by this review, only made unlikely (tarball = public git, scans clean, single well-known maintainer, 139 prior releases).
- Audit matching is my own script, not cargo-vet; crates.io `published_by` is null for trusted-publishing releases so those lock-only matches are unverified.
- The 1257 vs 1254 suite numbers: 1257 only without `preserve_order`; the 1109 report ran with default serde_json.
- Timings for F2/hang were taken on a machine with load average ~24 (other sessions); absolute seconds are inflated, growth rates are the evidence.
- Not covered: runtime memory ceiling of validation on large instances, thread-safety under concurrent `build()`, Windows/macOS-specific paths, 0.59.x fallback as an alternative version.

## Unresolved questions

1. Where will the validator crate sit and can any value reach it that did not pass through yaml-doc `to_json` (JSON state files, gateway request bodies)? Decides whether M3 is a real guarantee.
2. Do app-supplied schemas (agent apps, third parties) exist, or are all schemas first-party? Decides how hard M1 must be.
3. Is a ~27 h old release acceptable, or does the owner want a cooldown/older pin?
4. Should this review's finding (upstream assumes default serde_json features) be reported upstream (F1, F3 are two small issues)?
