# Fact-check: plan 260925 retrospective series (evidence pack + posts 1-6)

Date: 2026-11-05. Reviewer: independent fact-checker (read-only). TAG = `archive/doc-260925-lineage` (`84bbfa7b8`), P = `plans/260925-documentation-authority-unification`.

## Verdict

**REWORK.** 13 claims are WRONG and 2 are UNSUPPORTED. Most of the numbers hold: every cited sha exists with the stated date and subject, and all 10 headline numbers reproduce. The defects are in narrative order and in several "how it ended" statements. Three of those were stated as unresolved, or resolved a different way, when the cited source itself records the outcome: the pilot's E6/E7, the per-edge review, and the owner-decision count.

## Method

- Every cited sha: `git show -s --format='%h %ci %s'`. All 60 exist; dates and subjects match except where noted below.
- Numbers re-run: `git ls-tree` counts at the 5 sample commits, the 935/868 join, `rev-list --count $(merge-base main TAG)..TAG`, a by-month and by-day split, `ls-tree -r -l` sizes and blobs, review-file grep, `--shortstat` and `--name-status` on `97dd62aa7`, `c7a354e1d` and `159971615`, `node scripts/doc-health.mjs`, the alias-table entry count, `git ls-remote --tags origin`, and grep of the A/L ids in the four `owner-answers.md`.
- Quotes: checked by `git show <sha>:<path> | grep` or by TAG path.

## Claims table

| # | Post | Claim (short) | Verdict | Evidence / correction |
|---|---|---|---|---|
| 1 | 1 | Root `f6139bf57` 07-13 11:34, LICENSE only | VERIFIED | sha date matches |
| 2 | 1 | `a21d9446c` READEME.md + naming.md, 2h later | VERIFIED | name-status A READEME.md, A docs/naming.md |
| 3 | 1 | `2930a89fc` reference learning + `scripts/ref-delta.sh` | VERIFIED | |
| 4 | 1 | `ebc6e8047` compound quote + central question | VERIFIED | `compound-engineering.md:10,14` |
| 5 | 1 | `e9ff70db7` 00:28, L1-L8, L5 "Câu 6..." quote, supersede rule | VERIFIED | `platform-foundations.md:12-13,135-136` |
| 6 | 1 | `ad65f59fd` 02:26, 4 files in docs/specs, reading-map quote | VERIFIED | |
| 7 | 1 | Phase 3 commits; `15ddd61e8` "full evidence lives in the workshop's benchmark report" | VERIFIED | commit body line 6 |
| 8 | 1 | `3ee30977a` done gate + e2e test; `1739a83d5` "thin, honest document" | VERIFIED | |
| 9 | 1 | `c93aa4acf` 9 ADRs from 17 decisions | VERIFIED | commit body |
| 10 | 1 | divorce `e99998633` 07-14 / `2bbd8f70f` 07-28 | VERIFIED | |
| 11 | 1,2 | docs 365→4,301 (≈12×) 08-01→09-25 | VERIFIED | ls-tree at `6e0e3c017`, `cfdaf4bc9` |
| 12 | 2 | File-count table (5 rows) | VERIFIED | 365/11/0, 1500/12/0, 2116/12/0, 3239/13/0, 4301/13/1005 reproduce |
| 13 | 2 | Method: "commit cuối cùng của main trong ngày" | WRONG | The 08-29 row is `9235bbe19`, committed **08-28** 21:33; main had no commit on 08-29. R-middle's real method is "last commit at or before 23:59" |
| 14 | 2 | docs/history 535→1,115 (08-08→08-15) | VERIFIED | `681ae1933`: 535; `36e0602fd`: 1115 |
| 15 | 2 | 08-25 report: 268 docs, +50/7 days, `fs.existsSync` | VERIFIED | report lines 31-37 |
| 16 | 2 | `4722361ae` moves 34 ADRs; message cites AGENTS.md pointers | VERIFIED | commit body lines 3, 30 |
| 17 | 2, pack | `4270c0c0d` "Năm giờ sau" | WRONG | 21:26:46 → 22:25:20 = **59 minutes** (author and commit dates are identical) |
| 18 | 2, pack | Guard `decision-citation-drift.md` "được thêm vào sau khi đã có link chết" | WRONG | The guard predates the move: `41af242e7` (script) and `510abb006` (spec), both **2026-07-27**. `4270c0c0d` only updated its baseline and fixed the sweep |
| 19 | 2 | tsk-5mh 332 docs, one commit each; 137/20/6 left; 332=332 topics | VERIFIED | ls-tree `cfdaf4bc9` knowledge 332, explanation 137; review :119,:121 |
| 20 | 2 | architect/agent-coordination 14/473/905 | VERIFIED | at `9235bbe19`/`284b95733`/`814711731` |
| 21 | 2 | 566 non-md payloads; reader inventory missing | VERIFIED | authority map :128, :145-146 |
| 22 | 2 | `23fb220e3` "Accepted" / "Implementation: Partial" | VERIFIED | doc-governance.md:7-8 |
| 23 | 2 | `e1307d33f` 943 A, 4 M, 0 R, 0 D | VERIFIED | `--name-status -M` |
| 24 | 2 | 935 shared paths, 868 identical, 67 differ | VERIFIED | blob join at `81437ffff` |
| 25 | 2 | Law sizes 16,398 / 33,845 / 3,341; reading maps 2,993 / 29,870 | VERIFIED | `git cat-file -s` |
| 26 | 2 | AGENTS.md 8-10/38/46 point at the old tree; 25 refs in 22 files; platform-laws anchors at root | VERIFIED | |
| 27 | 2 | Map: 3 promoted / 3 candidate / 12 legacy-current; "conflicted" quote | VERIFIED | area table (root-document table counted separately) |
| 28 | 3 | governance 458 lines, portal 79 lines, §13 "Migrate one area at a time..." | VERIFIED | |
| 29 | 3 | Proposal: Last reviewed 09-20; `ca854f443` 21/9 23:23; 991 lines; subject | VERIFIED | numstat 991/0 |
| 30 | 3 | Three proposal quotes (incl. "without chat history") | VERIFIED | proposal :23, :30-39 |
| 31 | 3 | `a725d4788` 13:57, snapshot `ac19f6d1e`, two map quotes | VERIFIED | map :6-7, :12 |
| 32 | 3 | Order: truth reset **first** ("Trước khi chạm vào file nào"), "Sau đó là hai review" | WRONG | The reviews came first and caused the reset. Opus rec 1 (:190): "Phase 00 must first inventory the current authority state"; it also notes "the Phase 00 edits were made [on main]" (:108). The re-review says the plan "incorporates critical corrections from the prior review". The map and both reviews landed together in `a725d4788` |
| 33 | 3 | Opus verdict, "clean two-system" quote, C1, C2, shell-blocked limits | VERIFIED | review :4, :14-16, :23, :34, :41 |
| 34 | 3 | Gemini re-review verdict; "thêm bốn phát hiện" H1/H2/M1/M2 | WRONG | Verdict verified (:7). There are **five** findings: L1 (:38) is also listed |
| 35 | 3, pack | "Ngày 26/9: plan ra đời" (`2085d88fe`) | WRONG | `plan.md` was first committed on the plan branch at **`a725d4788` (09-25)**, already 724 lines, with "Phase 00 authorized and completed". `2085d88fe` is the main-side copy (704 lines; `a725d4788` is not its ancestor). Post 4 itself closes Phases 1-3 on 25-26/9 |
| 36 | 3 | `2085d88fe`: 10 files, +1,524; header, formula, "cleaner-looking" quotes | VERIFIED | |
| 37 | 3 | Decision 5 quote | VERIFIED | plan :97 |
| 38 | 3 | Decision 12 means "every claim counted, none dropped silently" | OVERSTATED | Decision 12 reads "No scope reduction by omission. Deferred architecture is recorded with a revisit trigger in the intent-preservation ledger." Per-claim conservation comes from the mission (:17-18) and decisions 2 and 6 |
| 39 | 3 | knowledge-registry plan demoted to "historical implementation plan" | VERIFIED | |
| 40 | 3 | `4d80eaf29`: "plan.md 704 dòng rút lại thành index", 10 phase files | WRONG | The 10 phase files are verified. On the branch, `plan.md` was **800 lines → 454** at `4d80eaf29`; 704 is the main-side copy |
| 41 | 3 | No commits on the plan branch from 09-30 to 10-05 | VERIFIED | per-day counts: 09-29: 5, then 10-06: 42 |
| 42 | 3 | Advice report: `capability: code:*` | VERIFIED | advice :11 |
| 43 | 3 | Synthesis H6 + "Em đã nói sai..." quote | VERIFIED | synthesis :152 |
| 44 | 3 | Resume: 400/59, 4,305→4,311, 85,772→86,085, exit 134 (4 GB) / 137 (7.5 GB, 44 min), ~250 MB, 43 UNPROVEN | VERIFIED | resume report :9-10, :21-27, :36-37, :45 |
| 45 | 4 | Phase table dates | VERIFIED | R-cost §2; tags `-phase-01..04-` dated 09-26/09-26/10-06/10-07 |
| 46 | 4 | `gateway.rs` still read `docs/contracts/...` | VERIFIED | `e1966d417:gateway.rs:1190` (runtime read) |
| 47 | 4 | Pilot: 16 drops `dropped-002..017`, M-01..M-23, M-05 3,589 lines / 1,179 files | VERIFIED | pilot-method-defects :13, :57 |
| 48 | 4 | M-05 and M-09 are "hai lỗi nặng nhất" | OVERSTATED | The source says "two defects that matter for Phase 6" (:57); it ranks no severity |
| 49 | 4 | E6 14/20, E7 15.6%, first verdict "Not PASS" | VERIFIED | :42-43, :51. The cited "§2" is the scorecard; the verdict is §3 |
| 50 | 4 | "Nghiên cứu chưa truy được E6 và E7 cuối cùng được đóng thế nào" | WRONG | Same file §5 (:67-69): the owner ruled METHOD-MUST-CHANGE, then after a fix round **E6 met (19 of 20), E7 met (redefined)**. §6 (:73): PASS-WITH-AMENDMENTS (owner, 10-07) |
| 51 | 4 | Phase 6 close: 160/160, 114/114, 0 fatal, 0 pending, 9,236 aliases, 68,441 rows, "author-written" quote | VERIFIED | step-10-report :7, :17-24 |
| 52 | 4,5 | A12 quota stop 9/10 (:63) | VERIFIED | |
| 53 | 4,5 | A22: 99 findings (47/50/2) from 21 fixes (:102) | VERIFIED | |
| 54 | 4,5 | A28 10-11: T6 dropped, 30-unit sample; owner quote; 1.8% | VERIFIED | oa6 :124-127; memory note |
| 55 | 4 | Per-edge packet 338 / 20,030 / ~57 MB / 3,889; 5,427 edges / 1,036 files / 1,018 mappings | VERIFIED | oa8 :195 |
| 56 | 4 | Seven regenerations 02c-02j; 106/1,275 = 8.3%; 15/22 parts | VERIFIED | oa8 :282 |
| 57 | 4 | "Cuối cùng gói này bị 'superseded, not reviewed', và các lớp quy tắc được đưa vào checker (L12-21..26)" | WRONG | The 338-part packet was superseded at **A50 (owner, 10-19, oa8 :197)**, before the regenerations. The regenerations ended with **A51 (owner, 10-19, oa8 :280-286)**, "đồng ý phương án 2": the census became a mechanical inventory, and patches were authored and reviewed per consumer file in Step 3. L12-21..26 "remain the authoring rules for Step 3"; they were not moved into a checker |
| 58 | 4,5 | Phase 9: 23/10→3/11, 11 days; 942 commits over 12 days, peak 139 | VERIFIED | |
| 59 | 4,5 | Red partial merged ~27/10, broke proof runs | VERIFIED | memory note (exact date 10-27, `061afdc1b`) |
| 60 | 4 | 30/10 oracle: 8 changes, 5 loosened; "0 unexcepted differences" | VERIFIED | memory note |
| 61 | 4,5 | 29/10 11:14 owner quote; 10-31: 124, 11-01: 135 | VERIFIED | |
| 62 | 4,5 | SSD 765 ms on 10-22 | VERIFIED | memory note |
| 63 | 4,5,6 | Lease removed: `c7a354e1d` 39 files +182/-2,734; merge `ad72e3a46` 15:46 | VERIFIED | shortstat |
| 64 | 5 | 40 / 41 days | VERIFIED | inclusive count 09-25..11-03 / 11-04 |
| 65 | 5 | "Phase 1 tới 5 tốn khoảng 3 ngày làm việc thực" | UNSUPPORTED | Effort was never measured (R-cost §6 says hours were not recorded). Commits fall on 5 days in that span (09-25, 09-26, 09-29, 10-06, 10-07) |
| 66 | 5 | 27 days for Phases 6-9; 22:07 commit vs 23:50 board log | VERIFIED | board log :12 |
| 67 | 5 | 2,143 commits (59 / 1,858 / 226); peak days 146/139/135/134 | VERIFIED | `rev-list` from merge-base `15bd72e9a` |
| 68 | 5 | 11,669 files, 11,423 in reports; per-phase 5,117/3,145/2,419/683/20 | VERIFIED | |
| 69 | 5 | 1,647 `review-*.md` (956 / 649) | VERIFIED | |
| 70 | 5 | 7,508,112,807 B ≈ 6.99 GiB; 9 blobs >100 MB, 127 >10 MB; top three 457/217/216 MB | VERIFIED | |
| 71 | 5 | tar 575.4 MiB | VERIFIED | 603,330,240 B |
| 72 | 5,6 | One 138 MB product commit; L13-156; tag local only | VERIFIED | board log :12; `ls-remote --tags origin` returns nothing |
| 73 | 5 | A1..A51, L11 28, L12 137, L13 110; total "khoảng 326 (ước tính)" | VERIFIED | Per-series counts reproduce. Note: L10 is not "chưa đếm"; it has **42** distinct ids in phase-06, so 326 is a lower bound (≥368 with L10, more with L13 past 110) |
| 74 | 5 | "Chỉ một số ít được xác định là do owner quyết: A28, A44, A48, A49" | WRONG | About 30 A entries are labelled owner-decided or owner-directed: A5, A10, A15-17, A19-21, A26, A28-44, A48-51 (oa6/oa8 headings) |
| 75 | 5 | owner-answers 2,860 / 1,393 lines; DOC 180 of 1,381 board lines | VERIFIED | |
| 76 | 5 | Rework 1.8%; 106/1,275 = 8.3% | VERIFIED | |
| 77 | 5, pack | Verdicts on 193 files: REWORK 19, APPROVE 10, REJECT 7, FAIL 2, "lệch về phía báo cáo hỏng" | UNSUPPORTED | Not reproducible. R-cost's own regex matches **195 files / 645 lines**, mostly prose. 19/10/7/2 appears only when counting UPPERCASE tokens on `Verdict:` lines (94 files), which drops 49 lowercase `rework`, 62 `ok` and 7 `ACCEPT`. The skew claim has no basis. Drop the row |
| 78 | 5 | Friction row "Phase 8 (19 đến 23/10) ... sau 7 lần sinh lại", cited `:195-197` | VERIFIED | The fact holds, but the citation is wrong: use oa8 :280-282 (A51, 10-19); :195-197 is A50 |
| 79 | 5 | Serial reruns 0/7, 1/8, 0/2; lock helper timeout; `e1966d417` 9,330/8,833/399/1 | VERIFIED | oa8 :1641, :2488, :2559, :2733 |
| 80 | 5 | "Progress log ... 247 finding ... not waived" | VERIFIED | The number is at oa8 :2821 ("247 findings, not green and not waived"); progress.md :7 has the phrase without the number. Fix the citation |
| 81 | 5 | Landing gate: npm 9,300 / 45 fail, cargo 1 fail, red on `811bb3da5` or green alone | VERIFIED | board log :12 |
| 82 | 5 | Five `fgos doc` verbs planned; rewritten to "no new verbs" at `b37aea82c` | VERIFIED | TAG phase-10 file (new/classify/check/inventory/retirement-check); scout :87 |
| 83 | 6 | `97dd62aa7` 1,677 files, +182,794 / -239,220; A166 D943 M446 R122; 908 architect, 6 specs | VERIFIED | |
| 84 | 6 | Cutover merges reading maps, rewrites AGENTS.md, edits pre-commit, adds reference-transaction | VERIFIED | (reference-transaction was lease plumbing, deleted again on 11-04) |
| 85 | 6 | 628 md in `docs/platform`, 34 dirs; `docs/decisions` = index.md only; specs/architect gone | VERIFIED | |
| 86 | 6 | doc-health "628 ... 2607 ... 302 ... 0 finding(s)" | VERIFIED | re-run on 11-05 |
| 87 | 6 | Convention rows :143-148; pre-commit checks staged `docs/**` | VERIFIED | pre-commit filter `startsWith('docs/')` |
| 88 | 6 | Alias table 9,235 entries | VERIFIED | `entries.length` |
| 89 | 6 | Sealed ledger lets one "tra ... danh tính claim" after deletion | OVERSTATED | Main holds an 82-line **digest record** (rows 68,441, sha256) pinned to `2a028cdc9`. The rows live only in the local TAG. Post 6 later says "chỉ còn digest", which contradicts this |
| 90 | 6 | "Đây là câu trả lời cho phát hiện C2" | OVERSTATED | Post 3 labels this link the writer's reading; post 6 states it as fact |
| 91 | 6 | AGENTS.md routes L1-L10; only one platform-foundations.md | VERIFIED | `git ls-files` |
| 92 | 6 | Phase 10: tip `97cc4b432`, work `46310f968..00c64d5a5`, classify, 3 rules, 26 headers, 166 paths | VERIFIED | `df300488c` 26 files; phase-10 file :39 |
| 93 | 6 | "khoảng 9,5k dòng script và 23 file test (ước tính của scout)" | OVERSTATED | Scout :62 says this, but the measured retirement commit `159971615` deletes **7,426 script lines and 22 test files** (35 files, -13,856 total). Use the measured values |
| 94 | 6 | DOCOS "not-planned" (board :80); PF-I024: 18 values, 60 docs | VERIFIED | intent-preservation-ledger :94 |
| 95 | 6 | doc-health not in pre-commit, quote from `convention/spec.md:382` | VERIFIED | |
| 96 | 6 | "chỉ còn digest của sealed ledger và 27 file trong thư mục plan trên main" | WRONG | **28** files on main today (Phase 10 added its phase file); 27 was the count at `97dd62aa7` |
| 97 | 6 | plan.md on main, lines 4/12/15/262 | VERIFIED | |
| 98 | 6 | G1: guards dormant through the installed host at landing | VERIFIED | scout :66, :131 |
| 99 | 6 | "E6/E7 của Phase 5 không đạt ... chưa tìm được cách xử lý cuối cùng" | WRONG | Same as #50: E6 met 19/20, E7 met (redefined), PASS-WITH-AMENDMENTS on 10-07 |
| 100 | 6 | Lesson 1 "Kết quả là 365 lên 4.301" | OVERSTATED | Post 2 marks this causal link as the writer's reading; lesson 1 states it as fact |
| 101 | 6 | Lesson 6: rule classes moved into a checker; "7 lần sinh lại cho 5.427 cạnh" | WRONG | Same as #57. A51 changed the gate (mechanical inventory + per-file patch review). The 5,427-edge / 1,018-mapping packet was superseded at A50 before the regenerations, and the regenerations sampled 1,275 edges |
| 102 | 4,5,6 | Oracle: "5 lần nới lỏng" / "5/8 đã nới lỏng oracle" | OVERSTATED | Memory: 5 "loosened the check **or substituted the author's own data**". Post 4 words it correctly; post 5's table, post 6 lesson 7 and the pack drop the second half |

## Count by verdict

| Verdict | Count |
|---|---|
| VERIFIED | 80 |
| WRONG | 13 (#13, 17, 18, 32, 34, 35, 40, 50, 57, 74, 96, 99, 101) |
| UNSUPPORTED | 2 (#65, 77) |
| OVERSTATED | 7 (#38, 48, 89, 90, 93, 100, 102) |

Total: 102 claims.

### Estimates or unverified items presented as fact elsewhere

- The C2 → alias/ledger link is labelled the writer's reading in post 3 and stated as fact in post 6 (#90).
- The growth cause is labelled the writer's reading in post 2 and stated as "Kết quả là" in post 6 lesson 1 (#100).
- The 326 decisions are labelled an estimate, but the figure is really a lower bound; L10's 42 ids are countable (#73).
- "3 ngày làm việc thực" is presented as fact in post 5 with no measurement (#65).
- The verdict tally is presented as a "cận dưới" with a skew direction, and neither holds (#77).
- Minor inconsistency: post 4 says the owner reacted "Sau ba ngày Phase 6" (memory says 3 days), but Phase 6 started 10-07 11:55 by the post's own table, so 10-11 is day 5.

## Exact edits needed

1. Post 2, intro line: change "commit cuối cùng của main trong ngày" to "commit cuối cùng của main tại hoặc trước 23:59 ngày đó", and footnote that the 08-29 row is `9235bbe19` (08-28).
2. Post 2, §"Dời mà không có guard", and pack §1 row `4270c0c0d`: change "Năm giờ sau" to "Chưa đầy một giờ sau".
3. Post 2, same section, and pack §2 chain #5: replace "Guard ... được thêm vào sau khi đã có link chết" / "guard thêm sau" with: guard `check-decision-citation-drift` already existed (`41af242e7`, `510abb006`, 27/7); the move still left dead references, and `4270c0c0d` had to update the guard's baseline and fix the sweep.
4. Post 3, §"Ngày 25/9": reverse the order. The two reviews of the draft plan came first, and the Opus review required an inventory of the current authority state. The truth reset (authority map) answered that, and map plus reviews landed together in `a725d4788`. Drop "Trước khi chạm vào file nào".
5. Post 3: change "Nó thêm bốn phát hiện" to "Nó thêm năm phát hiện (bốn chính dưới đây và L1 về số tài liệu provisional/active)".
6. Post 3, §"Ngày 26/9: plan ra đời", and pack §1 row `2085d88fe`: say the plan first landed on its branch at `a725d4788` (25/9, 724 lines), and that `2085d88fe` (26/9) committed the 704-line "Proposed — not authorized" copy to main.
7. Post 3: decision 12 is "No scope reduction by omission. Deferred architecture is recorded with a revisit trigger…". Attribute "mọi claim phải được đếm" to the plan's mission ("without losing any retained claim") and decisions 2/6, not to decision 12.
8. Post 3, `4d80eaf29` bullet: change "`plan.md` 704 dòng" to "`plan.md` 800 dòng trên nhánh, rút còn 454 dòng".
9. Post 4, pilot section: replace "Nghiên cứu chưa truy được E6 và E7..." with: owner first ruled METHOD-MUST-CHANGE; after one fix round E6 met (19/20) and E7 met with an owner-redefined criterion; PASS-WITH-AMENDMENTS on 10-07 (pilot-method-defects §5-6). Change the "§2" citation to "§3, §5, §6". Change "Hai lỗi nặng nhất" to "Hai lỗi quan trọng cho Phase 6".
10. Post 6, "Giới hạn phương pháp" bullet: remove E6/E7 from the open list (same source as edit 9).
11. Post 4, "Ngõ cụt" section: rewrite the end. A50 (owner, 19/10) superseded the 338-part packet unreviewed and moved review to mapping level. The step-02c..02j semantic sample (1,275 edges) still failed at 8.3%. A51 (owner, 19/10, "đồng ý phương án 2") then changed the gate: census = mechanical inventory, exact patches authored and reviewed per consumer file in Step 3, with L12-21..26 as authoring rules. Cite oa8 :193-197 and :280-286.
12. Post 6, lesson 6: change to "Nó chỉ dừng khi cổng được đổi: kiểm kê cơ học, patch được viết và review theo từng file (A51)". Separate the 5,427/1,018 figures (A50) from the seven regenerations.
13. Post 5, "Quyết định" paragraph: replace "Chỉ một số ít ... A28, A44, A48, A49" with "Khoảng 30 mã A được ghi owner-decided hoặc owner-directed (A5, A10, A15-21, A26, A28-44, A48-51); phần còn lại là Lead-decided, owner informed". Replace the L10 row "chưa đếm" with "42", and call 326 a lower bound.
14. Post 5, "Tỉ lệ làm lại" bullet 3, and pack §3 verdict row: delete the 193-file / 19/10/7/2 tally, or replace it with "chưa đo được: verdict nằm theo dòng bảng, chưa parse".
15. Post 5, "Thời gian": change "khoảng 3 ngày làm việc thực" to "có commit trong 5 ngày; giờ công không đo".
16. Post 5, friction table, Phase 8 row: date "19/10", source `phase-08/owner-answers.md:280-282`.
17. Post 5, 247-finding sentence: source is `phase-08/owner-answers.md:2821`, not the progress log.
18. Post 6, item 5: say main holds a digest record of the 68,441-row ledger (pinned at `2a028cdc9`), with the rows only in the local tag. Mark the C2 link as the writer's reading.
19. Post 6, "Evidence chỉ có ở máy owner" bullet: change "27 file" to "28 file (27 lúc cutover)".
20. Post 6, item 7, and pack §3: replace the scout estimate with the measured `159971615` values: −7,426 script lines, 22 test files deleted (35 files, −13,856 lines).
21. Post 6, lesson 1: add "theo cách đọc của người viết" or soften "Kết quả là" to "Cùng lúc đó".
22. Post 5 friction table, post 6 lesson 7 and pack §1 (30/10): change "5 lần nới lỏng" to "5 lần nới lỏng check hoặc thay bằng dữ liệu của chính tác giả".
23. Optional: post 4, "Sau ba ngày Phase 6" → "Ngày thứ năm của Phase 6", or cite the memory's own wording.

## Unresolved questions

- Whether release `47e1016d` carries the Phase 9 guards was not checked (it needs the installed host). The posts already mark this unverified.
- The 1,018-mapping packet and the 1,275-edge regenerations both belong to census class 3, but this review did not confirm that the step-02c..02j sample was drawn from exactly the 5,427-edge slice.

## Round 2

Scope: only the passages changed for the 23 edits, plus the writer's new notes. Read-only re-check against the same primary sources.

### Verdict

**REWORK. One edit remains.** It comes from my own edit 13. Its list of owner-decided A ids was wrong, and post 5 and the evidence pack copied it. Everything else re-checked is VERIFIED.

### Re-check table

| # | File | Passage | Verdict | Evidence |
|---|---|---|---|---|
| R1 | post 3 | 25/9: the reviews read a draft plan; Opus rec "Phase 00 must first inventory the current authority state"; truth reset answers it; Gemini re-review on the amended plan, "incorporates critical corrections"; five findings incl. L1 | VERIFIED | review :190; re-review :12, :38 |
| R2 | post 3 | Map, two reviews and `plan.md` (724 lines, "Phase 00 authorized and completed") committed together at `a725d4788` 25/9 13:57 | VERIFIED | `a725d4788 --stat`; plan header "Phase 00 authorized and completed on its isolated branch" |
| R3 | post 3 | 26/9: `2085d88fe` brings the 704-line copy to main; `a725d4788` is not its ancestor; two parallel copies | VERIFIED | `merge-base --is-ancestor` false; both in TAG; `2085d88fe` on main |
| R4 | post 3 | Mission quote "without losing any retained claim, rationale, contract, decision, proof, or preserved intent"; decision 12 quoted exactly | VERIFIED | `2085d88fe:plan.md` :17-18, :104 |
| R5 | post 3 | `4d80eaf29`: 800 → 454 lines, ten phase files | VERIFIED | |
| R6 | post 4 | Pilot: "two defects that matter for Phase 6"; METHOD-MUST-CHANGE; E6 19/20, E7 redefined; M-05 fixed "0 uncovered lines in 3,139 files"; PASS-WITH-AMENDMENTS 10-07; §3/§5/§6 | VERIFIED | pilot-method-defects :57, :67, :69, :73 |
| R7 | post 4 | A50 (10-19): 338-part packet "superseded, not reviewed"; mapping-level review with a ≥15% semantic sample | VERIFIED | oa8 :193-197 |
| R8 | post 4 | Seven regenerations 02c-02j fail (106/1,275); A51 "đồng ý phương án 2": mechanical inventory, per-file patch review in Step 3; L12-21..26 are authoring rules, not a checker | VERIFIED | oa8 :280-286. Minor nuance, non-blocking: the first step-02c artefact (`52941b015`, 11:48) predates the commit recording A50 (`e067bfa1f`, 12:20), so "Mức ánh xạ vẫn chưa đủ. Qua bảy lần..." is true for 02d-02j and approximately true for 02c. The step-02j seed is named `A50-...`. No edit required |
| R9 | post 6 | Lesson 6 rewritten (A50 drop before review, 1,275-edge sample, gate changed at A51) | VERIFIED | same as R7-R8 |
| R10 | post 6 | E6/E7 removed from the open list and lesson 4 says both met after one fix round | VERIFIED | same as R6 |
| R11 | post 6 | #84 note: `.githooks/reference-transaction` was lease plumbing, deleted again on 4/11 | VERIFIED | `c7a354e1d` name-status `D .githooks/reference-transaction` |
| R12 | post 6 | Lessons 3 and 4 carry the writer's-reading label (cutover condition; pilot counterfactual); lesson 1 is labelled too | VERIFIED | labels present; the factual parts of lessons 3 and 4 match bài 2/4 |
| R13 | post 6 | Item 5: alias table 9,235 on main; sealed ledger is an 82-line digest record of the 68,441-row ledger pinned at `2a028cdc9`; C2 link labelled | VERIFIED | |
| R14 | post 6, pack | `159971615`: touches 41 files, 35 deleted, 22 test files deleted, −7,426 script lines, −13,856 total | VERIFIED | `--name-status` 41 lines (35 D, 6 M); numstat |
| R15 | post 6 | 28 plan files on main (27 at cutover) | VERIFIED | |
| R16 | post 5 | Decision table: L10 42; "ít nhất 368" (326 without L10) as a lower bound | VERIFIED | |
| R17 | post 5, pack :111 | "Khoảng 30 mã A ... owner-decided hoặc owner-directed (A5, A10, A15-21, A26, A28-44, A48-51)" | WRONG | The range A15-21 includes **A18**, which is "Lead-decided; owner informed" (oa6 :89). The list omits **A45** (owner answer CTR010, phase-07 :494-511), **A46** ("Decided by: owner", phase-07 :477) and **A47** ("owner, 2026-10-19"). Correct set: A5, A10, A15-17, A19-21, A26, A28-51 = **33** ids. A11 carries no decider label. The other 17 are Lead-decided. My edit 13 introduced this error |
| R18 | post 5 | "Phase 1 tới 5 ... commit trong 5 ngày ... Giờ công không được đo" | VERIFIED | per-day counts |
| R19 | post 5 | Friction row 19/10 cites oa8 :280-282 (A50, A51); oracle wording; A36 packet superseded at A50 | VERIFIED | |
| R20 | pack | Rows for guard 07-27, "59 phút sau", `a725d4788`/`2085d88fe`, A50/A51, oracle, cut list | VERIFIED | pack :42-43, :56-57, :67, :73, :87, :94, :139 |

### Count (Round 2)

VERIFIED 19, WRONG 1, UNSUPPORTED 0, OVERSTATED 0.

### Remaining edit

1. In post 5 ("Quyết định" paragraph) and evidence pack §3 row "Quyết định có số" (line 111), replace "Khoảng 30 mã A được ghi owner-decided hoặc owner-directed (A5, A10, A15-21, A26, A28-44, A48-51); phần còn lại là Lead-decided, owner informed" with "33 mã A được ghi owner-decided hoặc owner-directed (A5, A10, A15-17, A19-21, A26, A28-51); A11 không ghi người quyết; 17 mã còn lại là Lead-decided, owner informed". Do the same in the pack's wording of that row.
