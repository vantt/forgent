# Đọc chuỗi hồi cứu 6 bài với tư cách người ngoài

Người đọc: kỹ sư phần mềm nói tiếng Việt, chưa biết dự án. Chỉ đọc 6 bài, không mở file nào khác.

## Bài 1: Ngày đầu tiên và lời hứa "compound"

1. Câu mở: 2/2. Câu "thông minh hơn đi. làm tài liệu có phải viết code gì phức tạp mà 6 tuần rồi" là một lời phàn nàn thật, có giờ, có người nói. Nó tạo câu hỏi "vì sao lại mất 6 tuần?". Đoạn thứ hai bắt đầu trôi vì phải nhảy sang chuyện ngày 13/7.
2. Điều học được: nếu cơ chế sinh tài liệu tự động chạy trước khi có luật nói tài liệu nào là bản đúng, số file sẽ tăng theo cấp số nhân mà không ai đọc kịp. "Cộng dồn tri thức" thành "cộng dồn file".
3. Chỗ rối:
   - Cả bài là hash commit và mã (`ebc6e8047`, `e9ff70db7`, "R-genesis §2.1", "L1 đến L8", "Phase 1", "F4"). Gợi ý: giữ tối đa 2-3 mốc, còn lại đưa xuống phần Nguồn.
   - "distillery", "Diataxis", "bee", "workshop", "repo divorce" không được giải thích. Gợi ý: "kho học từ dự án khác", "bốn kiểu tài liệu", "thư mục làm việc riêng".
   - Phần "Tám luật nền" kể tới ba cấp mã (L5, D-ID, câu 6) cho một ý duy nhất. Gợi ý: một câu, "luật định nghĩa xong gồm cả câu 'đã để lại bài học gì'".
   - Mục "Những lựa chọn lưu trữ đầu tiên" là bốn gạch đầu dòng dày đặc, đọc như audit.
4. Chia sẻ: không. Mở bài hay nhưng thân bài là nhật ký commit.

## Bài 2: Tài liệu đã trôi dạt thế nào

1. Câu mở: 2/2. "365 lên 4.301 file, specs chỉ nhích từ 11 lên 13" là con số gây sốc. Câu về commit "fix(dispatch)" chép 943 file cũng rất cuốn.
2. Điều học được: khi di trú tài liệu thì phải dời chứ không chép, và phải chuyển cả những thứ đọc tài liệu (file chỉ dẫn cho agent, link, script) trong cùng đợt, nếu không người mới vẫn bị dẫn vào cây cũ.
3. Chỗ rối:
   - "quadrant", "registry", "provisional", "TRUST_STORE_KINDS", "authority map", "promoted/candidate/legacy-current", "baseline citation drift". Gợi ý: nói "cây cũ", "cây mới", "danh sách tài liệu".
   - Bảng số liệu hay. Nhưng mục "Dời ADR", "Hai registry" và "architect" đều là chuyện nội bộ ở mức commit. Mỗi mục chỉ cần một câu kết luận.
   - Trích dẫn nội bộ kiểu "(fact-check #13)", "(R-middle §3.2)" nằm giữa câu và cắt mạch đọc.
   - Đoạn "đi trước câu chuyện một chút" (10/10) làm đứt dòng thời gian.
4. Chia sẻ: có, với dân làm docs/monorepo. Con số 12 lần và sự cố "chép thay vì dời" đủ để kể lại.

## Bài 3: Cú hích

1. Câu mở: 1/2. Ý "không có sự cố nào" có thể thành móc hay, nhưng câu mở lại nằm ở đoạn sau. Câu gần nhất là "Nghiên cứu hồi cứu không tìm thấy sự cố...". Mở bằng cụm này tốt hơn nhiều so với "Người ta thường nghĩ...".
2. Điều học được: trước khi lập kế hoạch dọn lớn, hãy kiểm kê hiện trạng thật. Review độc lập cho thấy hiện trạng tệ hơn tiền đề của bản nháp (ba luật thẩm quyền đang chạy cùng lúc và mâu thuẫn nhau).
3. Chỗ rối:
   - Bài đầy mã: "C1/C2", "H1, H2, M1, M2, L1", "Phase 00", "truth reset", "Quyết định 5", "TAG", "R-trigger §1.4", "fact-check #35". Gợi ý: gọi "review thứ nhất", "review thứ hai", bỏ mã phát hiện.
   - Hai bản plan song song (nhánh và main) khó theo dõi, người ngoài không phân biệt được. Gợi ý: một câu "plan chạy trên nhánh riêng trong khi bản trên main vẫn ghi 'chưa duyệt'".
   - Hai review của hai model khác nhau là chi tiết đắt giá nhưng bị chìm giữa các mã.
   - Mục "29/9 đến 6/10" nhồi 5 sự kiện (đổi định dạng, dừng, harness, resume, OOM) trong một danh sách.
4. Chia sẻ: không. Đây là bài yếu về mặt đọc: nhiều sự kiện, ít khoảnh khắc.

## Bài 4: Phương pháp, và vì sao nó chậm

1. Câu mở: 2/2. Câu hỏi "chỉ là viết tài liệu thôi mà sao build tool...", dự đoán đúng 7.100 dòng bị bỏ sau 15 phút, và owner vẫn phải nhắc thêm bảy lần. Đây là câu mở mạnh nhất chuỗi.
2. Điều học được: cuộc kiểm chứng "giữ đủ câu" không chứng minh "giữ câu đúng". Lấy mẫu 30 câu đúng/sai (13% và 27% sai) sớm sẽ rẻ hơn nhiều so với dựng kế toán đầy đủ.
3. Chỗ rối:
   - Bảng 10 phase dùng thuật ngữ khép kín ("write lease", "ratchet", "claim ledger", "alias table", "binding drift", "A50", "A51", "D1 đến D9", "E6/E7", "T6=0", "L13-91 tới L13-95"). Gợi ý: bỏ cột "Đóng", mỗi phase một câu dễ hiểu, hoặc chỉ nêu 4 phase quan trọng.
   - Mã A28, A40, A50 trong câu chạy. Nghĩa là mỗi lần người đọc phải đoán chúng là gì. Gợi ý: thay bằng việc đã làm ("bỏ check ngược", "bỏ gói review từng cạnh").
   - Bảng "Chín lần nhắc" hay, nhưng cột thứ ba bỏ trống nhiều dòng.
   - Mục "Hai lỗi quy trình ở Phase 9" (Doer uốn thước, Lead dời thước) rất hay nhưng thiếu một câu giải thích "oracle/scanner" là gì với người ngoài.
4. Chia sẻ: có. Chủ đề "nhiều lần phàn nàn nhưng không thành cấu trúc" ai làm dự án dài cũng gặp.

## Bài 5: Cái giá, bằng số đo

1. Câu mở: 2/2. "1.647 file review, 7,5 GB evidence, ít nhất 368 mã quyết định" cùng 33 lần owner hỏi báo cáo. Hơi dày đặc nhưng có sức nặng.
2. Điều học được: nếu cần hỏi tiến độ 33 lần thì trạng thái không đến tay người. Hãy đo "số lần người phải đi hỏi" như một chỉ số chi phí.
3. Chỗ rối:
   - Đây là bài khô nhất: 5 bảng liên tiếp (thời gian, khối lượng, dung lượng, quyết định, ma sát). Gợi ý: chọn 5 con số đắt nhất, nói bằng văn xuôi.
   - Bảng "Quyết định" (A, L10, L11, L12, L13) vô nghĩa với người ngoài. Một câu "ít nhất 368 quyết định đánh mã" là đủ.
   - Câu "Có ba thứ không đo được" mở rất trung thực nhưng đặt trước cả bài khiến người đọc hiểu "bài này sẽ thiếu số quan trọng".
   - Bảng "Ma sát" hay nhưng nguồn nội bộ ("memory ...md") không giúp người ngoài.
   - Câu "Với một hệ đặt 'release con người' ở ưu tiên số 2, đó là một khoản nợ" cần giải thích "release con người" là gì (giải phóng người khỏi việc canh chờ).
4. Chia sẻ: không. Nó là bài tham chiếu, chứ không phải bài để kể.

## Bài 6: Kết quả, những gì còn mở, và bài học

1. Câu mở: 1/2. "Land gọn" là thuật ngữ chưa giải thích, nên câu mở khó hiểu. Nội dung câu thì tốt (chỉ kiểm tra trên sản phẩm mới chặn landing). Gợi ý: mở bằng câu trả lời của Lead cho owner, "phần tài liệu không khó, cái chậm là bộ máy chứng minh".
2. Điều học được: cổng release chỉ nên gồm kiểm tra trên sản phẩm, sổ sách nội bộ thì ghi lại chứ không chặn. Và khi người chọn hình dạng cổng, hỏi luôn "qua cổng thì được làm luôn không?" để khỏi chờ thừa.
3. Chỗ rối:
   - 13 bài học trong một danh sách, trộn bài học lớn (1, 4, 5) với việc vặt (11, 12). Gợi ý: giữ 4-5 bài học xuyên suốt, phần còn lại thành "ghi chú vận hành".
   - Mục 1-7 "đã đạt" có nhiều mã/đường dẫn (`doc-health.mjs`, "G10", "gap G1", "PF-I024", "DOCOS"). Gợi ý: nêu 3 kết quả, bỏ phần còn lại.
   - "L13-152", "L13-155", "L13-159", "L12-89" lặp trong thân văn.
   - Các bài học 6 và 7 lặp lại bài 2, bài 9 và 10 lặp lại bài 4.
4. Chia sẻ: có, nếu rút còn 4-5 bài học. Hiện tại danh sách 13 mục làm giảm sức nặng.

## Cả chuỗi

- Khoảnh khắc mạnh nhất: bài 4, owner hỏi "quy mô tool ghê vậy?", 15 phút sau bản nháp đã đoán đúng 7.100 dòng sẽ bị bỏ, và 4 tuần sau Phase 10 xoá đúng 7.426 dòng. Đây là chi tiết người ngoài nhớ được.
- Bài yếu nhất: bài 5 (bảng số liệu liên tiếp, ít khoảnh khắc). Ngay sau đó là bài 3 (quá nhiều mã, không có nhân vật nào để người đọc bám vào).
- Cung truyện có giữ không: có, ở mức vừa phải. Bài 6 trả lời trực tiếp câu mở bài 1 ("phần tài liệu không khó, cái chậm là bộ máy chứng minh") và đóng vòng bằng câu "6 tuần rồi". Điểm yếu: bài 1 nói về nguyên nhân gốc (cơ chế sinh tài liệu), còn câu trả lời ở bài 6 nhắc tới nguyên nhân khác (bộ máy chứng minh). Hai thứ này liên quan nhưng chưa được nối thành một câu. Người đọc phải tự nối.
- Câu trích của owner có làm anh ấy khó xử không: không có câu nào không công bằng, vì phần lớn là câu hỏi thẳng về tốc độ và đều được dùng để cho thấy owner đúng. Hai chỗ cần để ý:
  - Bảng "chín lần nhắc" (bài 4) và "33 lần hỏi báo cáo" (bài 5) có thể đọc như "đếm lỗi của owner" nếu thiếu bối cảnh. Cần một câu nói rõ đây là lỗi của hệ thống không báo trạng thái.
  - "Nếu ổn thì anh không cần giữ dữ liệu đâu" (bài 6) là phát biểu chấp nhận rủi ro, đặt cạnh bài học 13 dễ đọc như đổ trách nhiệm. Nên nêu kèm câu hỏi mà Lead đã đặt.
  - Những chỗ tự phê bình của Lead ("em đã để tiêu chuẩn nghiệm thu thay đổi") là điểm cộng, giúp chuỗi đáng tin.

## Top 5 sửa đổi để tăng sức hút (không thêm claim)

1. Chuyển mã và hash commit xuống phần Nguồn. Trong thân bài chỉ giữ tên việc đã làm ("bỏ check ngược", "bỏ gói review từng cạnh") thay vì A28, A50, L13-152, "fact-check #35", "R-built §2". Hiệu quả lớn nhất cho bài 1, 3, 4, 6.
2. Thêm hộp thuật ngữ ngắn ở đầu bài 1 (8-10 từ): compound, distillery, authority/thẩm quyền, claim, ratchet, cutover, Land, evidence, Doer/Lead/owner. Hoặc thay từng từ bằng cách nói thường ở lần đầu xuất hiện. Riêng "Land gọn" cần giải thích ngay câu mở bài 6.
3. Rút bài 6 còn 5 bài học (hiện 13), gộp các bài lặp bài 2 và bài 4 (6, 7, 8, 9, 10). Đẩy các việc vặt (11, 12) sang một dòng "ghi chú vận hành". Rút mục "đã đạt" còn 3 mục.
4. Bài 5: đổi 5 bảng thành 5-6 con số lớn nhất bằng văn xuôi, giữ lại duy nhất bảng "ma sát" (rút còn 5 dòng đáng nhớ). Bỏ bảng "Quyết định" theo chuỗi mã. Có thể ghép bài 5 vào đầu bài 6 nếu muốn chuỗi ngắn lại.
5. Sắp xếp lại bài 3 quanh một nhân vật hoặc một khoảnh khắc: review đầu tiên phản bác tiền đề của chính bản nháp plan. Mở bài bằng câu "Nghiên cứu không tìm thấy sự cố nào", đẩy hai bản plan song song và mục "29/9 đến 6/10" xuống thành 2-3 câu. Thêm một câu nối ở cuối bài 6 gắn nguyên nhân gốc (bài 1: cơ chế sinh tài liệu) với nguyên nhân chậm (bộ máy chứng minh), để vòng truyện khép hẳn.

Status: DONE
Summary: Đã đọc đủ 6 bài và viết đánh giá của người ngoài theo từng bài và toàn chuỗi, kèm 5 sửa đổi cụ thể. Điểm mạnh nhất là bài 4. Điểm yếu nhất là bài 5 và bài 3, do quá nhiều mã và bảng nội bộ.
