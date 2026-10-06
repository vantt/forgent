---
phase: 5
title: "Source Observe (Rust) đọc v3 + usage"
status: completed
priority: P1
effort: "1d"
dependencies: [3, 4]
---

# Phase 5: Source Observe đọc v3 (phần Rust, cổng chờ plan Observe)

## Overview
Sửa source `run-result` và phần `runs` của scorecard Observe để đọc RunResult v3 (`classification.outcome.category`, `adapter`/`role`/`durationMs`, `usage`), thay vì đếm `status`.

Đây là **phần duy nhất của plan phụ thuộc code của plan Observe**. Nó phải xong trước khi merge branch, để khi `status` biến mất thì Observe không có khoảng hở. <!-- Validation Session 5: tách khỏi phase 3 để phase 1–4 chạy song song với Observe -->

## Cổng bắt đầu
- **5a** (port luật): chờ crate `packages/run-result/rust` (F2 của Observe) được **commit lên `main`**. Lúc tách plan, F2 đã `done` nhưng code còn nằm chưa commit trong main checkout.
- **5b** (nối scorecard): chờ thêm F4 (`metrics harness`, phần `runs`) được commit lên `main`.
- Trước mỗi bước: sync `main` vào branch (`git merge main`, không rebase).

## Requirements
- **5a:**
  - Port `deriveOutcome` và `deriveLegacyOutcome` sang Rust trong `packages/run-result/rust`.
  - Assert trên fixture chung `test/fixtures/run-outcome/legacy-derivation.json`, cùng file mà test Node dùng.
  - Đọc record theo version: v3 dùng `classification.outcome.category` (không phân nhóm lại); v1/v2 đi qua bản Rust của luật đóng băng.
  - Đọc `adapter`/`confinement`/`role`/`durationMs` khi có; `durationMs: null` thì là unknown, không tính là 0.
  - Đọc `usage` (`totalTokens` khi không có input/output).
- **5b:**
  - Phần `runs` của F4 bỏ "đếm `status`";
  - #4 theo `category`;
  - `tokens` cộng thêm `usage` cho executor không phải Claude.
- Test quét source phía Rust: ngoài `derive_outcome`/`derive_legacy_outcome`, không có chỗ nào tự phân nhóm.

## Related Code Files
- Modify: `packages/run-result/rust/src/lib.rs` (hoặc thêm module `outcome.rs`), `packages/observe/rust/src/scorecard.rs` (phần `runs`)
- Read: `test/fixtures/run-outcome/legacy-derivation.json`

## Implementation Steps
1. Kiểm cổng 5a (`git log main -- packages/run-result`), sync `main` vào branch, port luật và viết test fixture, commit.
2. Kiểm cổng 5b (`git log main -- packages/observe/rust/src/scorecard.rs`), sync `main` vào branch, nối scorecard, commit.
3. Chạy `cargo test --workspace` và `npm test`.
4. Sync `main` vào branch lần cuối, chạy lại toàn bộ test, rồi **merge cả branch về `main` một lần** (chỉ khi phase 1–5 đều xong). Restage và kiểm digest (`fgctl status` / `fgos doctor`). Chạy `fgos metrics harness --since <hôm qua>`.

## Success Criteria
- [x] Node và Rust cùng xanh trên `legacy-derivation.json`.
- [x] Record v3 không bị phân nhóm lại ở phía Rust.
- [x] `fgos metrics harness --since <hôm qua>` chạy đúng ngay sau merge, trên bản đã restage (không có khoảng hở).
- [x] Trước merge: đếm lại số session `active` (red-team thấy 512, plan cũ ghi 216); đóng hoặc park các session cũ không còn dùng.

## Risk Assessment
- **Observe đổi shape source/scorecard khi đang cook.** Dấu hiệu: conflict lớn khi sync `main` ở `lib.rs`/`scorecard.rs`. Cách xử lý: sync `main` thường xuyên; làm 5a/5b sau khi Observe đã commit phase tương ứng, không làm trên code chưa commit.
- **F4 của Observe trễ lâu.** Branch vẫn giữ được; phase 1–4 đã xong. Nếu trễ quá 1 tuần: hỏi anh có muốn đổi thứ tự không (plan này merge phần Node trước, và F4 viết thẳng để đọc v3).
