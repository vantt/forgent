Nghiên cứu hồi cứu không tìm thấy sự cố, báo cáo hỏng hay đoạn chat nào làm cú hích cho đợt dọn tài liệu này.
Thứ làm nó cấp bách là một review của bản nháp kế hoạch, nói thẳng: "Three authority rules are live at the same time and disagree" (ba luật về bản đúng đang cùng chạy và nói khác nhau).

Nhìn lại 6 tuần làm tài liệu với AI agent (phần 3/6)

Ngày 25/9: review bác tiền đề của bản nháp

Ngày 25/9, bản nháp kế hoạch được đưa cho hai model khác nhau review độc lập. Hai review chỉ tư vấn, không quyết định.

Review thứ nhất, do Claude Opus chạy, khuyên đi tiếp nhưng chỉ cho bước đầu tiên, kèm những thay đổi bắt buộc. Phát hiện quan trọng nhất của nó không phải một lỗi trong kế hoạch, mà là tiền đề của kế hoạch sai:

"The plan is aimed at a clean two-system repository. The live repository already has per-area authority flips, three user-doc systems, and decision history stored in [thư mục spec]."

Nói bằng lời thường: bản nháp tưởng repo có hai hệ tài liệu, một cũ một mới, chỉ cần chuyển từ hệ này sang hệ kia. Review cho thấy repo có nhiều hơn thế: bản đúng đã bị đổi chỗ theo từng khu, có ba hệ tài liệu cho người dùng, và lịch sử quyết định nằm trong spec. Phát hiện đầu tiên của nó là câu đã dẫn ở trên. Phát hiện thứ hai: xoá đường dẫn cũ thì cần một cách tra lại chúng sau đó, và cách đó chưa tồn tại trước cutover.

Khuyến nghị đầu tiên của review: trước khi làm gì, phải kiểm kê xem hiện tại cái gì đang là bản đúng.

Câu trả lời là một bước "truth reset": một bản đồ cho biết bản nào đang là bản đúng ở từng khu, chỉ ghi lại, không dời hay xoá gì.

Review thứ hai, do Gemini chạy trên bản kế hoạch đã sửa, ghi rằng kế hoạch đã nhận "critical corrections from the prior review", nhưng vẫn giữ: chưa được phép bắt đầu di trú. Nó nêu năm phát hiện; hai điều về sau thành việc thật: phát hiện tài liệu bị lệch không có nghĩa là đã chặn được việc ghi, và sổ theo dõi từng ý trong tài liệu chưa có chỗ lưu bền.

Trước đó: một proposal và một yêu cầu

Từ 15/9, quy định quản lý tài liệu cho phép di trú từng khu một, có con trỏ chuyển hướng. Phần 2 đã cho thấy cách này dẫn tới đâu.

Một proposal ghi ngày review cuối 20/9 lật lại cách làm đó. Nó được commit lần đầu đêm 21/9, lẫn trong một commit về chuyện khác. Proposal nói nó giữ lại toàn bộ cuộc thảo luận, nhưng phiên chat gốc không có trong repo, nên nguồn gốc này chưa kiểm chứng được. Nó ghi ý định của anh chủ dự án: mọi chi tiết còn giữ ở hai cây cũ phải được chuyển sang hệ mới, rồi hai cây cũ phải bị bỏ và xoá, không được tồn tại mãi như nguồn "tương thích".

Đây là yêu cầu thật: không để lại một chỗ chia đôi vĩnh viễn nào.

Hai nguyên tắc, và hai bản kế hoạch

Ngày 26/9, một bản kế hoạch được commit lên main, ghi "chưa được duyệt để chạy", trong khi trên nhánh riêng, bản đang chạy đã đóng ba giai đoạn đầu. Từ đây kế hoạch có hai bản song song.

Kế hoạch đòi kết thúc tình trạng chia đôi mà không mất bất kỳ ý, lý do, hợp đồng, quyết định, bằng chứng hay ý định nào. Hai nguyên tắc định hình toàn bộ chi phí phía sau:

– Chuyển bản đúng một lần duy nhất, không có trạng thái nửa vời.
– Bảo toàn từng ý trong tài liệu.

Hai nguyên tắc này đúng về mặt nguyên tắc. Nhưng chính chúng biến việc "dọn tài liệu" thành việc kế toán từng ý một.

30/9 đến 6/10: dừng, rồi chạy tiếp

Từ 30/9 tới 5/10 không có commit nào. Ngày 6/10, anh chủ dự án nhắc lại lý do khi hỏi: kế hoạch "đã dừng khá lâu để đợi cơ chế harness ổn định và quay lại, nhưng liệu đợi lâu như vậy có nên hay không…".

Kế hoạch chạy lại ngay hôm đó. Bộ sinh danh sách tài liệu hết bộ nhớ hai lần trước khi chạy được, và báo cáo chạy lại ghi 43 ý biến mất là chưa rõ mất thật hay chỉ đổi chỗ. Anh chủ dự án quyết định kế hoạch chạy trong một phiên chat riêng: "ở đây chúng ta chỉ hoàn thiện plan và ý định cho nó, không chạy nhé".

Nhìn lại

Không có cú hích dạng sự cố. Có hai tháng tích tụ, một proposal đòi xoá hẳn cây cũ, và một review cho thấy thực tế tệ hơn tiền đề của bản nháp.

Phần sau: ngày thứ 13, anh chủ dự án hỏi "quy mô tool ghê vậy?", và chưa tới 15 phút sau một bản nháp đã đoán đúng kết cục.

---

Đối chiếu:
- Dòng 1–2 (hook): post 3, đoạn mở (câu O1; câu trích C1, có dịch).
- "Ngày 25/9: review bác tiền đề": post 3 §"Ngày 25/9: review bác tiền đề của bản nháp" (câu trích premise giữ nguyên văn, trừ đường dẫn `docs/specs` thay bằng "[thư mục spec]"; "khuyên đi tiếp…"; phát hiện thứ hai C2 nói bằng lời; khuyến nghị "Phase 00 must first inventory…" nói bằng lời).
- "Câu trả lời là truth reset": cùng mục (bỏ câu trích "Use explicit declarations…" và nhận xét đi kèm).
- "Review thứ hai": cùng mục ("migration execution remains unauthorized" nói thành "chưa được phép bắt đầu di trú"; H1, M2 nói bằng lời).
- Câu "Bản đồ, hai review và plan được commit cùng nhau…": bỏ.
- "Trước đó: một proposal…": post 3 §"Trước đó: một proposal và một yêu cầu" (câu trích ý định owner nói bằng lời; bỏ tiêu đề commit).
- "Hai nguyên tắc…": post 3 §"Hai nguyên tắc, và hai bản plan" (câu trích sứ mệnh nói bằng lời).
- "30/9 đến 6/10": post 3 §"29/9 đến 6/10" (bỏ đổi định dạng 29/9 và câu bản tổng hợp H6; câu trích owner TI L2097 cắt bằng "…" để bỏ tên công cụ nội bộ; bỏ "main đi trước 400 commit").
- "Nhìn lại": post 3 §"Nhìn lại".
- Dòng "Phần sau": post 4, đoạn mở.
