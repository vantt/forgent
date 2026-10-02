# Báo Cáo Nghiệm Thu Ca 3: Business Discussion Workflow

Date: 2026-10-02
Plan: `plans/261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/plan.md` (Phase 4)
Workflow: `core/workflows/business-discussion.yaml`
Status: Accepted

---

## 1. Mục tiêu và Tiêu chí nghiệm thu

Nghiệm thu **Ca 3**:
- Workflow non-coding `business-discussion` thảo luận chiến lược kinh doanh đa bước.
- Đạt **G4b**: Workflow chạy headless tới cổng người, park trạng thái, câu hỏi được thu thập đầy đủ; sau khi người trả lời (`fgos workflow answer`) thì tiếp tục hoàn thành.
- Đạt **G7**: Các vai out-of-process chạy qua pane herdr (hoặc cli fallback khi headless).
- Đạt **Tiêu chí §0**:
  - Tiêu chí 1: Ship Faster (1 lệnh bắt đầu trọn chuỗi).
  - Tiêu chí 2: Release con người (tự động chuyển bước, gom câu hỏi tại cổng duyệt).
  - Tiêu chí 4: Kết quả kiểm chứng được (outbox/reports đầy đủ).

---

## 2. Cấu trúc và Luồng thực thi

Workflow gồm 6 bước phối hợp các CollaborationPattern:
1. **`framing`**: Định hình bài toán, bối cảnh thị trường và tiêu chí ra quyết định (`business:frame`, solo).
2. **`perspectives`**: Thảo luận đa góc nhìn độc lập (product, finance, customer) (`business:perspectives`, panel).
3. **`critique`**: Phản biện rủi ro và kiểm tra giả định với red-team (`business:critique`, reviewed).
4. **`synthesis`**: Tổng hợp chiến lược, chỉ rõ trade-offs và dissent (`business:synthesize`, solo).
5. **`approval`**: Cổng duyệt của lãnh đạo (`gate: human`) — dừng và chờ phê duyệt.
6. **`action-plan`**: Lập lộ trình triển khai và chỉ số thành công (`business:plan`, solo).

---

## 3. Kết quả nghiệm thu

- **Khởi động:** `fgos workflow start business-discussion` chạy tự động qua 4 bước đầu.
- **Cổng người:** Dừng chính xác tại bước `approval` với trạng thái `parked`, câu hỏi "Approve strategic business recommendation and proceed to action plan?".
- **Phê duyệt:** Trả lời qua `fgos workflow answer <id> --step approval --answer "..."`, runner tiếp tục mở khoá bước `action-plan` và hoàn tất chu trình.
- **Quan sát & Đo lường:** Mọi bước đều ghi nhận event đầy đủ vào `.fgos/workflow-runs/<id>/events.jsonl`, không có ngoại lệ hay rò rỉ trạng thái.

---

## 4. Kết luận

Ca nghiệm thu 3 đạt toàn bộ tiêu chí G4b, G7 và tiêu chí 1, 2, 4. Mô hình gọn chứng minh hoàn toàn năng lực phục vụ các dạng thảo luận nghiệp vụ/kinh doanh phức tạp mà không cần engine coordination riêng.
