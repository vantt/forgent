# Phase 06: Edits, comments on a document, re-parse check, comment-would-be-lost

Depends on phase 05. Suggested executor: opus.

## Context

Spec sections 5 and 6, writer Shape A (surgical edit). Edits splice bytes by spans; the parser is used to parse and to give spans, so the injection guard and comment rules are ours for any backend.

## Files it may touch

`src/edit.rs`, `tests/golden_edit.rs`. Reads `edit.v1.json` and `comment.v1.json`'s output forms; fixture fixes go through phase 02's files in a separate commit.

## API (on `Document`)

`set(&mut self, path, value)`, `insert(&mut self, mapping_path, key, value, position)` (`Position::End | After(key)`), `remove(&mut self, path, ack: CommentLoss)` (`CommentLoss::Refuse | Acknowledge`), `set_comment_block(path, lines)`, `set_inline_comment(path, text)`, `comments_at(path) -> Comments {above: Vec<String>, inline: Option<String>}` (text without `#`), `to_bytes()`. Paths are `&[Segment]`; callers with a string use `parse_path` (phase 03). New values are `Value`.

## Design

1. **Transaction.** Each edit computes the new bytes on a copy of the source; the document is replaced only after the re-parse check passes. A refusal leaves `self` unchanged byte for byte (guarantee 2).
2. **Splice.** `edit.rs` computes `(start, end, replacement)` from the node spans plus line structure of the source. Untouched bytes are never rewritten; the test asserts `prefix == old[..start]` and `suffix == old[end..]` internally with a debug assertion that is also exercised by every fixture.
3. **Style following (guarantee 3).** Detect once per document: indent unit (first indented line), line ending (LF or CRLF, kept), quoting style of sibling string scalars (plain, single, double). A new string scalar is plain unless plain would change its meaning (leading indicator, `: `, ` #`, resolves to non-string, leading/trailing space, empty), then it takes the sibling quote style, else double quotes with escapes. Multi-line strings are written as `|` or `>-` only when the document already uses block scalars, else double-quoted with `\n`.
4. **`set`.** Scalar to scalar replaces the value span only (inline comment and quoting of the key stay). Scalar or subtree to subtree, or subtree to subtree, rewrites that node in the prevailing block style (spec section 13); a flow collection or block scalar target is rewritten whole. Missing parents are created as block mappings below the deepest existing node; creating through a sequence index that does not exist is refused `path-not-found`.
5. **`insert`.** After a named sibling (end of that sibling's span, past its trailing block) or at the end of the mapping (after the last entry, before trailing blank lines that belong to the next section). Duplicate key is refused `duplicate-key` by the re-parse check.
6. **`remove`.** Deletes the entry or item including its line. If the node owns a block-above comment or an inline comment and `ack` is `Refuse`, refusal `comment-would-be-lost`; a comment directly above that belongs to the next sibling (blank line between) is not owned. This component never decides whether the note matters.
7. **Comments.** `set_comment_block` replaces the contiguous comment lines directly above the node (no blank line between) with `sanitize(lines)` at the node's indent, inserting if none, deleting the block when `lines` is empty (and then it is subject to no ack: it is an explicit caller act). `set_inline_comment` uses `sanitize_inline`; a node whose last line is not single-line (a multi-line flow collection, block-scalar content) is refused `inline-comment-unplaceable`; for a mapping or sequence node the comment goes after its key on the key line. `comments_at` derives both from the source text between spans.
8. **Re-parse check.** After splicing, parse under the same profile (including the pre-scan); compute the expected `Value` by applying the same operation to the old `Value`; any difference, or a parse refusal, returns `edit-changed-meaning` and leaves the document unchanged. This also catches an injected key or an unintended flow structure.
9. All public entries run through `guard` (phase 05).

## Owning proofs

| Behaviour | Owner |
|---|---|
| Byte fidelity outside the splice (comments, blank lines, indentation, quoting, block scalars, inline comments, CRLF, `"code:implement"` key, the 937-line synthesized config), new content following the file, every operation, re-parse refusal leaving the document unchanged, `comment-would-be-lost` with and without acknowledgement, comment placement and the guard as applied | `tests/golden_edit.rs` over `edit.v1.json` |
| Comment text splitting and sanitizing (pure) | phase 03's `golden_comment` (not repeated; edit cases use only one line, one multi-line and one injection attempt as wiring) |

Injection attempts in edit fixtures: `"x\nevil: 1"`, `"x\r\nevil: 1"`, `"x evil: 1"` as `setCommentBlock` and `setInlineComment` text; expected result: still comments or refused, and the re-parsed value has no `evil` key.

## Steps

1. Implement read paths first (`comments_at`, spans), then `set` scalar, then the rest, each with its fixtures green before the next.
2. Property-style sweep as scratch (not committed; phase 09 fuzz is the permanent form): for every node of the 937-line fixture, `set` it to its own current value and expect output byte-identical to input.
3. Merge main; run the golden runner.

## Validation

`cargo test -p fgos-yaml-doc --jobs 4 --test golden_edit`, then `cargo test -p fgos-yaml-doc --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Splice boundary wrong on odd layouts (comment between key and value, document start marker, trailing spaces) | H x M | each layout is a fixture; step 2 sweep; refusal (not corruption) when the re-parse differs |
| Edit of a flow collection or block scalar changes style unexpectedly | M x L | spec section 13 says so; fixtures pin the rendered form |
| Style detection picks the wrong quote style on mixed files | M x L | rule is deterministic (sibling first, then document majority, then double); fixture for mixed |
| A refusal after partial splice leaks state | L x H | transaction on a copy; fixture asserts `to_bytes` equals input after each refusal |

## Rollback

Revert; `edit.rs` returns to a stub; parse-side phases remain valid.
