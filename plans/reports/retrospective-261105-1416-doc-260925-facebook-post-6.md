Sáng 3/11, anh chủ dự án chọn "Land gọn": từ đó chỉ những kiểm tra trên chính sản phẩm (tài liệu, link, test) mới được chặn việc đưa lên main, còn sổ sách chứng minh nội bộ được làm sau.
Khoảng 13 tiếng sau, cutover lên main. Trước đó, mốc Land đã lùi từ 29/10 sang 1/11 rồi 3/11.

Nhìn lại 6 tuần làm tài liệu với AI agent (phần 6/6)

3/11: Land gọn

Câu hỏi ở đầu phần 1, "thông minh hơn đi… 6 tuần rồi", tới lúc 10:57 ngày 2/11. Lead trả lời ngay: "Phần tài liệu thật ra không khó; cái làm chậm là bộ máy chứng minh mà em dựng quanh nó".

Trong ba lựa chọn Lead đưa ra, anh chủ dự án chọn Land gọn lúc 10:22 ngày 3/11, gần một ngày sau câu hỏi.

Cổng gọn cũng bị audit. Một auditor độc lập trả về "làm lại": cổng mới đã hạ một loại lỗi xuống "ghi lại sau Land", trong khi cùng loại lỗi đó còn báo hai bản sửa đè lên cùng một dòng, tức xung đột ngay trong sản phẩm, và phải tiếp tục chặn Land.

Lúc 14:14, anh chủ dự án viết: "tưởng sáng cho quyền rồi. anh thấy cả 2 tiến trình đều ngồi đợi". Theo Lead, quyết định buổi sáng chỉ chọn hình dạng cổng và vẫn để "Land do owner duyệt riêng". Lead nhận: "Lẽ ra em nên hỏi gộp ngay lúc đó: gate qua thì Land luôn", và ghi quyền Land thành một quyết định riêng.

Cutover: một commit

Commit cutover thay đổi 1.677 file, trong đó 943 file bị xoá. Nó cài ba guard: chặn file mới ở các cây cũ, kiểm vị trí file, và kiểm link. Guard có mặt trong cutover vì ngày 21/10 anh chủ dự án hỏi: "bộ quy định, ràng buộc để docs không sinh bậy cũng được land trong phase 9?".

Đã đạt được

1. Một cây tài liệu có thẩm quyền. Hai cây cũ không còn. Cây mới có 628 file trong 34 khu, chỉ còn một bản đồ đọc và một bản luật nền.
2. Một check chạy lại được: ngày 5/11 nó báo 628 tài liệu, 2.607 link, 0 lỗi.
3. Tra được đường dẫn cũ qua một bảng 9.235 mục. Theo cách đọc của người viết, đây là phần trả lời cho nhu cầu tra cứu mà review đầu tiên nêu (phần 3).

Còn mở

– Một hệ có một cửa ghi duy nhất cho tài liệu, như proposal ngày 20/9 hướng tới, chưa có kế hoạch. Đợt này giải quyết chuyện bản nào đúng, chưa giải quyết việc viết.
– Check tài liệu chỉ chạy cùng bộ test, không chạy lúc commit, và đó là chủ ý: link gãy chỉ bị bắt khi bộ test chạy.
– Bằng chứng chỉ có ở máy anh chủ dự án. Sáng 4/11, Lead hỏi chỗ lưu bằng chứng ngoài máy; anh chủ dự án duyệt các việc 1-4 (gồm các bản ghi sau Land) và viết thêm: "Nếu ổn thì anh không cần giữ dữ liệu đâu". Lead hiểu câu đó là không cần bản sao ngoài máy, và cũng dựa vào nó để dừng phần sổ sách sau Land.

Năm bài học

1. Cổng release chỉ gồm kiểm tra trên sản phẩm, và khi người chọn hình dạng cổng thì hỏi luôn: qua cổng thì được làm luôn không. Sổ sách nội bộ ghi lại, không chặn. Thiếu câu hỏi đó, chiều 3/11 anh chủ dự án thấy cả hai tiến trình như đang chờ và phải hỏi lại.

2. Lời nhắc của người là chi phí của hệ thống, và một khúc cắt không thành quy trình thì lời nhắc quay lại. Anh chủ dự án phải nhắc ít nhất chín lần và hỏi tiến độ ít nhất 33 lần. Hãy đo số lần người phải đi hỏi như một chỉ số chi phí.

3. Giữ đủ câu không có nghĩa là giữ câu đúng. Mẫu 30 câu cho 13,3% và 26,7% câu sai so với hiện trạng. Lấy mẫu đúng-sai trước khi dựng kế toán.

4. Đặt luật về bản đúng trước cơ chế sinh tài liệu; khi di trú thì dời chứ không chép, và chuyển cả những thứ đọc tài liệu cùng lúc. Theo cách đọc của người viết, bước tự sinh tài liệu là một nguyên nhân chính của việc tăng từ 365 lên 4.301 file.

5. Quyết định chấp nhận rủi ro phải được hỏi và ghi rõ, không suy ra từ một câu chat. Câu "Nếu ổn thì anh không cần giữ dữ liệu đâu" được Lead hiểu thành chấp nhận để bằng chứng ở một máy, nhưng bản kế hoạch trên main chỉ ghi nơi bằng chứng nằm.

Câu hỏi ở đầu loạt bài là "6 tuần rồi". Câu trả lời: phần tài liệu không khó, cái chậm là bộ máy chứng minh, và nó dừng khi cổng chỉ còn hỏi sản phẩm có đúng không.

Theo cách đọc của người viết, hai nửa của loạt bài là một chuyện: phần 1–2 cho thấy tài liệu phình ra vì được sinh trước khi có luật nói bản nào đúng, và phần 4–6 cho thấy việc dọn chậm vì phải chứng minh lại từng câu của chính đống tài liệu đó.

Cảm ơn mọi người đã đọc tới đây.

---

Đối chiếu:
- Dòng 1–2 (hook): post 6, đoạn mở ("Land gọn" giải thích; khoảng 13 tiếng; bỏ giờ 23:41 và 22:07; mốc 29/10 → 1/11 → 3/11).
- "3/11: Land gọn": post 6 §"3/11: Land gọn" (bỏ câu 119 link chết; REWORK nói thành "làm lại"; "phán quyết" nói thành "quyết định"; L13-155 nói thành "một quyết định riêng").
- "Cutover": post 6 §"Cutover: một commit" (bỏ +182.794 / -239.220; bỏ gộp bản đồ đọc và viết lại `AGENTS.md`; `AGENTS.md` nói thành "file chỉ dẫn cho agent"; bỏ câu lý do của phán quyết L12-89).
- "Đã đạt được" 1–3: post 6 §"Những gì đã đạt được" mục 1–3 (bỏ "302 metadata-exempt"; bỏ đoạn doc-health 214 dòng so với dự đoán 400–500 vì không nói ngắn được mà giữ đúng phạm vi; bỏ câu về sổ claim 68.441 dòng / digest).
- "Còn mở": post 6 §"Những gì chưa đạt hoặc còn mở" (bỏ mục guard chưa có hiệu lực qua bản đã cài; câu O4 giữ gần nguyên văn, bỏ mã L13-159; bỏ "28 file trong thư mục plan"; "pre-commit" nói thành "lúc commit").
- "Năm bài học": post 6 §"Bài học" 1–5 (bài 1 bỏ "khoảng 13 tiếng sau khi được chọn" vì đã ở hook và bỏ mã L13-155; bài 4 bỏ "bước compound-learn (20/7) ra đời khi luật nền đã có hai bản", giữ nhãn; bài 5 bỏ "plan.md dòng 280").
- Hai đoạn kết: post 6, hai câu cuối (giữ nhãn "Theo cách đọc của người viết").
- Câu cảm ơn: dòng kết thêm cho Facebook, không phải claim.
