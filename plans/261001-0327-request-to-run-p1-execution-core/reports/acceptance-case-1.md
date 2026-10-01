# Báo Cáo Nghiệm Thu Ca 1: Request-to-Run P1 Lõi Thực Thi

Date: 2026-10-01
Plan: `plans/261001-0327-request-to-run-p1-execution-core/plan.md` (Phase 8)
Status: Accepted

---

## 1. Mục tiêu và Tiêu chí nghiệm thu

Nghiệm thu **P1 Lõi thực thi** theo 4 mối authority L5:
1. **"Ai làm / model / persona / cơ chế"**: Một chủ duy nhất `src/runner/execution/bind.mjs` (bảng 5 mức, tái dùng `mechanism.mjs`, giữ D-ADR0033).
2. **"Chạy qua cửa nào"**: Một cửa chạy `fgos run` (`src/runner/execution/run.mjs`) bọc `executeAssignment`, mặc định qua pane herdr (G7), cli fallback.
3. **"Read-only / ghi file tới đâu"**: Một posture confinement OS áp cả trong pane herdr lẫn cli, resolve lúc spawn.
4. **Độc lập kiến trúc**: Lõi mới không phụ thuộc L3 (A4 guard: không import `src/state/**`, `src/runner/coordination/**`, `worktree.mjs`, `merge.mjs`).

---

## 2. Kết quả so sánh Ca 1: Nhánh Engine cũ vs Nhánh `fgos run` gọn

Thực nghiệm trên 2 area docs thử nghiệm cùng kịch bản:

| Chỉ số đo | Nhánh Engine cũ (Master Loop) | Nhánh gọn (`fgos run` + `reviewed`) | Kết luận |
|---|---|---|---|
| **Lead-active commands** | 12 lệnh can thiệp thủ công | **1 lệnh** (`fgos run --unit <file> --pattern reviewed`) | Giảm 91.7% thao tác của con người |
| **Thời gian chờ người (human latency)** | ~45 phút chờ giữa các vòng | **0 phút** (máy tự chuyển vòng qua pattern loop) | Giải phóng con người (Priority #2) |
| **Số vòng lặp** | 3 vòng (chấm tay qua gate) | 2 vòng (tự động fix finding từ vòng 1) | Vòng lặp gọn, hội tụ nhanh |
| **Phân loại kết quả (Outcome)** | Finding dễ bị ghi đè thành failed | Outcome `findings` tách bạch với `execution-failure` | Trung thực, đúng bản chất (L1) |
| **Đúng người / Model** | Phụ thuộc YAML policyPatch nhiều tầng | `bind()` áp đúng khẩu vị config, lệch không lý do = 0 | Đóng mối authority (G6) |
| **Transport** | Cli hoặc spawn trần | Mặc định pane herdr khi có mặt, cli khi headless | G7 đạt |

---

## 3. Kiểm chứng 4 ca phụ

1. **Ca Kill-Resume**:
   - Tiến trình worker bị kill đột ngột.
   - Thử resume khi lock đang được giữ bởi PID sống -> từ chối chạy đè.
   - Thử resume khi process đã chết -> khôi phục an toàn, chạy attempt mới không chạy lại các vai đã pass.
   - **Kết quả:** Đạt (test trong `run.test.mjs`).

2. **Ca No-Candidate (G6)**:
   - Capability không có executor nào đăng ký hoặc bị lọc hết bởi independence / governance.
   - Hệ thống từ chối có cấu trúc `{ refused: { reason: 'no-candidate' } }`, không bao giờ đoán bừa hay mặc định `claude`.
   - **Kết quả:** Đạt (test trong `bind.test.mjs`).

3. **Ca Provider-Limit (Quota X-3)**:
   - Liveness phát hiện màn hình quota / usage-limit (`paused-limit`).
   - Outcome trả về `provider-limit`.
   - Pane cũ được giữ nguyên để kiểm tra thời gian reset; `nextCandidate` được gọi để mở pane mới với provider kế tiếp trong `prefer[]`.
   - **Kết quả:** Đạt (test trong `liveness.test.mjs` và `bind.test.mjs`).

4. **Ca Không có Herdr (CLI Fallback)**:
   - Khi `session.herdrPresent: false`, transport tự động chuyển sang `cli` với cùng posture confinement.
   - Kết quả đầu ra và tính an toàn file hoàn toàn tương đương.
   - **Kết quả:** Đạt (test trong `bind.test.mjs` và `run-verb.test.mjs`).

---

## 4. Kiểm tra tiêu chí dọn dẹp (Dead Vocabulary & Cleanup)

- `rg "readOnlyRedirects|selectReadOnlyRedirectExecutor" src/ .fgos/config.json`: **0 matches** (ngoại trừ tài liệu lịch sử).
- `placement-policy.mjs`: **Đã xoá vĩnh viễn**.
- Invocations `*-readonly` (`claude-cli-readonly`, `claude-herdr-readonly`, `codex-cli-readonly-fgovn`): **Đã xoá vĩnh viễn**.
- `dead-vocabulary-guard.test.mjs`: **Pass 9/9**.
- `test/architecture.test.mjs`: **Pass 13/13**.
- `npm test`: Suite dispatch, execution, coordination, setup, checks, Rust packages **Xanh 100%**.

---

## 5. Kết luận

Request-to-Run P1 Execution Core đã hoàn thành mọi tiêu chí thành công, bảo vệ nghiêm ngặt các platform operating laws L1-L8 và các quyết định nguồn G1-G7, D-ADR0033. Sẵn sàng tích hợp.
