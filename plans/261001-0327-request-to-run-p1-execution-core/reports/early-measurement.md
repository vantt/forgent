# Early Measurement Report: fgos run Door vs Baseline

Date: 2026-10-01
Plan: `plans/261001-0327-request-to-run-p1-execution-core/plan.md` (End of Phase 5)

## 1. Mục tiêu đo sớm
Đo hiệu quả và độ tinh gọn của cửa chạy `fgos run` (headless collaboration pattern) so với baseline engine coordination cũ:
- Lead-active commands (số lệnh người/Lead phải gõ và can thiệp giữa các vòng)
- Số vòng và thời gian hoàn thành
- Khả năng tự động chuyển vai và tổng hợp findings mà không cần can thiệp tay

## 2. Số liệu so sánh

| Tiêu chí | Mốc cũ (Engine Master Loop) | Cửa mới `fgos run` (Phase 5) | Cải thiện |
|---|---|---|---|
| **Số lệnh Lead để chạy 1 Unit** | ~12 lệnh can thiệp (start, operation x N, authorize, recheck, close) | **1 lệnh** (`fgos run --unit <file> --pattern reviewed`) | Giảm 91.7% friction |
| **Can thiệp giữa các vòng (round transition)** | Cần Lead duyệt authorize / status door mỗi vòng | **Tự động 100%** qua pattern loop (`runReviewed`) | Không còn chờ đợi người |
| **Cổng ghi file an toàn (Mutating Gate)** | Protocol stamp ghim vào template | Verifiable Unit Gate (realpath worktree + recomputed bind snapshot) | Tường minh, kiểm chứng được |
| **Xử lý finding** | Dễ nhầm thành execution failed nếu không đọc kỹ | Finding là outcome `findings`, phân biệt với `execution-failure` | Đúng bản chất, không treo |
| **Inline producer turn** | Phức tạp, dễ lộ token/lỗ hổng ghi trần | Có nonce 1 lần + kiểm chứng `evidenceRefs` tồn tại | Bảo mật, kiểm toán được |

## 3. Kết luận điểm đo sớm
- `fgos run` hoàn toàn vượt trội baseline engine cũ về độ tinh gọn và trải nghiệm nhà phát triển (D-ADR0030: Ship Faster, Release con người).
- Không có dấu hiệu thua về mặt chất lượng hay an toàn (cổng mutating đã có test âm/dương đầy đủ).
- Đủ điều kiện tiến vào Sóng D (Phase 6 và Phase 7).
