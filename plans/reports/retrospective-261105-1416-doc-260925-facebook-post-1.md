Sáng 2/11, sau gần sáu tuần, anh chủ dự án gõ một dòng: "thông minh hơn đi. làm tài liệu có phải viết code gì phức tạp mà 6 tuần rồi".
Câu trả lời bắt đầu từ ngày repo ra đời.

Nhìn lại 6 tuần làm tài liệu với AI agent (phần 1/6)

Vài từ dùng trong loạt bài: "Lead" là phiên agent điều phối, hỏi anh chủ dự án và giao việc. "Doer" là agent làm từng lượt việc theo lệnh của Lead. "Land" là đưa thay đổi lên nhánh chính (main). "Cutover" là lần chuyển một lần duy nhất từ cây tài liệu cũ sang cây mới.

Đợt dọn tài liệu của fgOS mất 41 ngày. Lý do không nằm ở một lỗi cụ thể, mà ở những lựa chọn rất hợp lý trong tuần đầu tiên, khi chưa ai nghĩ thư mục tài liệu sẽ phình 12 lần trong tám tuần: từ 365 lên 4.301 file, giữa 1/8 và 25/9.

Ngày 13/7: repo trống

Commit đầu tiên chỉ có file giấy phép. Hai giờ sau, tài liệu đầu tiên xuất hiện: một README định vị sản phẩm, gõ sai tên thành "READEME", và một file thử đặt tên dự án. Một phút sau, repo có thêm một hệ để học từ các dự án khác.

Ngay ngày đầu, thư mục tài liệu đã chứa ba loại: định vị sản phẩm, thăm dò, và kho học từ bên ngoài. Chưa có quy tắc nào phân biệt chúng.

Lời hứa: mỗi việc để lại hệ thống khá hơn

Rạng sáng 14/7, một bài viết về "compound engineering" đặt ra ý tưởng xuyên suốt của fgOS: mỗi đơn vị công việc phải để lại hệ thống khá hơn cho đơn vị kế. Câu hỏi trung tâm: "Làm sao để engineering cộng dồn thay vì reset mỗi lần?"

Bài chia câu hỏi đó làm bốn. Câu đầu tiên là "tri thức đã chốt được giữ ở đâu". Đó chính là câu mà đợt dọn tài liệu phải trả lời lại hơn hai tháng sau.

Luật nền, và bản thứ hai của nó

Cùng đêm, lúc 00:28, repo có tám luật nền. Luật quan trọng nhất cho chuyện tài liệu định nghĩa "xong" bằng sáu câu hỏi, câu thứ sáu là "Bài học nào để lại?". Luật ghi rõ đây nằm trong định nghĩa "xong", không phải tính năng cộng thêm.

Chưa đầy hai giờ sau, một thư mục spec ra đời, trong đó có một bản spec của chính các luật nền. Ngay ngày thứ hai, luật nền đã có hai bản. Tới 25/9, nó có ba bản với ba kích thước khác nhau.

Compound được dựng thành code

Ngày 15 và 16/7, repo có vòng "dự đoán rồi đối chiếu kết quả thật": mỗi việc ghi dự đoán lúc nhận, kết quả lúc xong, các va vấp gặp phải, và tự ghi bài học. Ngày 16/7, một commit tuyên bố đạt bậc trưởng thành F4 (trên thang F0 tới F5), nhưng bằng chứng nằm trong một báo cáo ngoài repo, nên tuyên bố đó không kiểm chứng được từ repo hiện tại.

Ngày 20/7, bước ghi bài học thành bắt buộc: một việc coding không thể đóng nếu chưa qua bước đó, và có test giữ luật này. Cùng ngày, một skill được thêm để viết một tài liệu cho người dùng sau mỗi việc. Skill dặn: "a thin, honest document beats an invented rich one" (một tài liệu mỏng mà thật tốt hơn một tài liệu dày mà bịa).

Đây là điểm mấu chốt. Từ 20/7, mỗi việc coding hoàn thành sinh ra ít nhất một tài liệu mới, theo thiết kế.

Những lựa chọn lưu trữ đầu tiên

Trong ba tuần đầu, có nhiều lựa chọn hợp lý khi đứng riêng, nhưng không có quy tắc nào ràng chúng lại:

– Mỗi khu một file spec, với một file trạng thái lớn nuốt dần mọi tính năng.
– Quyết định nằm ở ba chỗ: một file dữ liệu, một thư mục 9 bản ghi quyết định chưng cất tay từ 17 quyết định, và các trích dẫn rải trong spec.
– Hai tuần (14/7 tới 28/7), kế hoạch và lịch sử bị tách khỏi repo. Một số file chỉ nằm ngoài repo trong thời gian đó không có trong lịch sử repo hiện tại.
– Trong khoảng sáu tuần, có ít nhất bốn kho bài học khác nhau.

Không lựa chọn nào sai khi đứng riêng. Vấn đề là không cái nào trả lời được câu "khi hai chỗ nói khác nhau thì chỗ nào đúng".

Nhìn lại

Lời hứa rất rõ: tri thức phải cộng dồn chứ không reset. Cơ chế cũng được dựng thật, có cổng và có test. Nhưng khi chưa có luật nói tài liệu nào là bản đúng và nằm ở đâu, chính cơ chế đó đã biến "cộng dồn tri thức" thành "cộng dồn file".

Phần sau: số file đã cộng dồn nhanh tới mức nào, và một commit "sửa lỗi" đã chép 943 file thay vì dời.

---

Đối chiếu:
- Dòng 1–2 (hook): post 1, đoạn mở (câu trích transcript Lead L84830, 2/11 10:57 +07; "gần sáu tuần").
- Đoạn "Vài từ dùng…": post 1, hộp "Từ dùng trong chuỗi bài" (Lead, Doer, Land, Cutover).
- "41 ngày… 365 lên 4.301": post 1, đoạn mở thứ hai.
- "Ngày 13/7": post 1 §"Ngày 13/7: repo trống và một hệ học từ người khác".
- "Lời hứa": post 1 §"Lời hứa" (trích câu hỏi trung tâm; câu trích dài về compound được tóm lại bằng lời).
- "Luật nền": post 1 §"Luật nền, và bản thứ hai của nó" (bỏ quy tắc đổi luật).
- "Compound được dựng thành code": post 1 §"Compound được dựng thành code" ("compound-learn" nói thành "bước ghi bài học"; thêm lời dịch câu trích của skill).
- "Những lựa chọn lưu trữ": post 1 §"Những lựa chọn lưu trữ đầu tiên", mục 1–4.
- "Nhìn lại": post 1 §"Nhìn lại".
- Dòng "Phần sau": post 2, đoạn mở.
