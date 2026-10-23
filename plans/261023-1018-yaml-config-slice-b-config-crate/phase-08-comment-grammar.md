# Phase 08: Comment grammar for writes

Depends on 01. Runs in parallel with 03-07 (the doc line is built from a schema node's `description`, enum or bounds and `default` passed in by the caller, so it does not wait for 04). Suggested executor: sonnet (haiku for the fixture transcription).

## Context

Spec section 7: every file starts with `# @fgos:v1`; above each described key, `# @fgos:doc` (written by Config from the schema), `# @fgos:why [<actor>]` (written by whoever set the value), then free notes kept verbatim. Reason rules for the write doors: a reason is required on `set`, `unset`, `patch` (`config-comment-reason-required` for empty, whitespace-only or single generic word `update`, `fix`, `change`); one line only: a line break, U+2028, U+2029 or U+0085 is refused, not split; no comment line Config writes from caller text may begin with `@fgos:`; the actor is the writer identity, never typed by the caller; `init` and `doctor --fix` never write a standard value, and a suggested value's reason names its source (`[setup:suggested] ...`). YAML Document already guards comment text (bidi, zero-width, control characters, line breaks) in `fgos_yaml_doc::comment::sanitize`; this phase adds only Config's grammar on top and does not copy that guard.

## Files it may touch

`src/grammar.rs`, `contracts/comment-grammar.v1.json`, `contracts/fixtures/grammar.v1.json`, `tests/golden_grammar.rs`.

## Design

- `Reason::parse(text) -> Result<Reason, ConfigRefusal>`: trim; refuse empty and generic words (list in `comment-grammar.v1.json`: `update`, `fix`, `change`, compared case-insensitively after trimming trailing punctuation; a multi-word text is never "generic"); refuse the line-break set (the list lives in the contract file; yaml-doc's `sanitize` would turn them into new comment lines, which Config must not allow, so refusal precedes the call); refuse a text whose first non-space characters are `@fgos:` (also after a leading `#`), and a text that contains `@fgos:` at the start of any line (impossible after the line-break rule, kept as a defence in depth test).
- `Actor::from_writer(&WriterIdentity) -> Actor`: `identity.id.to_string()`; validated against `[A-Za-z0-9._-]{1,200}` (identity already guarantees it for registry and env sources; the check defends the comment line against a future identity source). Decision D18: an actor that fails the check is written as `unknown` while the transaction result keeps the real id, because a write must not fail on provenance text that is "nothing more" for readers (spec section 7); a fixture pins it.
- Line builders: `why_line(actor, reason) -> String` = `@fgos:why [<actor>] <reason>` (yaml-doc adds `# `); `suggested_why_line(source)` = `[setup:suggested] <source>` where `source` goes through the same reason checks; `doc_line(entry) -> String` = what the key does, its allowed values and its standard value (spec section 7 table), built from the node's `description`, `enum` or bounds and `default`; secret kinds render `description` only (a default would be absent anyway, lint rule `schema-secret-has-default`); a value is rendered through the redaction helper's `describe` (phase 11) so a `command` default is printed but a `secret-*` never; `header_lines(version)` = `@fgos:v1` first line plus the pointer line `see: fgos config standard`.
- Block assembly: `block_for_new_key(entry, actor, reason) -> Vec<String>` returns `[doc, why]` in the spec's order; `block_for_changed_key(existing: &Comments, actor, reason) -> Vec<String>` keeps the existing `@fgos:doc` line and every free note verbatim and **replaces** `@fgos:why` (a changed value gets the new reason; the old reason is git history, and the write is the reason's author). Free notes keep their order and position below the why line. The function is pure over text lines; applying them is phase 10 (`Document::set_comment_block`).
- Parsing: `parse_block(&Comments) -> Block { doc: Option<String>, why: Option<(actor, text)>, free: Vec<String> }`, recognizing `@fgos:doc` and `@fgos:why [..]` lines by prefix. A hand-written line that looks like grammar but is malformed is a free note (no code branches on actor text).

## Steps

1. Merge `origin/main`. Write the contract file (generic words, line-break set, forbidden prefix) and the module.
2. Fixtures (about 30): reasons accepted (single sentence, unicode text, leading `#` inside a sentence), refused (empty, spaces, `update`, `Fix.`, `change`, line break `\n`, `\r`, U+2028, U+2029, U+0085, `@fgos:why [x] y`, `  @fgos:doc forged`, `# @fgos:why`); actor cases (session id, pid id, invalid actor falls back to `unknown`); builder cases (new key block order, changed key keeps doc and notes and replaces why, key with no existing doc gets none added by a plain `set` of an undescribed key, suggested why line, header lines); parse cases (well-formed, malformed lookalike treated as note, why without actor).
3. Inline cross-check with yaml-doc: the lines produced pass `fgos_yaml_doc::comment::sanitize` unchanged (one assertion over all accepted fixtures, so the two layers agree).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Reason rules and no `@fgos:` forging | `golden_grammar.rs` over `grammar.v1.json` |
| Actor comes from the writer, not the caller | same runner (builders take `&WriterIdentity`, there is no string parameter to pass) plus a compile-level fact: the public builder signature has no actor `&str` |
| Block order and note preservation | same runner |

## Validation

`cargo test -p fgos-config --test golden_grammar --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Forging through a Unicode lookalike of `@fgos:` | L x L | only the exact ASCII prefix is grammar for readers; a lookalike is a free note; fixture documents it |
| A reason with a trailing `\` or emoji breaks a downstream tool | L x L | out of scope; yaml-doc guard owns control and bidi characters |
| D18 hides a bad actor silently | L x L | the transaction result (phase 10) carries the real writer id, as spec section 6 requires; the file text is a copy for readers |

## Rollback

Revert: new files only.
