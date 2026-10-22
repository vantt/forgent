# A38 Step 8 closure review, part A (Steps 0–5)

Reviewer: independent, read-only, fresh context. Worktree `/home/vantt/projects/forgentX-s8-review` at `373695db0c01c0f12f6fbccdf4469ab8760e6bc8` (confirmed with `git rev-parse`). It is a direct child of the author input `36a1a08fc`, and the only extra change is the scorecard plus small owner-answers/progress additions. The worktree is clean apart from an untracked `target-review/` directory (a cargo target dir that was there before this review; I did not touch it). Pinned bytes were read with `git show` / `git archive` into scratch. Extractors are the embedded `readOnlyScripts` / `scripts` of `reports/phase-06/step10-{sync4d,round5}-reproduction.json`, materialised unchanged in scratch. No worktree write, no git write, no fgos CLI, no `.fgos`, no suite run.

## Verdict: **rework**

The Step 0 binding integrity holds strongly: every recomputed digest matches and no approval was carried across a changed digest. Even so, I cannot close Steps 0–5 as scored. The Step 3 and Step 4 outcomes are not carried into the Step 7 handoff that the scorecard tells Phase 9 to execute. At least one real behavioral reader is untraced. Both of these hit Step 8 stop clauses: "untraced behavioral consumer" and "false green".

## Findings (false greens first)

### H1 — Step 3 final dispositions are missing from the Phase 9 handoff; the patch order uses superseded pilot records (false green)

- `reports/phase-08/step-07-assemble.py:320` builds Step 3 patch specs from `step-03-records-r3/`. That directory holds 4 pilot batches (001/002/040/041), last changed at `542093ce9`, 2026-10-20 01:58, which is before Step 3 closed at `0e5c9d2b4`. The final, accepted `step-03-records/` (130 batches, L12-56) is never read.
- `add()` is called only for `step-05-records` (`step-07-assemble.py:259-264`). The comment there says "Step 5 is the final owning-item join over the Step 3--5 census surfaces". That comment is false:
  - None of the 7,937 Step 3 edge keys and none of the 739 Step 4 slot keys appear as a `sourceOwner`/`inheritedOwner` of any Step 5 item. Step 5 has 553 owners, all of kind `step5`.
  - Example: the participant-contract edges `maps-j-04238/04242/04245/04247` appear in no step-05 or step-07 file.
- Measured gaps at the pin:
  - Final Step 3 has **830 prepared edges (596 patch + 234 phase9-row-flip) in 379 files**. Only 14 Step 3 specs are in `step-07-patch-order.json`, all from r3, so **373 files are missing**. Examples: `docs/platform/README.md` (18 prepared), `docs/io-contract.md` (6), `docs/platform/component-boundary.md` (5), and the Pilot B row 20 rewrite, now Step 3 patches `maps-j-04403..04406` in `batch-073.jsonl`.
  - **2,265 Step 3 parked edges and 43–45 Step 4 parks** are in no park handoff. The scorecard's "214 parks", "46,404 unique rows … no missing owning joins" and SC1 "214 owned parks" cover the Step 5 population only.
  - The 14 r3 specs disagree with the final records:
    - `docs/specs/runner.md` carries 10 r3 patch rows, but its final record has no edges (retiring tree, L12-34).
    - `docs/specs/reading-map.md`: `maps-j-08150/08169/08170` are r3 `patch` but final `parked`.
    - `docs/reading-map.md`: `maps-j-07977/07997` are r3 `patch` but final `parked`.
  - Of the final Step 3 records, 33 have a changed consumer source digest at the pin and one is missing (`docs/platform/session-identity/spec.md`). 30 of them are outside the patch order, so the L12-58(1) "deferred once to Step 7 final assembly" recomposition never happened for them.
  - The L12-121 post-move premise proof (9,650 preserves) does not cover Step 3's 4,804 preserves.
- **Correction:** assemble from `step-03-records/` (final). Emit Step 3 and Step 4 rows into the matrix, or into a separately counted handoff with its own disposition classes. Recompose the 34 changed or missing sources. Recount the parks and specs, then re-review integration on the corrected join. The current scorecard counts (226 specs, 214 parks, 46,404 rows) cannot be carried as the "exact Phase 9 handoff". This sits at the Step 7 assembly boundary (Part B) but falsifies the Step 3/4 carriage.

### H2 — Untraced runtime and setup readers of retiring roots (Step 5 / setup-doctor false green)

- `packages/identity/rust/src/mint.rs:247-301` (`highest_in_documents` / `decision_documents`) reads `docs/specs/*.md` headings, `docs/platform-foundations.md` and `docs/decisions/` to set the D-ADR / decision-file id floor.
- `src/setup/identity-checks.mjs:103-138` (doctor duplicate-id registry) reads `docs/backlog.md`, `docs/specs`, `docs/platform-foundations.md` and `docs/decisions`.
- `docs/specs/**` (16 files) and `docs/platform-foundations.md` are old paths in `step-05-cutover-move-set.json`. After the flip, the mint floor and the doctor duplicate-ADR check silently scan nothing. The counter ref still governs the mint, but the document floor and the doctor coverage are lost.
- These files were imported by L12-117 (`63b777873`, `744f01743`). They have no Step 5 record: they are not in any `step-05-records/*.jsonl`, nor in `step-07-readiness.json`, `-integration-inputs.json` or `-park-resolution-applied.json`. They exist only as unjoined lexical entries in `step-07-final-verification.json:censusRescan.newLiteralSites`.
- In total that rescan list holds **79 literal sites (21 reader, 2 default-root)** and **1,158 dynamic sites (181 reader, 172 default-root, 43 writer)**.
- The scorecard's "Setup/doctor registrations — met-with-carry, consumer roots prepared" is false for `identity-checks.mjs`. SC1 discloses the aggregate, but under Step 8 an untraced behavioral consumer blocks close.
- **Correction:** author Step 5 records with parity notes and exact cutover patch specs, or individually owned parks, for at least these readers. Also cover the other reader/default-root sites in the rescan, such as `packages/event-store/rust/src/legacy_import.rs:69`, the `.agents`/`plugins` `ak-cook-worker-contract.md:7` and `case-and-doors.md:5` (fix these via their `core/skills` sources). Do this before close, not as a Phase 9 carry.

### M1 — 81 changed bindings have no independent review at their current digest (contract: "Steps 7/8 … review changed bindings")

- Between the Step 0 input `f76861638` and the pin, 173 ledger/pilot target bindings changed. Of those, 92 match a digest that was independently reviewed (the Step 0 parts 01–04 and `review-a38-step-07-l12-101-rebinds.md`). **81 do not**: L12-27 (55), L12-57 (10), L12-117 (8), L12-112 (5), L12-44 (3).
- All 81 are honestly `pending` and none kept an approval, so this is not a false green. But the scorecard pushes "Review changed bindings" to Phase 9 (handoff item 2), while the contract puts it in the Step 7/8 review.
- My independent check covers part of it:
  - all digests and ancestry: done for every binding (see coverage);
  - all 8 L12-117 content diffs deep-read (only modified rows; no conservation loss);
  - L12-57/L12-27/L12-44 targets sampled; positions are consistent.
- The rest needs a reviewer-recorded verdict per row, or an explicit Lead ruling that Phase 9 owns them.

### M2 — The 47 judgments' "effective" dispositions are not current at the pin, and 10 have changed source digests with no rebind record

- The scorecard repeats L12-18's 2/21/24/0. Later rulings changed the outcomes:
  - rows 3–5 became retire-with-tree, no patch (L12-34, Step 3 `batch-006/046/053`);
  - rows 16/17 became Step 3 `parked` (P8-DOC-GAP-01/02);
  - row 20's rewrite became Step 3 patches that are dropped from the handoff (H1).
- Row 0 (generator) and rows 3–5, 16, 17 and 20 have no patch spec in `step-07-patch-order.json`.
- Ten source files changed after the Step 1 input `8b1d91078`: rows 35–39 (`docs/specs/reading-map.md`, `system-overview.md`), 42 (ratchet exceptions, where the occurrence count went 1→2), 43–45 (`decisions-corpus-retired.test.mjs`) and 46.
- I re-verified all ten at the pin:
  - each referenced line is still present verbatim and unique, shifted by at most 2 lines;
  - all 24 target sections are byte-identical, and all target anchors pass the unchanged `anchorExists`;
  - the queue hash matches.
- **My judgment: all 47 dispositions remain valid as judgments.** The records still need a current-disposition table at the pin, mapping each of the 47 rows to its final Step 3/5/7 owner and spec or park.

### L1 — SC2 "met" is bounded to Step 5 writers

The 51-writer check (`aliasWriterCheck`) is real, and I found zero writer edges in the Step 3/4 records. The 43 post-census dynamic writer sites in `censusRescan` are not alias-checked. The ones I sampled (`scripts/git/e3-bench.mjs`, `forge-probe.sh`, `git-one-door-scan.mjs`) write scratch, `.git` or state paths, not legacy docs. State this boundary in SC2.

### L2 — Records hygiene

- About 1,965 pre-Phase-8 ledger rows are `pending` with an empty `reviewNote`, unchanged since `f76861638`. That is an A47/Phase 9 matter and was correctly not claimed.
- The Step 0 rows keep `reviewStatus: pending` even though their review parts were ok, and 67/85 are still digest-identical to what was reviewed. This is conservative, but a reader can't tell that from the row itself.

## Verified true (no finding)

- **Step 0 binding currency, all bindings, both extractors:**
  - 9,711 rows; all **9,251** full 64-hex target digests are present at the pin under both the sync4d `lib.mjs` and the round5 `step10-sync287-lib.mjs` `unitsOf`. Zero drift, zero missing.
  - All **8,954** recorded `targetAncestry` values equal the pinned unit ancestry.
- **No stale approval:**
  - Every row that changed target, anchor or digest since `f76861638` is `pending` (173). Zero `reviewed` rows have a changed target. 15 went from reviewed to pending.
  - No `sourceUnitDigest`, disposition or `sourcePath` changed.
  - Every rebind file's claim ids are `pending` now.
- **L12-102 content-and-neighbour rebinding, 45 entries verified at the pin:**
  - Step 6b: 3 of 3. Historical text equals pinned text, and the previous/next digests match both witnesses.
  - L12-117: 8 of 8, neighbours matched.
  - L12-112: 3 still-current entries, neighbours matched.
  - L12-66: 21 anchor-only entries with identical text.
  - L12-57: 10 current entries with unit digests matched.
  - Six shards are covered.
- **Step 0 review joins:** 138 = 85 bindings + 6 exceptions + 7 manual conflicts + 3 auto-merges + 37 input pairs, matching parts 01–04. 67/85 reviewed bindings are still digest-identical at the pin.
- **Step 1 queue:** the hash matches at the pin (47 rows). The review report confirms a 47/47 deep read at `1b8603207`.
- **Gateway parity receipt:** the legacy and candidate (`docs/platform/herdr-web-dashboard/contracts/`) YAML have the same sha256 `9f200578…` at the pin. `gateway.rs:1190` is still the active legacy reader, as recorded.
- **Alias writers in Step 3/4 records:** zero, against 1,559 effective old paths.

## Coverage

| What | Count checked |
|---|---|
| Ledger/pilot bindings: digest recompute | 9,251 of 9,251 (both extractors) |
| Ancestry recompute | 8,954 of 8,954 |
| Changed bindings traced since Step 0 | 173 of 173 |
| Rebinds verified by content and neighbours | 45 entries across 6 shards (minimum required: 40) |
| Content-change deep reads | 8 (L12-117) plus 12 sampled |
| Step 1 judgments | 47 of 47 joined to the pin, 10 changed re-judged, 24 target sections plus anchors |
| Step 3 records checked for source currency and handoff | 1,037 of 1,037 |
| Step 3/4 edges joined against Step 5 owners and patch order | 7,937 and 739 |
| Census-rescan sites classified | 79 literal and 1,158 dynamic; 23 reader/default-root literal lines read at the pin |

## Lead questions

1. H1: is Step 3/4 meant to be carried by the raw `step-03-records/` and `step-04-records/` alongside the matrix? If so, the scorecard and readiness must say so and count those parks and specs. Either way, the r3-derived specs must be replaced.
2. M1: should the 81 unreviewed changed bindings be reviewed in this closure round, or does a Lead ruling move them explicitly to Phase 9? The contract places them in Steps 7/8.
3. H2: given that the Identity mint and doctor checks landed after the Step 2 census, should every post-census reader/default-root/writer site get a Step 5-grade record before close, or only the behavioral ones? I recommend all 181+21 readers and 43 writers be triaged individually.

Status: DONE
Summary: Rework. Step 0 bindings are fully current: zero drift and zero carried approval across all 9,251 bindings with both extractors. But the Step 7 handoff drops the final Step 3/4 dispositions (830 prepared Step 3 edges and 2,265 Step 3 parks, built from stale pilot r3 records). Real runtime and doctor readers of `docs/specs` (Identity mint, `identity-checks.mjs`) are also untraced.
