Verdicts: 285 APPROVE / 0 REWORK

# G0 per-row verdicts, batch 1

Pin: `dbc8d6655fe9fb3b77f67930eb0c9a18cb91bb9f`. Input: `g0join/verdict-batches/batch-1.json` (285 rows). Records: `w24-g0-verdicts-b1.json`.

## REWORK reasons

None.

## Method

- Every row was read at HEAD at its `file` + `pointer`. Its stored digests equal the batch row, and `bindingSha256` recomputes with `ledgerfix/bindings.py` `digest()`.
- Target units were extracted with the repo's own extractor (`g0fix/extract-units.mjs`). The copy differed only in its scratch path, and ran with `node --no-addons`. For all 285 rows, the anchor is unique, `textDigest` equals `targetUnitDigest`, and the self-inclusive ancestry equals `targetAncestry`.
- Claim lineage followed `supersedesBinding`, `sourceRecord` and parent records. Source and predecessor texts came from a digest index over every historical blob of the 31 source and target paths. For headings, the section payload was compared, because the heading digest covers it.

## How the rows were judged

| Group | Rows | Basis |
|---|---:|---|
| Verbatim: target digest equals the claim source digest | 120 | Placement checked against the source ancestry; ADR number checked for the b-decisions rows |
| Verbatim to `sourceOrigins` (s11 candidate unit carries via s14 refresh) | 80 | Digests equal |
| Reference duties (s11 conservedClaims) | 11 | Holder section present with the cited content. The RUL11 locked line matches `RUL11_LAW`; the 0036 and 0054 narratives and §5.5, §7.4 and §8 are present |
| Only heading depth, links or whitespace differ | 48 | Includes all 44 w8 overlays; see the concern below |
| Real content change | 26 | Each row read one by one (reasons in the JSON). 19 equal what the legacy source itself became at HEAD (supersede, adapted or same-file successor). The others: friction verbs added (real, corrected in 6b8d84f9e), V-012 to V-013, YAML fenced, runner snapshots/partial carry equal to current runner.md |

## Concerns (non-blocking)

- **w8 overlays (44 rows).** The target `docs/platform/system-architecture/history/component-boundary-source-carriage.md` is absent at HEAD (`appliedToDocs: false`). The digests were recomputed on the prepared bytes of `g9/recomposed.json` spec 424, whose sha256 `d9cf0c43…` equals `expectedAfterSha256`. These approvals are valid only if F applies spec 424 atomically with the overlays. If the Lead requires presence at HEAD, flip these 44 to REWORK.
- **Stale rationale digests (s7 `/claims/24`, `/claims/25`; s2-exact-06 `/claims/126`).** The rationale cites pre-merge digests. The binding and the meaning are correct.
- **Legacy file as target (s4 `/registryGaps/21`).** The target owner is the legacy `docs/specs/confinement-authority.md`. At F it needs a delta rebind if that file retires.
- **Single-heading bindings (s14 `/bindingRefresh/1`).** The heading `0054 …` has an empty direct payload, so its digest does not cover the narrative in its `####` subsections. The narrative is present today.
