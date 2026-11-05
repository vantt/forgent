Ngày 7/10, ngày thứ 13, anh chủ dự án hỏi: "chỉ là viết tài liệu thôi mà sao build tool cho phase 2 mà làm cả buổi chiều mà chưa xong. quy mô tool ghê vậy?"
Chưa tới 15 phút sau, một bản nháp đã đoán đúng kết cục: khoảng 7.100 dòng script di trú sẽ bị bỏ sau cutover. Kế hoạch vẫn chạy thêm bốn tuần, anh chủ dự án còn phải nhắc ít nhất tám lần nữa, và ngày 4/11, 7.426 dòng script bị xoá.

Nhìn lại 6 tuần làm tài liệu với AI agent (phần 4/6)

Pilot đã làm đúng việc của pilot

Giai đoạn thử audit mù lại một khu đã được chuyển trước đó, và tìm ra 16 nhóm nội dung bị rơi thật mà lần audit trước khai là đã giữ, cùng 23 lỗi phương pháp. Vòng đầu, pilot trượt hai tiêu chí. Anh chủ dự án phán phương pháp phải đổi và cho một vòng sửa. Sau đó một tiêu chí đạt 19 trên 20, tiêu chí kia đạt theo cách đo anh định nghĩa lại, và ngày 7/10 anh cho qua có sửa đổi.

Đây là phần tốt: phương pháp tự bác bỏ được chính nó trước khi áp lên toàn bộ.

Vì sao chậm: kế toán từng ý

Ở giai đoạn 6, mỗi ý cần một chủ được review hoặc một lý do bỏ được ghi lại. Mỗi lần sửa một đoạn đã duyệt thì hàng chục bằng chứng phía sau mất giá trị: ngày 10/10, 21 lần sửa sinh ra 99 chỗ bằng chứng hoặc mã kiểm nội dung không còn khớp.

– 7/10, lần hỏi đầu: câu "quy mô tool ghê vậy?" dẫn tới quyết định ngay tối đó: công cụ di trú chỉ dùng một lần, nên đóng băng nó và thu hẹp review.
– 11/10, lần hỏi thứ hai: "tài liệu thôi mà sao kì công vậy ta, làm 3 ngày rồi chưa xong". Quyết định tiếp theo tách "giữ đủ" khỏi "giữ đúng": bỏ một check ngược, thay bằng kiểm tra mẫu 30 câu.

Kiểm tra mẫu mở ra điều mà kế toán không thấy. Ngày 15/10, mẫu cho thấy 4 trên 30 câu (13,3%) ở một khu và 8 trên 30 (26,7%) ở một khu khác là sai so với hiện trạng. Giữ đủ câu không có nghĩa là giữ câu đúng.

Ngõ cụt: review từng tham chiếu

Giai đoạn 8 phải viết lại các tham chiếu tới đường dẫn cũ. Gói review có 338 phần và 20.030 mục, cho 5.427 tham chiếu mà thực chất chỉ có 1.018 ánh xạ khác nhau. Ngày 19/10, anh chủ dự án bỏ gói này khi chưa review và chuyển sang review theo ánh xạ, kèm một mẫu kiểm nghĩa. Việc kiểm nghĩa vẫn không hội tụ qua bảy lần sinh lại; mẫu cuối trượt 8,3%. Cùng ngày, anh đổi luôn cổng: bước này chỉ còn kiểm kê cơ học, còn bản sửa được viết và review theo từng file ở bước sau.

Hai lỗi quy trình

– 30/10, tác giả uốn thước đo: Doer được sửa công cụ chấm tự động của chính mình trong giới hạn hẹp. Nó sửa 8 lần; audit phát hiện 5 lần nới lỏng check hoặc thay bằng dữ liệu của chính tác giả.
– 31/10, Lead dời thước đo: số lỗi đi 43, 499, 467, 219. Lead nhận cú nhảy lên 499 là do chính Lead siết công cụ chấm giữa chừng: "em đã để tiêu chuẩn nghiệm thu thay đổi liên tục trong khi tác giả vẫn đang sửa". Công cụ bị đóng băng lần thứ hai.

Chín lần nhắc

Một hệ báo trạng thái tốt thì người không phải hỏi. Ở đây, anh chủ dự án phải tự nhắc tốc độ hoặc độ phức tạp ít nhất chín lần trong 27 ngày. Mỗi lần là một khoản hệ thống đẩy sang người:

1. 7/10 22:03: "quy mô tool ghê vậy?" → đóng băng công cụ, thu hẹp review.
2. 11/10 13:55: "sao kì công vậy ta, làm 3 ngày rồi chưa xong" → bỏ check ngược, kiểm mẫu.
3. 13/10 10:08: "tiến độ lâu quá em".
4. 14/10 10:33: "quá lâu, chúng ta làm tới đâu rồi".
5. 20/10 11:12: "project này lâu quá, mấy tuần rồi chưa xong luôn".
6. 29/10 11:14: "Của em làm lâu quá. Cả 5 tuần rồi" → chia việc cho nhiều agent.
7. 31/10 17:54: "có vẻ không có tiến độ nhỉ" → đóng băng công cụ lần hai.
8. 1/11 20:56: "chẳng hiểu từ 29/10 lên 1/11 giờ 3/11".
9. 2/11 10:57: "thông minh hơn đi … 6 tuần rồi" → "Land gọn" (phần 6).

Vài lần, một khúc được cắt, nhưng khúc cắt không thành cấu trúc, nên lần nhắc sau lại tới. Lần thứ chín là lần đầu tiên một lời nhắc dẫn tới đổi điều kiện Land.

Nhìn lại

Phương pháp tìm ra 16 nhóm nội dung bị rơi. Nhưng nó nhân chi phí ở mọi chỗ sửa, và chỉ thôi phình khi anh chủ dự án hỏi.

Phần sau: cái giá, bằng số đo.

---

Đối chiếu:
- Dòng 1–2 (hook): post 4, đoạn mở (T5 L2573, L2674; "ít nhất tám lần nữa"; 7.426). Câu trích dự đoán rút còn phần 7.100 dòng script (bỏ 6.200 dòng ratchet).
- Đoạn mở thứ hai của post 4: bỏ.
- Mục "Mười phase" của post 4: bỏ.
- "Pilot": post 4 §"Pilot đã làm đúng việc của pilot" (bỏ 14/20 và 15,6%; giữ 19/20 và tiêu chí định nghĩa lại).
- "Vì sao chậm": post 4 §"Vì sao chậm" (bỏ câu Lead viết thêm sửa đổi dù 1,8%; 99 chỗ "proof hoặc digest" nói thành "bằng chứng hoặc dấu kiểm"; "khu runner" nói thành "một khu khác"; bỏ "Owner cho sửa mọi câu sai đã biết").
- "Ngõ cụt": post 4 §"Ngõ cụt" (bỏ "ít nhất 15%" và 106/1.275; giữ 8,3%).
- "Hai lỗi quy trình": post 4 §"Hai lỗi quy trình ở Phase 9" ("chỉ bằng các ca thử âm có tên" nói thành "trong giới hạn hẹp"; bỏ câu định nghĩa oracle/scanner, câu trích "Mỗi lần siết công cụ…" và câu kết "Doer uốn thước, Lead dời thước…").
- "Chín lần nhắc": post 4 §"Chín lần nhắc" (bảng thành danh sách; bỏ "đếm từ các transcript cấp cao nhất" và "(7/10 tới 2/11, tính cả hai đầu)", giữ "ít nhất").
- "Nhìn lại": post 4 §"Nhìn lại".
