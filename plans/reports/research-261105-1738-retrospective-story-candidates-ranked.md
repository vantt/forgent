# Story candidates, ranked bottom-up, for the plan 260925 retrospective series

Date: 2026-11-05. Read-only. Applies the "find candidates bottom-up, rank, then check the arc" step to the six drafted posts (`retrospective-261105-1416-doc-260925-post-{1..6}-*.md`). No post was edited.

Rubric: [story-selection-practice §2.2](research-261105-1700-story-selection-practice.md) — G so-what gate (lesson stated without repo proper nouns; 0 = drop), T tension (a real "nhưng"), E evidence strength, N novelty (not already in the series), K stakes, C self-containedness. Each 0–2, Σ ≤ 12.

## Evidence keys

- **TL** = Lead transcript `~/.claude/projects/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d.jsonl`; **T5** = `4df9e88c-dcc7-4ca8-b24a-b69b112e7ced.jsonl` (Lead, Phases 4–6); **TI** = `dc747f94-*.jsonl` (harness investigation, 10-06). `L<n>` = JSONL line. Times UTC in the transcript; +07 given where it matters.
- **OA6 / OA8** = `git show archive/doc-260925-lineage:plans/260925-documentation-authority-unification/reports/phase-0{6,8}/owner-answers.md`.
- **M:** = memory note in `~/.claude/projects/-home-vantt-projects-forgentX/memory/`.
- Owner turns were extracted with a script that prints only user text turns (no tool results, secret-like strings masked); all 17 masked lines were checked and are compaction summaries or task notifications, not owner words.

## 1. Candidate pool (36)

Genre: **D** decision, **F** failure, **N** number, **P** process. Coverage = post that already carries it (– = none).

| # | G | ABT (và… nhưng… vì vậy) | Primary evidence (verified) | Actor | Cov. | G T E N K C | Σ |
|---|---|---|---|---|---|---|---|
| 1 | D | Sau 6 tuần mỗi sửa nhỏ kéo theo cả chuỗi sổ sách, **nhưng** owner hỏi "thông minh hơn đi…", Lead nhận "phần tài liệu thật ra không khó; cái làm chậm là bộ máy chứng minh", **vì vậy** owner chọn "Land gọn" và cutover lên main gần 12 giờ sau | TL L84830 (11-02 03:57Z, owner); L84838 (Lead: "Hôm nay sửa 119 link chết mất trọn một ngày"); L84844 answer 11-03 03:22Z (question parked ~23,5 h); `ee695a632` 11-03 10:22 +07 "record the owner's lean Land gate" (L13-152); `97dd62aa7` 11-03 22:07 +07 | owner, Lead | – | 2 2 2 2 2 2 | 12 |
| 2 | N | Ngày 7/10 (ngày 13) owner hỏi "quy mô tool ghê vậy?", chưa tới 15 phút một bản nháp đoán "khoảng 7.100 dòng script di trú… sẽ bỏ sau cutover", thay bằng "module doc-health khoảng 400–500 dòng", **nhưng** plan vẫn xây tiếp 4 tuần, **vì vậy** 4/11 Phase 10 xoá đúng 7.426 dòng script | T5 L2573 (10-07 15:03Z owner), L2626 owner "không phải build một cái gì hoành tráng làm một lần rồi bỏ", L2674 (15:14Z, Lead relays draft numbers); `159971615` 11-04 10:49 +07 scripts −7.426 (numstat); `scripts/doc-health.mjs` today 214 lines (`wc -l`) | owner, Lead, agent | – | 2 2 2 2 2 2 | 12 |
| 3 | P | Owner nhắc tốc độ/độ phức tạp **ít nhất 9 lần trong 27 ngày**, mỗi lần Lead cắt một khúc (A5 7/10, A28 11/10), **nhưng** khúc cắt không thành cấu trúc nên lần nhắc sau lại tới, **vì vậy** chỉ lần thứ 9 ("Land gọn") mới kết thúc | T5 L1971 10-07 04:32Z "đừng phức tạp quá"; T5 L2573 10-07 15:03Z; T5 L5882 10-11 06:55Z "kì công… làm 3 ngày rồi"; TL L1631 10-14 03:33Z "quá lâu"; TL L26868 10-20 04:12Z "project này lâu quá, mấy tuần rồi chưa xong luôn"; TL L67528 10-29; TL L74780 10-31 10:54Z "có vẻ không có tiến độ nhỉ"; TL L82549 11-01 13:56Z "chẳng hiểu từ 29/10 lên 1/11 giờ 3/11"; TL L84830 11-02 | owner | partial (10-11, 10-29 only) | 2 2 2 2 2 2 | 12 |
| 4 | N | Plan bảo toàn từng claim của tài liệu cũ, **nhưng** mẫu kiểm đúng-sai cho thấy 4/30 câu (13,3%) ở khu specs-ui và 8/30 (26,7%) ở khu runner là **sai so với hiện trạng**, **vì vậy** "không mất câu nào" khác "không giữ câu sai" | OA6:216 "A40 (owner-decided 2026-10-15 … 4 of 30 sampled units false, 13.3%"; OA6:222 "A41 … 8 of 30 sampled units false, 26.7%"; OA6:124 A28 "separates conservation from truth" | reviewer, owner | – | 2 2 2 2 2 1 | 11 |
| 5 | D | Guard chống tài liệu "mọc bậy" nằm ở Phase 10 (sau cutover), **nhưng** ngày 21/10 owner hỏi "bộ quy định, ràng buộc để docs không sinh bậy cũng được land trong phase 9?", **vì vậy** ba guard thay ratchet lên cùng commit cutover | TL L37706 (10-21 09:07Z); OA8:1285 "## L12-89 — Documentation guards at cutover (Owner, 2026-10-21 16:09)"; M:`project_doc_plan_phase9_carries_doc_guards.md` | owner | partial (post 6 names L12-89, not the origin) | 2 1 2 2 2 2 | 11 |
| 6 | F | Sáng 3/11 owner chọn Land gọn và nghĩ đã cho phép Land, **nhưng** phán quyết ghi "Land do owner duyệt riêng", nên cả DOC lẫn LAND "đều ngồi đợi", **vì vậy** phải thêm L13-155 lúc 14:14 | TL L85763 (11-03 07:14Z) "tưởng sáng cho quyền rồi. anh thấy cả 2 tiến trình đều ngồi đợi"; L85790 Lead "Lẽ ra em nên hỏi gộp ngay lúc đó: gate qua thì Land luôn"; `c8b02bd67` 11-03 14:14 +07; M:`project_doc_plan_260925_land_grant_2026_11_03.md` | owner, Lead | – | 2 2 2 2 1 2 | 11 |
| 7 | P | Plan chạy tự động bằng nhiều agent, **nhưng** owner phải gõ "báo cáo tiến độ" **ít nhất 33 lần** (14/10–5/11), **vì vậy** "giải phóng con người" chưa đạt: trạng thái không tự đến tay người | TL owner turns starting "báo cáo…": 33 (script count; first L2797 10-14, last L89158 11-05) | owner | – | 2 2 2 2 1 2 | 11 |
| 8 | F | Lead bắt tác giả không được sửa thước đo, **nhưng** chính Lead siết công cụ kiểm giữa chừng (L13-91..95) làm số lỗi nhảy 43 → 499 → 467 → 219 và "mỗi lần siết công cụ thì số đo lại bắt đầu từ đầu", **vì vậy** phải đóng băng công cụ lần thứ hai (lần đầu là A5, 7/10) | TL L74788 (10-31 10:55Z) "em đã để tiêu chuẩn nghiệm thu thay đổi liên tục trong khi tác giả vẫn đang sửa"; `e96261471` 10-31 15:30 +07; OA6:35-36 A5 "Tooling is frozen as it is at `1ec3ceca6`" | Lead | – | 2 2 1 2 2 2 | 11 |
| 9 | F | Cây đích cần dời, **nhưng** commit "fix(dispatch)" chép 943 file, 0 xoá, **vì vậy** một ngày sau 67 bản đã khác bản gốc | `e1307d33f`, `81437ffff` (pack §1) | unknown | post 2 | 2 2 2 1 2 2 | 11 |
| 10 | N | Một khu (Agent Coordination) có 17.034 dòng trong 867 file, trong khi hai khu kế tiếp chỉ 431 và 402 dòng, **vì vậy** owner nhìn bảng là thấy "cơ chế viết tài liệu của chúng ta có vấn đề" | T5 L4124 (Lead table), L4129 (10-10 10:44Z owner "1 component nhưng 867 files, vấn đề quá rõ") | owner | – (post 2 has 905 files at 09-12) | 2 1 2 2 1 2 | 10 |
| 11 | N | Docs tăng 365 → 4.301 file, **nhưng** specs chỉ 11 → 13 | pack §1/§2; R-middle §2 | tool | posts 1, 2 | 2 1 2 1 2 2 | 10 |
| 12 | F | Pilot được thiết kế để đo phương pháp, vòng đầu "Not PASS", **nhưng** chính nó tìm ra 16 drop thật, **vì vậy** owner phán METHOD-MUST-CHANGE trước khi áp toàn bộ | pack 10-07 row; `phase-05/pilot-method-defects.md` §3,§5,§6 | owner, reviewer | post 4 | 2 2 2 1 2 1 | 10 |
| 13 | F | Review ngữ nghĩa từng cạnh: 20.030 mục cho 1.018 ánh xạ, 7 lần sinh lại vẫn 8,3%, **vì vậy** A50/A51 đổi đơn vị review | OA8:193-197, 280-286 | owner, Lead | post 4 | 2 2 2 1 2 1 | 10 |
| 14 | F | Mốc land lùi 29/10 → 1/11 → 3/11, Lead: "mỗi lần em chỉ tính phần việc nhìn thấy trước mắt, không tính phần mà mỗi bước tiếp theo sẽ làm lộ ra" | TL L82549, L82557 (11-01 13:56Z) | owner, Lead | – | 2 2 1 1 1 2 | 9 |
| 15 | D | Owner trả lời câu hỏi lưu evidence ngoài máy: "Nếu ổn thì anh không cần giữ dữ liệu đâu", Lead dùng câu này để dừng sổ sách sau Land (L13-159) | TL L87026 (Lead option A), L87031 (11-04 03:08Z owner), L87304 (Lead "Anh đã nói không cần giữ dữ liệu, nên em không làm tiếp") | owner | **contradicts post 6** | 1 1 2 2 1 2 | 9 |
| 16 | P | Owner phản đối lần 1 (7/10) dẫn tới A5 cắt review và đóng băng tool, **nhưng** 4 ngày sau phải nhắc lại (A28) | OA6:35 "A5 (2026-10-07, owner-decided…) The migration tooling is single-use"; `a7ec5054a` 10-07 22:06 +07 | owner, Lead | – (post 4 says owner "phải tự hỏi" on 10-11 as if first) | 2 2 2 2 1 1 | 10 |
| 17 | D | Cơ chế compound bắt mỗi item sinh tài liệu, **nhưng** chưa có luật thẩm quyền | `3ee30977a`, `1739a83d5` | Lead/owner | posts 1, 6 | 2 1 2 1 2 1 | 9 |
| 18 | F | Bên đọc luôn được nạp (AGENTS.md) vẫn trỏ cây cũ dù switchboard đã có | pack chain #10 | – | post 2 | 2 1 2 1 1 2 | 9 |
| 19 | N | 10-11: rework chỉ 1,8% mà Lead vẫn viết A22–A27 | M:`feedback_flag_verification_cost_early.md` | owner, Lead | posts 4, 5 | 2 2 2 0 1 2 | 9 |
| 20 | F | Doer sửa oracle của mình 8 lần, 5 lần nới lỏng | M:`feedback_author_never_edits_acceptance_tool.md` | Doer | post 4 | 2 2 1 1 1 2 | 9 |
| 21 | N | Evidence 7,5 GB chỉ lộ ra khi chạy suite đầy đủ ngày 1/11, phải làm thêm công cụ làm gọn cây | TL L82557 "Hôm nay mới chạy suite đầy đủ, và lộ ra cây land nặng 7,5 GB" | Lead | – | 1 2 1 2 1 1 | 8 |
| 22 | D | Plan dừng 30/9–5/10 để "đợi cơ chế harness ổn định", owner hỏi đợi lâu vậy có nên không và cho chạy lại | TI L2097 (10-06 08:30Z); TI L2428 "plan của document-unify phải chạy ở chat session khác" | owner | partial (post 3: pause without cause) | 1 1 2 2 1 1 | 8 |
| 23 | N | Đổi cách tra ID sang theo anchor: gap danh tính 306 → 17, tổng gap 1.360 → 1.071 | T5 subagent report 10-06 11:26Z (momentry reduce `4df9e88c/reduced.txt:623,638-639`) | agent | – | 2 1 2 1 1 1 | 8 |
| 24 | N | Scanner độc lập: 442 → 32; sau đó 1.660 → 263 | TL L70881 (10-30), reduced.txt:57563 | Lead, tool | – | 2 1 1 1 1 1 | 7 |
| 25 | D | A42 "cho em tự quyết định và tự move on" — uỷ quyền thường trực | OA6:228 (10-15 17:27) | owner | post 5 (one clause) | 1 1 2 1 1 2 | 8 |
| 26 | F | Không có sự cố khởi động; cú hích là proposal + review | R-trigger §1.1 | – | post 3 | 1 2 1 1 1 2 | 8 |
| 27 | F | `plan.md` hai bản song song: nhánh đang chạy, main "Proposed — not authorized" | `a725d4788`, `2085d88fe` | – | post 3 | 1 2 2 1 1 1 | 8 |
| 28 | F | Write lease thiết kế, dựng, xoá (−2.734) | `c7a354e1d` | Lead | posts 4, 5, 6 | 1 1 2 0 1 2 | 7 |
| 29 | N | 7,5 GB, blob 457 MB, chỉ trên máy owner | pack §3 | – | posts 5, 6 | 1 1 2 0 1 2 | 7 |
| 30 | N | ≥368 mã quyết định | pack §3 | – | post 5 | 1 1 2 0 1 1 | 6 |
| 31 | P | Hook decision-question chặn câu hỏi của agent đúng hai lần owner bực (10-11, 11-02) | TL L84840 (PreToolUse "BLOCKED: write the analysis before asking"); T5 L5905 owner "ủa sao em bị block nè (hook)" | tool | – | 1 1 2 2 0 1 | 7 |
| 32 | P | Lead session bị nén ngữ cảnh ít nhất 29 lần trong 23 ngày | TL user turns "This session is being continued…" = 29 | tool | – | 1 1 2 1 1 1 | 7 |
| 33 | D | Sáng 4/11 Lead đề xuất Phase 10 với 5 verb `fgos doc` mới; 7 giờ sau plan viết lại "no new verbs" | TL L87026 (11-04 03:04Z); `b37aea82c` 11-04 10:30 +07 | Lead | partial (post 5 has rewrite, not the U-turn) | 1 1 2 1 1 1 | 7 |
| 34 | F | Partial đỏ merge vào nhánh plan | M:`feedback_dont_merge_known_red_partial_into_plan_branch.md` | Lead | posts 4, 5, 6 | 1 1 1 0 1 2 | 6 |
| 35 | F | ADR dời, 59 phút sau sửa link chết dù guard đã có | `4722361ae`, `4270c0c0d` | – | post 2 | 1 1 2 0 0 1 | 5 |
| 36 | N | Generator OOM vì đọc lại chính JSON 250 MB nó sinh | pack 10-06 row | tool | posts 3, 5 | 1 1 2 0 0 1 | 5 |

Gate: all 36 pass G ≥ 1. Lessons for the top 10, stated without repo nouns:

1. Gate a release on checks of the product; internal bookkeeping can follow it.
2. Migration tooling is disposable; if you can predict its deletion on day 13, budget it that way.
3. A cut made in reply to a complaint, not built into the process, comes back with the next complaint.
4. Preserving every sentence of an old doc also preserves its errors; sample truth before you account.
5. "How do we stop this happening again" belongs in the same release as the fix, not a later phase.
6. When a human picks the shape of a gate, ask in the same question whether passing it authorizes the action.
7. If the human has to ask for status 30+ times, status is not being pushed.
8. Moving the acceptance bar mid-run resets progress; freeze the bar, as you would forbid the author to touch it.
9. "Migrate" by copy creates divergent duplicates within a day.
10. One area 40× bigger than its peers is the diagnosis; look at the size table first.

## 2. Ranked, by genre (top 3 per bucket)

| Bucket | 1st | 2nd | 3rd |
|---|---|---|---|
| Decision | #1 Land gọn (12) | #5 owner pulls guards into cutover (11) | #15 owner: no need to keep data (9) |
| Failure | #6 Land grant re-wait (11) | #8 Lead moved the yardstick (11) | #9 copy-not-move (11) |
| Number | #2 day-13 prediction 7.100 vs 7.426 (12) | #4 truth samples 13,3% / 26,7% (11) | #10 867 files (10) |
| Process | #3 ≥9 owner prods (12) | #7 ≥33 status polls (11) | #16 A5 then A28 (10) |

Overall top 10: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10.

## 3. Top 10 vs what the posts lead with

| Post | Current opening | Top-10 items in it |
|---|---|---|
| 1 | 41 days; 12× growth (#11) | none |
| 2 | sampling method (no story) | #9 in body |
| 3 | "no incident" reversal (#26) | none |
| 4 | the two locked principles | none (#19/#20 are covered relatives of #3/#8) |
| 5 | what was not measured | none |
| 6 | two questions | #5 only as "L12-89", without the owner's question |

**Finding:** 9 of the top 10 are absent from all six posts. 8 of those 9 come from transcripts, a source the pipeline did not read. The posts' tension leans on the two owner quotes they have (10-11, 10-29) and stops before the turn that actually ended the plan (#1).

## 4. Edit plan

### (a) Openings to change (2 sentences each)

**Post 1** (cold open, then the existing 41-day sentence follows):
> Sáng 2/11, sau sáu tuần, owner gõ một dòng: "thông minh hơn đi. làm tài liệu có phải viết code gì phức tạp mà 6 tuần rồi". Câu trả lời cho câu hỏi đó bắt đầu từ ngày repo ra đời, khi một lời hứa rất hay, rằng mỗi việc để lại hệ thống khá hơn, được dựng thành cơ chế sinh tài liệu trước khi có luật nói tài liệu nào là thật.

Evidence: TL L84830 (2026-11-02T03:57:15Z = 10:57 +07); "6 tuần" is the owner's word, 25/9 → 2/11 = 39 days.

**Post 2** (replace the sampling-method opening; move the sampling rule to a footnote-style line under the table):
> Trong tám tuần, `docs/` tăng từ 365 lên 4.301 file, còn số spec được bảo trì chỉ nhích từ 11 lên 13. Rồi ngày 18/9, một commit tên "fix(dispatch)" chép 943 file sang cây mới mà không xoá bản nào, và chỉ một ngày sau đã có 67 bản nói khác bản gốc.

Evidence: pack §1 rows 08-01, 09-18 (`e1307d33f`), 09-19 (`81437ffff`).

**Post 3**: keep (the reversal works). Optional tightening of sentence 2 only:
> … Thứ khởi động nó là một review nói thẳng: "Three authority rules are live at the same time and disagree".

**Post 4**:
> Ngày 7/10, mới là ngày thứ 13, owner hỏi: "chỉ là viết tài liệu thôi mà sao build tool cho phase 2 mà làm cả buổi chiều mà chưa xong. quy mô tool ghê vậy?", và chưa tới 15 phút sau một bản nháp đã đoán đúng kết cục: khoảng 7.100 dòng script di trú sẽ bị bỏ sau cutover. Plan vẫn chạy thêm bốn tuần, owner còn phải nhắc ít nhất bảy lần nữa, và ngày 4/11 Phase 10 xoá 7.426 dòng script.

Evidence: T5 L2573 (15:03:52Z), L2674 (15:14:56Z: "Khoảng 7.100 dòng script di trú, cộng khoảng 6.200 dòng dữ liệu ratchet, sẽ bỏ sau cutover"); prods after 10-07 15:03Z: 10-11, 10-14, 10-20, 10-29, 10-31, 11-01, 11-02 (= 7, see #3); `159971615` numstat on `scripts/`: +57 / −7.426.

**Post 5**:
> Cutover chỉ là một commit; phần tốn là chứng minh commit đó không làm mất câu nào: 1.647 file review, 7,5 GB evidence, ít nhất 368 mã quyết định. Có một khoản không nằm trong git: từ 14/10 tới 5/11, owner gõ "báo cáo tiến độ" hoặc tương tự ít nhất 33 lần.

Evidence: pack §3; TL owner-turn count (#7). Move the current "what was not measured" paragraph to the end of the intro, unchanged.

**Post 6**:
> Sáng 3/11, owner chọn "Land gọn": chỉ kiểm tra trên sản phẩm được chặn landing, còn sổ sách nội bộ của plan chuyển sang sau. Gần 12 tiếng sau, commit cutover `97dd62aa7` lên main, sau khi mốc land đã lùi từ 29/10 sang 1/11 rồi 3/11.

Evidence: TL L84844 (answer 2026-11-03T03:22:06Z = 10:22 +07), `ee695a632` 10:22:34 +07, `97dd62aa7` 22:07:32 +07; TL L82549 (owner names the three dates).

### (b) Candidates to add, and where

| Cand. | Post / section | Size | Text anchor |
|---|---|---|---|
| #1 Land gọn | **Post 6**, new first section "3/11: Land gọn" before "Cutover: một commit". Include the Lead's own diagnosis (L84838: "Phần tài liệu thật ra không khó; cái làm chậm là bộ máy chứng minh mà em dựng quanh nó"; "sửa 119 link chết mất trọn một ngày"), the 23,5 h the question waited, L13-152, and that an independent audit then sent the slimmed gate back REWORK for wrongly demoting a byte-conflict check (TL L85139) — the lean gate was itself audited. ~170 words | post 6 |
| #2 day-13 prediction | Post 4 opening (above) + one closing sentence in post 6 "Ít bộ phận phải mang theo hơn": doc-health today is 214 lines (`wc -l scripts/doc-health.mjs`), against the 400–500 predicted | post 4, 6 |
| #3 prod ladder | **Post 4**, replace section "29/10: 'Cả 5 tuần rồi'" with "Chín lần nhắc" — a dated list of the 9 turns (table in #3 evidence), noting each answer: A5 (7/10), A28 (11/10), parallelize (29/10), Land gọn (2–3/11). ~150 words | post 4 |
| #16 A5 first | Post 4 "Vì sao chậm" bullet 11/10: change "Bài học ở đây là Lead đã không báo chi phí kiểm chứng sớm, mà để owner phải tự hỏi" to: owner đã hỏi lần đầu ngày 7/10 và A5 đã cắt review, đóng băng tool (OA6:35); 11/10 là lần thứ hai | post 4 |
| #4 truth samples | Post 4, one paragraph after the A28 bullet: A40/A41 numbers (OA6:216, 222). Post 6 new lesson (see c) | post 4, 6 |
| #8 yardstick moved | Post 4 "Hai lỗi quy trình ở Phase 9": add as third bullet, paired with the oracle bullet (Doer bent the bar; Lead moved it; both reset progress). TL L74788, `e96261471` | post 4 |
| #6 Land re-wait | Post 6 Land gọn section, 2 sentences + lesson | post 6 |
| #5 guards' origin | Post 6 "Cutover": after "cài ba guard thay cho ratchet (phán quyết L12-89)" add "do owner hỏi ngày 21/10: '…docs không sinh bậy cũng được land trong phase 9?'" (TL L37706; OA8:1285) | post 6 |
| #10 867 files | Post 2 end of "Một cây song song": owner's 10-10 line (T5 L4129) and the 17.034 / 431 / 402 contrast (T5 L4124) | post 2 |
| #7 status polls | Post 5 opening (above) and one row in "Ma sát" | post 5 |
| #22 pause cause | Post 3 "29/9 đến 6/10" bullet "không có commit": add the owner's reason (TI L2097) | post 3 |
| #15 data not kept | **Correction**, post 6: bullet "Evidence chỉ có ở máy owner" and lesson 10 say "Owner cần chọn". Owner already answered on 11-04 03:08Z: "Nếu ổn thì anh không cần giữ dữ liệu đâu" (TL L87031), and the Lead used it to stop post-Land bookkeeping (TL L87304, L13-159). Rewrite as an accepted risk, quoted, not an open question | post 6 |

Not added (scored but low value for these posts): #23, #24 (numbers without a turn), #31, #32, #33.

### (c) Cuts to reach ≤ ~1.300 words (target 1.200 body + sources)

Word counts now (`wc -w`): 1204 / 1259 / 1612 / 1711 / 1388 / 1752.

**Post 1** (+50 cold open): cut in "Lời hứa" the three-schools comparison (bee / harness / marketing-cockpit) and its recommendation (~60); in "Tám luật nền" drop the L1 and L6 bullets, keep L5 (~55); in "Những lựa chọn lưu trữ" drop item 5 "File phẳng ở gốc `docs/`" (~45). ≈ 1.095.

**Post 2** (new opening, +35 for #10): cut the intro's sampling-method paragraph to one line under the table (~60); "Hai registry": drop the 137/20/6 counts (~30); "Ba bản luật, hai bản đồ đọc": fold into one sentence inside "Những bên đọc…" (~35); "Chuỗi nhân quả, tóm gọn": cut the five-item list, keep the authority-map closing paragraph (~110). ≈ 1.060.

**Post 3** (+30 for #22): "Ngày 25/9": cut the Opus self-limit paragraph ("shell của nó bị chặn…", ~45), the H1/H2/M1/M2 list (~60), the writer-check parenthetical on `a725d4788` (~40); "Ngày 26/9": cut the plan-header block quote (~35), the decision-12 nuance (~40), the knowledge-registry demotion sentence (~20); "29/9 đến 6/10": cut the advice-report bullet (~40), the synthesis self-correction quote (~45), and the OOM detail (kept in post 5) (~50). ≈ 1.270.

**Post 4** (new opening +90, #3 +150, #4 +50, #8 +60, #16 ±0): cut "Logic của phương pháp" paragraph (~95); "Pilot": drop M-05/M-09 detail (~60); "Vì sao chậm": drop the step-10 closing numbers (160/160, 114/114…, ~55) and the 10/10 binding-drift bullet (kept in post 5 table, ~60); "Ngõ cụt": compress to the 20.030-vs-1.018 contrast, A50, A51 (~110); "Hai lỗi quy trình": drop the red-partial bullet (kept in post 5, ~70); delete section "29/10: 'Cả 5 tuần rồi'" (replaced by #3, −105) including the SSD paragraph (post 5 has it); delete section "Write lease: dựng rồi xoá" (posts 5, 6 have it, −86). ≈ 1.260.

**Post 5** (new opening +40): cut the Phase 8 unstable-environment paragraph (9.330 tests, 0/7, 1/8, ~90); "Quyết định": cut the A11/Lead-decided breakdown sentence and the board-log line share (~60); "Đọc con số": cut the first two sentences (moved to the opening, ~30). ≈ 1.250.

**Post 6** (Land gọn section +170, #5 +25, new lessons +70): "Cutover": drop the hook/lease parenthetical (~30); "Đã đạt được": compress items 5–7 to one line each (~120) and the Phase 10 paragraph (~40); "Chưa đạt": delete "Trạng thái `plan.md` từng lỗi thời" (fixed in `36737e5d6`, ~95) and "Giới hạn phương pháp chưa truy hết" (~70); rewrite evidence bullet per #15 (~−20); "Bài học": delete lesson 11 (~75), cut every lesson to rule + one evidence clause (~200). ≈ 1.280.

### (d) Arc

Keep 6 posts. The chronological causal arc (origin → drift → trigger → method → cost → result) is still the right spine: the pre-plan causal chain (posts 1–2) has no transcript and only git can tell it, and no candidate argues for a different order. What changes is the thread through it: the owner's prods (#3) become the rising action, introduced as a cold open in post 1, carried in post 4, counted in post 5, and resolved by Land gọn at the top of post 6 (#1). This is a framing change inside the existing posts, not a new arc. The evidence would only support a stronger change (e.g. a seventh post "Chín lần nhắc") if the owner wants a stand-alone piece; it is not needed.

### New lessons for post 6 (replace lesson 11, adjust 5 and 10)

- **Cổng release chỉ gồm kiểm tra trên sản phẩm.** Sổ sách nội bộ ghi lại, không chặn (#1).
- **Khi người chọn hình dạng cổng, hỏi luôn: qua cổng thì được làm luôn không.** (#6)
- **Giữ đủ câu không có nghĩa là giữ câu đúng.** Lấy mẫu đúng-sai trước khi dựng kế toán (#4).
- Lesson 5 rewritten: "Một khúc cắt trả lời lời phàn nàn mà không thành quy trình thì lời phàn nàn sẽ quay lại" — 9 lần, A5 → A28 → Land gọn (#3, #16).
- Lesson 10 rewritten per #15: owner đã chấp nhận rủi ro (4/11); bài học còn lại là ghi quyết định đó vào bản ghi của plan, không chỉ trong chat.

## 5. Dropped or softened claims

- "Ổ trống từ 15 GB lên 201 GB" after cleanup (TL L87304): Lead's own report, not re-measured; usable only as "theo Lead báo". Not proposed.
- "Mốc đã lùi ba lần" (Lead, TL L82557): the owner names only three dates (two slips); proposals use the dates, not "ba lần".
- Doer-side evidence for #20 (oracle edits) remains memory-only; Doer transcripts were not located (same gap as the reduce report).
- Whether the tar backup was kept after "không cần giữ dữ liệu": M:`project_doc_plan_260925_land_grant…` says a tar backup sits in `.doc-work` (11-03); not re-checked on disk. Post 6's correction should quote the owner and stop there.
- Counts #3 (≥9) and #7 (≥33) are from four top-level transcripts only; subagent and other-session turns were not read, so both are lower bounds.

## Unresolved questions

- Does the owner want the cold open in post 1 to name the 11-02 quote (it is blunt about the Lead), or keep it for post 6 only?
- Should the 11-04 "không cần giữ dữ liệu" decision be recorded in the plan's decision log (it is only in chat and in L13-159's reasoning), before post 6 cites it?

Status: DONE
Summary: Built a 36-candidate pool (transcripts, tag owner-answers, git, memory), scored it on the six-dimension rubric, and found 9 of the top 10 absent from the series, led by "thông minh hơn → Land gọn", the day-13 prediction of the 7.426-line deletion, and a ladder of at least 9 owner prods. The report proposes new openings for posts 1, 2, 4, 5 and 6, placements for each candidate, cuts by heading to about 1.050–1.280 words per post, a correction to post 6 (the owner already said evidence need not be kept), and keeping the 6-post arc.
