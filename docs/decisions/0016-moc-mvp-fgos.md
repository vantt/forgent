---
title: Mốc MVP của fgOS — người lạ nộp một yêu cầu, nhận code sẵn-sàng-merge, tối thiểu ngồi canh
date: 2026-07-20
status: accepted
source_decisions: [4faa122e, 9401954d]
relates_specs: [system-overview]
extends: []
---

# 0016 — Mốc MVP của fgOS

## Bối cảnh

Trước quyết định này fgOS chưa có phát biểu MVP/milestone chính thức nào — grep "MVP"/"milestone" trong `docs/` trả 0 hit. Định nghĩa "có harness" ở `platform-foundations.md` L5 (sáu câu hỏi) và thang trưởng thành hạ tầng L6 (F0–F5, fgOS tự tuyên F4 tại 2026-07-16) đo ĐỘ CHÍN CỦA HẠ TẦNG, không đo "người dùng cuối LÀM ĐƯỢC GÌ". Một câu MVP nháp xuất hiện trong báo cáo tích hợp P50 (2026-07-20) nhưng gắn nhãn "chưa chốt" và chỉ sống trong một file HTML report — không phải tài liệu sản phẩm đã ship.

Mốc dogfood tự-phát-triển (STR25) đã ĐẠT 2026-07-17: item thật đi trọn vòng submit→clarify→decompose→execute→PR→merge, không cần bee đỡ. Nghĩa là VÒNG cốt lõi đã chạy; cái còn thiếu để thành "sản phẩm cho người lạ" là hai điều trong chính câu MVP: người-mới-chỉ-dùng-tài-liệu-đã-ship, và tối-thiểu-ngồi-canh.

## Quyết định

1. **Phát biểu MVP của fgOS (chốt):**

   > Một người mới — không có ngữ cảnh trước, chỉ dựa vào tài liệu ĐÃ SHIP — cài fgOS, nộp MỘT yêu cầu thật bằng văn xuôi tự do, và nhận lại một thay đổi code thật: chạy được, có test, sẵn sàng merge — với tối thiểu sự canh chừng của con người.

2. **"Tối thiểu ngồi canh" có răng đo được:** con người chỉ can thiệp ở các CỔNG-NGƯỜI thật sự cần một quyết định (clarify không hội tụ được vì thiếu thông tin chỉ người có; duyệt/merge). Con người KHÔNG phải can thiệp để gỡ hệ tự-kẹt (park oan, loop lỗi, phán đoán lồng-nhau hỏng). Một lần bắt người gỡ-kẹt là một lỗi tính vào MVP, không phải một cổng-người hợp lệ.

3. **Trục MVP bổ sung cho L5/L6, không thay thế:** L5 (định nghĩa "có harness") và L6 (thang chín hạ tầng) đo phía HỆ; câu MVP này đo phía NGƯỜI DÙNG CUỐI. Ba trục cùng tồn tại, không trùng.

4. **Phạm vi MVP là "một yêu cầu → một code change".** Nó KHÔNG đòi goal-directed planning (khai goal → tự sắp cả backlog, STR67) — đó là tính năng lớn hơn, mở rộng CƠ HỘI vượt MVP tối thiểu, không phải điều kiện của MVP.

## Hệ quả

- **Ưu tiên hướng MVP** (dẫn ra từ phát biểu này): (a) độ tin cậy của loop tự chạy — mọi "gỡ-kẹt-thủ-công" là bug MVP (ví dụ STR68: phán đoán discovery lồng-nhau trả văn xuôi thay vì JSON → park oan item rõ ràng, vi phạm trực tiếp "tối thiểu ngồi canh"); (b) chất lượng tài liệu ĐÃ SHIP đủ cho người lạ (STR64); (c) trải nghiệm cổng-người khi loop THẬT SỰ cần người (STR61 đã ship; STR69/STR70 là enabler).
- **STR67 (goal-directed planning)** dùng chính câu MVP này làm target đầu vào cho ca dogfood đầu tiên của nó — nhưng nằm NGOÀI phạm vi MVP tối thiểu (điểm 4).
- **Không supersede gì** — thêm một trục mục tiêu sản phẩm mới, không đổi luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
