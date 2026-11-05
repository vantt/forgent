# Bài 5: Cái giá, bằng số đo

*Chuỗi hồi cứu plan 260925, bài 5/6. Bài trước: [Phương pháp, và vì sao nó chậm](retrospective-261105-1416-doc-260925-post-4-the-method-and-why-slow.md). Bài sau: [Kết quả và bài học](retrospective-261105-1416-doc-260925-post-6-result-and-lessons.md).*

Cutover chỉ là một commit; phần tốn là chứng minh commit đó không làm mất câu nào: 1.647 file review, 7,5 GB evidence, ít nhất 368 mã quyết định. Có một khoản không nằm trong git: từ 14/10 tới 5/11, owner phải gõ "báo cáo tiến độ" hoặc tương tự ít nhất 33 lần, 29 lần trong số đó trước khi Land.

## Thời gian: hai phần ba là kế toán

Từ commit đầu (25/9) tới landing (3/11) là **40 ngày**, khoảng 5,7 tuần; tính tới hết Phase 10 (4/11) là 41 ngày. Năm phase đầu trải trên 13 ngày lịch nhưng chỉ có commit trong 5 ngày. Phase 6 tới 9, phần chuyển và kế toán từng claim, tốn **27 ngày**, khoảng hai phần ba thời gian lịch (phép tính của người viết). Riêng Phase 9 giữ trạng thái "trước khi lật" 11 ngày, từ 23/10 tới khi owner duyệt landing, với 942 commit chạm vào thư mục báo cáo của phase đó.

## Khối lượng: 2.143 commit, phần lớn là báo cáo

Nhánh plan có **2.143 commit**, 1.858 trong tháng 10. Ngày bận nhất (25/10) có 146 commit. Cây plan có **11.669 file**, trong đó 11.423 là báo cáo. Riêng file review từng đơn vị là **1.647**.

Một so sánh đáng nhớ: Phase 5, pha thử tìm ra lỗi phương pháp quan trọng nhất, chỉ có 20 file báo cáo. Phase 9, pha cutover, có 5.117.

## Dung lượng: 7,5 GB chỉ ở một máy

Cây plan nặng **7.508.112.807 byte**, tức khoảng 7,5 GB thập phân (6,99 GiB). Một file đơn lẻ lớn nhất nặng 457 MB; 9 file trên 100 MB. Bản nén nặng 575,4 MiB. Main chỉ nhận một commit sản phẩm (138 MB theo board log). Evidence nằm ở một tag **chỉ có trên máy owner**, không được push lên origin.

## Quyết định: ít nhất 368 mã

Plan đánh mã **ít nhất 368** quyết định qua năm chuỗi, và đây là cận dưới vì chuỗi cuối còn chạy tiếp. Không phải mã nào cũng là một quyết định thật: nhiều mã là sửa lỗi hoặc kế toán. 33 mã trong chuỗi chính được ghi là owner quyết hoặc chỉ đạo; sau một lần uỷ quyền thường trực, Lead tự quyết phần lớn các mục về sau. File câu trả lời của owner cho Phase 8 dài 2.860 dòng.

## Làm lại

Đầu Phase 6, review cho **1,8%** phải làm lại. Ở Phase 8, mẫu ngữ nghĩa cuối cho **8,3%** (106/1.275), 15 trên 22 phần vượt ngưỡng 3%. Tỉ lệ làm lại trên toàn bộ 1.647 file review **chưa đo được**: kết luận nằm theo từng dòng bảng và chưa được đọc máy.

## Ma sát và đứt đoạn

| Ngày | Sự kiện |
|---|---|
| 6/10 | Bộ sinh inventory hết bộ nhớ hai lần (4 GB, rồi 7,5 GB sau 44 phút) |
| 9/10 | Dừng vì hết quota, phải tiếp tục từ trạng thái dở dang |
| 10/10 | 21 lần sửa section đã duyệt làm 99 proof hoặc digest không còn khớp |
| 11/10 | Owner: "tài liệu thôi mà sao kì công vậy ta" |
| 19/10 | Review từng tham chiếu không hội tụ sau 7 lần sinh lại; owner đổi cổng |
| 22/10 | Ổ SSD máy owner bão hoà, ghi mất 765 ms (chủ yếu do việc khác chạy cùng máy) |
| khoảng 27/10 | Một phần việc đang đỏ bị merge vào nhánh plan |
| 29/10 | Owner: "làm lâu quá. Cả 5 tuần rồi." |
| 30/10 | Doer sửa oracle của chính nó; 5 trên 8 thay đổi nới lỏng check hoặc thay bằng dữ liệu của chính tác giả |
| 14/10 tới 5/11 | Owner phải mở tin nhắn bằng "báo cáo…" ít nhất 33 lần |

Phase 8 còn ghi một mốc đỏ của audit độc lập: "247 findings, not green and not waived". Nghiên cứu chưa truy được chúng được xử lý cuối cùng thế nào. Cổng landing cuối cùng cho 45 fail trên 9.300 test npm và 1 fail ở cargo; mọi fail đó hoặc cũng đỏ y hệt trên main, hoặc xanh khi chạy riêng.

## Những gì bị bỏ

Gói review từng tham chiếu 338 phần bị bỏ khi chưa review. Một check ngược bị bỏ ở lần owner hỏi thứ hai. Cơ chế khoá ghi tài liệu trong lúc cutover được thiết kế ở Phase 4, dựng ở Phase 8 và xoá ngày 4/11. Năm lệnh mới định thêm ở Phase 10 cũng bị bỏ: plan được viết lại thành "no new verbs, no parallel checker".

## Đọc con số thế nào

Có ba thứ **không đo được**: giờ công, token và chi phí model không được ghi ở đâu cả; số lượt Doer và reviewer của riêng plan này cũng không tách được. Mọi con số trên là chi phí theo lịch, commit, file và quyết định, không phải chi phí tiền.

Chi phí chứng minh mua được ít nhất một thứ có thật: 16 nhóm nội dung bị rơi mà audit trước bỏ sót (bài 4). Nhưng một phần không nhỏ là chi phí của các vòng không hội tụ và của các lần sửa làm mất giá trị proof. Không có giờ công hay token, nên không thể nói chính xác phần nào đáng.

Còn ít nhất 33 lần hỏi tiến độ thì cho thấy một điều không cần số đo: trạng thái không tự đến tay người, nên người phải đi hỏi. Theo cách đọc của người viết, đó là chi phí hệ thống đẩy sang owner: fgOS đặt 'release con người', tức giải phóng con người khỏi việc ngồi canh chờ, ở ưu tiên số 2, và ở plan này ưu tiên đó chưa đạt.

## Nguồn

- Thời gian: R-cost §1, §2; fact-check #65; Lead check 2026-11-05. 942 commit chạm `reports/phase-09`.
- Khối lượng: R-cost §1, §2 (tháng 9: 59; tháng 10: 1.858; tháng 11: 226; ngày đỉnh 25/10: 146, 27/10: 139, 1/11: 135, 7/10: 134; report theo phase: 5.117 / 3.145 / 2.419 / 683 / 20; `review-*.md` phase-06: 956, phase-08: 649).
- Dung lượng: R-cost §1 (blob lớn nhất `phase-09/fchain/g7-r6-rebind-batch.json`; 127 blob trên 10 MB; `.tar.zst`); 138 MB: board log 3/11 23:50; product commit `97dd62aa7`; quyết định L13-156; tag `archive/doc-260925-lineage` (`84bbfa7b8`), Lead check 2026-11-05.
- Quyết định: A1..A51 (51), L10 42, L11 28, L12 137, L13 110 trong file (board log trích tới L13-156); 326 nếu không tính L10. 33 mã A owner-decided hoặc owner-directed (A5, A10, A15-17, A19-21, A26, A28-51); uỷ quyền A42; ví dụ mã kế toán A12, A22. Phase 9 owner-answers 1.393 dòng. R-cost §1, §3; fact-check #73, #74.
- Làm lại: memory `feedback_flag_verification_cost_early.md`; `TAG:plans/260925-documentation-authority-unification/reports/phase-08/owner-answers.md:282` (step-02j); R-cost §6; fact-check #77.
- Bảng ma sát: R-trigger §2 (exit 134, 137); `phase-06/owner-answers.md:63` (A12), `:102`; memory `feedback_flag_verification_cost_early.md`; `phase-08/owner-answers.md:280-282` (A50, A51); memory `project_owner_machine_qlc_ssd_serialize_heavy_io.md`, `feedback_dont_merge_known_red_partial_into_plan_branch.md`, `feedback_doc_plan_parallelize_for_speed.md`, `feedback_author_never_edits_acceptance_tool.md`; fact-check #78, #102.
- 247 finding: `phase-08/owner-answers.md:2821`; fact-check #80; R-built §4. Cổng landing: board log 3/11 23:50, so với main `811bb3da5`; R-cost §4.9.
- Bị bỏ: A36 / A50 (19/10); T6=0 ở A28; write lease, `ad72e3a46`; `b37aea82c`; R-cost §4.10; R-built §2.
- Số lần "báo cáo…": đếm lượt owner trong `~/.claude/projects/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d.jsonl` có text bắt đầu bằng "báo cáo" (dòng 2797, 2026-10-14T10:32:52Z, tới dòng 89158, 2026-11-05T02:34:35Z); 4 lượt sau khi Land (3/11 23:41). Chỉ một transcript, nên là cận dưới. Round 3 m5.
- Ưu tiên "release con người": `AGENTS.md`, thứ tự ưu tiên sản phẩm.
- [R-cost](research-261105-1411-retrospective-plan-260925-execution-cost.md); [R-built](research-261105-1412-retrospective-plan-260925-built-and-gained.md); [R-trigger](research-261105-1411-retrospective-plan-260925-trigger.md); [fact-check](review-261105-1423-doc-260925-retrospective-claims.md); [round 3](review-261105-1800-doc-260925-retrospective-claims-round3.md); [evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §3, §6.
