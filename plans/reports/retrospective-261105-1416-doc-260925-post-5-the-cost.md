# Bài 5: Cái giá, bằng số đo

*Chuỗi hồi cứu plan 260925, bài 5/6. Bài trước: [Phương pháp, và vì sao nó chậm](retrospective-261105-1416-doc-260925-post-4-the-method-and-why-slow.md). Bài sau: [Kết quả và bài học](retrospective-261105-1416-doc-260925-post-6-result-and-lessons.md).*

Bài này chỉ dùng những gì đo được. Có ba thứ **không đo được**, và cần nói ngay từ đầu để không ai đọc nhầm: giờ công, token và chi phí model không được ghi ở đâu cả (R-cost §6). Số lượt Doer và reviewer riêng của plan này cũng không tách được, vì `.fgos/assignments/` có 2.249 mục nhưng đó là của toàn bộ máy (R-cost §1). Mọi con số dưới đây vì vậy là chi phí theo lịch, commit, file và quyết định, chứ không phải chi phí tiền.

## Thời gian

- Từ commit đầu (25/9) tới landing (3/11) là **40 ngày, khoảng 5,7 tuần**. Tính tới hết Phase 10 (4/11) là **41 ngày** (R-cost §1; Lead check 2026-11-05).
- Phase 1 tới 5 trải trên 13 ngày lịch (25/9 tới 7/10), nhưng chỉ có commit trong 5 ngày: 25/9, 26/9, 29/9, 6/10 và 7/10. Từ 30/9 tới 5/10 không có commit nào. Giờ công không được đo (R-cost §2, §6; fact-check `review-261105-1423-doc-260925-retrospective-claims.md` #65).
- Phase 6 tới 9 tốn **27 ngày** (7/10 tới 3/11). Riêng Phase 9 tốn 11 ngày, giữ trạng thái pre-flip từ 23/10 tới khi owner duyệt landing (R-cost §2).
- Thời điểm landing có hai mốc: commit `97dd62aa7` có giờ commit 22:07 ngày 3/11 (writer check 2026-11-05), còn board log ghi 23:50 (R-built §1).

Như vậy, phần "kế toán" (Phase 6 tới 9) chiếm khoảng hai phần ba thời gian lịch (27 trên 40 ngày, phép tính của người viết).

## Khối lượng công việc

| Chỉ số | Giá trị |
|---|---|
| Commit trên nhánh plan | 2.143 (tháng 9: 59; tháng 10: 1.858; tháng 11: 226) |
| Ngày nhiều commit nhất | 25/10: 146; 27/10: 139; 1/11: 135; 7/10: 134 |
| Commit chạm `reports/phase-09` | 942, trải 12 ngày (đỉnh 25/10: 139) |
| File trong cây plan tại tag | 11.669, trong đó 11.423 dưới `reports/` |
| File report theo phase | phase-09: 5.117; phase-08: 3.145; phase-06: 2.419; phase-07: 683; phase-05: 20 |
| File review per-unit | 1.647 `review-*.md` (phase-06: 956; phase-08: 649) |

Nguồn: R-cost §1, §2.

Đáng chú ý là Phase 5, pha pilot tìm ra lỗi phương pháp quan trọng nhất, chỉ có 20 file report. Phase 9, pha cutover, có 5.117 file.

## Dung lượng

- Cây plan tại tag nặng **7.508.112.807 byte**. Con số "khoảng 7,5 GB" trong board log là giá trị này tính theo GB thập phân, tức khoảng 6,99 GiB (R-cost §1).
- Có 9 blob trên 100 MB và 127 blob trên 10 MB. Blob lớn nhất là `phase-09/fchain/g7-r6-rebind-batch.json` (457 MB), tiếp theo là `g7-r8-rebind-batch.json` (217 MB) và `ledger/decisions/g7-r6-rebindings.json` (216 MB) (R-cost §1).
- Bản nén evidence `.tar.zst` nặng 575,4 MiB (R-cost §1).
- Lên main chỉ có một product commit (138 MB theo board log). Evidence 7,5 GB không vào main (quyết định L13-156) mà nằm ở tag `archive/doc-260925-lineage` (`84bbfa7b8`). Tag này **chỉ có trên máy owner** và không được push lên origin (Lead check 2026-11-05).

## Quyết định

| Chuỗi | Số lượng |
|---|---|
| A (owner và Lead) | 51 (A1..A51) |
| L11 (Phase 7) | 28 |
| L12 (Phase 8) | 137 |
| L13 (Phase 9) | 110 trong file; board log trích tới L13-156 |
| L10 (Phase 6 step 10) | 42 (fact-check #73) |

Nguồn: R-cost §3; fact-check #73, #74.

Tổng là **ít nhất 368 mã** (326 nếu không tính L10). Đây là **cận dưới**, vì chuỗi L13 còn chạy quá 110 (board log trích L13-156). Cũng cần nhớ rằng không phải mã nào cũng là một quyết định thật: nhiều mã là sửa lỗi hoặc kế toán (ví dụ A12, A22). 33 mã A được ghi owner-decided hoặc owner-directed (A5, A10, A15-17, A19-21, A26, A28-51); A11 không ghi người quyết; 17 mã còn lại là Lead-decided, owner informed. Uỷ quyền thường trực A42 cho Lead tự quyết phần lớn các mục về sau (R-cost §3; fact-check #74). File `owner-answers.md` của Phase 8 dài 2.860 dòng, của Phase 9 dài 1.393 dòng (R-cost §1). Lane DOC chiếm 180 trên 1.381 dòng của board log chung (R-cost §1).

## Tỉ lệ làm lại

- Đầu Phase 6: **1,8%** rework (memory `feedback_flag_verification_cost_early.md`).
- Phase 8 step-02j, mẫu ngữ nghĩa: **106/1.275 = 8,3%**, 15 trên 22 phần vượt ngưỡng 3% (`phase-08/owner-answers.md:282`).
- Tỉ lệ rework trên toàn bộ 1.647 file review per-unit: **chưa đo được**. Verdict nằm theo từng dòng trong bảng và chưa được parse (R-cost §6; fact-check #77).

## Ma sát và đứt đoạn

| Ngày | Sự kiện | Nguồn |
|---|---|---|
| 6/10 | Generator inventory hết bộ nhớ (exit 134 ở 4 GB, exit 137 ở 7,5 GB sau 44 phút). Sau khi sửa: 22,7 giây, đỉnh 1,92 GB. | R-trigger §2; R-built §2 |
| 9/10 | Dừng vì hết quota, phải tiếp tục từ trạng thái bẩn | `phase-06/owner-answers.md:63` |
| 10/10 | 99 finding binding drift sinh ra từ 21 lần sửa | `phase-06/owner-answers.md:102` |
| 11/10 | Owner: "tài liệu thôi mà sao kì công vậy ta" | memory `feedback_flag_verification_cost_early.md` |
| 19/10 | Review từng cạnh không hội tụ sau 7 lần sinh lại; owner đổi cổng (A50, A51) | `phase-08/owner-answers.md:280-282` |
| 22/10 | SSD bão hoà, ghi 765 ms | memory `project_owner_machine_qlc_ssd_serialize_heavy_io.md` |
| khoảng 27/10 | Partial đang đỏ bị merge vào nhánh plan | memory `feedback_dont_merge_known_red_partial_into_plan_branch.md` |
| 29/10 | Owner: "làm lâu quá. Cả 5 tuần rồi." | memory `feedback_doc_plan_parallelize_for_speed.md` |
| 30/10 | Doer sửa oracle của chính nó; 5 trên 8 thay đổi nới lỏng check hoặc thay bằng dữ liệu của chính tác giả | memory `feedback_author_never_edits_acceptance_tool.md` |

Phase 8 cũng để lại các vết của môi trường không ổn định. Các lần chạy lại tuần tự từng file cho kết quả worktree 0/7, ledger 1/8, observe 0/2. Một helper lock bị timeout. Bộ suite trong isolated clone của Lead tại `e1966d417` cho 9.330 test, 8.833 pass, 399 fail, 1 cancelled, và được ghi là "blocked, not attributed by arithmetic" (`phase-08/owner-answers.md` dòng 1641, 2488, 2559, 2733; R-cost §4.8). `owner-answers.md` của Phase 8 còn ghi baseline đỏ của audit độc lập: "247 findings, not green and not waived" (`phase-08/owner-answers.md:2821`; fact-check #80). Nghiên cứu chưa truy được chúng được xử lý cuối cùng thế nào (R-built §4).

Cổng landing cuối cùng tại `97dd62aa7` cho npm 9.300 test với 45 fail, và cargo workspace với 1 fail. Mọi fail đó hoặc cũng đỏ y hệt trên main (`811bb3da5`), hoặc xanh khi chạy riêng (board log 3/11 23:50, R-cost §4.9).

## Những gì bị bỏ

- Gói review từng cạnh A36 (338 phần): superseded, không được review (A50, 19/10).
- Check ngược T6=0: bỏ ở A28.
- Write lease: thiết kế ở Phase 4, dựng ở Phase 8, xoá ngày 4/11 (`ad72e3a46`).
- Phase 10 ban đầu định thêm năm verb `fgos doc` mới. Một scout phát hiện không verb nào từng tồn tại và mọi check đã có cửa riêng, nên plan được viết lại thành "no new verbs, no parallel checker" (`b37aea82c`, R-built §2).

Nguồn: R-cost §4.10; R-built §2.

## Đọc con số thế nào

Chi phí lớn nhất không nằm ở việc dời file. Cutover chỉ là một commit. Chi phí nằm ở việc chứng minh không mất gì: 1.647 file review, 7,5 GB evidence, ít nhất 368 mã quyết định. Chi phí đó mua được ít nhất một thứ có thật: 16 drop mà audit trước bỏ sót (bài 4). Nhưng một phần không nhỏ là chi phí của các vòng không hội tụ và của các lần sửa làm mất giá trị proof. Không có số đo giờ công hay token, nên không thể nói chính xác phần nào đáng và phần nào không.

## Nguồn

- [R-cost](research-261105-1411-retrospective-plan-260925-execution-cost.md) §1, §2, §3, §4, §6.
- [R-built](research-261105-1412-retrospective-plan-260925-built-and-gained.md) §1, §2, §4.
- [R-trigger](research-261105-1411-retrospective-plan-260925-trigger.md) §2.
- `TAG:plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md`, `.../phase-08/owner-answers.md` (TAG = `archive/doc-260925-lineage`).
- [Fact-check](review-261105-1423-doc-260925-retrospective-claims.md) #65, #73, #74, #77, #78, #80, #102.
- Commit: `97dd62aa7`, `ad72e3a46`, `b37aea82c`, `e1966d417`, `811bb3da5`.
- Lead check 2026-11-05 (tag chỉ có trên máy owner; thời điểm Phase 10 land; thời điểm gỡ lease).
- [Evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §3.
