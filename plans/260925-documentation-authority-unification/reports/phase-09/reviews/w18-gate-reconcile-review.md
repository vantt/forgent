# W18 review: gate register reconciliation (969425890)

**5 APPROVE / 1 REWORK** on the six met-local claims (G3, G4, G6, G7, G9 approve; G2 rework). All 16 `cleared` entries are supported by the reviews they cite. Plus 5 Low/Info findings.

- Commit reviewed: `969425890`, brief `w17-gate-register-reconcile-brief.md`, inputs pinned at `53de2207e`.
- Read-only. No git write, no fgos CLI, no suites, no native addons.

## Proofs run

| Command | Exit |
|---|---|
| `python3 -B P/gate-reconcile/verify.py` | 0 |
| `python3 -B P/gate-reconcile/controls.py` | 0 (7 controls) |

`verify.py` rewrote only `verification.json` `checkedAtHead` (53de2207e to 969425890). I restored it with `git checkout`. The tree is clean.

## What I checked

**Coverage.** The old register has 87 entries (12 gates × blockers + remaining, plus 6 + 19 + 6 in cutoverReadiness). `receipt.json` has a decision for all 87. No entry disappeared without being cleared, moved to F, or kept open.

**Cleared entries (16).** I opened each cited review and traced every REWORK to its fix and re-review:

- **G0 content re-review:** W14 found 121 APPROVE / 3 REWORK. The 3 were fixed in c25e8cf6a, and W16 A passed them. W16 F1 was fixed in a8ea05c50, and W17 passed it except W17-1, which is known and L13-16. W16 F2 is deferred by L13-15.2.
- **G1 members, GAP-05, citation drift, import-3:**
  - W8 composition: 164 APPROVE / 19 REWORK.
  - W9: 17 / 2.
  - W10: 9 / 1. F10 was approved in W11 gloss-16.
  - The W11 gloss REWORK goes through W12 (M1-M3 open), then W13 B-pass, then W14 pass.
  - L13-11.2 approves GAP-05. L13-11.3 defers the 130 main-owned glosses to F.
  - W14-import3 approves 98/98.
- **G4:** W8 `git-spec-escape-sentence` APPROVE on 53499dc9d.
- **G6:** W8 `misc-verify-g6-pin` APPROVE on c5586146c. W8 parks gave 1,220 / 40 and W8 judgments gave 163 / 1. W9 gave 7/7 APPROVE on db023f065.
- **G7:**
  - g7-c1..c7 total exactly 385 APPROVE / 2 REWORK over 387 specs.
  - Both REWORKs are approved in W8.
  - All 6 REWORK park files and both supplemental groups (system-overview, architecture-intent) are approved in W9.
- **G8:** W14 approves retention and timing. Its REWORK (`w8-archive-receipt-json-stale`) correctly stays a blocker.
- **G9:**
  - W10 REWORKs are approved in W11.
  - W11 REWORKs are fixed through W12–W14.
  - The W15 ACCEPT_WITH_FIXES items are fixed in 33cc5539d, and W16 B passes them.
  - Every clearedBy commit is the one its review examined, and each is an ancestor of HEAD.

**Counts checked against sources:**
- 25 pending rows in `carries-current-rebindings.json`, 8 of them with a changed target digest.
- 4,320 + 924 + 163 + 6 = 5,413.
- 526 / 15 / 31 / 2 and 546 bodies (W16).
- 98/98 (W14-import3).
- Archive figures 6,918 = 6,026 + 892 and 783,918 B (W8).
- No `refs/archive` or `refs/heads/archive` in the repository; only unrelated `refs/tags/archive/*` exist.

All are correct.

**Moved to F.** Most F items were already in the old `atFinalPinUnderLease`, or are sourced from L13-9.4, L13-11.3, L13-13.3/4, L13-15.2, L13-16, or the execution plan's W3/W4 wave text. The exceptions are F1 and part of F3.

## Findings

### F1 — Medium — REWORK — G2 met-local rests on an unsourced F deferral of the 187 original owned judgments

- The new G2 F item adds "settle/review the 187 original owned judgments". That clause is not in the old register.
- No L13 ruling defers it. L13-9.4 covers only the 33 Rust locators and the verifier pin. Execution plan W3 names only "post-pin census literals (G2)" and "delta reviews G2".
- `census-join/receipt.md:32` says the 187 judgments "remain Lead custody".
- Execution plan §2 G2 "Met" requires each of the 1,126 ids to be joined to an owning proof or a confirmed REJECT. The 187 are neither.
- This is local Lead work with no dependency on F. G2 is therefore not met-local as defined by the brief.
- The 8 post-pin literal judgments are fine: plan W3 places post-pin literals at F.
- **Fix:** either record a Lead ruling that defers the 187 judgments to F (they are digest-bound at the pin and would be re-judged at F anyway), or list them as a before-F Lead item and set G2 to `partial`.

### F2 — Low — NOTE — G9 note overstates review coverage of the former 338 parks

The G9 note says "All former 338 mechanical parks were reviewed". W15 checked these exhaustively: the 5 owned parks, the 32 superseded and the 13 recomposition rows. It **sampled** 60 of the 288 still-valid rows, with 0 wrong verdicts. The old demand was Lead re-judgment, so clearing the item is acceptable. Reword the note as "re-judged in 63c884240; W15 exhaustive except a 60/288 still-valid sample".

### F3 — Low — NOTE — G6 "exhaustive" wording and one unsourced F item

- W8 parks/judgments are exhaustive over the population **before** db023f065. That fix then confirmed 319 former parks plus 20 operand rows under new rules. W9 approved these at rule level, with negative controls and a 56-row spot check, not row by row. The G6 note should disclose this.
- The new F item "co-compose … owned-park actions" cites the preserve-premise receipt and the W9 review. Neither places the owned-park actions at F. L13-10 calls every park a "pre-flip Lead action". The dated notes legitimately need the flip date; the owned-park rechecks need a Lead ruling to sit at F.

### F4 — Low — NOTE — G6 c5586146c clearance covers only one of its two W7 REWORK fixes

The old blocker was "c5586146c (w7 REWORK fixes)". W8 approved the verify.py pin (`misc-verify-g6-pin`), but it REWORKed the misc-fix receipt counts (`misc-receipt-stale-claims`). The Lead fixed those counts in 25e8842d3, which has no named independent re-review; W14 re-reviewed only the archive part of 25e8842d3. The substance is small, and W9 independently confirms the current totals. The cleared entry should still name 25e8842d3 and say how it was checked.

### F5 — Low — CARRY — W16 F5 dropped silently

W16 F5 says that the duplicate effective rows `/bindingRefresh/124..126` (g0-content-redecisions) must follow any later in-place rebind of `/6`, `/20` and `/21`, or the stale-pointer defect returns. W17 did not address it, and neither the register nor the receipt mentions it. The a8ea05c50 rebinds do not touch those rows (all 25 are in s11 `/unitCarries`), so nothing is broken now. Add it to the G0 F join duty.

### F6 — Info — receipt labelling and citations

- `receipt.json` `/cutoverReadiness/beforeFinalPin/4` is labelled "still open", but its only part is cleared and it is gone from `beforeFinalPin`. `/gates/9/blockers/1` is labelled "moved to F" while its part is cleared.
- The G3 F item cites "execution plan §3 W3", but W3 does not name G3. The F placement comes from the old register itself, so this is not a new deferral.
- G9 cleared item 1 cites W12, which still has M1-M3 open, but not W13/W14, which close them.

## Plan follow-ups

- Fix F1 (ruling or G2 → partial) before the cutover packet treats G2 as met-local.
- F2–F6 are wording or carry edits in `preflip-gate-status.json` and `gate-reconcile/**`.
