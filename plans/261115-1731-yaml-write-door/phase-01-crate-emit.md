# Phase 01: the crate emits a whole document (Rust leaf)

Start after: plan approval. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: [phase-00-facts.md](phase-00-facts.md) F2, F6.
Worktree `ywd-p01`, target `ywd-p01-target`, report slug `ywd-p01-crate-emit`. Effort: 4h.

## Context

The crate already writes YAML through shape A (`Document::set`, re-parse check in `commit`). Its documented contract "an
empty path replaces the whole document" fails on a document that holds no node (F2 gap): only the first entry of a
mapping is appended and the commit refuses; a sequence or scalar returns `not_found`; an empty mapping value hits
`entries.remove(0)` (`edit.rs:94-96`, a panic caught by `guard`). Emitting a new document is exactly that case. This phase
makes the existing operation meet its contract and names the composition `emit`.

This is new rendering code for one case, bounded: it reuses the shape-A renderers (`render_for`, `map_lines`, `seq_lines`,
`scalar`) that `set` already uses for new subtrees, and its result passes the same re-parse check. It is not a shape-B
printer: there is no "parse, re-render the whole document" path for an existing document (spec section 15, 2026-10-22).

## Requirements

1. `Document::set(&[], value, ack)` on a document with no root node writes the whole value in ONE splice rendered with the
   empty document's preferences (`render_for(&[], None)`): a mapping as `map_lines` at indent 0, a sequence as
   `seq_lines` at indent 0, a scalar as `scalar(value, false)`, an empty mapping as `{}` and an empty sequence as `[]`
   (the inline forms `rendered` already uses, `edit.rs:921-922`); every line ends with the document's eol; a document that
   holds only comments keeps them above the new content. The commit's re-parse check stays the only acceptance. Paths that
   are not empty keep today's behaviour byte for byte.
2. `pub fn emit(value: &Value, profile: Profile, file: &str) -> Result<Vec<u8>, Refusal>` in `edit.rs` (public operations
   section), re-exported from `lib.rs`: `parse(b"", profile, file)`, `set(&[], value.clone(), CommentLoss::Refuse)`,
   `to_bytes()`, inside `guard` like the other public entries. Doc comment: the output parses back, under `profile`, to
   `value`, or the call refuses; rendering depends only on the value.
3. Quoting of hidden characters. Today `plain_ok`/`single_ok` (`edit.rs:1007-1046`) and `double_quoted` (`:1047-1068`) treat
   bidi controls, zero-width characters and the other members of the hidden set as ordinary text, and the `tool` profile
   refuses them only in keys (`packages/yaml-doc/contracts/profiles.v1.json`, `bidi-controls`/`zero-width` =
   `refuse-keys-only`). So a value holding U+202E would be written raw, invisible in a diff. Change: a string holding a
   member of the one hidden set the crate already defines for comment text (`Hidden::of`, `packages/yaml-doc/rust/src/comment.rs:50-61`,
   already `pub(crate)`; reuse it, do not copy it) is never plain or single-quoted, and `double_quoted` writes each such character as `\uXXXX`.
   The value is unchanged (it reads back equal); only its bytes are visible. No new refusal rule, no profile change.
4. Key order: `fgos-yaml-doc` owns `Value::from_json` (`model.rs:23-42`, iterates `serde_json::Map`), so it enables
   `serde_json` `preserve_order` itself: `packages/yaml-doc/rust/Cargo.toml` `serde_json = { workspace = true, features = ["preserve_order"] }`
   with a one-line comment. Today the feature reaches the crate only through `fgos-config` in a workspace build; under
   `cargo test -p fgos-yaml-doc` (resolver 2, root `Cargo.toml:40`) keys come back sorted. `Cargo.lock` must not change
   (`indexmap` is already locked); if it does, stop and ask the big lead.
   Side effect: five crates depend on `fgos-yaml-doc` without `fgos-config` (`cargo tree --offline -p <crate>`):
   `fgos-host-runtime`, `fgos-convention`, `fgos-run-result`, `fgos-seat-binding`, `fgos-identity`. Their per-crate builds
   switch `serde_json` maps from sorted to insertion order (workspace builds already have it). Gate each one with its own
   `cargo test -p` (step 3).

## Proofs (design principle 8)

- `set` on an empty document is a change of `set`; its owning proof is `golden_edit.rs` over `edit.v1.json`. Add the cases
  there (input empty, one op `set` with path `""`, the fixture's text form of the empty path, as in
  `set-root-replaces-document`), each with its `why`:
  - multi-key mapping whose keys are NOT alphabetical (`name`, `description`, `tools`) keeps their order;
  - strings that must quote: contains `": "`, leading backtick, leading `-` + space, ` #`, empty string, leading/trailing
    space, `---` prefix, a newline (double-quoted with `\n`), `true`, `null`, `123`, `1e5`, `0123`;
  - strings that stay plain: `yes`, `none`, `sha256:copy`, `how-to`, `Read, Grep, Bash`, `Decisions index`, a 64-hex digest;
  - a value holding U+202E and one holding U+200B: double-quoted with `‮`/`​`, reads back equal (requirement 3);
  - nested mapping, block sequence of strings, sequence of mappings, empty mapping value, empty list value;
  - bool, int, negative int, float, null values;
  - root sequence, root scalar, root empty mapping (`{}`), root empty sequence, a comment-only input;
  - a key needing quotes (`a: b`) and `__proto__` (plain own key);
  - refusal: a value nested past the profile depth (existing `check_value` rule).
  Run under both profiles where the case allows (`strict-config` refuses hidden characters in values: list only `tool` for those cases).
- `emit` is a composition: one test in `golden_edit.rs` runs every empty-input `set` case with path `""` through `emit` too and asserts
  the same bytes (no second fixture family, no change to `FIXTURE_FILES`).
- `api_seal.rs`: the existing public-entry seal cases (no panic out, bounded time, no value in a refusal) also drive `emit`,
  seeded from those fixture values.

## Files

- Modify: `packages/yaml-doc/rust/Cargo.toml`, `packages/yaml-doc/rust/src/edit.rs` (root branch of `set_inner` `:86-117`,
  `emit`, hidden-set quoting), `packages/yaml-doc/rust/src/lib.rs` (re-export), `packages/yaml-doc/contracts/fixtures/edit.v1.json`,
  `packages/yaml-doc/rust/tests/golden_edit.rs`, `packages/yaml-doc/rust/tests/api_seal.rs`,
  `packages/git/contracts/mutation-census.v1.json` (regenerated, see phase-lead-rules).
- Create/Delete: none. Tests retired: none.
- Net size: about +60 Rust lines, +40 test lines, about 30 fixture cases.

## Steps

1. Red: add the `edit.v1.json` cases and the `emit` assertion in `golden_edit.rs`; `cargo test -p fgos-yaml-doc --test golden_edit`
   fails (no `emit`; empty-document `set` refuses; order sorted; hidden characters raw). Commit, push.
2. Implement requirements 1-4.
3. Green: `cargo test -p fgos-yaml-doc` (all golden runners; the pre-existing `edit.v1.json` cases unchanged and green);
   then each crate whose per-crate map order changes: `cargo test -p fgos-host-runtime`, `-p fgos-convention`,
   `-p fgos-run-result`, `-p fgos-seat-binding`, `-p fgos-identity --features provider`. A failure there is a test that
   depended on sorted keys: report it to the plan lead before changing it.
4. Gates in phase-lead-rules (fmt, clippy `-p fgos-yaml-doc`, msvc and aarch64-apple-darwin check, census).

## Acceptance

- `cargo test -p fgos-yaml-doc` green, run with `-p` (not only `--workspace`); no existing `edit.v1.json` case changed;
  `emit` re-exported; no new id in `packages/yaml-doc/contracts/refusal-rules.v1.json`; `Cargo.lock` unchanged.

## Risks

- Root-branch change alters an existing edit's bytes (M x M): existing `edit.v1.json` cases unchanged is the check; the
  branch is entered only when the document holds no node and the path is empty.
- `preserve_order` changes map order in the per-crate builds of the five crates above (M x M): their own
  `cargo test -p` gates; workspace builds already ran with insertion order.
- Hidden-set quoting changes the bytes of an existing `set` of a new value holding such a character in a `tool` document
  (L x L): before, it was written raw (and `strict-config` refuses it anyway); now escaped, same value.
- A string the profile resolves differently from `plain_ok` (L x H): the commit re-parse check refuses instead of writing a
  wrong value; cases `true`/`null`/`123`/`1e5`/`0123` pin it.

## Rollback

Revert the phase's commits (and regenerate the census on the reverted tree); 02 cannot land without `emit`.
