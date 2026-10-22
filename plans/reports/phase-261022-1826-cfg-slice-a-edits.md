# Phase report: edits, comments on a document, re-parse check, comment-would-be-lost

Branch `cfg/slice-a-crate`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-a-crate`. Plan: `plans/261022-1342-yaml-config-slice-a-yaml-document/phase-06-edits-and-recheck.md`.

## Result

- `cargo test -p fgos-yaml-doc --jobs 4` green (golden edit runner over 109 cases = 47 existing + 62 new, each under every listed profile; 1 unit test for the depth guard). clippy `-D warnings` (all targets) and `cargo fmt --check` clean for the crate. `cargo test --workspace` and `npm test` not run, as instructed. Impact analysis inactive (0 providers).
- No existing fixture was amended. The 47 cases written before a parser existed all passed unchanged.
- Main merged (one backlog doc commit) after the feature commit; golden runner re-run green.

## API (all on `Document`, all through `guard`)

`set(&[Segment], Value)`, `insert(&[Segment], key, Value, Position::End | After(key))`, `remove(&[Segment], CommentLoss::Refuse | Acknowledge)`, `set_comment_block(&[Segment], &[String])`, `set_inline_comment(&[Segment], &str)`, `comments_at(&[Segment]) -> Comments {above, inline}`, `to_bytes()`. `CommentLoss`, `Comments`, `Position` re-exported at the crate root.

## How it works (`src/edit.rs`)

- One `Splice {start, end, text}` per operation, computed from node spans plus the line structure of the source; `commit` applies it to a copy (char-boundary checked), parses under the same profile, compares the parsed value to the expected value (the same operation applied to the old `Value`; NaN equal to NaN), and replaces the document only on a match. Every refusal leaves `self` untouched; the golden runner asserts `to_bytes` equal before and after each refusal.
- Refusal mapping: a profile rule hit by the result (`duplicate-key`, `number-out-of-range`, `prototype-key`, ...) passes through under its own rule, as the fixtures require; a syntax error in the result or a value mismatch is `edit-changed-meaning` with fixed wording.
- Style: indent unit read from the first mapping nested under a key (default 2), line ending from the first break, quoting from the sibling strings, else the document's strings, else plain. A string that cannot stay plain (indicator, `: `, ` #`, resolves to non-string, flow indicator inside a flow collection, control characters) takes the document's quote style, else double quotes with escapes. A multi-line string becomes a block scalar only when the document already uses them (or the node replaced was one).
- Comments: association is ours (text between scalar spans, plus a block scalar's header line). `comment-would-be-lost` is raised by `remove` (without ack) and by `set`/`insert` when they must rewrite a node that holds a comment (no ack parameter exists there); the comment on the key line of a rewritten entry moves with it.
- Depth of a caller-supplied `Value` is checked iteratively against the profile bound (`depth-exceeded`) before any recursive rendering.
- Fallbacks to the document's block style (spec 13): a flow collection that gets a new key, an insert, a removal or a non-scalar replacement is rewritten whole in block style; a block scalar stays a block scalar (indentation and header comment kept); a folded scalar replaced by one line stays folded.

## Findings and deviations

1. **Stale props on empty scalars.** `tag_at`/`anchor_at` of an empty value hold the parser's reported position (the next token), so the minimum with `start` pointed before the real start. Found by the sweep; `first_pos` now uses them only when the node has a tag or anchor. Worth knowing for phase 07.
2. **Phase text vs fixtures on parse refusals.** The phase says any parse refusal becomes `edit-changed-meaning`; the fixtures (`duplicate-key`, `number-out-of-range`, `prototype-key`) want the profile's rule. Fixtures followed.
3. **Phase text vs fixture on quoting.** The design says new strings are plain unless unsafe; fixture `insert-follows-quote-style` wants `"z"` among double-quoted siblings. Fixture followed (sibling majority first).
4. **Empty `text` in `set_inline_comment` removes the comment** (not in the spec; without it there was no way to remove one). `comments_at` also reads a block scalar's header comment, which `set_inline_comment` still refuses to write (fixture).
5. `src/document.rs`: `text` and `tree` made `pub(crate)` (outside the ownership list, needed by edit.rs). `fixtures/README.md` row for `edit.v1.json` now names `tests/golden_edit.rs`.
6. Inline and block placement of a note on an item of a flow collection is limited: inline is refused when more text follows on the line; a block goes above the line of the item (valid YAML, attaches by position only).

## Scratch sweep (not committed; kept at `/tmp/x/scratch_sweep.rs` only for this session)

Over 56 tracked YAML files plus a 937-line synthesized config (13 746 operations, debug build, tool profile): `set` of every scalar to its own value is byte-identical (differences only where a folded scalar wrapped over several lines is rewritten as one line, by spec 13, and null becoming explicit `null`); `set_comment_block` and `set_inline_comment` with the node's current comments are byte-identical for every node; `remove` with acknowledgement never produced a state other than valid or `edit-changed-meaning`. No panic.

## Known limits (refused, never corrupted)

- A flow mapping entry with no value and no colon (`{a: 1, b}`) cannot be set (the re-parse refuses it).
- Setting a scalar that an alias points at is refused `edit-changed-meaning` (the alias would change).
- `|+` block scalars with trailing blank lines: inserting after them is refused by the re-parse.
- Tool profile `!!tag` scalars: a swap that changes the type against the tag is refused.

## Unresolved questions

- Should `set`/`insert` take a `CommentLoss` argument too, so Config can rewrite a commented subtree knowingly? Today they refuse.
- Is "empty inline text removes the comment" acceptable as API, or should removal be its own method?
