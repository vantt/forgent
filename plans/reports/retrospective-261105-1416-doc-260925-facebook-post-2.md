Trong tám tuần, thư mục tài liệu tăng từ 365 lên 4.301 file, còn số spec được bảo trì chỉ nhích từ 11 lên 13.
Rồi ngày 18/9, một commit "sửa lỗi" chép 943 file sang cây mới mà không xoá bản nào. Lúc chép, chỉ 6 trong 935 file trùng đường dẫn là khác nhau; một ngày sau đã là 67.

Nhìn lại 6 tuần làm tài liệu với AI agent (phần 2/6)

Phần 1 dừng ở chỗ fgOS có cơ chế tự sinh tài liệu nhưng chưa có luật nói bản nào là bản đúng. Phần này đo hậu quả, từ 1/8 tới 25/9.

Số file tăng 12 lần, spec gần như đứng yên

1/8: 365 file, 11 spec.
15/8: 1.500 file, 12 spec.
29/8: 2.116 file, 12 spec.
12/9: 3.239 file, 13 spec.
25/9: 4.301 file, 13 spec.

Phần tăng thêm gần như toàn là bằng chứng và lịch sử công việc, không phải spec được bảo trì. Riêng thư mục lịch sử tăng từ 535 lên 1.115 file trong một tuần. Vấn đề không nằm ở số lượng, mà ở chỗ mọi thứ nằm chung một cây và không có dấu nào nói file nào là bản đúng.

Một báo cáo ngày 25/8 đã đo được nguyên nhân cơ học. Hệ có 268 tài liệu cho người dùng và tăng khoảng 50 tài liệu mỗi 7 ngày. "Viết mới hay viết thêm vào tài liệu cũ" chỉ được quyết bằng việc kiểm một đường dẫn đặt tên tự do có tồn tại hay không, nên gần như lần nào cũng thành viết mới. Theo cách đọc của người viết, đó là cơ chế ở phần 1 chạy đúng như thiết kế.

Dời quyết định, sinh link chết

Ngày 17/8, 34 bản ghi quyết định được dời vào từng spec. Một guard bắt trích dẫn lệch đã có từ 27/7, nhưng lần dời vẫn để lại tham chiếu chết: 59 phút sau, một commit khác phải sửa một phần và nới mốc của guard để chấp nhận phần còn lại. Từ đây, một quyết định nằm ở ba nơi: lời kể trong spec, bản ghi sự kiện, và một file mục lục sinh tự động.

Hai danh sách tài liệu trong một tuần

Cuối tháng 8, một danh sách tài liệu (registry) được tạo và bật bắt buộc. 332 tài liệu được dời sang thư mục mới, nhưng thư mục cũ không bị xoá. Tới 25/9, một review độc lập phát hiện mọi tài liệu đều "tạm thời" và số chủ đề bằng đúng số tài liệu (332 = 332): registry chưa gộp được tài liệu nào.

Một cây song song

Thư mục thiết kế của một khu (Agent Coordination) có 14 file vào 29/8, 473 file vào 5/9, và 905 file vào 12/9. Phần lớn là request thô, kết quả và bằng chứng chạy, không phải thiết kế.

Hai tuần sau khi đợt dọn bắt đầu, ngày 10/10, Lead đưa anh chủ dự án bảng tiến độ: khu này có 17.034 dòng trong 867 file, trong khi hai khu kế tiếp chỉ có 431 và 402 dòng. Anh chủ dự án trả lời: "nhìn bảng tổng kết mới thấy cơ chế viết tài liệu của chúng ta có vấn đề. 1 component nhưng 867 files, vấn đề quá rõ."

Sai lầm 18/9: chép thay vì dời

Ngày 15/9, quy định quản lý tài liệu mới ra đời, ghi "Accepted" (đã chấp nhận) nhưng "Implementation: Partial" (mới làm một phần).

Ngày 18/9, một commit có tiêu đề bắt đầu bằng 'fix(dispatch)' (sửa phần điều phối) và phần sau ghi 'migrate' (di trú) thêm 943 file vào cây mới: không đổi tên, không xoá bản gốc. Một việc di trú lớn nằm lẫn trong commit sửa lỗi, và chữ "migrate" thực chất là chép.

Lúc chép, 935 đường dẫn có ở cả hai cây và chỉ 6 file khác nhau. Một ngày sau, con số là 67. Hai cây bắt đầu tách nhau ngay khi vừa được chép. Ai quyết định chép thay vì dời, và với ý định gì, chưa rõ.

Những thứ đọc tài liệu không chuyển theo

Ngày 25/9, luật nền có ba bản, và có hai bản đồ đọc. File chỉ dẫn mà mọi agent đọc đầu tiên vẫn trỏ tới tổng quan hệ thống, bản đồ đọc và luật nền ở cây cũ. Có 25 tham chiếu tới thư mục spec cũ nằm trong 22 file chỉ dẫn và skill.

Đây là mắt xích làm mọi nỗ lực di trú trở nên vô nghĩa: một agent mới vào repo sẽ được dẫn thẳng tới cây cũ. Cổng vào mới tồn tại nhưng không ai đi qua nó.

Nhìn lại

Ngày 25/9, bản đồ thẩm quyền tổng kết: 3 khu đã chuyển sang cây mới, 3 khu đang chờ, 12 khu vẫn dùng bản cũ. Bản đồ ghi rằng không còn xung đột nào sau một quy tắc định tuyến viết tay ngay trong lần thay đổi đó. Nói cách khác, xung đột có tồn tại, và chỉ được gỡ bằng tay ngay ngày hôm đó.

Phần sau: không tìm thấy sự cố nào khởi động đợt dọn này. Thứ làm nó cấp bách là một review nói thẳng rằng tiền đề của bản kế hoạch đã sai.

---

Đối chiếu:
- Dòng 1–2 (hook): post 2, đoạn mở (365→4.301; 11→13; 943 file; 6/935 rồi 67).
- "Phần 1 dừng ở chỗ…": post 2, đoạn mở thứ hai.
- Danh sách 5 mốc: post 2, bảng §"Số file tăng 12 lần" (bỏ cột `docs/platform`).
- "Phần tăng thêm…", "Một báo cáo ngày 25/8…": post 2 §"Số file tăng 12 lần" (giữ nhãn "theo cách đọc của người viết"; bỏ câu "Nghiên cứu hồi cứu quy phần tăng…").
- "Dời quyết định, sinh link chết": post 2 §"Dời ADR và link chết: 17/8" ("cập nhật mốc của guard và sửa bước quét" nói gọn thành "phải sửa lại").
- "Hai danh sách tài liệu": post 2 §"Hai danh sách tài liệu trong một tuần: 25 đến 27/8".
- "Một cây song song" + đoạn 10/10: post 2 §"Một cây song song" (bỏ 566 payload).
- "Sai lầm 18/9": post 2 §"Sai lầm 18/9" (bỏ "943 file thêm, 4 file sửa"; tiêu đề commit giữ cụm đầu "fix(dispatch)" và chữ "migrate", có dịch; bỏ đường dẫn).
- "Những thứ đọc tài liệu không chuyển theo": post 2 §"Những bên đọc luôn được nạp…" (bỏ kích thước byte; `AGENTS.md` nói thành "file chỉ dẫn mà mọi agent đọc đầu tiên").
- "Nhìn lại": post 2 §"Nhìn lại" (câu trích tiếng Anh "after the routing correction…" nói bằng lời).
- Dòng "Phần sau": post 3, đoạn mở.
