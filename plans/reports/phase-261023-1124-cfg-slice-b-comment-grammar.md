# Phase 08: comment grammar for writes (report)

Status: done. Branch `cfg/slice-b-comments`.

## Delivered
- `packages/config/rust/src/grammar.rs` (200 lines incl. doc comments; stub line replaced): `Reason::parse`, `Reason::suggested`, `Actor::from_writer(&WriterIdentity)`, `header_lines`, `why_line`, `doc_line(&serde_json::Value)`, `Block`/`parse_block`, `block_for_new_key`, `block_for_changed_key`. No validator crate added.
- `contracts/comment-grammar.v1.json`: header, prefixes, generic words, line-break codepoints, actor rule. Rust reads it with `include_str!` (single authority, no copied lists).
- `contracts/fixtures/grammar.v1.json` (44 cases) + `tests/golden_grammar.rs` (130 lines) + README row.
- `src/lib.rs`: `mod grammar` made `pub mod grammar` (one-word change, needed by the integration test; outside the phase's file list).

## Behaviour notes
- Hidden text (bidi, zero width): refused through `fgos_yaml_doc::comment::sanitize`, kept as `ConfigRefusal.yaml`; code stays `config-comment-reason-required` (no other reason code exists in failure-codes).
- Every produced line is asserted to pass `sanitize` unchanged (cross-check over all fixtures).
- Public signatures have no actor `&str`; the only way to an `Actor` is `from_writer`.
- Invalid actor id (space, bracket, empty, over 200) renders `unknown`.
- Duplicate or malformed `@fgos:doc`/`@fgos:why` lines are free notes (kept verbatim); only exact ASCII prefixes are grammar.

## Deviations / open points
- Redaction `describe` (phase 11) does not exist yet: `doc_line` treats `x-fgos-sensitivity: secret-*` as description only and prints other defaults as is. When phase 11 lands, route default rendering through it (one call site, `plain` in grammar.rs).
- `#![allow(clippy::result_large_err)]` at the top of grammar.rs: `ConfigRefusal` is 208 bytes. Later modules will hit the same lint; boxing or one crate-level allow is a decision for the owner of error.rs.
- Multi-line schema descriptions (Seat Binding ladder) are collapsed to one line in the doc line, since a doc line is one line.

## Verification
`cargo test -p fgos-config --jobs 4` green (grammar 2 tests, fixture_shape 2, lock_rows 3); clippy `-D warnings` and fmt clean for the crate. Rust source lines added: 199 in src (+1 changed in lib.rs); tests 130.
