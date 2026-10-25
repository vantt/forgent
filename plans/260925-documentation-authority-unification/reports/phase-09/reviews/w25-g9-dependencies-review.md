Verdicts: 158 APPROVE / 12 REWORK

# W25 review: G9 dependency rulings and replay checks

Reviewed `e05261fc9` (decisions packet, F additions and checker) plus the Lead's checker fix in `ee2ce49c4`. Pin `56b3c3ebf`. Per-item verdicts are in [w25-g9-dependencies-review.json](w25-g9-dependencies-review.json): 158 entries and 12 cross-cutting items. Entries: 151 APPROVE, 7 REWORK. Cross-cutting items: 7 APPROVE, 5 REWORK.

## What holds

- **Population.** I re-derived it on my own. Parked dependencies naming Phase 9 across all 33 step-05 JSONL files come to 158 in 29 records, the same keys as the packet. The id, dependency text and physical-line SHA-256 match for all of them. A looser match on `blockedReason` adds 3 `citation-convention-and-scan` rows. Their dependency names a different packet, and `composition/member-joins.json` owns them.
- **Counts.** The Step-7 effective overlay gives 91 preserve, 9 patch and 58 parked. Of the 125 new entries, 65 are preserve, 6 patch and 54 parked. The packet's 54 is right; the brief's 53 is wrong. None of the original 33 decisions changed.
- **Sources.**
  - Retained rows quote L12-96 for their own file: decisions index (45), enduser index (35), architecture manifest (6), native Land (8).
  - The ratchet's 18 rows retire as one unit with the L12-89 guards, with the application condition stated.
  - The 17 retired clauses match claim-carries for operand and successor. Successor text is present, after the F chain where needed.
  - AGENTS rows reuse the existing AGENTS chain. The `decision-scope-to-holder-table` anchor exists in `governance.md` after the chain (line 504).
  - The backlog row is already done at the pin.
  - The two Lead proposals were accepted by L13-23.1. The packet still flags them as proposals because it predates that ruling.
- **Governance and map content checks.** Both reproduce. Governance differs only in the component-boundary link label; its H2 set is equal apart from the candidate metadata section. The map's diff is the phase-07 A45 CTR010/011/012/013 correction. A45 is not cited.
- **Gateway census.** `git grep` at the pin finds 40 files outside plans that use the full path: the 12 readers plus 28 exclusions, each with a reason. Basename-only hits are not reads of the old path.
- **Patch replay.** On the step-07 → effective composition chain built from pin bytes, all 22 additions pass three checks:
  - forward with `--fuzz=0`, no offsets, matching `expectedAfterSha256`;
  - reverse with `patch -R`;
  - `rollbackDiff`, back to the exact chain bytes.

  The stale S28 bin patch is disclosed correctly: its input hash is `4ad9ed0c`, the pin's is `1c50f564`.
- **Checker at `ee2ce49c4`.** Exits 0. All 25 self-test controls fail. Each fails on its intended rule except "outside move set", which trips "chain lacks successor" first. The move-set rule does fire when I remove the destination from the move set.

## REWORK

1. **Gateway doc readers vs G6 (high).** This covers entries 26-31 and the `gateway-g6-ownership` item. G6 shard-2/3 already owned these rows at the pin, and the packet does not account for that:
   - The packet says the three knowledge docs have no G6 owner. In fact G6 has f03917 (repoint, with patch), f04343 (preserve-confirmed) and f04357 (repoint, with patch).
   - Additions `/2`, `/4`, `/7` and `/8` repeat G6's own prepared retargets (f03917, f04357, f07976, f07985). Applying the G6 patch and then the addition fails with "Reversed (or previously applied) patch detected".
   - `/6` repeats f06837 at line 299. It also rewrites line 30, which G6 keeps as correction evidence (f06830 and f06831 are preserve-confirmed; the same line keeps its other old-path locators).
   - `/3` rewrites the f04343 historical footprint.

   Fix: cite the G6 row and its patch without adding a new one, and drop `/3` and the line-30 hunk. Only `/5` (config/spec.md) has no G6 owner.
2. **Map move, entry 155 (medium).** Addition `/1` (manifest `"map"` line 3) duplicates G6 shard-1 f00527's prepared repoint of the same line.
3. **Checker breaks on later record edits (high).** The branch moved to `b005d4eba` during this review, and `1ff225412` rewrote `shard-1.json`. The checker now exits 1 with "scan input drift: .../shard-1.json". It requires every `plans/` scan member on disk to equal its pin bytes, but `ee2ce49c4` only handled deleted files. Since `plans/` is excluded wholesale, read those files from the pin.
4. **Checker coverage (medium).** These mutations still pass:
   - removing every G6 row from the gateway readers and relabelling them as F additions;
   - setting an AGENTS successor anchor to a bogus value;
   - swapping the AGENTS successor path to `docs/reading-map.md`.

   The checker never reads G6 shard patches or `carries/pointer-patches.json`, so it cannot see duplicates or overridden preserve judgments. It runs the rg census only for the gateway. The decision-type rule hardcodes `RETAINED` instead of deriving it from the ruling.
5. **Supersession of carries patches (medium).** Additions `/9`-`/12`, `/17`, `/18` and `/19` restate `carries/pointer-patches.json` `/patches/19-22`, `16`, `14` and `3`. Nothing links them machine-readably, so F sees two prepared patches for the same lines. Add a `replaces` link to each, as composition does. Only bin `/13` is marked stale.
6. **Governance and map reader census (medium).** These moves list R26 code readers only. At the pin, live docs still cite the old paths: for governance, `documentation-system-design.md:44/165`, the intent ledger, the migration rules and the user and generated READMEs; for the map, `cli-io-contract.md:439` and `retired-decision-history.md:319`. The sampled ones have G6 proof rows (f06582-f06587, f08044, f08050, f08446, f03297). The packet records none of this, and nothing proves the census complete.

## Limits

This was a read-only review. Scratch work ran under `/tmp/fgos-work/` and was removed afterwards. I ran no product tests and no fgos CLI. I did not run the consolidated `park-judgments/check_shard.py`: it landed after `e05261fc9` (in `926000dbd`). The G9 additions should be rerun through it once the fixes above land.
