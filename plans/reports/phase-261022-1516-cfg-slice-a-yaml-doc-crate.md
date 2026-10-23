# Report: crate fgos-yaml-doc, fixtures and parser-independent parts

Branch `cfg/slice-a-crate`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-a-crate`. Covers facts (only what was needed), crate skeleton with contracts and golden fixtures, and the parser-independent parts including idea I2. No parser dependency; the parser choice stays with the owner gate.

## Result

- `cargo test -p fgos-yaml-doc --jobs 4`: 7 fixture-shape tests and 4 golden runners (path, comment, prescan, merge) green. `cargo clippy -p fgos-yaml-doc --all-targets --jobs 4 -- -D warnings` and `cargo fmt -p fgos-yaml-doc -- --check` clean. `cargo test --workspace` not run, as instructed.
- Facts: `free -g` showed 16-19 GB available before the first build. Impact analysis: 0 providers registered, so inactive; new symbols need none, no existing symbol was edited. Not done: merging `origin/main` into the branch (no fetch; the branch only adds files, so no collision is possible beyond root `Cargo.toml` and `Cargo.lock`).
- Scratch differential: `prescan::check` over all 53 tracked `*.yaml`/`*.yml` files under both profiles gave no refusal. The throwaway example was deleted.
- Fixtures: 280 cases (parse 84, prescan 50, edit 47, path 37, comment 33, merge 29), well over the planned 130; they are data, one owning runner per file. Old-test expectations were produced by running today's `parseYaml` over each case flagged `old` (all agreed); edit outputs were cross-checked for semantic meaning against the js door (byte placement checked by eye only).
- I2: comment guard refuses bidi controls and zero-width characters (incl. U+FEFF) in comment text; 6 block, 2 inline fixtures. Spec section 6 gained one bullet, "Lịch sử quyết định" one dated line.

## Files

- `Cargo.toml` (member line), `Cargo.lock` (new package entry only; a necessary consequence, not in the plan's ownership list).
- `packages/yaml-doc/rust/`: `Cargo.toml`, `src/{lib,model,path,comment,prescan,merge}.rs`, empty stubs `{backend,document,profile,expand,guard,edit}.rs`, `tests/{common/mod,fixture_shape,golden_path,golden_comment,golden_prescan,golden_merge}.rs`. `tests/common/mod.rs` is not in the plan's list; it is the one shared fixture loader.
- `packages/yaml-doc/contracts/`: `limits`, `profiles`, `refusal-rules` (all `.v1.json`), `fixtures/{parse,prescan,path,comment,edit,merge,yaml-test-mapping}.v1.json`, `fixtures/README.md`.
- `docs/platform/yaml-document/spec.md`: I2 lines only.

## Ambiguities and how they were resolved

1. **I2 refuse vs strip**: refuse. Values already refuse these characters (spec section 4); stripping would write different words than the caller supplied and hide the attempt. Consequence: `sanitize` returns `Result`. Not covered, by the spec's own list: U+200E/F, U+061C (bidi marks), U+2060; a follow-up if wanted.
2. **`lines` input form**: plan says "joined with LF"; chose each line followed by LF (YAML files end with a newline); `text` gives exact bytes.
3. **Rule id list**: plan's list plus `invalid-path` (path text that breaks the grammar had no id). 31 ids, closed list shared by `refusal-rules.v1.json` and `rule::ALL`, equality tested.
4. **`-0` under strict-config** uses `number-out-of-range`; under `tool` it is `Float(-0.0)` (sign kept). Integers past 2^53 under `tool` keep an exact `Int` in the Rust value (the Node facade converts to doubles later). Fixture field is `profiles` (array), not `profile`.
5. **Depth meaning**: nesting of collections, block and flow together, root collection = depth 1; at the bound passes, one more refused. Written in `limits.v1.json` notes. A key's mapping counts as a level, so `k: [[...` allows 31 brackets.
6. **Node counting (D1)** pinned in `limits.v1.json`: values, not keys; 100 000 exactly passes, 100 001 refused.
7. **Merge**: spec gives `replace` and `leaf` the same effect here (highest layer holding the path wins whole, lower layers unexamined); implemented identically, the rule name is kept for Config. Origins list every leaf of the result (scalars, nulls, empty collections, sequence items as `[n]`), also for `leaf` and `replace` paths. Kinds for mismatch are mapping, sequence, scalar; a string over an integer is not a mismatch (schema work belongs to Config). `merge(&[])` returns null with no origins. Depth guard 64 (deepest profile bound) refuses with `depth-exceeded`.
8. **Refusal shape**: `Refusal {rule, file, path, line: Option, column: Option, detail: Option<String>}`; `detail` carries fixed wording only (limits, layer numbers). Guard-level refusals (comment, path) leave `file` empty for the caller to fill with `with_file`.
9. **Pre-scan** is deliberately a counter, not a parser: it treats a `- ` or `? ` or `key:` line as an entry, so a plain multi-line scalar continuation containing `: ` at a deeper indent over-counts one level (a false refusal only near the bound). Lone CR counts as a line break; U+0085/U+2028/U+2029 do not (YAML 1.2).
10. **Edit fixtures pin choices phase 06 may amend**: a replaced scalar keeps its own quoting; a new inline comment sits after two spaces, a replaced one keeps its spacing; `setCommentBlock` replaces only the block directly above (a blank line separates); an inline comment on a block-scalar header is `inline-comment-unplaceable`.
11. **Fixture-shape test reads `test/util/yaml.test.mjs`** to prove every Node case is mapped. That coupling ends with the Node test; the file says so and the later change that deletes the Node test must retire that one test.
12. The phase text puts `fixture_shape.rs` before the runners; the three phases landed in one crate commit because the shape test uses the path parser.

## Unresolved

- Parse and edit fixtures have no Rust runner yet (parser adapter and edits need the owner's parser choice); their expectations are checked against the js door only where an old test or semantic equivalence applies. Positions of new refusals (for example `tag-binary` at 1:4) are my pins, reversible by editing a fixture.
