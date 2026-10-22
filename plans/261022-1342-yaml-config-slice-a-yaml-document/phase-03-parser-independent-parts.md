# Phase 03: Parser-independent parts: path text form, comment guard, pre-scan, merge

Depends on phase 02. Needs no parser, so it proceeds while phase 04 waits for the owner. Suggested executor: sonnet.

## Context

Four spec behaviours operate on text or on `Value` only: path text form (section 3), comment injection guard (section 6), the pre-scan that bounds size and depth before any parser recursion (section 8), merge (section 7). Building them before the parser choice means the owner gate blocks less.

## Files it may touch

`src/path.rs`, `src/comment.rs`, `src/prescan.rs`, `src/merge.rs`, `tests/golden_path.rs`, `tests/golden_comment.rs`, `tests/golden_prescan.rs`, `tests/golden_merge.rs`. Fixture files are read only; a wrong expectation is fixed in phase 02's file in a separate commit that says why.

## Behaviour and design

**Path text form** (`path.rs`): `parse_path(&str) -> Result<Vec<Segment>, Refusal>` and `format_path(&[Segment]) -> String`. Keys joined by `.`; a key containing `.`, `[`, `]` or a quote is written `["a.b"]`; `\` escapes the next character; numeric `[0]` is an index. `code:implement` needs no escape. Round trip `format(parse(x))` for canonical forms.

**Comment guard** (`comment.rs`): `sanitize(text) -> Vec<String>`: split on LF, CRLF, CR, U+0085, U+2028, U+2029; remove control characters except tab; each line becomes `# ` plus text, empty line `#` (D5). `sanitize_inline(text) -> Result<String, Refusal>`: any line break gives `inline-comment-multiline`. Pure functions; the caller (phase 06) splices the result.

**Pre-scan** (`prescan.rs`): `check(bytes, profile, file) -> Result<(), Refusal>` in D4 order: byte bound (`input-too-large`), UTF-8 validity (`invalid-utf8`; a leading BOM is allowed, D2), then a single linear pass counting (a) flow nesting: `[` and `{` only where a flow collection can start (start of a value or item, after `,`, `[`, `{`, or `: `/`- `), ignoring quoted scalars, comments and block-scalar bodies; (b) block indentation depth by an indent stack, skipping block-scalar bodies. Refuses with `depth-exceeded` and the line and column of the offending token. This is a bound, not a parser: over-counting is a false refusal, under-counting is a stack overflow, so the exact tree depth is re-checked in phase 05 and this pass is deliberately conservative toward counting. No allocation proportional to depth (a counter plus an indent stack capped at the bound).

**Merge** (`merge.rs`): `merge(layers: &[&Value], rules: &dyn RuleSource) -> Result<Merged, Refusal>` with `Merged { value, origins: Vec<(Vec<Segment>, usize)> }` (index into `layers`, highest priority first), `RuleSource::rule(&self, path: &[Segment]) -> Option<MergeRule>` (`Deep | Replace | Leaf`). No rule: maps `Deep`, sequences `Leaf`. Absent falls through; present `null` wins (D6); a type mismatch at a `Deep` path returns `merge-type-mismatch` naming both layer indexes and the path. `Replace`: highest layer holding the path wins whole, all leaves under it share its origin. Complexity linear in total nodes; recursion depth bounded by the profile depth (inputs already bounded) with an explicit guard for callers passing `Value`s of their own.

## Owning proofs

| Behaviour | Owner |
|---|---|
| Path text round trip, escapes, odd keys | `tests/golden_path.rs` over `path.v1.json` |
| Comment line splitting, control removal, empty line, inline refusal | `tests/golden_comment.rs` over `comment.v1.json` |
| Size, UTF-8, flow depth 200 000, block depth, quote/comment/block-scalar skipping, limit and limit plus one | `tests/golden_prescan.rs` over `prescan.v1.json` |
| Merge rules, absent vs null, mismatch naming, origins | `tests/golden_merge.rs` over `merge.v1.json` |

Each runner loads only its own file and asserts the case list is non-empty and complete against the fixture ids it is documented to cover. No parser involved, so none of these reappear in phase 05.

## Steps

1. Write each module with its runner, red-green per fixture group.
2. Add false-refusal cases found while writing the scanner (regex-like plain scalars `a[[[[`, `# [[[`, `key: "[[[["`, block scalar with brackets) to `prescan.v1.json` as new cases; they pass or the scanner is fixed.
3. Differential scratch check (not committed): run `prescan::check` with the `tool` profile over every `*.yaml`/`*.yml` in the repo (`rg --files -g '*.y*ml'`, excluding `target`, `node_modules`); expected result: no refusal except files already known too large. Any other refusal is a scanner bug.

## Validation

`cargo test -p fgos-yaml-doc --jobs 4` (narrow, per runner first: `--test golden_prescan`), `cargo clippy -p fgos-yaml-doc --all-targets --jobs 4 -- -D warnings`, `cargo fmt --all -- --check`.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Scanner disagrees with the parser about what opens a flow collection | M x M | conservative counting, false-refusal cases, repo-wide differential in step 3, exact depth re-check in 05 |
| Merge null semantics (D6) differ from what Config needs | L x M | pinned by fixtures; the Config slice may amend fixtures with a decision entry |
| Pathological `Value` passed to `merge` overflows the stack | L x H | explicit depth guard returning a refusal; covered by a fixture |

## Rollback

Revert the commits; modules return to empty stubs from phase 02.
