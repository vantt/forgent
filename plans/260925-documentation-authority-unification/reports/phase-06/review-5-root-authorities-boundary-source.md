# Review 5 - root authorities boundary, source rows

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:15@2026-10-14
Review mode: ordinary
Request commit: 7576ead9d
Content commit: c1961bdb2

## Scope and method

Scope: the two current `claims` rows of `review-request-261014-1900-root-authorities-boundary.md` for the A31 batch-boundary merge 48e3a992b (main pin 88315d5de, pre-merge tree 7d83c6b63). Decision/registry commit 796b247c6 holds the pending rows in `ledger/decisions/s4-packaging-distribution-distribution.json`; request commit 7576ead9d. Worktree HEAD confirmed 7576ead9d. Rules: A28, A31 item 3 (main-only files are checked as successor, not code truth), A34 (no partial carry here).

Checks run (worktree read only, helper scripts in `work-root-boundary/`):
- Recomputed every unit digest with `extractMarkdownConservationUnits` at the committed blobs: source `distribution.md#data-dictionary` heading 7843e5b1... and block `#unheaded-block-5` 648a2fee..., targets `packaging-distribution/spec.md#data-dictionary` daf68f42... and `#unheaded-block-85` 648a2fee.... All equal the digests in the pending shard and the request.
- `node scripts/list-doc-anchors.mjs --check` is ok for all four paths#anchors.
- `git diff 7d83c6b63 48e3a992b -- docs/specs/distribution.md` (word level): main changed only registry row 7 (doctor checks, `credential-copies-retained` text) and row 7b (doctor fixes) of the Data Dictionary table; pure additions plus `warn;` to `warn, and, ...`. The candidate import (7d83c6b63 to HEAD on `packaging-distribution/spec.md`) is 2 lines changed, the same two rows. The block digest of the legacy unit and the candidate unit are byte-identical, so the carry is verbatim.
- Heading carry: section payload digest and following-block digest of the Data Dictionary heading are equal in both files (648a2fee...); only heading depth differs (level 2 to level 4), as the rationale says. The source heading digest changed 435a7083 to 7843e5b1 only because its following block changed; claim ID, path, anchor, kind unchanged (no identity graft). Recomputed unitDigest = sha256("heading\n" + textDigest) for before/after of both headings.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_4eeb2f406288458e61bad21531966ab1 | ok | Heading Data Dictionary moved, depth 2 to 4 only; section payload and following-block digests equal on both sides; the new source digest differs from the old only through main's row 7 and 7b edits; anchor ok; rationale accurate, though it does not say the digest drift came from main | 7843e5b171ea17f9bece9456184250e5ef748cb46c1a87d79917c145dbcba539 | daf68f421dfeceaf353dae3acd35391978f7dd56e9f10b1a0d6d4d0a13d7380b |
| claim_a26a90f97c6a399a30ce1df9207743b0 | ok | Complete table verbatim at packaging#unheaded-block-85: digest 648a2fee equals the main legacy unit, so main's row 7 and 7b additions are carried word for word and nothing is lost; the stale boilerplate phrase about relative-link changes is inert since the unit has none, so no objection; no truth approval implied | 648a2fee27dd55616a3ca003e9bb21fc11827ca1947dbf7463dbec2538f113b6 | 648a2fee27dd55616a3ca003e9bb21fc11827ca1947dbf7463dbec2538f113b6 |

## Ratchet accounting (three legacy spec exceptions)

`scripts/check-legacy-docs-ratchet.exceptions.json` entries for `docs/specs/distribution.md`, `docs/specs/runner.md` and `docs/specs/confinement-authority.md` now carry expectedDigest 2ab0c766..., b08341e9..., 435f3ccc.... I recomputed `sha256(git show HEAD:path)` for each and they match; the blobs 766f8691, 049e0291 and 63a2cb78 are identical at main 88315d5de, merge 48e3a992b and HEAD, so the exceptions account exact main bytes. `node scripts/check-legacy-docs-ratchet.mjs` reports clean (995 files, 25 accounted edits, 1 new). Wording only: the distribution, runner and confinement `approvedBy` strings now repeat the phrase "owner A31 boundary-sync instruction (accounting only, no content approval)" twice; cosmetic, no accounting effect. Content approval stays owed.

Status: DONE (2 ok / 0 rework / 0 hold)
