# Review: import 3 bindings, per row (G1)

Verdict: **APPROVE, 98 of 98 rows.** No REWORK.

- Pin: `0763c2259`. HEAD moved during the review to `f67e0f676` and then `c767bc45c`. Those commits add only review and plan records: `docs/` and `ledger/` are byte-identical to `0763c2259` and to `d786e305e`.
- Reviewed commit: `d786e305e`.
- Machine record: [w14-import3-binding-review.json](w14-import3-binding-review.json). Every verdict is bound to `{claimId or file+pointer, bindingSha256, targetUnitDigest}`.
- Read-only review.

## Scope

I diffed every list in the six touched shards between `d786e305e^` and `d786e305e`. 98 rows changed or were added, and all 98 end `pending`. The list below is the full set, not a sample.

| Shard | Rows | What changed |
|---|---:|---|
| s18 `sourceBindings` | 24 | New: 16 exact, 8 adapted (rows 1, 2, 16, 17, 18, 19, 22, 23) |
| s8 `claims` | 28 | 11 materialized origins and 17 current-byte rebinds. 19 of them were `reviewed` before and are now downgraded |
| s14 `unitCarries` / `bindingRefresh` | 5 / 33 | 11 rows include a `supersedesBinding` refresh |
| s12 `nativeIdentityGaps` | 4 | Rebind |
| s17 `bindingRefresh` | 3 | Rebind (reading map) |
| s3 `registryGaps` | 1 | Anchor shift 68 to 71 |

## Method

I did not use the Doer's frozen copies or its scripts.

- **Extractor.** Production `extractMarkdownConservationUnits`. I computed ancestry from the heading stack myself, self-inclusive for headings.
- **Hashes.** Recomputed for every row: sha256 of the sorted, compact `{targetAncestry, targetAnchor, targetOwner, targetUnitDigest}` JSON plus LF. Where a row omits the digest or ancestry (s3, some s12), I derived them from the target bytes at the pin.
- **Results.** 98/98 match on hash, target digest and ancestry. No bound target unit has a duplicate text in its file.
- **Sources.** I resolved every source digest in the legacy file history: 571a996f5, HEAD, and the earlier commits abe31e389, 056dac663, c3272bc6f, 5a33989fa, 022c0ee67, bc5589ed7 and d9bedf229. All 24 s18 sources match at both 571a996f5 and HEAD on digest, ancestry, line range and content.

## Content findings

- **The import delta lands word for word.** Eleven target units changed text: spec blocks 1, 4, 55, 59 and 66, rollout blocks 3 and 6, decisions block 3, seat blocks 38 and 62, and reading-map block 16. For each one, the before/after word diff equals main's `571a996f5^1..571a996f5` change to the matching legacy unit. Nothing extra was added and nothing was dropped.
- **Rows with unchanged text** shifted anchor only (+3 after the new §9.3 blocks), or are headings whose digest moved because their section payload changed. In all of them the title or text is byte-identical.
- **Historical-source rows** (s8, s14, s12, s17, s3) now point at a target equal to the current legacy unit, or at a declared adapted holder. I applied the settled w7 convention: `sourceUnitDigest` is the historical identity.
- **Placement is correct:**
  - §9.2 tail, §9.3, the banner and §11.3 are in `spec.md`.
  - The S3 row and settled facts 5/7 are in `history/rollout-and-settled-facts.md`.
  - The §12 row is in `decisions/confinement-authority-decisions.md`.
  - Item 2 and the dated bullet are in `seat-binding/spec.md`.
  - Two entries are in reading-map section 5.

### The 8 adapted rows: all declared and justified

| Row | Adaptation | Judgment |
|---|---|---|
| 2 | Banner. The 9-probe clause is verbatim. The earlier live-migration and invocation truth correction is kept | The same correction already exists in s14 `retained-truth-correction` |
| 17 | Settled facts. The fact-5 clause is verbatim. CTR011/A45 is kept | Matches s14 `retained-authority-correction` |
| 23 | D-ADR0072 body. The dated bullet is verbatim. Only the `runner.md` and component-boundary links are rebased | Both new link targets exist |
| 19 | Reading map. Both imported entries are verbatim. Line by line (69 to 69, no line dropped), the other replaced lines are the earlier reviewed corrections | Reviewed earlier in w5 misc-fix (no `plans/reports/` in the reading map) and w13 |
| 18 | Legacy H1 mapped to the section 5 heading | Declared single detailed-map holder |
| 1, 16, 22 | Heading title is verbatim. The payload differs only by the child units above or by candidate scaffolding | Each of those child units is bound by its own row |

## Concerns (non-blocking)

1. **The materialized s8 origins now equal their s14 overlays.** For 11 pairs, the s8 row and its overlay have the same owner, anchor, digest and hash, so the supersession no longer records in the ledger what it replaced. The prior identity survives only in `import3/binding-refresh.json` (`directOriginMaterializations`). That file must stay with the ledger.
2. **Stale reason text.** In s8 claims 0, 2, 157, 161, 163, 172, 179 and 182, and in their s14 overlays, the retained original reasons ("full native unit digest is equal" and "Full unit content preserved") describe the historical source, not the current target. This is consistent with the w7 convention. The w7 open question about refreshing `sourceUnitDigest` at cutover still applies.
3. **Leftover scratch on the host.** `/tmp/fgos-work` still holds other reviewers' leftovers, for example `w14-g0-review`, `p8-audit-*` and `acct*.json`. `w11-import3` is gone. My own directory is removed.

Status: DONE
