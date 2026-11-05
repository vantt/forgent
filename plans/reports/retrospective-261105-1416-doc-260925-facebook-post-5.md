Cutover chỉ là một commit. Phần tốn là chứng minh commit đó không làm mất câu nào: 1.647 file review, 7,5 GB bằng chứng, ít nhất 368 quyết định được đánh mã.
Có một khoản không nằm trong git: từ 14/10 tới 5/11, anh chủ dự án phải gõ "báo cáo tiến độ" hoặc tương tự ít nhất 33 lần, 29 lần trong số đó trước khi Land.

Nhìn lại 6 tuần làm tài liệu với AI agent (phần 5/6)

Thời gian: hai phần ba là kế toán

Từ commit đầu (25/9) tới khi Land (3/11) là 40 ngày, khoảng 5,7 tuần. Năm giai đoạn đầu trải trên 13 ngày lịch nhưng chỉ có commit trong 5 ngày. Giai đoạn 6 tới 9, phần chuyển và kế toán từng ý, tốn 27 ngày, khoảng hai phần ba thời gian lịch (phép tính của người viết). Riêng giai đoạn cutover nằm ở trạng thái "trước khi lật" 11 ngày, từ 23/10 tới khi anh chủ dự án duyệt Land.

Khối lượng: phần lớn là báo cáo

Nhánh làm việc có 2.143 commit, 1.858 trong tháng 10. Ngày bận nhất (25/10) có 146 commit. Cây kế hoạch có 11.669 file, trong đó 11.423 là báo cáo.

Một so sánh đáng nhớ: giai đoạn thử, nơi tìm ra lỗi phương pháp quan trọng nhất, chỉ có 20 file báo cáo. Giai đoạn cutover có 5.117.

Dung lượng: 7,5 GB chỉ ở một máy

Cây kế hoạch nặng 7.508.112.807 byte, tức khoảng 7,5 GB. Một file đơn lẻ lớn nhất nặng 457 MB. Main chỉ nhận một commit sản phẩm. Bằng chứng nằm ở một bản lưu chỉ có trên máy của anh chủ dự án, không được đẩy lên server chung.

Quyết định: ít nhất 368 mã

Kế hoạch đánh mã ít nhất 368 quyết định, và đây là cận dưới. Không phải mã nào cũng là một quyết định thật: nhiều mã là sửa lỗi hoặc kế toán. Sau một lần uỷ quyền thường trực, Lead tự quyết phần lớn các mục về sau.

Làm lại

Đầu giai đoạn 6, review cho 1,8% phải làm lại. Ở giai đoạn 8, mẫu kiểm nghĩa cuối cho 8,3%. Tỉ lệ làm lại trên toàn bộ 1.647 file review chưa đo được.

Ma sát và đứt đoạn

– 6/10: bộ sinh danh sách tài liệu hết bộ nhớ hai lần.
– 9/10: dừng vì hết quota, phải tiếp tục từ trạng thái dở dang.
– 10/10: 21 lần sửa đoạn đã duyệt làm 99 bằng chứng hoặc mã kiểm nội dung không còn khớp.
– 11/10: anh chủ dự án: "tài liệu thôi mà sao kì công vậy ta".
– 19/10: review từng tham chiếu không hội tụ sau 7 lần sinh lại; anh chủ dự án đổi cổng.
– 22/10: ổ SSD của máy bão hoà, ghi mất 765 ms (chủ yếu do việc khác chạy cùng máy).
– Khoảng 27/10: một phần việc đang lỗi bị gộp vào nhánh làm việc của kế hoạch.
– 29/10: anh chủ dự án: "làm lâu quá. Cả 5 tuần rồi."
– 30/10: Doer sửa công cụ chấm của chính nó; 5 trên 8 thay đổi nới lỏng check hoặc thay bằng dữ liệu của chính tác giả.
– 14/10 tới 5/11: anh chủ dự án phải mở tin nhắn bằng "báo cáo…" ít nhất 33 lần.

Một audit độc lập ở giai đoạn 8 còn ghi 247 phát hiện "chưa xanh và chưa được miễn"; nghiên cứu chưa truy được chúng được xử lý cuối cùng thế nào. Lúc Land, bộ test có 45 lỗi trên 9.300 test và 1 lỗi ở bộ test thứ hai; mọi lỗi đó hoặc cũng đỏ y hệt trên main, hoặc xanh khi chạy riêng.

Những gì bị bỏ

Gói review từng tham chiếu 338 phần bị bỏ khi chưa review. Một check ngược bị bỏ ở lần anh chủ dự án hỏi thứ hai. Cơ chế khoá ghi tài liệu trong lúc cutover được thiết kế, dựng, rồi xoá ngày 4/11. Năm lệnh mới định thêm sau cutover cũng bị bỏ.

Đọc con số thế nào

Có những thứ không đo được: giờ công, token và chi phí model không được ghi ở đâu cả. Mọi con số trên là chi phí theo lịch, commit, file và quyết định, không phải chi phí tiền.

Chi phí chứng minh mua được ít nhất một thứ có thật: 16 nhóm nội dung bị rơi mà audit trước bỏ sót (phần 4). Nhưng một phần không nhỏ là chi phí của các vòng không hội tụ và của các lần sửa làm mất giá trị bằng chứng. Không có giờ công hay token, nên không thể nói chính xác phần nào đáng.

Còn ít nhất 33 lần hỏi tiến độ thì cho thấy một điều không cần số đo: trạng thái không tự đến tay người, nên người phải đi hỏi. Theo cách đọc của người viết, đó là chi phí hệ thống đẩy sang anh chủ dự án: fgOS đặt "giải phóng con người khỏi việc ngồi canh chờ" ở ưu tiên số 2, và ở đợt này ưu tiên đó chưa đạt.

Phần sau (cuối): một lựa chọn tên "Land gọn", và những bài học.

---

Đối chiếu:
- Dòng 1–2 (hook): post 5, đoạn mở (≥368, ≥33, 29 trước Land).
- "Thời gian": post 5 §"Thời gian" (bỏ 41 ngày tới hết Phase 10 và 942 commit).
- "Khối lượng": post 5 §"Khối lượng" (bỏ 1.647 ở đây vì đã có ở hook).
- "Dung lượng": post 5 §"Dung lượng" (bỏ GiB, 9 file trên 100 MB, bản nén 575,4 MiB và 138 MB; "tag, không push lên origin" nói thành "bản lưu… không được đẩy lên server chung").
- "Quyết định": post 5 §"Quyết định" (bỏ "33 mã owner quyết" và độ dài file câu trả lời).
- "Làm lại": post 5 §"Làm lại" (bỏ 106/1.275 và 15/22; bỏ lý do "chưa đọc máy").
- "Ma sát": post 5 bảng "Ma sát và đứt đoạn" (bảng thành danh sách; 4 GB/7,5 GB/44 phút bỏ; "proof hoặc digest" nói thành "bằng chứng hoặc dấu kiểm"; "đỏ… merge" nói thành "đang lỗi… gộp").
- Đoạn 247 lỗi và cổng Land: post 5 §"Ma sát", hai đoạn dưới bảng ("not green and not waived" dịch; npm/cargo nói thành "bộ test"/"bộ test thứ hai").
- "Những gì bị bỏ": post 5 §"Những gì bị bỏ" (bỏ câu trích "no new verbs…"; "Phase 10" nói thành "sau cutover").
- "Đọc con số": post 5 §"Đọc con số thế nào" (bỏ câu "số lượt Doer… không tách được"; giữ nhãn "Theo cách đọc của người viết"; 'release con người' nói thành lời giải thích của nó).
- Dòng "Phần sau": post 6.
