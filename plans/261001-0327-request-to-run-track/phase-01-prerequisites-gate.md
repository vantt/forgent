---
phase: 1
title: "Cổng điều kiện tiên quyết"
status: done
priority: P1
effort: "theo dõi; không có code"
dependencies: []
---

# Phase 1: Cổng điều kiện tiên quyết

## Overview

Theo dõi các điều kiện phải xong trước khi từng plan con được bắt đầu hoặc được nghiệm thu. Không có code; người chủ trì (Lead) kiểm và đánh dấu.

## Requirements

- Functional: mỗi điều kiện có bằng chứng kiểm được (commit trên `main`, output lệnh).
- Non-functional: không chặn việc song song không liên quan.

## Architecture

| Điều kiện | Chặn cái gì | Bằng chứng xong |
|---|---|---|
| T merge `main` | P1 bắt đầu (cùng file `src/runner/dispatch/**`) | **XONG** 2026-10-01 — merge `dc677ac16` trên `main`, cả 4 phase `done`; `runner.rigorToTier`, `capabilities.<cap>.rigor` có validator; `capabilities.*.overrides` bị từ chối; `test/runner/dead-vocabulary-guard.test.mjs` có sẵn để append |
| Việc lẻ A (Observe harness đếm protocol) | P1 phase 8 (nghiệm thu) | **XONG** — owner báo 2026-10-01 11:38; `main` @ `143b36540` (sửa đếm), `58bb92f49` (chặn đọc vô hạn); `harness.rs:294-316` đọc 3 tầng `coordination-protocols`. Chưa đọc được số qua CLI (có thể bản release stage cũ) — kiểm lại khi restage |
| Việc lẻ B (test rò store + dọn) | P1 phase 8 | **XONG** — `c7ed77120`, `751fbabb0`; store dọn 606 → 311 session (backup `.fgos/backups/test-leak-261001/`). Kèm làm xanh suite: `97a9052bb`, baseline (`ce11f7677`…`d4620190f`), contract cũ (`6b4171b05`), `f564769b4`. **Full `npm test` trên `main` sau merge T (2026-10-01 20:48): 7858 pass / 0 fail.** Hàng rào chống rò báo `.fgos/main-checkout.lock` đổi — do chính session lead commit ở checkout chính giữa lúc suite chạy (lock ghi session id, ts trùng commit `e80b348d2`), không phải test rò: chạy suite khi không ai commit ở checkout chính, hoặc chạy trong worktree |
| P1 merge `main` (gồm nghiệm thu ca 1 qua pane herdr) | P3a bắt đầu | commit merge + báo cáo ca 1 |
| P3a (P3 phase 2) merge vào nhánh P3 và lên `main` | P2 bắt đầu; P3b tiếp tục | commit merge |
| Spike herdr + confinement (P1 phase 6) đạt | P1 phase 6 tiếp tục | báo cáo spike; không đạt → dừng, báo owner (G7) |
| P3 merge `main` | P4 bắt đầu | commit merge |
| Owner authorize phase 4 plan tài liệu (Q5) | P2 phase 5 phần "chạy thật" | ghi trong plan tài liệu |
| P4 merge `main` | P5 bắt đầu | commit merge |

## Related Code Files

- Không sửa code. Chỉ cập nhật bảng trạng thái trong [plan.md](./plan.md) của track.

## Implementation Steps

1. Khi một điều kiện xong, ghi bằng chứng (commit hash/lệnh) vào bảng trên.
2. Trước khi mở một plan con, kiểm đủ điều kiện "chặn" của nó.
3. Cập nhật cột trạng thái các plan con trong `plan.md` track.

## Success Criteria

- [x] Mọi điều kiện có bằng chứng trước khi plan con tương ứng bắt đầu.
- [ ] Không plan con nào bắt đầu khi điều kiện chặn của nó chưa xong.

## Risk Assessment

- **Điều kiện bị bỏ qua vì vội** → tín hiệu: plan con bắt đầu khi T chưa merge, xung đột merge lớn ở `src/runner/dispatch/**`. Phản ứng: dừng plan con, rebase lên `main` sau khi T merge.
