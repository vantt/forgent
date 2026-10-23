# G0 changed-binding review: batch g0-b5 at 8a9385eca

Result: 22 rows, 19 APPROVE, 3 REWORK. Verdicts: `g0-g0-b5-review.json`, next to this file.

## How the digests were checked

- **Unit digest:** recomputed with `extractMarkdownConservationUnits` from `scripts/generate-doc-inventory.mjs` at the review commit. For `docs/architecture-manifest.json` the unit is the sha256 of the whole file. All 22 match `targetUnitDigest`, the shard rows and the heading ancestry.
- **Binding digest:** all 22 recompute, but they use two different encodings, and no plan script computes either one.
  - **3 rows (the L12-130 refresh, manifest rows):** the declared encoding from `step-08-preflip-gates.json` `bindingHashEncoding`. That is sha256 of the UTF-8, sorted-key, compact JSON plus LF of `{targetOwner,targetAnchor,targetUnitDigest,targetAncestry}`.
  - **The other 19 rows:** that encoding does not match. They match a different encoding that is written down nowhere: Python `json.dumps(sort_keys=True)` with default separators and no LF, over the same four keys plus `successorGroup`. Batch g0-b3 used the same encoding.
  - The join in the G0 gate (`preflip-execution-plan.md` row 0) depends on these digests, so the Lead should declare the second encoding too.

## REWORK

1. **`claim_15308eb4…` (s3 registryGaps/4)**
   - It is bound to `docs/specs/confinement-authority.md#unheaded-block-140`, which is section 13.1, the credentialStore recipe.
   - The candidate `docs/platform/agent-confinement/spec.md` has no section 13.1, even though its own line 602 points to "§13.1".
   - No ledger claim carries digest 5364ce63 into the candidate, so at flip this claim ends up in a retiring file. Section 13.1 needs carrying into the candidate (overlaps with G9), then the row needs rebinding there.
2. **`claim_a7278e15…` (s8-observe registryGaps/0, partial-carry)**
   - It is bound to the legacy `docs/specs/observe.md#unheaded-block-3`.
   - Its sibling predecessor of the same block (`claim_bf1888a0`) is bound to the candidate `docs/platform/observe/spec.md#unheaded-block-5`.
   - The remainder still names primary target 36f5428d, not the bound digest 8ab1ac2f.
   - `A34Accepted` is false.
3. **`claim_f5365b8e…` (b-io-contract registryGaps/4, partial-carry)**
   - It is bound to the legacy `docs/io-contract.md#unheaded-block-5`.
   - Its sibling (`claim_57f11d83`) is bound to the candidate `cli-io-contract.md#unheaded-block-10`.
   - The remainder names d3828696, not the bound 9f779327.
   - `A34Accepted` is false.

## Notes on approved rows

- **Agent-coordination rows (10):** 8 are byte-identical moves. The other two:
  - `claim_233e60f8`: only change is "V-012" → "V-013"; V-013 exists in the candidate.
  - `claim_4ff3a128`: supersede bound to the section heading. The heading digest includes the section payload (`generate-doc-inventory.mjs:633`), so later edits to the section invalidate the binding.
  - Several rationales cite superseded digests or block numbers. The digests are correct; only the prose is stale.
- **Manifest rows (3):** contract, map, layers and rules are unchanged. Every `files` entry that was removed is a module deleted from disk.
- **Confinement section 13.2 rows (2):** the bound legacy unit f0b5e6c1 is carried byte-identically to candidate block 70 by reviewed `claim_19c1aba2`.

Status: DONE_WITH_CONCERNS
