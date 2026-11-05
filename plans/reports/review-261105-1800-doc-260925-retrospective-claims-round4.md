# Fact-check round 4 (narrow): doc-260925 retrospective series

**REWORK: 0 WRONG, 3 OVERSTATED, 0 UNSUPPORTED, 6 minor.** All 13 round-3 findings are applied correctly in the posts. The three blocking items come from the restructuring itself: two unit or wording shifts that change what the reader thinks was counted, and one evaluative sentence with no label. After the replacements below the series passes.

Scope: the current working tree of posts 1-6 and the evidence pack (all uncommitted), each post read in full. Sources were re-read for every changed claim: TAG `archive/doc-260925-lineage`, main git, and transcripts T5/TL/TI read one line at a time. No post was edited.

## 1. Blocking findings

| # | Post:line | Claim | Verdict | Evidence | Exact replacement |
|---|---|---|---|---|---|
| B1 | post 4:15, post 4:59, post 5:54 | "16 **claim** bị rơi thật" / "16 claim bị rơi" | **OVERSTATED** (the unit changed) | Post 1's glossary (line 10) defines **Claim** as "một ý trong tài liệu, đơn vị mà plan đếm và bảo toàn", so a reader will take 16 to mean 16 claim units. The source counts **groups**: `pilot-method-defects.md:45` reads "16 real-drop D1 groups", and `:57` reads "real omissions (16 groups registered as `dropped-002` to `dropped-017`)". A group can contain more than one claim. The pack still says "16 drop". | post 4:15: "tìm ra **16 nhóm nội dung bị rơi thật** mà lần audit trước khai là đã giữ". post 4:59: "Phương pháp tìm ra 16 nhóm nội dung bị rơi." post 5:54: "16 nhóm nội dung bị rơi mà audit trước bỏ sót (bài 4)". In the pack (§1 row 2026-10-07, §7 "Pilot phải được phép thất bại"), change "16 drop" to "16 nhóm drop". |
| B2 | post 4:21, post 5:35 | "21 lần sửa sinh ra 99 **lỗi lệch liên kết**" | **OVERSTATED** (misleading) | OA6:102 (A22): "The 99 findings (47 target-digest drift, 50 exact proofs no longer valid, 2 retired candidates without successor accounting) are consequences of the 21 authorized section fixes". These are binding/proof findings, not links. To an outside reader "liên kết" means hyperlinks, and the series uses "link" in that sense elsewhere (for example post 6:9, "119 link chết"). | post 4:21: "ngày 10/10, 21 lần sửa sinh ra 99 chỗ proof hoặc digest không còn khớp." post 5:35: `\| 10/10 \| 21 lần sửa section đã duyệt làm 99 proof hoặc digest không còn khớp \|` |
| B3 | post 5:56 | "Đó là chi phí hệ thống đẩy sang owner, không phải thói quen của owner. … ở plan này, nó chưa đạt." | **OVERSTATED** (writer's judgment with no label) | No source supports the claim about the owner's motive ("không phải thói quen"). "Chưa đạt" is an evaluation. Elsewhere the series labels its inferences "theo cách đọc của người viết" (post 2:23, post 6:25, :39, :44), so this sentence breaks that convention. The data under it (≥33 asks, ≥9 reminders) is verified. | "Theo cách đọc của người viết, đó là chi phí hệ thống đẩy sang owner: fgOS đặt 'release con người', tức giải phóng con người khỏi việc ngồi canh chờ, ở ưu tiên số 2, và ở plan này ưu tiên đó chưa đạt." |

## 2. Minor (non-blocking)

| # | Post:line | Issue | Evidence | Suggested text |
|---|---|---|---|---|
| n1 | post 3:11 | "cho phép đi tiếp" contradicts line 9, "Hai review chỉ tư vấn, không quyết định". | review :23 "**PROCEED WITH REQUIRED CHANGES**, for Phase 00 only"; R-trigger: "advisory only" | "Review thứ nhất, do Claude Opus chạy, khuyên đi tiếp nhưng chỉ cho bước đầu tiên, kèm những thay đổi bắt buộc." |
| n2 | post 5:9 | "942 commit **chỉ** cho báo cáo của phase đó": the 942 are commits that *touch* `reports/phase-09`. They overlap with other directories and are not report-only. | R-cost §1 :14 ("these overlap one another") | "với 942 commit chạm vào thư mục báo cáo của phase đó." |
| n3 | post 5:19 | "138 MB theo board log": post 5's Nguồn does not cite the board log for this number, so it is close to an orphan. | board log line 26 (2026-11-03 23:50): "một commit sản phẩm 138 MB" | In Nguồn → Dung lượng, add "138 MB: board log 3/11 23:50". |
| n4 | pack §1 row 2026-10-19 (A50/A51), pack §7 "Review không hội tụ…" | The round-3 m6 wording reached post 4 but not the pack: "sau bảy lần sinh lại vẫn 8,3% rework" / "Mẫu 1.275 cạnh trượt qua bảy lần sinh lại". | OA8:280 | Use post 4:30's wording: "Phán đoán ngữ nghĩa không hội tụ qua bảy lần sinh lại; mẫu cuối (step-02j) trượt 106/1.275 = 8,3%." |
| n5 | post 6:44 | The closing sentence is labelled as the writer's reading, but its cross-references are slightly off. Growth is measured in post 2, not post 1, and "dọn chậm vì phải chứng minh lại từng câu" is shown in posts 4-5. | post 2 table; post 4 §"Vì sao chậm" | "bài 1–2 cho thấy tài liệu phình ra … và bài 4–6 cho thấy việc dọn chậm …" |
| n6 | post 2:45 | The inference "Hai cây bắt đầu tách nhau ngay khi vừa được chép" is **supported**. There are only two commits between `e1307d33f` and `81437ffff` (`9818f25a8` 19/9 20:02, `81437ffff` 19/9 20:36), and together they changed 69 files in the legacy tree and 20 in the new one. | `git rev-list --count e1307d33f..81437ffff` = 2; `git diff --name-only … -- docs/architect/agent-coordination \| wc -l` = 69, `-- docs/platform/agent-coordination` = 20 | Optional, makes it concrete: "…một ngày sau đã là 67, vì hai commit ngày 19/9 vẫn sửa 69 file ở cây cũ và 20 file ở cây mới." |

## 3. (a) Round-3 findings: application check

| Round-3 # | Applied where | Result |
|---|---|---|
| W1 (13/10 replaces 7/10 11:32) | post 4:5 ("tám lần nữa"), table :45-53, Nguồn :69; pack §1 rows 1/9, 2/9, 3/9 (T5 L7150), the 11:32 row deleted, §5 note, §6 row | OK |
| W2 (13 hours, 23:41) | post 6:5, :36; pack §1 row "22:07 / 23:41 / 23:50", §6 row | OK |
| W3 (not idle for four hours) | post 6:36, merged into lesson 1 | OK, exact text |
| O1 (review made the plan urgent, did not start it) | post 3:5 | OK, exact text |
| O2 (doc-health scope) | post 6:24; pack §6 | OK, exact text |
| O3 ("Vài lần…", "lần đầu tiên … điều kiện Land") | post 4:55 | OK, exact text |
| O4 (evidence and owner's sentence) | post 6:31, :40; pack §1 rows 10:08 and 10:17, §3, §5, §6 | OK. The pack is now explicit: "Owner không chọn phương án nào cho câu A; hiểu 'dữ liệu' là evidence là cách đọc của Lead" |
| m1 (guard quote source) | post 6 Nguồn :48-49 (TL L37706; OA8:1285-1291) | OK |
| m2 ("gần sáu tuần") | post 1:17 | OK |
| m3 (6 → 67) | post 2:5, :45, Nguồn :68 | OK |
| m4 (freeze at 17:55, pinned at 15:30 commit) | pack §1 row 2026-10-31 17:55 | OK |
| m5 (29 before Land; "ít nhất") | post 5:5, :56, Nguồn :68; pack §3 | OK |
| m6 (seven regenerations wording) | post 4:30 | OK in post 4; not carried into the pack (n4) |
| "tuầ" note removed | pack §1 row 2026-10-29 | OK |

## 4. (b) The ten flagged rewordings

| # | Rewording | Verdict | Evidence |
|---|---|---|---|
| 1 | post 2: "6 trong 935 … một ngày sau 67" + "Hai cây bắt đầu tách nhau ngay khi vừa được chép" | VERIFIED | blob join reproduced: 935/6 at `e1307d33f`, 935/67 at `81437ffff`; only two ordinary commits in between, editing 69 legacy and 20 new files (n6) |
| 2 | post 3:13-15 paraphrase of the Opus premise | VERIFIED | review :23, quoted exactly; review :163 "Platform authority is two overlapping systems — **Falsified as stated.** It's more like four". "ba hệ tài liệu end-user" = "three user-doc systems"; "lịch sử quyết định nằm trong spec" = "decision history stored in `docs/specs`" |
| 3 | post 3:19 "Câu trả lời là truth reset"; post 3:11 "cho phép đi tiếp nhưng chỉ cho bước đầu tiên, kèm những thay đổi bắt buộc" | VERIFIED / minor | The truth reset as the answer to "Phase 00 must first inventory the current authority state" was already verified in round 2 (R1). The map header reads "Records current authority; does not promote, migrate, delete, or supersede any source", which matches "chỉ ghi lại, không dời hay xoá gì". "cho phép" → "khuyên" (n1) |
| 4 | post 4 "16 claim bị rơi thật", "99 lỗi lệch liên kết" | **OVERSTATED** | B1, B2 |
| 5 | post 5:48 A28 tied to the 11/10 ask ("ở lần owner hỏi thứ hai") | VERIFIED | memory `feedback_flag_verification_cost_early.md`: "2026-10-11: … owner said 'tài liệu thôi mà sao kì công vậy ta' … Owner chose option B (A28): … drop T6=0". OA6:124 "A28 (2026-10-11, owner-decided)". It is the second ask in the corrected list of nine |
| 6 | post 5:56 "nó chưa đạt" (release con người) | **OVERSTATED** (needs a label) | B3 |
| 7 | post 6:25 "nhu cầu tra cứu mà review đầu tiên nêu" | VERIFIED (labelled) | review :41 "**C2. Deleting legacy platform paths needs a way to look them up afterwards…**", in the first (Opus) review; post 3:15 calls it "Phát hiện thứ hai" of that review |
| 8 | post 6:44 closing post 1 ↔ post 6 link | VERIFIED (labelled) | Labelled "Theo cách đọc của người viết". The cross-references need a small fix (n5) |
| 9 | post 6 lesson 4 (three lessons merged); lesson 2 advice | VERIFIED | Lesson 4: the three parts rest on post 1 (compound-learn on 20/7, a second copy of the laws), post 2 (943 files copied, `AGENTS.md` still pointing at the old tree), and the cited `3ee30977a`, `ad65f59fd`. The causal part keeps its label. Lesson 2: the counts ≥9 and ≥33 match posts 4 and 5; "Đo số lần người phải đi hỏi" is advice, not a factual claim |
| 10 | post 1:58 "ít nhất bốn kho bài học khác nhau" | VERIFIED | R-genesis :101 traces where *learnings* were written: `docs/history/learnings` → events (`0228c4034`, 07-16) → Diataxis docs (`cf27ae0b3`, 07-22) → `docs/knowledge/` (`d889032c0`, 08-27). That is four stores over 14/7-27/8, about six weeks, matching pack §2 chain #3 |

## 5. (c) Orphan check (moving sources into Nguồn)

Every body number I sampled across all six posts, about 70, has a source in that post's Nguồn or in the pack. Examples: post 1 has 41 days (pack §3), 9 ADRs from 17 decisions (`c93aa4acf`; R-genesis §3), and the two-week repo split (`e99998633`/`2bbd8f70f`). Post 2 has 14/473/905 (`ba7b62ace`), 566 payload files, 34 ADRs, 268/50 (the 08-25 report) and 25 references in 22 files. Post 4 has 4.305/85.772, E6/E7, 1,8%, 338/20.030/5.427/1.018 and 43/499/467/219. Post 5 has 2.143/1.858/146, 11.669/11.423, 457 MB/9, 575,4 MiB, 2.860, 765 ms and 45/9.300/1. Post 6 has 628/34, 9.235, 28 and 119. The DOCOS "cửa ghi duy nhất" claim is verified against board :80 ("cửa viết duy nhất (`fgos doc new/classify` …)") and proposal :391. The only weakly sourced number is the 138 MB in post 5 (n3).

## 6. (d) Cross-post numbers

These agree everywhere they appear: nine reminders over 27 days (post 4, post 6 lesson 2, pack §3/§6); 33 asks, 29 of them before Land (post 5 ×3, post 6, pack §1/§3/§6); 13 hours, 23:41 (post 6 ×2, pack); 7.426 lines and 22 test files (post 4, pack §1/§7); 40 and 41 days (post 5, post 1, pack §3); 368 / 33 A ids (post 5, pack); 13,3% / 26,7% (post 4, post 6, pack); 1.018 / 106 / 1.275 (post 4, post 5, pack); 6 → 67 (post 2, pack §6/§7). Two mismatches remain. First, the pack's "16 drop" does not match the posts' "16 claim"; B1 brings both to "16 nhóm". Second, the pack's "trượt qua bảy lần sinh lại" does not match post 4:30 (n4).

## 7. Unresolved questions

- None new. The round-3 questions are still open: what "dữ liệu" meant in TL L87031 (the posts now present it as the Lead's reading, which is correct), and the extra reminder candidates TL L60292 and T5 L3156 (the pack records both and keeps "ít nhất").

Status: DONE
Summary: REWORK. All round-3 fixes are applied correctly in the posts and no claim was orphaned. Three restructuring rewordings overstate (the 16 "claim" are 16 groups; the 99 "lỗi lệch liên kết" are proof/digest mismatches, not links; post 5's "không phải thói quen … chưa đạt" needs a writer's-reading label), and six minor wording fixes are listed with replacement text.
