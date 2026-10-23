# Phase 06: Comment renderer and `refresh-docs` for existing files

Depends on 03. Suggested executor: sonnet. Cap: `docs.rs` 180 lines, `write.rs` delta 60.

## Context

Spec section 7: `# @fgos:doc` is rendered from the schema (`description`, `enum`, bounds) and the standard value; it is rewritten only when the rendered line differs, and only by `doctor --fix` or `fgos config refresh-docs`, never as part of another write; `@fgos:why` is never rewritten; free notes stay. Slice B built the per-key renderer (`grammar.rs::doc_lines`, `parse_block`, `block_for_new_key`) and uses it when a door writes a key. What is missing is the renderer applied to a whole existing file: find drifted or missing doc lines, and rewrite them in one transaction. The detection also feeds doctor `config-doc-drift` and `config-comment-missing-doc` (phase 08) and `fgos config check`.

## Files it may touch

`src/docs.rs`, `src/write.rs` (extract two helpers; add `Edit::Docs`), `tests/golden_docs.rs`, `contracts/fixtures/docs.v1.json`, and `tests/write_golden.rs` / `contracts/fixtures/write.v1.json` only if a signature moved.

## Design (reuse first)

- **`docs::scan(ctx, name, bytes) -> Vec<DocFinding>`**: parse with `Profile::StrictConfig`; for every key in the document that has a schema node (`ctx.schemas.resolve(path)`), compute `doc_lines(node, standard_value_at(path))` (the same function a door uses) and compare with `parse_block(comments_at(path)).doc`. A key with no description yields no expectation (nothing to render, nothing flagged). `DocFinding { path, line, column, kind: Missing | Drift }`; never a value. A file parsed from JSON has no comments: `scan` returns nothing for a legacy JSON source (the finding is `config-format-legacy-json`, phase 08).
- **`Edit::Docs`**: a request-wide edit that cannot be mixed with `Set`/`Unset` (`config-key-out-of-scope` with a keyword `docs-edit-alone`, mirroring the spec's "never as part of another write"); needs no reason (the redundancy path already lets reasonless no-ops through, `write.rs:all_redundant`; this generalises it to "an edit that writes no value"). In the shared `produce` it walks the same paths `scan` found and applies `set_comment_block(path, new_doc ++ remaining)` where `remaining` is the existing comment lines minus the old doc run, in original order, so `@fgos:why` and every free note keep their text and relative order.
- **Extractions (one door, no copies):** rename `edit` to `pub(crate) produce(ctx, edits, ack, actor, reason, base, name)` (today `edit(ctx, req, ...)` reads `req.edits` and `req.acknowledge_comment_loss`); split `validate` into `pub(crate) snapshot_with(ctx, roots, role, bytes)` (builds the snapshot with one source replaced) and the thin call from `commit_observed`. Phase 07 calls both; the existing write tests prove nothing moved.
- `refresh(ctx, req, writer, observe)` is `commit_observed` with `Edit::Docs`: lock, revision compare, produce, validate (value unchanged, so it passes by construction), second check, replace. Idempotence is a property of `produce`: a second run finds no drift and `applied` is empty, which `commit_observed` already turns into "write nothing" (`write.rs:177-181`).
- Standard files themselves: not touched here; Slice B's `registry_defaults.rs` already proves their doc lines equal the render.

## Steps

1. Merge `origin/main`; `impact` on `edit` and `validate` in `write.rs` (callers: `commit_observed` only; record it).
2. Extract the helpers first with the Slice B tests as the safety net (`cargo test -p fgos-config --test write_golden --test write_concurrency --jobs 4` before and after, same results).
3. Fixtures (`docs.v1.json`, about 20 cases, inline file text before/after): missing doc on a described key; drifted doc after a schema `description` change; an `enum` change; a standard-value change (the `Default:` text); multi-line description; two refreshes in a row (second is byte-identical, acceptance 1); `why` and free notes untouched, including a note between doc and why; a key with no schema node untouched; a doc line that is not the first run stays a note (existing `parse_block` rule); a forged `@fgos:doc` line from a person is replaced by the render; `Docs` mixed with `Set` refused; legacy JSON source scans empty and refresh refuses with `config-format-legacy-json`; refresh on an absent file writes nothing.
4. `tests/golden_docs.rs` runner (one runner per fixture file); clippy; fmt; source total.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Detection, rewrite, idempotence, `why` and notes untouched | `tests/golden_docs.rs` over `docs.v1.json` |
| The transaction still behaves as before after the extraction | Slice B's `write_golden.rs` and `write_concurrency.rs` (unchanged) |

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| The extraction changes a Slice B behaviour | M x H | tests before and after the move, no edits to those tests in the same commit |
| Doc comment reordering touches a person's notes | L x M | only the leading doc run is replaced; golden case with a note between doc and why |
| A forged doc line passes as valid | L x M | the comparison is against the render, not against the file's own prior text |

## Rollback

Revert: `docs.rs` and the helper extraction go together; `Edit::Docs` is unused elsewhere until phase 08/10.
