# Phase 04: cổng placement policy + `measured-split`

Wave 1. Nhánh `terminal-control/p04-policy`, worktree `.claude/worktrees/tc-p04`. Phụ thuộc: P00.

## Đọc trước

r6 §7.9 toàn bộ (cơ chế đo thật, policy chỉ quyết vị trí, `measured-split`, "policy không bao giờ đổi chủ/vòng đời/đóng pane của key khác", chọn bằng `terminal.layout.policy`), §12.8 (352 → 176 + 176; 69 → 35 + 34; luật hôm nay để lại pane 2 dòng sau 6 lần tách).

## Yêu cầu

- `policy/mod.rs`: registry tên → policy (`measured-split` mặc định); tên lạ → lỗi cấu hình có tên (doctor bắt, P08).
- `policy/measured_split.rs`: hàm thuần, xác định. Với mỗi pane sống của nhóm × hướng (`right`, `down`): kích thước hai con từ rect đo được, tỉ lệ 0.5, chia giống herdr đo được (phần lẻ về con trước: 69 → 35 + 34); chọn ứng viên có pane con nhỏ hơn lớn nhất, so theo tỉ số với `minCols`/`minRows`; không ứng viên nào đạt min hoặc tab đủ `maxPanesPerTab` → `newTab`. Hoà → thứ tự cố định (pane trước theo `paneId`, `right` trước `down`).
- Fixture `packages/terminal-control/contracts/policy-fixtures/*.json`: 352×69 ngang (tab rỗng, 1–6 pane), 110×80 dọc, các ca bảng research, tab đầy, pane của key khác lớn nhất (vẫn được chọn làm neo — neo không đổi chủ).
- Không đọc nhãn; `roleHint` là trường dữ liệu, `measured-split` bỏ qua nó (policy sau dùng).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/terminal-control/rust/src/policy/{mod.rs,measured_split.rs}`, `tests/policy_fixtures.rs` |
| tạo | `packages/terminal-control/contracts/policy-fixtures/*.json` |

## Test

Mỗi fixture có output mong đợi; thêm property test: với mọi output `split`, hai con ≥ min; không output nào chạm pane ngoài `groupPanes`. So luật hôm nay trên 352×69 sau 6 worker: `measured-split` không có pane nào < min (luật hôm nay có pane 2 dòng).

Lệnh: `cargo test -p fgos-terminal-control policy`.

## Tiêu chí nghiệm thu / rollback

Fixture xanh; policy là hàm thuần (không I/O, không driver). Rollback: revert.
