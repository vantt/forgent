# w8 review: the Lead's own rework fixes, at f2162d9ff

**8 APPROVE / 4 REWORK.** Full rows: [w8-lead-fixes-review.json](w8-lead-fixes-review.json).
Commits: 53499dc9d, 6c628b07e + c5586146c, 6f5b9419d, 984829939 + 5c3b57347, f2162d9ff.

All the code and data fixes hold. Three REWORKs are stale or incomplete records. The fourth is the G5 checker: it checks only half of the gate.

## How I checked

- I made a `git clone --shared` of W in `/tmp/fgos-work/w8-lead-review/` and did all runs there. Before running, I backed up the two files `misc-fix/verify.py` overwrites in its hardcoded `/tmp/fgos-work/w5-misc-rework/`, and I restored them byte-equal afterwards. The scratch is deleted. In W I wrote nothing except these two files.
- `misc-fix/verify.py` at f2162d9ff: **exit 0**, 95 s. The regenerated `checks.json` differs from the committed one only in HEAD sha and temp dir names. `g6SourceCommit` = 4178dcc6e.
- `rebind/rebind.py --check`: **exit 0**, drift 0. `misc-fix/rebind.py --check`: **exit 0**, 283 bindings.
- `archive/verify-design.py` at detached d3efc70c5, with W's `archive/` copied in: **exit 0**, `status: verified`. Its `verification.json` is byte-equal to the committed one.
- `g5/check.py` at HEAD and with `--pin 01e64719d`: both exit 0, and the rows equal the committed output. Two negative probes: a changed line 34 gives exit 1 with that span missing; a removed file gives exit 1 (an uncaught FileNotFoundError, which still fails closed).

## APPROVE

1. **Git spec sentence (53499dc9d).** The scanner has not changed since 87c4f5f7a. `declaredSiteId` returns `valueFlowCalls` escapes only for non-literal sites. `applyDeclarations` refuses any escape unless the class is `configured-binary` (line 2531). `.call/.apply`, an array slot (`stored in an array`) and `passed to an unresolved callee` (which is how `Reflect.apply` and `setTimeout` show up) are all real escape kinds. The aliased-export gap is now stated as open, and the owner request names the declared-wrapper inheritance. The parenthesis gives 4 of about 14 escape kinds; read as examples it is true.
2. **G6 pin in `misc-fix/verify.py`.** The replay, the assertion header `pin` and `source()` now all use `g6pin`. The owning section is still extracted verbatim. Freshness against HEAD stays with the combined verifier. `proof.py` widening its output guard to `/tmp/fgos-work/` is a scratch guard, not an assertion. Nothing is weakened.
3. **owner-answers L13-9 ruling 3** accepts the illustrative-placeholder rule and its 51 rows, and cites `sentence-delta.json`.
4. **`claim_26b3a49a…` move→merge.** `merge` is an existing disposition (34 rows) with the same field shape. `claim_d572bb9d…` (s10) stays the only `move` on block-45.
5. **`claim_5ba6768e…` correction** names both the id-mint clause and the `rigorToTier` clause, as the review asked.
6. **Binding fields unchanged.** The diff touches only `disposition` and `rationale`, and both rebind checks exit 0.
7. **Direct-link retention.** The 4 files / 783,918 B and the before/after partition (888→892 retained, 6,030→6,026 archived, 6,918 total) agree across the receipt, `receipt.json`, `verification.json` and the verifier rerun.
8. **Cold timing evidence and labels.** I recomputed all 16 residency snapshots: the per-file pages and bytes sum to the totals, and pages × 4096 equals the bytes. Each run's "before" equals the previous "after". Eviction went from 704,667,648 B to 0 in both variants. That number is the same in both because each timing clone is a full `--no-hardlinks` clone with the same 639 object files. Run 1 is `cold` in both variants and run 2/3 are `warm`, matching the rule "cold iff eviction proven and residency 0" (`rehearse.py:301`, re-asserted by `verify-design.py:208`). The medians 2.904 s and 12.439 s are correct.

## REWORK

1. **`misc-fix/receipt.md` still has stale claims outside the superseded table** (Low).
   - Line 82 says "3,939 bounded confirmations + 1,474 open judgment/note rows".
   - Lines 16–22 say `misc-fix/verify.py` exits 1 and that the exit-0 request "remains unmet".
   - Lines 88 and 93 say `proof.py --pin HEAD`.
   - The review's 3,990 / 1,260 / 1,423 totals were never added.

   **Fix:** in the 20:35 section add: "3,990 bounded confirmations (2,574 + 1,416) + 1,423 open rows (1,260 parks + 163 dated notes); `misc-fix/verify.py` now exits 0 (see checks.json); the G6 replay runs `proof.py --pin 4178dcc6e`." Then mark lines 16–22, 82 and 88–93 as superseded by that section.
2. **The `claim_2e2bc926…` correction is incomplete, and the receipt miscounts** (Low).
   - The review's lost clauses include `events.lock` and the `acquireSessionsLock` mirror. The L13-9 line names neither.
   - `rebind/receipt.md` says "checked all 217 rows: 217 APPROVE, 3 REWORK". That reads as 220 rows. The actual split is 214 rows approved and 3 rows REWORK; the 217 APPROVE count includes 3 non-row verdicts.

   **Fix:** add "`events.lock`, the `acquireSessionsLock` mirror," to that row's L13-9 sentence. Change the receipt line to "checked all 217 rows: 214 APPROVE, 3 REWORK".
3. **`archive/receipt.json` contradicts the Lead's run** (Medium).
   - 5c3b57347 left it at `status: blocked-external-real-disk-scratch`, `verifierExit: 2`, `rehearsalRerunCompleted: false`, `newTimingRuns: 0`, `coldCacheEvidence: false`, `checkARevalidated: false` and `runtimeExercised: false`, with the old `blocker`.
   - `receipt.md` line 3 still opens with a bold BLOCKED. Only line 55 supersedes it.

   **Fix:** update `receipt.json` from `verification.json` and `rehearsal.json`: `status` verified-local, `verifierExit` 0, `verifierStatus` verified, `rehearsalRerunCompleted` true, `newTimingRuns` 6, `coldCacheEvidence` true, `checkARevalidated` true and `runtimeExercised` true. Move the blocker to a `historicalBlocker` field, and add `leadRunCommit: 5c3b57347`. Add one line under the H1 of `receipt.md` pointing to the Lead-run section.
4. **`g5/check.py` checks only the first half of G5** (Medium).
   - Section 2 defines G5 as "each `retentionReceipts` span sha256 found at its file at F; **reading-map entry-union record keeps L11-25 banner and both compounding→knowledge lines**".
   - The script checks the legacy `docs/specs/reading-map.md` and `holder-lock/spec.md`. The legacy reading map is untouched on this branch, so that half is close to trivially true pre-flip. The union target that survives the flip is `docs/reading-map.md` (resync-b adjudications `entry-union-transition-banner` → `#3-transitional-note`).
   - That target is not checked, and it does not hold the spans byte-exact. Banner lines 3–9 are absent: §3 restates the rule in English. Line 34 is present only with an appended `**Truth correction:** …` (line 156). Line 37 is exact (line 159).
   - So `preflip-gate-status.json` G5 `met-local` overclaims.
   - Smaller issue: the output file is named `check-01e64719d.json` and the note says "at 01e64719d", but its `pin` is `working-tree@b726d44ed`. The docs are identical between those two commits, so only the label is wrong.

   **Fix:** add the union clause. Record, for each receipt span, its union-target location and accepted text in `docs/reading-map.md`, and have the owner accept the §3 restatement and the line-156 suffix. Check those rows too. Until then, set G5 to `partial` with this clause under `remaining`. Rename the output to `check-b726d44ed.json`, or rerun with `--pin 01e64719d`.

## Informational

- In `rehearsal.json`, `check-doc-retirement` exits 1 on both the baseline and the reduced side ("inventory shards unreadable"). Link parity from that check is a failure-parity result, not a pass. Rerun it at F with the shards present.
- `rebind/rebindings.json` row 36 still records `proposedDisposition: move` and the pre-correction `afterFileSha256`. That is acceptable as an apply record, because the receipt section documents the later change.
- The "cold" label covers the timing clone's `.git/objects` only, as `coldMethod` states. It is not a whole-system cold cache.

Not run: npm or cargo suites, the fgos CLI, impact analysis.
