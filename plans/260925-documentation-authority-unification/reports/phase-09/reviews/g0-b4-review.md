# G0 changed-binding review: batch g0-b4 at 8a9385eca

Result: 22 rows. 20 APPROVE, 2 REWORK. Verdicts are in `g0-g0-b4-review.json`.

## How the digests were recomputed
- **Unit digest:** I ran `extractMarkdownConservationUnits` from `scripts/generate-doc-inventory.mjs` (the extractor behind `scripts/list-doc-anchors.mjs`) on the target file in the review worktree. `targetUnitDigest` is the unit's `textDigest`, which is sha256 of the trimmed unit text. It is not `buildUnitIdentityDigest`. I also recomputed the heading ancestry, and it matches `targetAncestry` on all 22 rows.
- **Binding digest:** no committed helper computes it. There are two encodings, and both reproduce exactly:
  - The 2 rows refreshed under L12-130 (af89, b741) use the encoding declared in their `bindingHashEncoding` (step-08-preflip-gates.json `bindingRefresh`): sha256 of compact JSON with sorted keys, plus a trailing LF, over `{targetOwner, targetAnchor, targetUnitDigest, targetAncestry}`.
  - The other 20 rows use an encoding that is declared nowhere. It reproduces as Python `json.dumps({targetOwner, targetAnchor, targetUnitDigest, targetAncestry, successorGroup}, sort_keys=True, ensure_ascii=False)`, with default separators and no LF.
- **Source text:** for each row I recovered the source unit from git history, matching it by `sourceUnitDigest`.

## REWORK
1. **claim_af89c4e6** (`docs/platform/component-boundary.md#unheaded-block-11`). Commit 6bee0a74f (Config row) changed the unit after the binding was written. Its digest is now `17b94e60…`, but the row is bound to `b8232055…`, so it needs a rebind. The content carriage itself is sound.
2. **claim_891db485** (`setup-doctor-registry.md#unheaded-block-30`, C-F9 line 207). The source claim is fully carried. The problem is two present-tense claims in the target unit, neither of which exists in `src/setup/registrations.mjs`:
   - setup attempts the `lock-fences` cutover fix (row 7b). There is no `registerFix` for it.
   - the merge adds a `lock` config default with `predecessorKillWaitMs: 2000`. There is no `registerConfigDefault` for it, and src/ has no `predecessorKillWaitMs`.

   The fence mechanism was removed at 51e36b06b. The fix is to mark this text historical or remove it.

## Code-truth check for setup-doctor-registry.md
The "Registered inventory" lists 143 checks and 32 fixes. Both match the registrations in `src/setup/registrations.mjs` exactly: 135 literal checks plus 8 Git checks registered in a loop, and 32 fixes. Nothing is missing on either side.

## Concerns (not blocking)
- In `docs/specs/distribution.md`, Data Dictionary rows 7 and 7b no longer match the code:
  - row 7 is missing 17 registered checks and still lists `model-policy-tier-coverage`, which is not registered;
  - row 7b is missing 7 registered fixes.

  That file is a retired-root projection. The 3 supersede rows that bind into it are still valid as carriage, because the current unit forwards the claim to `docs/platform/packaging-distribution/spec.md#unheaded-block-86`.
- No committed helper computes the legacy binding encoding, so this is the only reconstruction of it. The batch file should declare the encoding for every row, not only for the 2 refreshed ones.
