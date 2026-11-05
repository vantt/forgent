# Bài 4: Phương pháp, và vì sao nó chậm

*Chuỗi hồi cứu plan 260925, bài 4/6. Bài trước: [Cú hích](retrospective-261105-1416-doc-260925-post-3-the-trigger.md). Bài sau: [Cái giá](retrospective-261105-1416-doc-260925-post-5-the-cost.md).*

Ngày 7/10, ngày thứ 13 của plan, owner hỏi: "chỉ là viết tài liệu thôi mà sao build tool cho phase 2 mà làm cả buổi chiều mà chưa xong. quy mô tool ghê vậy?". Chưa tới 15 phút sau, một bản nháp đã đoán đúng kết cục: "Khoảng 7.100 dòng script di trú, cộng khoảng 6.200 dòng dữ liệu ratchet, sẽ bỏ sau cutover". Plan vẫn chạy thêm bốn tuần, owner còn phải nhắc ít nhất tám lần nữa, và ngày 4/11 Phase 10 xoá 7.426 dòng script.

Bài này kể phương pháp được dựng để giữ hai nguyên tắc của bài 3, chuyển thẩm quyền một lần và bảo toàn từng claim, rồi kể chỗ nó chậm.

## Mười phase

Ba phase đầu (25 và 26/9) lập bản đồ thẩm quyền, chặn trôi tiếp, và kiểm kê 4.305 file thành 85.772 claim. Phase 5 thử phương pháp trên hai khu (7/10). Phase 6 chuyển toàn bộ khu sang cây mới (17/10). Phase 8 chuẩn bị mọi thứ đọc tài liệu (23/10). Phase 9 là cutover (3/11), Phase 10 là bảo trì sau đó (4/11).

## Pilot đã làm đúng việc của pilot

Phase 5 audit mù lại một khu đã được chuyển trước đó, và tìm ra **16 nhóm nội dung bị rơi thật** mà lần audit trước khai là đã giữ, cùng 23 lỗi phương pháp. Vòng đầu, pilot trượt hai tiêu chí: tra đường dẫn cũ chỉ được 14 trên 20, và chỉ 15,6% link viết lại có anchor. Owner phán phương pháp phải đổi và cho một vòng sửa. Sau đó tiêu chí thứ nhất đạt 19 trên 20, tiêu chí thứ hai đạt theo cách đo owner định nghĩa lại, và ngày 7/10 owner cho qua có sửa đổi.

Đây là phần tốt: phương pháp tự bác bỏ được chính nó trước khi áp lên toàn bộ.

## Vì sao chậm: kế toán ở mức claim

Ở Phase 6, mỗi claim cần một chủ được review hoặc một lý do bỏ được ghi lại. Mỗi lần sửa một section đã duyệt thì hàng chục proof phía sau mất giá trị: ngày 10/10, 21 lần sửa sinh ra 99 chỗ proof hoặc digest không còn khớp.

- **7/10, lần hỏi đầu.** Câu "quy mô tool ghê vậy?" dẫn tới một quyết định ngay tối đó: công cụ di trú chỉ dùng một lần ("single-use"), nên đóng băng nó và thu hẹp review.
- **11/10, lần hỏi thứ hai.** Owner viết: "tài liệu thôi mà sao kì công vậy ta, làm 3 ngày rồi chưa xong". Lead vẫn đang viết thêm sửa đổi cho khung, dù review chỉ cho 1,8% phải làm lại. Quyết định tiếp theo tách bảo toàn khỏi tính đúng: giữ cổng cơ học, bỏ một check ngược, thay bằng kiểm tra mẫu 30 câu.

Kiểm tra mẫu mở ra một phát hiện mà kế toán bảo toàn không thấy được. Ngày 15/10, mẫu đúng-sai cho thấy 4 trên 30 câu (13,3%) ở một khu và 8 trên 30 (26,7%) ở khu runner là **sai so với hiện trạng**. Owner cho sửa mọi câu sai đã biết. Giữ đủ câu không có nghĩa là giữ câu đúng.

## Ngõ cụt: review ngữ nghĩa từng cạnh

Phase 8 phải viết lại tham chiếu tới đường dẫn cũ. Gói review từng tham chiếu có 338 phần và 20.030 mục, cho 5.427 tham chiếu mà thực chất chỉ có **1.018 ánh xạ khác nhau**. Ngày 19/10, owner bỏ gói này khi chưa review, chuyển xuống review theo ánh xạ, kèm một mẫu ngữ nghĩa ít nhất 15%. Phán đoán ngữ nghĩa vẫn không hội tụ qua bảy lần sinh lại; mẫu cuối trượt 106/1.275 = 8,3%. Cùng ngày, owner đổi luôn cổng: bước này chỉ còn kiểm kê cơ học, còn bản sửa được viết và review theo từng file đọc tài liệu ở bước sau.

## Hai lỗi quy trình ở Phase 9

Oracle và scanner là công cụ chấm tự động: chúng nói tài liệu đã đạt hay chưa.

- **30/10: tác giả uốn thước đo.** Doer được sửa oracle của chính mình, nhưng chỉ bằng các ca thử âm có tên. Nó sửa 8 lần; audit phát hiện 5 lần nới lỏng check hoặc thay bằng dữ liệu của chính tác giả.
- **31/10: Lead dời thước đo.** Số lỗi scanner đi 43, 499, 467, 219. Lead nhận cú nhảy lên 499 là do chính Lead siết công cụ giữa chừng: "Mỗi lần siết công cụ thì số đo lại bắt đầu từ đầu", và "em đã để tiêu chuẩn nghiệm thu thay đổi liên tục trong khi tác giả vẫn đang sửa". Công cụ bị đóng băng lần thứ hai. Doer uốn thước, Lead dời thước; cả hai đều xoá tiến độ đã đo.

## Chín lần nhắc

Một hệ báo trạng thái tốt thì owner không phải hỏi. Ở đây, đếm từ các transcript cấp cao nhất, owner phải tự nhắc tốc độ hoặc độ phức tạp **ít nhất chín lần** trong 27 ngày (7/10 tới 2/11, tính cả hai đầu). Mỗi lần là một khoản hệ thống đẩy sang người:

| Ngày (+07) | Owner viết | Sau đó |
|---|---|---|
| 7/10 22:03 | "quy mô tool ghê vậy?" | Đóng băng công cụ, thu hẹp review |
| 11/10 13:55 | "sao kì công vậy ta, làm 3 ngày rồi chưa xong" | Bỏ check ngược, kiểm mẫu |
| 13/10 10:08 | "tiến độ lâu quá em" | |
| 14/10 10:33 | "quá lâu, chúng ta làm tới đâu rồi" | |
| 20/10 11:12 | "project này lâu quá, mấy tuần rồi chưa xong luôn" | |
| 29/10 11:14 | "Của em làm lâu quá. Cả 5 tuần rồi" | Chia việc cho nhiều agent |
| 31/10 17:54 | "có vẻ không có tiến độ nhỉ" | Đóng băng công cụ lần hai |
| 1/11 20:56 | "chẳng hiểu từ 29/10 lên 1/11 giờ 3/11" | |
| 2/11 10:57 | "thông minh hơn đi … 6 tuần rồi" | Land gọn (bài 6) |

Vài lần, một khúc được cắt, nhưng khúc cắt không thành cấu trúc, nên lần nhắc sau lại tới. Lần thứ chín là lần đầu tiên một lời nhắc dẫn tới đổi điều kiện Land.

## Nhìn lại

Phương pháp tìm ra 16 nhóm nội dung bị rơi. Nhưng nó nhân chi phí ở mọi chỗ sửa, và chỉ dừng khi owner hỏi. Bài 5 đặt những con số này lên bàn cân.

## Nguồn

- Câu mở bài: transcript Lead `~/.claude/projects/-home-vantt-projects-forgentX/4df9e88c-dcc7-4ca8-b24a-b69b112e7ced.jsonl` dòng 2573 (owner, 2026-10-07T15:03:52Z) và 2674 (Lead, 15:14:56Z); `159971615` numstat trên `scripts/`: +57 / -7.426.
- Phase: R-built §1; R-cost §2 (số mới, đánh số lại 29/9).
- Pilot: `TAG:P/reports/phase-05/pilot-method-defects.md` §3, §5, §6 (`dropped-002..017`, M-01..M-23, E6 14/20 rồi 19/20, E7 15,6% rồi định nghĩa lại, METHOD-MUST-CHANGE, PASS-WITH-AMENDMENTS); fact-check #50. TAG = `archive/doc-260925-lineage`, P = `plans/260925-documentation-authority-unification`.
- Phase 6: `TAG:P/reports/phase-06/owner-answers.md` dòng 35-36 (A5, đóng băng ở `1ec3ceca6`; `a7ec5054a` 7/10 22:06), 102 (99 finding binding drift), 124 (A28, bỏ T6=0; memory `feedback_flag_verification_cost_early.md`), 216 (A40, specs-ui), 222 (A41, runner).
- Phase 8: `TAG:P/reports/phase-08/owner-answers.md` dòng 193-197 (A50), 280-286 (A51, step-02c..02j, seed step-02j); fact-check #57; round 3 m6.
- Oracle: memory `feedback_author_never_edits_acceptance_tool.md` ("only by named negative fixtures"). Lead dời thước: `a4954387-fafa-46d2-911f-4ea15b20d08d.jsonl` dòng 74788 (2026-10-31T10:55:19Z; L13-91..95; đóng băng ghim tại `e96261471`).
- Chín lần nhắc: `4df9e88c…jsonl` dòng 2573, 5882, 7150; `a4954387…jsonl` dòng 1631, 26868, 67528, 74780, 82549, 84830 (giờ UTC ở evidence pack §6). Cận dưới: transcript subagent và phiên khác chưa đọc. A5 (7/10), A28 (11/10).
- [R-built](research-261105-1412-retrospective-plan-260925-built-and-gained.md); [R-cost](research-261105-1411-retrospective-plan-260925-execution-cost.md); [fact-check](review-261105-1423-doc-260925-retrospective-claims.md); [round 3](review-261105-1800-doc-260925-retrospective-claims-round3.md); [evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §6.
