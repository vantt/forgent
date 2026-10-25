Verdicts: 283 APPROVE / 2 REWORK

# G0 per-row binding verdicts, batch 4

Pin: `cb6fa5fb5fc6fada041376ef437df8378721aed8`. The work was done at `dbc8d6655`. The only commits since then add the batch 2 and batch 6 review files; `docs/` and the ledger and pilot decision shards are byte-identical. Ruling: L13-22. Input: `g0join/verdict-batches/batch-4.json`, 285 rows. Machine-readable verdicts are in `w24-g0-verdicts-b4.json`.

## REWORK

Both rows bind `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-36`. The link-destination rewriter changed text inside an inline code span in the RUL95 clause (line 191). `docs/specs/runner.md:1123` has `` `d['executeAssignment'](a)` ``, but the target now has `` `d['executeAssignment'](../../../../specs/a)` ``. The bound unit therefore misquotes the code example.

- `s13-resync-a.json /sourceBindings/453`: the code span above is corrupted. The disposition also says "only heading depth, link destination or whitespace adaptation". That is not true against the bound source digest, which still says "24 hours by default" for `retainFailedPaneMs`; the target has the later main wording, "nothing closes it".
- `s5-root-authorities-boundary-gaps.json /registryGaps/3` (claim_f033905b…, partial-carry): the same code-span corruption is in the bound unit.

Fix: restore `(a)` inside the code span in the candidate file, rebind block-36, and fix the link rewriter so it skips code spans. My scan found no other corrupted code span in this batch.

## How each row was checked

1. **Mechanical.** All 285 rows passed:
   - The batch row matches the ledger row at HEAD.
   - `bindings.digest(row)` equals the stored `bindingSha256`, using the canonical four-key recipe.
   - The target anchor is unique, and its `textDigest` equals `targetUnitDigest`. The target units come from `rebind.extract`, which runs the unchanged dual extractors in a temp-directory copy.
   - `targetAncestry` equals the extractor ancestry, including the heading itself.
2. **Claim source.** I followed `supersedesBinding` back to the originating row, then took the source text from one of three places:
   - its `sourceContent`;
   - `sourceOrigins` resolved by digest through `git log` of the source path;
   - for s4 claims, the source path from the `claimId` in the identity registry, then the same digest lookup.

   All 281 source-bearing rows resolved. Two rows are new candidate units, and two are test-reader `conservedClaims`.
3. **Meaning.**
   - In 264 rows the target text equals the source text after removing heading depth, link destinations and whitespace.
   - I resolved every link destination separately. Five rows point to different files (repointed to docs/platform candidate successors, to retired-engine snapshots, or the restored legacy topology link). I accepted them as the planned link pass, as the documented engine retirement, or as the g0-b1 fix.
   - I read the 21 remaining rows one by one: authorized A37 or N1 truth corrections, labelled status notes, the agent-coordination README supersedes, the knowledge-registry header split, the RUL104 law equality, and the retired-section marker count.

## Notes (did not change any verdict)

- In 38 s4/s5/s10/s14 rows the rationale prose names an older synthetic anchor (for example `#unheaded-block-60`) while the binding is `-61`. The SHA256 in the prose matches the stored digest, so the drift is in the prose only.
- `s14 /bindingRefresh/60`: the candidate unit's 20 `sourceOrigins` are identical one-line boilerplate from five legacy files, matched by digest. The origin list over-attributes them; no content is lost.
- `s13 /sourceBindings/877`: the disposition reason leaves out the inserted RUL108 supersession label. The source content is fully present.
- `s14 /bindingRefresh/474`: the line "Document type: Contract" moved from the bound block into the same file's metadata fence.
