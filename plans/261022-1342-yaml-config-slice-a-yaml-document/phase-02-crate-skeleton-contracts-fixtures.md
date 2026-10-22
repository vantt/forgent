# Phase 02: Crate skeleton, value and span model, contract files, golden fixture files

Depends on phase 00. May be built beside phase 01; lands after it. Suggested executor: sonnet.

## Context

Spec section 9: the contract is the port and the golden fixtures, not the parser. This phase writes the fixtures first (data, no parser), so phase 04 can judge candidates against them and phase 05 onward has a target. Crate layout follows `packages/canonical-json` (`rust/Cargo.toml`, `contracts/`, `include_str!`).

## Files it may touch

- `Cargo.toml` (workspace members: add `packages/yaml-doc/rust`).
- `packages/yaml-doc/rust/Cargo.toml` (`fgos-yaml-doc`; `version.workspace`, `edition.workspace`; deps `serde_json.workspace`, `sha2.workspace` only).
- `packages/yaml-doc/rust/src/lib.rs`: `#![forbid(unsafe_code)]`, module declarations for every later module, each as an empty stub file that later phases own (`path.rs`, `comment.rs`, `prescan.rs`, `merge.rs`, `backend.rs`, `document.rs`, `profile.rs`, `expand.rs`, `guard.rs`, `edit.rs`).
- `packages/yaml-doc/rust/src/model.rs`: `Value` (Null, Bool, Int(i64), Float(f64), Str, Seq, Map as ordered `Vec<(String, Value)>`), `Segment` (Key(String) | Index(usize)), `Span {start, end, line, column}`, `Profile {StrictConfig, Tool}`, `Refusal {rule, file, path, line, column}` with Display that never prints a value or source snippet.
- `packages/yaml-doc/contracts/**` and `packages/yaml-doc/rust/tests/fixture_shape.rs`.

## Contract files (`packages/yaml-doc/contracts/`)

| File | Content |
|---|---|
| `limits.v1.json` | the bounds table of spec section 8 for both profiles (input bytes 1 MiB / 8 MiB, depth 32 / 64, nodes 100 000, scalar bytes 64 KiB / 1 MiB, expanded bytes n/a / 16 MiB, key bytes 1 KiB, aliases 100); node counting rule D1 written in a `notes` field. Loaded by `include_str!`; the crate has no second copy. |
| `profiles.v1.json` | the rule table of spec section 4, one row per rule per profile (`refuse`, `allow`, `stringify`, `string`, `null`), rule ids from `refusal-rules.v1.json` |
| `refusal-rules.v1.json` | closed list of rule ids (decision D3): `duplicate-key`, `tag-refused`, `unknown-tag`, `anchor-refused`, `alias-refused`, `alias-limit`, `merge-key-refused`, `multiple-documents`, `complex-key`, `non-string-key`, `prototype-key`, `bidi-control`, `zero-width`, `number-out-of-range`, `non-finite-number`, `input-too-large`, `invalid-utf8`, `depth-exceeded`, `node-limit`, `scalar-too-large`, `key-too-large`, `expanded-too-large`, `syntax-error`, `comment-would-be-lost`, `inline-comment-multiline`, `edit-changed-meaning`, `path-not-found`, `inline-comment-unplaceable`, `merge-type-mismatch`, `yaml-internal-error` |
| `fixtures/parse.v1.json`, `fixtures/prescan.v1.json`, `fixtures/path.v1.json`, `fixtures/comment.v1.json`, `fixtures/edit.v1.json`, `fixtures/merge.v1.json` | cases. Each: `id`, `why` (one line, names the spec section or old test), `profile` (where it applies), `input` as `{"lines": [...]}` (joined with LF) or `{"text": "..."}` (exact bytes) or `{"generate": {"unit": "[", "count": 200000}}` / `{"generate": {"template": "  - id: {i}\n    tags: [a, b]", "count": 10000, "prefix": "items:\n"}}`, and `expect`: `{"value": <JSON>}` | `{"refusal": {"rule": "...", "line": n, "column": n}}` | (edit) `{"output": ...}` | (merge) `{"value": ..., "origins": ...}` |
| `fixtures/README.md` | one page: case shape, how generators work, how to add a case, which test owns which file |

Each fixture file belongs to exactly one runner test (principle 8): `parse` to phase 05, `prescan` and `path`, `comment`, `merge` to phase 03, `edit` to phase 06. A case that two runners could run is a defect.

## Old-test mapping (every case of `test/util/yaml.test.mjs` becomes a fixture)

| Old test (line) | Fixture ids (profile `tool` unless noted) |
|---|---|
| mappings, sequences, scalars (12) | `plain-values`, `plain-scalar-root`, `integer-root` |
| malformed input names file, line, column (24) | `syntax-error-position` (D7) |
| empty, whitespace, comment-only, `---`, `--- # note`, `~` (38) | `null-empty`, `null-whitespace`, `null-comment-only`, `null-two-comments`, `null-bare-marker`, `null-marker-comment`, `null-tilde`; each also under `strict-config` |
| more than one document (44) | `multi-doc-2`, `multi-doc-3` (both profiles) |
| duplicate key (49) | `dup-key-plain`; plus new `dup-key-quoted-vs-plain`, `dup-key-escaped` (resolved-value identity, spec section 3) |
| core schema yes/no/on/off, dates, `<<` (53) | `core-yes-no-on-off`, `core-dates-strings`, `merge-key-ordinary` (tool); `merge-key-refused` (strict) |
| unknown tag incl. `!!binary` (72) | `tag-binary`, `tag-custom` (tool); `tag-core-str-refused` (strict) |
| alias bomb, flat and nested (77) | `alias-flat-over-100`, `alias-nested-16x10` |
| aliases within the limit resolve (90) | `alias-within-limit` |
| self-referencing map and sequence (95) | `alias-self-map`, `alias-self-seq` |
| nested aliases under the alias limit past the value budget (100) | `alias-nested-value-budget` (also a time bound: result within 2 s is asserted by the runner for generated cases only) |
| large flat document under the budget (110) | `flat-10000-items`, plus new `flat-over-budget` |
| `__proto__`, nested, `constructor.prototype` (116) | `proto-keys-tool` (value keeps the keys), `proto-keys-strict` (refused) |
| indented mappings, whitespace-only block scalars, anchored keys (131) | `indent-nested`, `blockscalar-blank-literal`, `blockscalar-blank-folded`, `blockscalar-blank-nested`, `anchored-keys` |
| vendored hash (141) | not a fixture; retired with js-yaml in Slice C (it tests a file that disappears) |

New cases required by spec sections 3-8 (each names its section in `why`): complex keys; non-string keys (`1`, `true`, `null`) stringified (tool) and refused (strict); `.nan`, `.inf`, `-0`, integer beyond 2^53 (strict refused, tool converted); bidi and zero-width in keys and values; BOM at byte 0 (D2); every bound at limit and limit plus one for both profiles; 200 000 nested flow brackets and deep block indentation (prescan, "named refusal, no stack overflow"); byte-fidelity round trips (comments, blank lines, quoting styles, block scalars, inline comments, CRLF, tabs in values, a `"code:implement"` key, a 937-line synthesized config like the spike's); edit cases for every operation incl. refusal and the unchanged document; comment guard cases (LF, CR, CRLF, U+0085, U+2028, U+2029, control characters, tab kept, empty line D5, multi-line inline refused); merge cases (absent vs null, deep, replace, leaf, mismatch with both layers named, D6); path text form cases (`["a.b"]`, escape, `code:implement`).

## Steps

1. Create crate and workspace member; `cargo build -p fgos-yaml-doc --jobs 4`.
2. Write `model.rs` and the stubs; `Refusal` Display tested only in phase 07 (values never printed).
3. Write the contract files and fixtures. Expected values for old-test cases are produced once by running today's js door (`parseYaml`) in a scratch script and pasted; the script is not kept. Expected values for new cases are written by hand from the spec.
4. `fixture_shape.rs`: loads every contract and fixture file and asserts (a) JSON well-formed, (b) every `rule` named exists in `refusal-rules.v1.json`, (c) ids unique across files, (d) every id in the old-test mapping above exists, (e) every spec section 4 row has a `profiles.v1.json` entry, (f) generators resolve under the limits they are meant to exceed. This is the owning proof of fixture integrity only; no behaviour of the parser.

## Validation

`cargo test -p fgos-yaml-doc --jobs 4`, `cargo clippy -p fgos-yaml-doc --all-targets --jobs 4 -- -D warnings`, `cargo fmt --all -- --check`.

## Risk

| Risk | Mitigation |
|---|---|
| A fixture encodes js-yaml quirk, not the contract | each old-test case keeps its `why`; where js-yaml and the spec disagree, spec wins and the case says so |
| 200 000-bracket fixture bloats the repo | generator form, not literal text |
| Rule ids churn later | closed list in one file; fixture-shape test fails on an unknown id |

## Rollback

Delete `packages/yaml-doc` and the workspace member line.
