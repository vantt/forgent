Verdicts: 282 APPROVE / 2 REWORK

# G0 per-row verdicts, batch 5

Pin: cb6fa5fb5fc6fada041376ef437df8378721aed8 (HEAD when the file was written). The review ran at dbc8d6655. Between the batch pin 608a4ada5 and cb6fa5fb5, nothing changed under docs/, the ledger, composition/, src/, scripts/ or packages/; the two later commits only record batch 2 and batch 6 verdicts. There are 284 rows, and the machine-readable records are in `w24-g0-verdicts-b5.json`.

## REWORK

- **Binding does not carry the claim.** s14-resync-b.json `/bindingRefresh/8` (s11 `conservedClaims/7/bindings/0`, reference-004047). The 0032 collision test reads only runner.md and work-state.md. The platform-foundations retired-decision heading holds neither 0032 topic. Bindings 2 and 3 of the same record carry the claim, so this family-copied binding should be dropped or justified.
- **Stale delta accounting.** s10-systemic-native-predecessors.json `/registryGaps/4` (claim_e0fc7041). The rationale and reviewNote describe only the evolve citation change `bin/fgos.mjs:4373 -> 4415`, and the reviewNote says "no other word differs". The bound unit `a943adf3` also does three more things:
  - it replaces the required `modelPolicies` / `rigorToTier` text with family->tier->cell plus a Seat Binding config migration;
  - it adds the `runner.llmAccounts` pool reading;
  - it moves provider state to the holder-lock mutex.

  Re-decide the row with these clauses accounted for.

## How each check was done

- **Digests.** `bindingSha256` was recomputed with `ledgerfix/bindings.py` `digest()`. All 284 match the stored value and the batch row.
- **Target units.** Each target unit was re-extracted with the two embedded extractors (the `g0fix/extract-units.mjs` adapter, scratch redirected to a private tmp dir). For every row, the anchor resolves to exactly one unit, its `textDigest` equals `targetUnitDigest`, and the ancestry matches with the self-inclusive heading convention.
- **w9 overlays (90 rows).** These target `docs/platform/system-architecture/history/component-boundary-source-carriage.md`, which does not exist at HEAD (`appliedToDocs:false`). They were verified against the after-state of patch `w8:gap05:history` in `composition/patch-specs.json`. That after-state was rebuilt from the diff and its sha `d9cf0c43` was checked. Every overlay is a byte-identical move: its superseded source unit still sits in `docs/platform/component-boundary.md` at HEAD with the same digest. Each APPROVE holds only if the overlay is applied atomically with `w8:gap05:relocation` and `w8:gap05:history`.
- **Meaning checks.**
  - **Byte-identical carries:** 131 s14 rows, 11 agent-confinement rows, and 5 carries rows equal their source unit at HEAD. In the 12 advisory headings only the depth changed (## to ####).
  - **Link rebases** (s14 611 and 820, g0 126): every rebased link resolves.
  - **Supersedes** (g0 123/50/9, observe registryGaps/2): each replaced clause was checked against the code at HEAD: `hot-lock.mjs`, `event-log.mjs`, `identity-mint.mjs`, the `rigorToTier` refusal in `config.mjs`, `fgos-shell-integration.sh`, and `friction_cli.rs`. These three g0 rows had REWORK verdicts from earlier reviews, which judged them as promote/move. They are now re-decided as supersede, and the evidence holds.
  - **Partial carry** (observe registryGaps/0): residual row 2 keeps both changed source lines.
  - **Candidate-only units** (18 carries rows): only the new metadata fence was added, and the old "Document type" line moved into it.

## Notes (non-blocking)

- **Join double-counts three claims.** g0-content-redecisions `/bindingRefresh/124`, `/125` and `/126` each share their claim id and both digests with `/6`, `/20` and `/21` in the same file. Both rows of each pair remain effective groups in the join, so `join.py` counts each of these APPROVEs for two groups. The re-decision rows say they supersede the older ones, but no `supersedesBinding` link closes the older rows.
- **Rationale undercounts edits in `/bindingRefresh/124`.** It lists only the Workflow rename and the new foundation rows. The Execution Core row (seat authority moved to Seat Binding), the Dispatch Transport row and the Domain row also changed. Each change is backed by a cited decision, so the row stays APPROVE.
