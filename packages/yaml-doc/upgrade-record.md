# fgos-yaml-doc parser upgrade record

Status: parser evaluation complete, **waiting for owner sign-off**. No parser dependency has been added to the repository.

- Evaluated: 2026-10-22 (Asia/Saigon), toolchain `cargo 1.97.1`, Linux x86_64.
- Scope: choose the one parser crate under `fgos-yaml-doc` (spec `docs/platform/yaml-document/spec.md` sections 5, 8, 9).
- Method: throwaway Cargo project (own workspace) outside the repo workspace, under the worktree's `.fgos/runtime/tmp/yaml-eval/` (ignored by git, kept until the last phase of the slice). One small adapter per candidate behind one tree type, one shared profile walk, the golden fixtures under `packages/yaml-doc/contracts/fixtures/` as input, 53 tracked `*.yaml`/`*.yml` files of this repo plus the real project config converted to YAML (1064 lines, semantically equal to `.fgos/config.json`) as real-world input. Every cargo command ran with `--jobs 4`; `cargo test --workspace` was not run.
- Fixture and corpus numbers below come from that scratch driver. The committed owning proof of fixture correctness against the chosen parser is the later parse runner; this record cites it once available.

## 1. Recommendation (details in sections 3 to 9)

**Option A: `saphyr-parser` 0.2.2 used for parsing only, with byte-exact spans derived by our crate and all edits done by our own splicing.**

- A and B parse all 53 real YAML files correctly and agree with each other and with PyYAML; C does not (section 4.3). A also passes every parser-dependent fixture except four refusal positions that one more derived rule fixes (section 4.1).
- `yaml-rt` is rejected on evidence: it silently mis-parses one real repo file and falsely refuses another (section 4.3), and its parser overflows the stack at 100 000 nested block sequences (section 6.4).
- `noyalib` works but its API hides facts the strict profile needs (complex keys, non-string keys, tag/anchor/multi-document positions, `-0`), its source is 55 k lines (not reviewable), and it has the fastest release churn (section 7).
- Cost of A, stated plainly: saphyr-parser's own span numbers are not usable as they come (section 3). Six derived rules (about 60 lines, section 3.2) fix them; they agree byte-for-byte with an independent oracle on 9 224 of 9 224 addressable nodes in 166 inputs and recover all 758 comments in 160 inputs. They are source rescans, and the record counts that against A.

## 2. Candidates, pins and provenance

| Item | `yaml-rt` | `noyalib` | `saphyr-parser` |
|---|---|---|---|
| Exact version | 0.3.3 (+ `yaml-rt-core` 0.3.3), `default-features = false` | 0.0.58, `default-features = false, features = ["std"]` | 0.2.2 |
| Published | 2026-10-17 | 2026-10-15 | 2026-10-15 |
| crates.io checksum (matches scratch `Cargo.lock`, sha256 of the `.crate` re-computed) | yaml-rt `9860179b…ebe6`, yaml-rt-core `d8799292…bc47` | `3fad8f1a…a3bb` | `6c622058…d387` |
| Repository, commit in `.cargo_vcs_info.json` | `hdevalke/yaml-rt` `c87cec4b` (7 tags point at it) | `sebastienrousseau/noyalib` `7529f1b3` (1 tag) | `saphyr-rs/saphyr` `b8205d5f`, path `parser` (1 tag) |
| Published crate equals the repo at that commit | yes (`diff -rq` of the `.crate` against a depth-1 fetch of the commit: only `Cargo.toml` normalization and `.cargo-ok` differ) | yes (same test) | yes (same test) |
| MSRV (`rust-version`) | 1.96 | 1.89 | 1.85 |
| Edition / license | 2024 / MIT OR Apache-2.0 | 2024 / MIT OR Apache-2.0 | 2024 / MIT OR Apache-2.0 |
| Owners (crates.io) | 1 user | 1 user | 2 users (`davvid`, `Ethiraric`), repo under an organisation |

New transitive crate pinned by A besides `saphyr-parser`: `arraydeque` 0.5.1 (`7d902e3d…c236`, repo commit `2ccf3057`, untagged, content equal to the commit; 81 M downloads, 43 dependents, last release 2023-02). `thiserror`, `thiserror-impl`, `proc-macro2`, `quote`, `syn`, `unicode-ident` are already in the workspace `Cargo.lock` (thiserror 2.0.20 locked; `saphyr-parser` asks `^2.0.20`).

## 3. The saphyr-parser gate (rule: exact start and end byte offsets for keys and values)

Question asked: can exact start AND end byte offsets of keys and values (block scalars, flow collections, multi-line plain and quoted scalars, aliases, empty values) be had, and how are comments treated?

### 3.1 What the parser reports (`src/scanner.rs` `Marker`/`Span`, probe `sdump`)

| Finding | Evidence |
|---|---|
| `Marker::index()` is documented "in bytes" but is a **character index**. With a non-ASCII line (`v: ünï` after `u: "ünï"  # é`) offsets shift and slicing the source at them hits a non-char boundary. | `YAMLEVAL_CHARIDX_AS_BYTES=1 gate h2` gives `bad bounds 115..116`, `122..123` and two wrong spans on the one non-ASCII file; the cause is in `src/input/str.rs` (`StrInput` walks `chars()`). Fixed here by one char-to-byte table. |
| Quoted scalar span **ends too late** when trivia follows: `"q\"uote"   # c` reports 15 bytes (end includes the spaces and the comment). | span `[42..57]` over `"q\"uote"   # c`; `'w'  # c` the same. Replacing the span with a sentinel deletes the comment (oracle: COMMENT LOST, 17 double-quoted and 2 single-quoted cases). |
| Block scalar span **starts after the header** (`\|`, `>-`, `\|+`) and **ends after trailing blank lines plus the next line's indent**. | `[86..113]` for `lit one\n      lit two\n\n    `; 16 of 20 folded and 46 of 47 literal nodes wrong as reported. |
| Flow collection start event covers only `[` or `{`; the close event's span runs on through trailing trivia (`] # c`). Its `start` is exact. | all 413 flow collections wrong as reported (covers one byte). End = close event start + 1. |
| Block collection end events carry the start of the next token, not the end of the content. | `MappingEnd [131..131]` at the next key. Block collection spans are not used for edits by any candidate (see 5.4). |
| Anchor and tag are **outside** the node span (span starts at the content); anchors are numeric ids, not names. | `&anc val` span `[225..228]`; `!!str 5` span at `5`. A refusal position at the tag (fixtures want column 4) is not available without a backward scan. |
| Empty scalar in a **flow** mapping gets the span of the next token (`{ a: b, c }` gives the empty value the span of `}`); block-context empties are empty spans at the key end. | `file:fgos-gateway-api-v1.yaml: [18321..18322] "}"`; 2 failures before the empty-scalar rule. |
| Comments: **dropped**, no event, no trivia. | event list in `sdump` contains none. |

### 3.2 Derived rules that make the spans exact (measured, not assumed)

1. character index to byte offset: one table built from `char_indices()`.
2. quoted scalar end: rescan from the start for the closing quote (double: skip `\x` pairs; single: `''` is a literal quote).
3. block scalar: start = header token at the end of the previous line (comment cut at ` #`); end = reported end with trailing whitespace and blank lines trimmed.
4. flow collection end = close event start + 1.
5. empty plain scalar: empty span (ignore the reported one).
6. (positions only) tag/anchor start: scan back from the content start over `!`/`&` tokens.

Rules 1 to 5 are `derive()` in the scratch driver (`scan_dq`, `scan_sq`, `header_start`, `derive`: 54 lines); rule 6 is not implemented in the oracle run (it only concerns refusal positions: 4 of 82 fixture rows, section 4.1). Each rule rescans source text from a position the parser reported; none re-parses. They count against saphyr; they are the cost of option A.

### 3.3 Oracle and result

Oracle (independent of every candidate's spans): replace the candidate's span of a node with the plain scalar `ZZ`, re-parse with saphyr as the reference, and require (a) the tree equals the original with only that node replaced and (b) the list of comment tokens (noyalib's lexer) is unchanged. Inputs: parse and edit fixture inputs up to 12 kB plus the real files: 166 inputs (27 non-ASCII), every key and value node except the root and block collections, 9 238 addressable nodes per candidate.

| Span source | pass | fail | no span / empty value |
|---|---|---|---|
| saphyr as reported (after char-to-byte) | 8 730 | 496 | 12 |
| **saphyr with rules 1 to 5** | **9 224** | **0** | 14 (empty values; nothing to replace) |
| yaml-rt CST span as reported | 7 159 | 79 | 9 (+ 1 055 key nodes in the two real files it mis-parses) |
| yaml-rt span with trailing whitespace trimmed | 7 198 | 40 | same |
| noyalib `span_at`/`key_span` by path (simple unquoted keys and indexes only) | 7 266 | 19 | quoted keys and complex paths not addressable |

Comments (step 5): scanning only the text **between** the derived leaf spans of saphyr (plus the first line of block scalars for `| # c`) found 758 of 758 comments in 160 inputs, identical to the lexer tokens of noyalib, 0 mismatching inputs (`cmt` probe). So "block above" and "inline on line" (phase 06 definitions) are derivable from source text between spans alone with saphyr's derived spans. The same holds for the other two (comment association is ours for every candidate: see 5.5).

**Verdict: not rejected.** Exact byte starts and ends are derivable for every node kind measured, by rules that agree with the oracle on every node. They are a second scan of the source around reported positions (not a second parser pass) and they exist because the reported numbers are character-based and over-extended. If the owner reads the gate rule strictly ("a derived end that needs a rescan counts against it"), that is counted in the comparison below, not hidden.

## 4. Fixtures, round trip and real files

### 4.1 Parse fixtures that depend on the parser (51 cases, 82 case-by-profile rows; command `eval`)

The other 33 parse fixtures (limits, bidi, zero-width, prototype keys, number range, alias budget, node budget, scalar and key size) are decided by our own walk or pre-scan and are the same for every candidate; they run in the later parse runner. The 47 edit fixtures were not run per candidate: byte fidelity of edits is measured by the oracle in 3.3, the edit runner belongs to the chosen parser phase. Candidate adapters build one tree; the profile walk (duplicate keys, tags, anchors, merge key, multi-document, complex keys, non-string keys, alias expansion, scalar resolution) is shared code, except `noyalib`, which is driven through its own config and policy hooks. A leading BOM is stripped before `yaml-rt` and `saphyr` (our pre-scan does that); `noyalib` handles it itself.

| Candidate | pass (rule or value, and position) | rule right, position wrong | fail |
|---|---|---|---|
| yaml-rt | 81 | 1 (`syntax-error-position`: 2:4, fixture wants 2:1) | 0 |
| noyalib | 67 | 9 (no position reported: `multi-doc-2/3` x2 profiles, `merge-key-refused`, `tag-binary`, `tag-custom`, `tag-core-str-refused`, `anchor-refused-strict`) | 6: `complex-key-seq`, `complex-key-map` (keys are stringified, not seen), `non-string-key-{int,bool,null}-strict` (same), `numbers-edge-tool` (`-0` becomes `0`) |
| saphyr-parser | 78 | 4 (tag and anchor positions: parser reports the content start; rule 6 would fix) | 0 |

Decision D7 (`a: [1,\nb: }`): saphyr 2:1, noyalib 2:1, yaml-rt 2:4 (the fixture pins 2:1; with `yaml-rt` the column would change and be recorded).

### 4.2 Round trip with no edit (222 inputs: fixtures up to 1 MiB without bracket generators, plus real files; command `rt`)

| Candidate | byte-identical | parsed but different | refused |
|---|---|---|---|
| yaml-rt (`YamlDoc` lossless path) | 210 | 0 | 12 |
| noyalib (`cst::Document`) | 201 | 0 | 21 (budgets and multi-document refused by the parser, as designed) |
| saphyr-parser | 211 parsed; output is the input bytes by construction (our splice never re-renders untouched bytes) | n/a | 11 |

The real config as YAML (1064 lines, doc/why/free and inline comments, block scalars) round-trips identically in all three.

### 4.3 Meaning on real files (179 inputs: fixture inputs up to 200 kB, 53 tracked repo YAML files, 3 scratch files; tool profile; command `parity`)

All three agree on 160 inputs. Differences that matter:

- **`yaml-rt` mis-parses `domains/coding/workflows/feature.yaml` silently.** Line 169, a flow mapping `{ ..., reason: a worker's own claim of passing tests is not a receipt }`: the plain scalar does not stop at `}` and swallows the following entries (value becomes `...not a receipt } - { id: integration-receipt, ...`). `saphyr-parser`, `noyalib` and PyYAML 6.0.3 agree with each other (same 7 081-character JSON). No error is raised: wrong data.
- **`yaml-rt` refuses valid `docs/contracts/fgos-gateway-api-v1.yaml`** (syntax-error at 456:130, a flow mapping with an unquoted comma-free sentence and trailing `}`); `saphyr-parser`, `noyalib` and PyYAML parse it.
- `yaml-rt` also refuses input using lone CR line breaks (`block-cr-line-breaks-strict`), which the other two accept.
- `noyalib` differs in 8: 4 are alias-bomb fixtures refused by its own budget under a different rule name (fine), 2 complex keys, `-0`, and the numbers case.
- `saphyr-parser` differs in 1: it refuses a 1 025-character implicit key (`key-over-limit`; YAML limits implicit keys to 1 024) where the other two accept; our own key-size rule refuses it first.

## 5. Tree facts, comments and errors

### 5.1 Tree facts the profiles need

| Fact | yaml-rt | noyalib | saphyr-parser |
|---|---|---|---|
| tag | yes (`raw_tag`) | policy hook or `Value::Tagged`, no position | yes (handle and suffix) |
| anchor | yes (name) | policy hook only | id only (enough: refusal and alias linking) |
| alias target | yes (`resolve_alias`) | no (expanded; `span_at` through an alias returns the anchor's node) | id |
| scalar style | yes | green-tree leaf kinds only | yes (event) |
| raw scalar text | yes (span) | span by path | derived span |
| mapping key node (complex keys) | yes | **no** (keys are strings; `NonScalarKeyPolicy` stringifies or errors) | yes |
| duplicate keys not collapsed | yes | policy `Error` (position not given) | yes (we build the tree) |
| multiple documents | yes | refuses in `parse_document`, `parse_stream` otherwise | yes (`DocumentStart`/`DocumentEnd`) |
| empty documents | yes (`document_root` is `None`) | yes | yes |

Profile rules that need the parser rather than our walk: only syntax errors and scalar decoding (escapes, folding, block scalar chomping).

### 5.2 Comments

| Candidate | exposure | note |
|---|---|---|
| yaml-rt | comment tokens with spans (`tokens()`); no association | probes P1 to P6 found every comment token |
| noyalib | `comments_at(path)` before/inline | does **not** see the comment after a key colon (P1), after `-` (P2) or after a block scalar header (P4); a blank line does **not** end the "block above" (`# a`, blank, `# b` gives both), which contradicts the fixture rule (a blank line separates) |
| saphyr-parser | none | derived from the text between spans, 758 of 758 (3.3) |

So no candidate removes the need for our own comment association; B's built-in one would have to be bypassed.

### 5.3 Syntax-error text (spec section 8: errors never carry source text)

Probed `token: [SECRET-VALUE-123,\nb: }`, a bad indent, an unterminated quote and a tab indent: none of the three candidates echoes the offending value in its message or debug output (`msgs` probe). Our crate still maps every parse error to a fixed rule text and takes only line and column.

### 5.4 Block collection spans

No candidate reports the end of a block collection as a node span (yaml-rt includes trailing blanks; saphyr gives the next token; noyalib trims by path). Edits address scalars, flow collections and entries; the entry end for `remove` is derived from the next key start, a rule that is ours in all three options and is the subject of the later edit runner, not of this choice.

## 6. Safety and cost

### 6.1 `unsafe` sites in non-test source (census by `unsafe_scan.py`, comments excluded)

| Crate | Status vs workspace | `unsafe` sites | Where / what |
|---|---|---|---|
| `yaml-rt` | new (option C) | 0 | facade, 34 lines |
| `yaml-rt-core` | new (C) | 1 | `src/source.rs:394` `get_unchecked` on a slice with debug-assert and a SAFETY note |
| `noyalib` | new (B) | 0 (`#![forbid(unsafe_code)]` for its own code only) | |
| `libm` | new (B) | 56 | `src/math/**` (intrinsics, arch fma) |
| `smallvec` | new (B) | 80 | `src/lib.rs` |
| `rustc-hash` | new (B) | 0 | |
| `hashbrown` | already locked (B) | 454 | `src/raw.rs` 244 |
| `memchr` | already locked (B) | 333 | SIMD paths |
| `indexmap` | already locked (B) | 12 | |
| `serde_core` | already locked (B) | 2 | |
| `equivalent` | already locked (B) | 0 | |
| `saphyr-parser` | new (A) | 0 (`#![no_std]` + `alloc`) | |
| `arraydeque` | new (A) | 72 | `src/lib.rs`: `MaybeUninit` ring buffer, `get_unchecked`, `from_raw_parts`, and 2 lifetime-extending `transmute` in `IterMut` (lines 2314, 2334) |
| `thiserror`, `thiserror-impl`, `proc-macro2` (6), `unicode-ident` (2), `quote` (0), `syn` | already locked (A) | see crate | existing |

`noyalib`'s `forbid(unsafe_code)` covers only its own 55 k lines; the memory-safety surface it builds on is larger than A's (all of `hashbrown`, `memchr`, `smallvec`, `libm`), although two of those four are already in the workspace.

### 6.2 Dependency tree (`cargo tree -e normal -p <crate>`, minimal features)

- A: `saphyr-parser` -> `arraydeque`, `thiserror` -> `thiserror-impl` (proc-macro) -> `proc-macro2`, `quote`, `syn`, `unicode-ident`. **New to the workspace: 2 crates** (`saphyr-parser`, `arraydeque`).
- B: `noyalib` -> `equivalent`, `hashbrown`, `indexmap`, `libm`, `memchr`, `rustc-hash`, `serde_core`, `smallvec`. **New: 4 crates** (`noyalib`, `libm`, `rustc-hash`, `smallvec`). With the crate's default features (`fast-int`, `fast-float`, `strict-deserialise`) it also adds `itoa`, `ryu`, `serde_ignored`.
- C: `yaml-rt` -> `yaml-rt-core`. **New: 2 crates.** With its default feature `derive` it adds the proc-macro `yaml-rt-derive` and `syn`/`quote`/`proc-macro2`; the evaluation and the table use `default-features = false`.

### 6.3 `build.rs` and proc-macro presence

| Crate | `build.rs` | proc-macro | note |
|---|---|---|---|
| `yaml-rt`, `yaml-rt-core` | no | no (`yaml-rt-derive` is, behind default feature `derive`, off here) | |
| `noyalib` | **yes** | no | runs `$RUSTC --version`, reads `NOYALIB_COVERAGE`, no network or file access, no build dependencies (read in full, 60 lines, contract in its header) |
| `libm` | yes | no | `configure.rs`, reads `ENSURE_NO_PANIC`; no process, no file write beyond cargo directives (grep) |
| `saphyr-parser`, `arraydeque`, `rustc-hash`, `smallvec` | no | no | |
| `thiserror` (already locked) | yes | `thiserror-impl` is a proc-macro | existing |
| `serde_core` (already locked) | yes | no | existing |

### 6.4 Adversarial input without our pre-scan (`adv.py`, subprocess per case, 8 MiB main-thread stack, 6 GiB address limit)

| Case | yaml-rt | noyalib | saphyr-parser (events only; then our tree) |
|---|---|---|---|
| 200 000 unclosed or closed `[`, 200 000 `{a: ` | refused (syntax-error), no crash | refused, no crash | refused, no crash |
| `- ` x 100 000 nested block sequences | **stack overflow, SIGABRT** (inside `YamlDoc::parse`) | refused (recursion limit 128) | parsed, no crash |
| `- ` x 200 000 | **SIGABRT** | refused | the event parser parses; **the tree our scratch adapter built overflowed** (most likely the recursive drop of a 200 000-deep nested value; not isolated further) |
| 20 000 nested block indent levels | refused | refused | parsed in 1.55 s |
| 64 nested levels (profile maximum), flow, block and sequence | parsed | parsed | parsed |
| 8 MiB double-quoted scalar, 1 MiB comment | parsed | parsed | parsed |
| alias doubling chain, 20 levels | parsed (no expansion) | refused (alias budget) | parsed (no expansion) |

Read: `saphyr-parser`'s event parser has no recursion to overflow; the crash seen at 200 000 is in the tree our scratch adapter built (events alone were fine), which the pre-scan (depth 32 or 64) makes unreachable; the real tree is bounded by the same depth. `yaml-rt` overflows inside the parser. With the pre-scan (the crate's `prescan::check`, run by the `pre` probe) 200 000 brackets, 200 000 `- ` and 20 000 block levels are refused in under 200 microseconds (`depth-exceeded` at the profile bound, or `input-too-large`); every input the pre-scan lets through (depth at most 32/64) parsed in all three.

### 6.5 `cargo deny --config .github/cargo-deny.toml check advisories bans sources` (cargo-deny 0.20.2 installed with `cargo install --locked cargo-deny`, run on a scratch lock containing only the candidate, advisory database fetched 2026-10-22)

| Candidate | result |
|---|---|
| yaml-rt (+core) | `advisories ok, bans ok, sources ok` |
| noyalib (+deps) | `advisories ok, bans ok, sources ok` |
| saphyr-parser (+deps) | `advisories ok, bans ok, sources ok` |

Each run also printed the existing `advisory-not-detected` warning for the `RUSTSEC-2024-0449` ignore (no `serde_yaml` in these locks), as expected. `bans.multiple-versions` is `warn` and was not triggered.

### 6.6 Parse time and memory (release build, parse and tree build, `perf` with `/usr/bin/time -v`)

| Input | yaml-rt | noyalib | saphyr-parser |
|---|---|---|---|
| real config, 35 013 bytes, 1064 lines (mean of 2 000) | 0.50 ms (lossless parse + print only: 0.24 ms) | 1.08 ms (lossless: 1.01 ms) | 0.47 ms |
| 1 MiB document (1 040 007 bytes, 9 082 items, mean of 10) | 18.7 ms, max RSS 35.9 MB (lossless 9.6 ms, 17 MB) | 42.2 ms, 48.9 MB (lossless 38.9 ms, 43 MB) | 22.8 ms, 38.5 MB |

The numbers measure parse plus building the adapter tree, not our final tree; all are far below anything a config door will notice.

## 7. Maintainer and release churn (crates.io API, 2026-10-22)

| | yaml-rt | noyalib | saphyr-parser |
|---|---|---|---|
| first release / versions | 2026-07-24 / 12 | 2026-05-10 / 56 | 2024-04-02 / 18 |
| releases in the last 30 days | 3 | **11** | 5 (`0.1.0` 2026-09-19, breaking `0.2.0` 2026-10-12, `0.2.2` 2026-10-15) |
| owners | 1 | 1 | 2 (organisation repo) |
| downloads total / last 90 days | 4 028 / 4 021 | 952 295 / 815 517 (inflated by a `serde_yml` compatibility shim) | 7 888 868 / 5 708 366 |
| reverse dependencies | 1 | 57 | 70 (`saphyr-parser`), 112 (`saphyr`) |
| repository stars | 2 | 11 | 339 (`saphyr`, 52 forks) |

Secondary signal only (spec section 9). The noyalib author also wrote `serde_yml` (archived, RUSTSEC-2025-0068); `noyalib`'s own `Cargo.toml.orig` says so ("the maintainer's prior crate") and the source contains no `serde_yml` code, only a `serde_yaml` API-compatibility module and documentation. Pre-1.0 churn exists in A as well (a breaking minor 26 days after the first release of the line); the exact pin, vendored copy and fixtures are what contain it.

## 8. Source read (what was read, in lines, and what was not)

Crate sizes (non-test `src`): `yaml-rt-core` 23 903 lines, `noyalib` 55 045 (plus 100 119 lines of tests and benches shipped in the package), `saphyr-parser` 5 529, `arraydeque` 3 212, `yaml-rt` 34. Read by a person (me): `yaml-rt` facade in full (34); `yaml-rt-core` about 520 lines (`doc.rs` parse, mapping and scalar entries, `syntax.rs` node and kinds, `source.rs`, `semantic.rs`, `value.rs`, `diagnostic.rs`); `noyalib` about 700 lines (`build.rs` in full, `lib.rs` module gating, `cst/document.rs` span and parse entries, `policy.rs`, `cst/annotated.rs`, `cst/green.rs`, `cst/syntax.rs`, the `serde_yaml` compat header); `saphyr-parser` about 540 lines (`lib.rs` in full, `debug.rs` in full, `input/str.rs` first 200, `scanner.rs` `Marker`/`Span`/`ScanError`, `parser.rs` `Event`/`Tag`); `arraydeque` the unsafe call sites around lines 340 to 372 and 2300 to 2340.

Mechanical sweep over **every source line** of all five crates (not a substitute for reading): no `std::fs`, `std::net`, `std::process`, `include_bytes!`, `extern "C"`, `static mut`, `asm!` or `dlopen` outside feature-gated modules; `noyalib` has `std::fs`/`rustix` only in `include/fs.rs` and `figment.rs`, gated behind features (`include`, `include_fs`, `figment`) that are off; `saphyr-parser` is `#![no_std]` and reads `SAPHYR_DEBUG` only under its `debug_prints` feature; `yaml-rt-core` has no hit at all; no line over 300 characters outside one in `patch.rs` and one in a test; no string literal that looks like an encoded blob; `macro_rules!` counts 4, 3, 2, 2 and none generates `unsafe`. Published bytes equal the repository commit (section 2).

**Not done: a full line-by-line read of `noyalib` (55 k) and `yaml-rt-core` (24 k).** Neither is reviewable at the depth this record claims for A; this alone is a reason against B and C. For A the remaining unread parts are the logic of `scanner.rs` (2 728 lines) and `parser.rs` (1 359 lines), which contain no `unsafe`, no `std` and no I/O; a full read of those two files plus the 72 `arraydeque` sites is the follow-up the owner can ask for before the version is vendored.

### 8.1 Read before vendoring (owner condition of 2026-10-22 18:02)

Read by a person (me) on 2026-10-22 in the unpacked `.crate` files whose sha256 equals the checksums of section 2 (`saphyr-parser` `6c622058…d387`, `arraydeque` `7d902e3d…c236`).

| File | Lines | How read |
|---|---|---|
| `saphyr-parser` `src/scanner.rs` | 2 728 | in full, top to bottom |
| `saphyr-parser` `src/parser.rs` | 1 359 | in full, top to bottom |
| `saphyr-parser` `src/lib.rs`, `src/debug.rs` | 52, 40 | in full (section 8) |
| `saphyr-parser` `src/input.rs`, `src/input/str.rs`, `src/input/buffered.rs`, `src/char_traits.rs` | 493, 468, 126, 128 | `grep` of every `unsafe`, `unwrap`, `expect`, `assert`, `unreachable`, `static`, `std::`, `extern`, plus the functions the scanner calls on the string input (`skip`, `skip_n`, `raw_read_*`); not read line by line |
| `arraydeque` `src/lib.rs` | 3 089 (2 451 before the test module) | the 1 222 non-comment, non-blank lines before the test module, in full: every `unsafe` block, the `Drain`, `Iter`, `IterMut`, `IntoIter` code; doc comments and the test module (638 lines) skipped |
| `arraydeque` `src/behavior.rs`, `src/error.rs`, `src/range.rs` | 51, 29, 43 | in full |

Findings, none of which changes the choice:

- **`unsafe`**: `saphyr-parser` has none (`#![no_std]`, `alloc` only). `arraydeque` has the 72 sites of section 6.1, all in the `MaybeUninit` ring buffer (`get_unchecked`, `ptr::copy`, `ptr::read`, `from_raw_parts`) and two lifetime-extending `transmute` in `IterMut`. The only user is `saphyr-parser`'s `BufferedInput` (`input/buffered.rs`: `push_back`, `pop_front`, `drain`, `len`); this crate builds the parser on `StrInput` only, so no `arraydeque` code runs. It is still compiled and still vendored.
- **I/O, global state, build, macros**: no file, network or process access in either crate; no `build.rs`; no proc-macro in either (the `thiserror` derive is a crate already in the workspace lock). Global state exists only behind the off-by-default feature `debug_prints` (`src/debug.rs`: `SAPHYR_DEBUG`, a `OnceLock`).
- **Panics reachable from input** (all caught by the crate's panic guard, none read from a value): `parser.rs` 443 `expect`, 452 `pop_state` `unwrap`, 538 `assert_eq!` in `Parser::load_document`, `unreachable!` at 566, 651, 859, 868, 872, 882, 886, 901; `scanner.rs` 678 `assert!`, `unwrap` on the simple-key and indent stacks at 1554, 2490, 2495, 2625, 2665, 2677, and usize subtractions `sk.token_number - self.tokens_parsed` at 2513, 2522, 2609 (a debug-build panic if the bookkeeping ever drifts; wraps in a release build). The crate never calls `Parser::load` (the only user of the `assert_eq!`); it pulls events with `next_event()`.
- **Recursion**: scanner and event state machine are iterative (explicit `Vec<State>` and indent stacks, bounded by memory). Recursion exists only in `Parser::load`, `load_node`, `load_mapping`, `load_sequence` (`parser.rs` 544 to 608), which the crate does not call. The scanner caps flow nesting at 255 (`flow_level: u8`, `checked_add`, error "recursion limit exceeded", `scanner.rs` 1542 to 1549); block nesting has no cap besides memory, which the crate's pre-scan bounds (depth 32 and 64).
- **Hard-coded limit**: an implicit key may sit at most 1 024 characters from its `:` (`scanner.rs` 855). A longer key is a syntax error from the parser; the adapter reports it as `key-too-large` (the fixture `key-over-limit`).
- **Error text**: `ScanError` Display carries one character of the source in one message (`scanner.rs` 778 to 781, "unexpected character"). The crate takes only line and column from a parser error and writes its own fixed text.
- **Not unusual, noted**: a literal NUL ends the input early or is "found unprintable character" (`scanner.rs` 716 to 719); `Marker::index` is a character index although documented as bytes (section 3.1, already handled); `parser_process_directives` resets the tag map inside its loop (`parser.rs` 742), harmless here because every tag outside the core set is refused.

Nothing found that should change the choice.

## 9. Swap cost, public API leakage, vendoring layout

Scratch adapter size (non-blank lines): `yaml-rt` 55, `noyalib` 94 (driven through config and policies), `saphyr-parser` 98 plus 54 of derived span rules plus the shared walk. The shared tree type, profile walk, comment association and splicing are ours and do not change with the candidate. No parser type is in our public API in any option (the adapter returns our tree and spans); swapping is one adapter file plus the fixtures that must stay green.

Vendoring layouts (spec section 9; sizes are the exact `cargo vendor` output of the new crates only, including the tests and benches that ship in the packages):

| Option | Crates to commit | Size | Files |
|---|---|---|---|
| A | `saphyr-parser-0.2.2` 496 KiB (39 files), `arraydeque-0.5.1` 152 KiB (12) | **648 KiB** | 51 |
| B | `noyalib-0.0.58` 8 148 KiB (887), `libm-0.2.16` 1 092 KiB (156), `smallvec-1.16.3` 184 KiB (12), `rustc-hash-2.1.3` 96 KiB (14) | 9 520 KiB | 1 069 |
| C | `yaml-rt-0.3.3` 156 KiB (20), `yaml-rt-core-0.3.3` 908 KiB (24) | 1 064 KiB | 44 |

(a) committed copy under `packages/yaml-doc/third-party/<crate>-<version>/` with `[patch.crates-io]` path entries, `exclude` in the root workspace and a Rust integrity test comparing a digest of each tree with this record; (b) exact pin `=x.y.z` plus `Cargo.lock` checksum, `cargo vendor` used only for review. For A, (a) costs 648 KiB; the vendored copy can be reviewed whole.

## 10. Comparison table (summary)

| Check | `saphyr-parser` 0.2.2 (A) | `noyalib` 0.0.58 (B) | `yaml-rt` 0.3.3 (C) |
|---|---|---|---|
| Parser-dependent parse fixtures (82 rows) | 78 pass, 4 position only | 67 pass, 9 position, 6 fail | 81 pass, 1 position |
| Real repo YAML files (53) | all correct | all correct | **1 wrong meaning, 1 false refusal** |
| Byte-exact spans | after 5 derived rules: 9 224 / 9 224 | 7 266 / 7 285 where addressable; alias and keep-chomp wrong | 7 159 / 7 238; props, comments, blank lines included |
| Round trip no edit | by construction | 201 / 201 accepted identical | 210 / 210 accepted identical |
| Comment association | ours (derivable) | own API differs from fixture rule | ours |
| Stack safety (no pre-scan) | parser safe at 200 000 | refuses at 128 | **overflow at 100 000** |
| New crates / own `unsafe` / `build.rs` | 2 / 0 (+72 in `arraydeque`) / none | 4 / 0 (+136 in `libm`, `smallvec`) / `noyalib`, `libm` | 2 / 1 / none |
| Source size to review | 8.7 k lines | 55 k + deps | 24 k |
| Vendored size | 648 KiB | 9 520 KiB | 1 064 KiB |
| Parse time, real config | 0.47 ms | 1.08 ms | 0.50 ms |
| `cargo deny` | ok | ok | ok |
| Releases in last 30 days | 5 | 11 | 3 |
| Own span rules needed | 5 (+1 for tag position) | 0 for scalars, but needs token rescan for the facts in 5.1 | trims for props, comments, blank lines |

## 11. Decision question (core/skills/_shared/decision-question.md)

**What is happening.** Slice A needs one YAML parser crate under `fgos-yaml-doc`. Three candidates were measured on the same golden fixtures and on 53 real YAML files of this repo. Nothing downstream (parse, edits, merge, fuzz, migration of the three `serde_yaml` users) starts until the owner chooses.

**Cause (what was checked).** Fixture results, real-file meaning, byte-exact spans against an independent oracle, `unsafe` sites, dependency tree, `build.rs` and proc-macros, `cargo deny`, stack behaviour on adversarial input, source read, cost. Findings per option: A parses every real file correctly and gets exact spans after five small derived rules; B parses correctly but hides complex keys, non-string keys and several positions, is 55 k lines and releases 11 times a month; C silently mis-parses one real file, falsely refuses another and overflows the stack in the parser at 100 000 nested sequences.

**Options.**
- **A. `saphyr-parser` 0.2.2 (span only) + our splicing.** Gain: widest adoption (5.7 M downloads in 90 days, 70 dependents), smallest review surface (8.7 k lines, `#![no_std]` parser), correct on all real files, 648 KiB to vendor. Harm: its span numbers are characters and over-extended, so we own about 60 lines of derived rules and all comment reading and splicing; breaking `0.2.0` landed 2026-10-12 so churn is real. Cost: adapter about 100 lines plus about 60 lines of span rules.
- **B. `noyalib` 0.0.58.** Gain: `forbid(unsafe_code)` in its own code, lossless round trip, built-in budgets. Harm: hides facts the strict profile needs (complex keys, non-string keys, tag and anchor positions, `-0`), comment API disagrees with our rule, 55 k lines (not reviewable), 11 releases in 30 days, shares an author with archived `serde_yml`, 9.5 MiB to vendor. Cost: adapter about 100 lines plus a token rescan for the missing facts.
- **C. `yaml-rt` 0.3.3.** Gain: smallest and fastest, lossless. Harm: wrong meaning on a real repo file without any error, false refusal on another, stack overflow inside the parser, created 2026-07 with 4 k downloads. Cost: adapter about 60 lines; the defects are not ours to fix.
- (D. none: stay on `serde_yaml` is not an option; spec section 8 and RUSTSEC-2024-0449 forbid it.)

**Recommendation.** **A.** Reason: it is the only candidate with no correctness defect found, the span gap is measured and closed by rules that agree with an oracle on every node, and its small size lets us read all of it (the unread `scanner.rs` and `parser.rs` can be read before vendoring). B is the fallback if A's derived rules prove unstable across a version bump. Vendoring layout: **(a)**, because spec section 9 asks that the bytes read are the bytes built; it is 648 KiB for A.

**Scope of the answer.** A yes on option X authorizes: adding that crate and the listed new transitive crates (for A: `saphyr-parser` 0.2.2 and `arraydeque` 0.5.1) at the exact recorded versions, committing a vendored copy and its integrity test, building the parse, edit, merge and migration phases on it, and running the fuzz targets. It does not authorize: any other crate, a version bump, dropping the golden fixtures as the arbiter, or skipping the fuzz run. Sign-off is given before the first fuzz run; a fuzz finding in the parser reopens this gate. New fixtures worth adding for any choice: the two real-file shapes of section 4.3 and a non-ASCII line before a quoted scalar with a trailing comment.

## 12. Sign-off and later fields

- Owner sign-off: option A (`saphyr-parser` 0.2.2 with `arraydeque` 0.5.1, vendored under `packages/yaml-doc/third-party/`), owner 2026-10-22 18:02 ("ok chọn A"); condition: the remaining source of `saphyr-parser` (`scanner.rs`, `parser.rs`) and `arraydeque` is read before the dependency is added, and anything unusual reopens this gate; a fuzz finding in the parser also reopens it.
- Integrity hash: filled when the chosen crate is vendored
- Fuzz result: filled when the fuzz targets have run

## 13. Reproduction

Scratch project: `.fgos/runtime/tmp/yaml-eval/` (own `[workspace]`, `.cargo/config.toml` sets the output directory to `out/`). Bins: `eval` (4.1), `rt` (4.2), `parity` (4.3), `gate` (3.3), `cmt` (3.3), `cprobe` (5.2), `msgs` (5.3), `adv` with `adv.py` (6.4), `pre` (6.4), `perf` (6.6); `unsafe_scan.py` (6.1); `gen_config.py` turns `.fgos/config.json` into the YAML used as the real-config input; `deny-<candidate>/` hold the scratch locks for 6.5 and the `cargo vendor` runs for 9. Versions are pinned in `Cargo.toml` with `=`. Commands: `cargo build --jobs 4 --release --bins`, then run each binary from the scratch directory.
