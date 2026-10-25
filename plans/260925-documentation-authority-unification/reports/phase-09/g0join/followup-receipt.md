# Literal-code and verdict-freshness follow-up receipt

Input HEAD: `0d200a3cd799c21688b8574646a6baae71300d27`. Authority: `../w27-g0-followup-brief.md`, L13-25, and `../reviews/w26-g0-rework-verdicts.{md,json}`. Authored corrections only: independent review remains pending; no G0 approval, promotion or cutover is claimed.

## Corrections and provenance

- Fixed the seven REWORK decisions/evidence records. Both s7 predecessor clauses now start at the exact bound source (`d631e41b…` / `59d3caa3…`), including the previously unaccounted Seat Binding tier replacement. The full original witness is authenticated at `2f0d4a5502f0259da212d840abd49ec6a95f725d`. Both rationales preserve `b919e2b9b` and the full native successor claim IDs. Clause replay leaves no unaccounted source-to-target difference.
- s14 `/bindingRefresh/8` is an explicit `drop`. Its target fields authenticate the original, dropped foundation locus **as evidence only**, not a carry. It no longer duplicates the Work 0032 target. The existing Work Team Harness `/bindings/2` and Runner Iron Law `/bindings/3` remain intact. The superseded origin still resolves to this explicit drop, so the carry verifier needs no exemption.
- Refreshed residual rows 0/1 to `e8167a0a…` and file SHA256 `85a7a1f8…`, with complete current placement/neighbour witnesses. Residual text and residual digests are unchanged. The residual rows and their referring ledger rows remain pending.
- g0 `/bindingRefresh/125` and `/126` now name `/20` and `/21` as their predecessors and themselves as the current endpoints.
- Restored only two fenced-code destinations: `workflow/spec.md:420` to `seat-binding.md`, and `component-boundary.md:549` to `../proposals/component-authority-boundary-map.md#13-draft-ports`. Both equal their legacy source bytes. No component boundary or product behaviour changed.
- Reused `rebind.py`'s `extract/history/locate/binding/witness` and the canonical ledger traversal/hash. Seven effective endpoint bindings changed; superseded origins and link preimages were not rewritten. All 12 changed ledger rows retain their full previous rows in `priorReview.g0FollowupBefore` and remain pending. Exact before/after witnesses: `../rebind/followup-rebindings.json`. The bounded, input-guarded authoring replay is `../rebind/followup-records.py` (run only at the input pin, after the two literal restorations, with clean ledger/residual preimages).

## Literal scan and fingerprint contract

`../rebind/scan-code-literals.mjs` extends the earlier marked lexer/walker recipe, not the forbidden link rewriter. The final `../rebind/g0-code-span-scan.json` covers all **1,198 files**, including 627 Markdown files, **83,104 inline spans and 2,346 code blocks**. It investigates all `](` hits without path filtering: **103 literal candidates authenticated, zero unresolved**. Fenced historical wrappers authenticate against their cited complete source blobs, not only source code tokens. The native Git spec span authenticates against its introducing commit (`git log -S'table[key](…)'`: `d4839a339`). The original inline repair and its 83,102/83,104 census remain recorded alongside the two new fenced repairs. Tokenizer version/module hash, source hashes, literal hashes and every scanned-file hash are retained. No dependency was installed.

`join.py` reuses `ledgerfix/bindings.py` rows/snapshot exclusions, exact supersession traversal and binding keys. `row_fingerprint(doc, pointer)` hashes compact, sorted, UTF-8 JSON plus LF with SHA256. The JSON is the leaf-to-enclosing-object decision context: canonical target fields, binding hash/groups, disposition, rationale/reason, changedClauses, reviewStatus and supersedes links; own nested bindings are included, sibling bindings are excluded from inherited context. Review notes, immutable snapshots and target-unit witness snapshots are excluded. Including reviewStatus deliberately detects review resets under L13-25.2.

A verdict must still identify the exact row/lineage and both digests unambiguously. It then requires either an equal/descendant review-file commit relative to the row's last decision edit, or a matching `rowFingerprint`. Last-edit discovery compares row fingerprints through Git's parent-rewritten path-history DAG, not shard modification dates or an interleaved linear log. It follows the first matching parent at merges (Git blame semantics) and detects reverted decisions. Stale approvals cannot pass; stale REWORK cannot reopen a changed decision. Fresh REWORK still needs a strictly later exact approval. The obligation population is unchanged: this extends freshness, not the set of previously unreviewed obligations. Output contract is `g0-verdict-join.v2` with per-row fingerprint, decision commit and stale-verdict evidence.

Prior-art search found the existing strict join introduced in `d7126c5b9` and the prior literal repair in `594fe4194`; no earlier rowFingerprint implementation was found. Direct callers are the join entry point and its owning tests; other gate tools cite its artifacts. Impact-analysis: degraded/unqueried (brief forbids fgOS CLI; no live impact MCP tool is available). No indexed blast-radius claim.

## Commands and results

`P` = `plans/260925-documentation-authority-unification/reports/phase-09`. Exact argv, stdout/stderr, hashes and final exits are in `followup-commands.json`. All Node invocations inherited `NODE_OPTIONS=--no-addons`; every Python invocation used `-B`. Extractor scratch used exit-cleaned tempfile directories under `/tmp/fgos-work/`.

| Command | Exit |
|---|---:|
| `python3 -B P/rebind/followup-records.py` (authoring, before input guards were added; 12 rows / 7 rebindings / 2 residuals) | 0 |
| `node P/rebind/scan-code-literals.mjs <recorded marked module> docs/platform/git/spec.md@d4839a339` | 0 |
| `python3 -B P/rebind/rebind.py --check` | 0 |
| `node P/carries/verify-carries.mjs` | 0 |
| `node scripts/check-legacy-docs-ratchet.mjs` | 0 |
| `python3 -B P/g0join/test_join.py` (15 owning tests; 10 original tests retained) | 0 |
| `python3 -B P/rebind/test_rebind.py` (3 existing owning tests, unchanged) | 0 |
| `python3 -B P/g0join/validate_followup.py` (source clauses, 12 current rows, drop/lineages, residuals and scan hashes) | 0 |
| `python3 -B P/g0join/join.py --pin HEAD` | **1, expected** |
| `git diff --check` | 0 |

The pinned join output is `followup-join-head.json`: **1,927 effective rows, 1,740 approved, 187 stale**, zero missing, mismatched, invalid bindings or unresolved loci. Seven open REWORK verdicts overlap those 187 and are exactly the decisions/evidence corrected here. Every failing row has a stale verdict under the new rule; no unrelated failure class was accepted. Intermediate exploratory scans/joins were superseded by this final replay (an experimental expansion of obligations was removed; the final population is unchanged).

**HEAD is the committed input pin, not this worker's uncommitted corrections.** Its seven REWORKs therefore remain visible in the pinned output. `validate_followup.py` separately authenticates the current authored bytes; it is not independent approval. The carries proof also retains its pre-existing final-pin recomposition duties for `bin/fgos.mjs` and `docs/backlog.md`; neither file is writable here. The runner owns committing these scoped outputs; after that commit, rerun the join at the new HEAD and obtain fresh independent reviews/fingerprints. This receipt does not manufacture those verdicts.

No git write, lifecycle/fgOS CLI call, product test, native addon, pair accounting, legacy-doc edit, register edit, review edit or out-of-scope script edit was performed. No additional writable path is needed.
