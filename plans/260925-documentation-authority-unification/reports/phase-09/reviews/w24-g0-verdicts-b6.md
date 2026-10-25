Verdicts: 284 APPROVE / 0 REWORK

# G0 per-row verdicts, batch 6

Pin: dbc8d6655fe9fb3b77f67930eb0c9a18cb91bb9f. Rows: `g0join/verdict-batches/batch-6.json` (284 rows). Machine record: [w24-g0-verdicts-b6.json](w24-g0-verdicts-b6.json).

## REWORK reasons

None.

## Method

- **Digests.** For every row, I read the ledger row at `file` + `pointer` at HEAD. Its stored `bindingSha256`, `targetUnitDigest`, `targetAnchor` and `targetOwner` equal the batch row's values.
- **Binding hash.** `ledgerfix/bindings.py` `digest()` recomputes the stored `bindingSha256` for all 284 rows.
- **Target units.** I ran the repo's dual extractor adapter (`g0fix/extract-units.mjs`, with its scratch path redirected the same way `rebind/rebind.py` redirects it). It finds exactly one unit per target at HEAD with the stored anchor and digest. The self-inclusive ancestry also matches. 0 failures.
- **Meaning.** I followed each row's `supersedesBinding` chain back to the originating claim. I compared that claim's content (source unit, `sourceContent`, or authored placement content) with the current target text, using word diffs where they differ.

## Row classes

| Class | Rows |
|---|---|
| Verbatim: target digest equals `sourceUnitDigest`, and that source unit is still in the legacy file at HEAD | 148 |
| Candidate unit carries (s11, s12, s14): target text is byte-equal to the authored placement content | 98 |
| Heading units: same title, only heading depth or the composite heading digest changed | 17 |
| Resynced: target digest exists verbatim in the legacy source at HEAD | 10 |
| Same-file supersede, work-state: labelled A35/A37 corrections, all RUL ids kept | 4 |
| Individually judged: system-overview block-6 (pointer repoints to candidate holders); confinement locus truth correction (A40, step8-truth-corrections.json); io-contract supersede and partial carry (residual row 14 hash verified); two parked reference/backlog heading claims; vendored-yaml-parser heading | 7 |

## Earlier REWORKs on rows in this batch, now resolved at HEAD

- **claim_f5365b8e (b5):** the remainder now names the bound digest f62415e8.
- **claim_891db485 (b4):** the lock-fences and predecessorKillWaitMs text is gone, and the unit equals legacy distribution.md at HEAD.
- **claim_c87924f5 (b1):** the disposition is now supersede, with a labelled date correction.

## Notes

- **Legacy still stale (4 rows).** For the four s5 work-state rows, legacy `docs/specs/work-state.md` at HEAD still carries the pre-correction text (`tier`, old id minting). The candidate is the corrected successor. This is not a conservation loss, but the legacy file stays stale until cutover.
- **Link-anchor spelling (system-overview block-6).** This block links `knowledge-registry.md#spec-soạn--nuôi-…` with a double hyphen. That is the GitHub slug. The repo extractor's anchor uses a single hyphen.
