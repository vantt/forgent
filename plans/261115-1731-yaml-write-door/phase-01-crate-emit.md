# Phase 01: the crate emits a whole document (Rust leaf)

Start after: plan approval. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: [phase-00-facts.md](phase-00-facts.md) F2, F6.
Worktree `ywd-p01`, target `ywd-p01-target`, report slug `ywd-p01-crate-emit`. Effort: 3h.

## Context

The crate already writes YAML through shape A (`Document::set`, re-parse check in `commit`). Its documented contract "an
empty path replaces the whole document" fails on a document that holds no node (F2 gap): only the first entry of a
mapping is appended and the commit refuses; a sequence or scalar returns `not_found`. Emitting a new document is exactly
that case. This phase makes the existing operation meet its contract and names the composition `emit`, so every writer
gets one deterministic rendering with the re-parse check (no second printer, no shape B; spec section 15, 2026-10-22).

## Requirements

1. `Document::set(&[], value, ack)` on a document with no root node writes the whole value in ONE splice rendered with the
   empty document's preferences (`render_for(&[], None)`): a mapping as `map_lines` at indent 0, a sequence as
   `seq_lines` at indent 0, a scalar as `scalar(value, false)`, an empty mapping as `{}` and an empty sequence as `[]`
   (the inline forms `rendered` already uses, `edit.rs:921-922`); every line ends with the document's eol; the commit's
   re-parse check stays the only acceptance. Paths that are not empty keep today's behaviour byte for byte.
2. `pub fn emit(value: &Value, profile: Profile, file: &str) -> Result<Vec<u8>, Refusal>` in `edit.rs` (public operations
   section), re-exported from `lib.rs`: `parse(b"", profile, file)`, `set(&[], value.clone(), CommentLoss::Refuse)`,
   `to_bytes()`, all inside `guard` like the other public entries. Doc comment: the output parses back, under `profile`,
   to `value`, or the call refuses; rendering depends only on the value (no sibling or file preference).
3. No new refusal rule: an input past a limit or holding a refused character is refused by the existing `check_value`
   (`edit.rs:438`) with its existing rule ids.

## Files

- Modify: `packages/yaml-doc/rust/src/edit.rs` (root branch of `set_inner`, `:86-117`; `emit`), `packages/yaml-doc/rust/src/lib.rs`
  (re-export `emit`), `packages/yaml-doc/rust/tests/fixture_shape.rs` (`FIXTURE_FILES` gains `"emit"`),
  `packages/yaml-doc/rust/tests/api_seal.rs` (the existing "a panic never leaves a public entry" / bounded-time / no-value
  seal cases also drive `emit`, seeded from the emit fixture values), `packages/yaml-doc/contracts/fixtures/README.md` (one
  paragraph: the emit family and its runner).
- Create: `packages/yaml-doc/contracts/fixtures/emit.v1.json`, `packages/yaml-doc/rust/tests/golden_emit.rs` (owning proof of
  emit: "emitted text matches the golden bytes and parses back to the value under each listed profile").
- Delete: none. Tests retired: none.
- Net size: about +40 Rust lines in `edit.rs`/`lib.rs`, +60 test lines, one fixture file.

## Steps

1. Red: write `emit.v1.json` cases (shape like `edit.v1.json`: `id`, `why`, `profiles`, `value` (JSON), `expect.lines` or
   `expect.refused`) and `golden_emit.rs` (for each case and profile: `emit` bytes equal `expect.lines` joined with `\n`
   plus a final `\n`; `parse(bytes)` value equals `Value::from_json(value)`). Cases, each with its `why`:
   - multi-key mapping keeps key order (`name`, `description`, `tools`);
   - strings that must quote: contains `": "`, leading backtick, leading `-` + space, `#` after space, empty string,
     leading/trailing space, `---` prefix, a newline (double-quoted with `\n`, no block scalar in an empty document),
     `"true"`, `"null"`, `"123"`; strings that stay plain: `yes`, `none`, `sha256:copy`, `how-to`, `Read, Grep, Bash`;
   - nested mapping, sequence of strings (block, compact), sequence of mappings, empty mapping value `{}`, empty list `[]`;
   - bool, int, negative int, float, null values;
   - root sequence, root scalar, root empty mapping (`{}`), root empty sequence;
   - a key that needs quoting (`a: b`, `__proto__` stays a plain own key);
   - refusals with existing rule ids: a bidi character in a value, a value nested past the profile depth.
   Run `cargo test -p fgos-yaml-doc --test golden_emit`: fails to compile or fails (no `emit`). Commit, push.
2. Implement requirement 1 in `set_inner`'s `chain.is_empty()` branch for `path.is_empty()` (one new splice planner beside
   `plan_append_root`, reusing `render_for`, `map_lines`, `seq_lines`, `scalar`); implement `emit`.
3. Green: golden_emit, golden_edit (no case changes: proves non-empty paths kept their bytes), api_seal, fixture_shape.
4. Gates in phase-lead-rules (fmt, clippy `-p fgos-yaml-doc`, msvc and aarch64-apple-darwin check).

## Acceptance

- `cargo test -p fgos-yaml-doc` green; `edit.v1.json` unchanged; every emit case parses back to its value (the runner asserts it).
- `emit` appears in `lib.rs` re-exports; no new rule id in `packages/yaml-doc/contracts/refusal-rules.v1.json`.

## Risks

- Root branch change alters an existing edit's bytes (M x M): golden_edit unchanged is the check; the branch is entered
  only when the document holds no node and the path is empty.
- A string the profile resolves differently from `plain_ok`'s view (L x H): the commit re-parse check refuses instead of
  writing a wrong value; the golden cases for `yes`/`null`/`true`/`123` pin the result.

## Rollback

Revert the phase's commits; no other phase can land without it (02 depends on `emit`).
