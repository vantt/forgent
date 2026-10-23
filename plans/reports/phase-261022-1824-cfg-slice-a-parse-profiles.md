# Phase report: parse, both profiles, limits, alias expansion (saphyr-parser, option A)

Branch `cfg/slice-a-crate`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-a-crate`. Plan: `plans/261022-1342-yaml-config-slice-a-yaml-document/phase-05-parse-profiles-limits.md` with the coordinator note. Owner decision 2026-10-22 18:02: option A.

## Result

- **Condition met first.** Read `scanner.rs` (2 728) and `parser.rs` (1 359) in full and the non-comment code of `arraydeque` (1 222 lines before its test module) plus its three small files; grep sweep over the string-input files. Nothing unusual enough to change the choice: no `unsafe`, I/O, `build.rs` or proc-macro in `saphyr-parser`; `arraydeque`'s 72 `unsafe` sites only serve `BufferedInput`, which is never built; panic sites listed with line numbers; recursion only in `Parser::load*`, which is not called. Written to `upgrade-record.md` section 8.1 and committed before the dependency was added (`ef0b28949`).
- `cargo test -p fgos-yaml-doc --jobs 4`: green (guard 2, fixture shape 7, comment 1, merge 1, **parse 2**, path 1, prescan 1, **third-party integrity 1**). `cargo clippy -p fgos-yaml-doc --all-targets --jobs 4 -- -D warnings` and `cargo fmt -p fgos-yaml-doc -- --check` clean. `cargo test --workspace`, `npm test` not run, as instructed.
- Acceptance: integrity test proves the vendored bytes (39 + 12 files) match the recorded tree digests; a one-byte change makes it fail (checked, then restored). Golden parse runner green over all 136 parse fixtures. No existing fixture was amended.
- Impact analysis: inactive (0 providers registered); new symbols only, no existing symbol edited.

## Commits

1. `ef0b28949` docs: source read log.
2. `51e339d0a` build: vendored crates, `[patch.crates-io]`, `exclude`, pinned dependency, integrity test, record (integrity lines, wiring, deviations).
3. `56f7ce019` feat: adapter, profile walk, expansion, document, guard, parse runner, fixtures, comment guard widening, spec lines.
4. Merge of local `main` (one board-doc commit). `origin/main` was not fetched.

## What was built (all in `packages/yaml-doc/rust/src`)

- `backend.rs`: only file naming the parser. `next_event()` into an arena (no recursion); spans derived (char index to byte table, quote rescan, block scalar header read back over blank lines, flow close bracket, empty scalars, tag and anchor start by backward scan); defect fix and key-reach mapping (below).
- `profile.rs`: rule table loaded once from `profiles.v1.json` (no per-profile branch), core-schema scalar resolution (checked against the old door on about 40 edge forms), the walk in document order, alias token count before expansion.
- `expand.rs`: iterative expansion with own stack; counts values (D1) and scalar bytes; self-referencing anchors end at the node bound.
- `document.rs`: `parse(bytes, profile, file)`, `Document { source, value, revision, span_of(path), to_json() }`, line index (BOM not a column; CRLF and lone CR are breaks).
- `guard.rs`: `catch_unwind` to `yaml-internal-error`; `parse` runs inside it. Two unit tests (a panic message does not appear in the refusal).
- `comment.rs`: one `Hidden` classifier shared by the comment guard and the profile rows; U+200E, U+200F, U+061C (bidi-control), U+2060 (zero-width) added with fixtures; spec sections 4 and 6 and the decision history carry the lines; `refusal-rules.v1.json` meanings updated.
- Tests: `tests/golden_parse.rs` (collects every failing case, then asserts), `tests/third_party_integrity.rs`.

## Findings worth the owner's eye

1. **Parser defect, corrected in the adapter.** `saphyr-parser` reads a block scalar with a header and no content at the end of the input (`k: |` then EOF, `|+` with one break, a whitespace-only line) as `"\n"`. YAML and the old door say empty. A 120-case matrix (6 headers x 10 tails x mid-document or end) now agrees with the old door on all 120. Pinned by fixtures; a parser upgrade that fixes it makes the correction a no-op.
2. **Implicit key reach.** The parser refuses a key more than 1 024 characters from its `:` as a syntax error; the fixture wants `key-too-large`. The adapter reports `key-too-large` when the error sits on a `:` right after a scalar longer than the key bound. Keys of 513 two-byte characters pass the parser and are refused by the byte bound (fixture).
3. **Scratch rule 3 bug.** The evaluation code took the line directly before the content as the block scalar header; with blank lines in between that is wrong. Fixed (fixtures `spans-literal-block-scalar`, `spans-empty-block-scalar`).
4. **Differential against the old door (scratch, not committed).** 56 tracked YAML files: 55 identical, 1 refused by both at the same position (2:31). 215 fixture inputs: 165 identical, 35 refused by both, 15 different on purpose (hidden chars in keys, key and depth bounds, invalid UTF-8, `-0`).
5. **Mutation run (scratch).** About 78 000 parses of mutated inputs in a debug build, no panic reached the guard. Not the fuzz run.
6. Tool profile reads an integer past 2^53-1 as a float (`9007199254740993` becomes `9007199254740992.0`), as the phase text and the `numbers-edge-tool` fixture say; the phase 02 report had assumed an exact `Int`. The runner compares such a float with the fixture's JSON integer.
7. Expansion depth is not bounded by the depth bound (the fixtures `alias-self-*` want `node-limit`, and the old door had no expansion depth). The node budget bounds it (an acyclic alias chain of depth D needs about D^2/128 nodes, so D stays under about 3 600). Expansion builds iteratively; fixture `alias-chain-past-depth-bound` proves depth 100 passes.

## Deviations from the ownership list (necessary consequences)

- `src/lib.rs`: `backend`, `expand`, `profile` made private modules (parser types must not leak); `parse`, `Document`, `NodeSpans` re-exported. Phase 07 owns the final seal.
- `tests/fixture_shape.rs`: two new parse expectation forms (`spans`, `revision`) accepted and checked.
- `src/comment.rs` and `contracts/refusal-rules.v1.json`, spec lines, fixtures README: the coordinator note.
- `Cargo.lock`: the two new packages and the dependency edge only (`thiserror` untouched).

## Notes for later phases

- Spans: a block scalar span ends at its last content byte (trailing blank lines of a `|+` scalar are outside); an empty value is an empty span right after its key's colon; a path does not continue through an alias; block collections span from first child start to last child end; implicit single-pair mappings in a flow sequence have no brackets and span their children.
- `strict-config` `alias-refused` and the tree-level depth check are defence only: an alias needs an earlier anchor, which is refused first, and the pre-scan bounds depth before the tree exists.
- A panic caught by the guard still goes through the process-wide panic hook (stderr). None of the panic sites in the parser formats input text; the hook is for phase 07 or the addon to decide on.
- `apps/fgos-gateway` has its own lock and workspace: it needs the same `[patch.crates-io]` lines when it moves to the crate (phase 08).
- The vendored `arraydeque` emits three lifetime-syntax warnings on rustc 1.97; they stay in third-party source and are not promoted.
- `cargo clippy --workspace` was not run (resource rule). The `exclude` is shown by `cargo metadata --no-deps`: 24 workspace members, neither vendored crate among them.
- Plan phase file status was not edited (use `ak plan`); the program board row was not touched.

## Unresolved questions

- Whether the owner wants the parser's `"\n"` defect reported upstream (not done).
- Whether `to_json` should refuse or convert non-finite floats for the consumers of phase 08 (it refuses with `non-finite-number`; no consumer hits it).
