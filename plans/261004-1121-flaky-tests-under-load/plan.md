---
title: "Test chập chờn khi máy có tải: chẩn đoán, cô lập, fail nhanh"
description: "Ba test xanh khi chạy riêng nhưng đỏ hoặc treo trong full suite khi máy có tải: provider-capacity treo ~58 phút, fanout overlapping windows, settleClaim writer identity mismatch. Tìm nguyên nhân thật, sửa cô lập, và chặn mọi file test treo quá lâu."
status: pending
priority: P2
effort: "~1d"
tags: [tests, flaky, isolation, timeout, concurrency]
created: 2026-10-04
blockedBy: []
blocks: []
---

# Test chập chờn khi máy có tải

## Overview

Bằng chứng (discussion lead, 2026-10-03/04, full suite `env -u CLAUDE_CODE_SESSION_ID npm test`):

| Test | Triệu chứng | Chạy riêng |
|---|---|---|
| `test/runner/provider-capacity.test.mjs` | treo **~58 phút** ở 2 lần chạy độc lập khi máy có tải/thiếu RAM: test `:403` "S3 round 2 … withFileLock never grants two holders…" timeout 60s, rồi cả file báo `Promise resolution is still pending but the event loop has already resolved` (3.489s). Kéo theo Rust harness `exit code null`, herdr re-brief cap đỏ | 21/21 xanh, 8 giây |
| `test/runner/dispatch.test.mjs` — `fanoutBatchExecutorCli … overlapping execution windows` | đỏ một lần (agent báo) | xanh |
| `test/runner/dispatch-production-call-sites.test.mjs:708` — `fgos return --blocked …` | `settleClaim: writer identity mismatch` (`src/state/store.mjs:1123`; identity ở `src/util/session-identity.mjs:157`): claim lấy bởi writer `1416440`, settle bởi `1375678` | 19/19 xanh |

Khi máy rảnh: full suite xanh 6523/0 trong ~5,3 phút (`1cf0f9091`). Nên đây là lỗi cô lập/thời gian của test (hoặc của code dưới tải), không phải hồi quy chức năng — nhưng một test treo gần một giờ thay vì fail nhanh là lỗi thật của bộ test.

Mục tiêu: (1) không file test nào treo quá giới hạn — fail nhanh, có tên file; (2) mỗi test chập chờn có nguyên nhân thật (`file:line`) và được sửa cô lập hoặc sửa code; (3) chứng minh bằng chạy lặp dưới tải.

## Phases

| # | Phase | Phụ thuộc | Sở hữu file |
|---|---|---|---|
| 1 | [Giới hạn thời gian mỗi file + tái hiện dưới tải](./phase-01-per-file-timeout-and-repro.md) | — | `scripts/run-tests.mjs`, `test/scripts/run-tests.test.mjs`, script tái hiện (`scripts/` hoặc trong test) |
| 2 | [Sửa provider-capacity](./phase-02-provider-capacity.md) | 1 | `test/runner/provider-capacity.test.mjs`, `src/runner/dispatch/provider-capacity.mjs` (chỉ nếu lỗi ở code) |
| 3 | [Sửa fanout + writer identity](./phase-03-fanout-and-writer-identity.md) | 1 | `test/runner/dispatch.test.mjs`, `test/runner/dispatch-production-call-sites.test.mjs`, `src/util/session-identity.mjs` / `src/state/store.mjs` (chỉ nếu lỗi ở code) |
| 4 | [Nghiệm thu + merge](./phase-04-verify-merge.md) | 2, 3 | `reports/**` |

Phase 2 ∥ 3 (khác file).

## Success Criteria

- [ ] `scripts/run-tests.mjs` có giới hạn thời gian **mỗi file** (mặc định đủ rộng, ví dụ 10 phút, cấu hình được): quá hạn → kill cây tiến trình của file đó, báo tên file + "timed out", suite tiếp tục và exit ≠ 0. Test cho cơ chế này.
- [ ] Mỗi test trong bảng có nguyên nhân `file:line` ghi trong báo cáo; sửa tận gốc (cô lập tài nguyên dùng chung, bỏ phụ thuộc thời gian tuyệt đối, identity ổn định) — **không** tăng timeout hay thêm retry để che.
- [ ] Nếu nguyên nhân nằm ở code (ví dụ khoá provider-capacity busy-wait ăn CPU dưới tải, hoặc identity writer đổi giữa claim và settle) → sửa code có test, vì đó là lỗi chạy thật trên máy bận.
- [ ] Chạy lặp dưới tải giả (ví dụ `stress-ng`/vòng CPU song song, hoặc `--test-concurrency` cao) N lần cho 3 file: 0 đỏ, 0 treo.
- [ ] Full `npm test` xanh khi máy rảnh; merge `main`.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Không tái hiện được trên máy rảnh | 3 file xanh dù lặp | phase 1 dựng tải giả có kiểm soát; vẫn không tái hiện → ghi rõ, giữ giới hạn thời gian mỗi file làm lưới, không đoán sửa |
| Khoá provider-capacity thật sự sai dưới tải (cấp trùng) | test `:403` báo >0 cặp chồng | đây là lỗi an toàn của dispatch thật → ưu tiên sửa code, báo owner |
| Giới hạn mỗi file kill nhầm test Rust/release-tree vốn chậm | test chậm hợp lệ bị kill | cho phép override theo file (danh sách rõ ràng trong `run-tests.mjs`), không nâng mặc định cho mọi file |

## Câu hỏi mở

Không có.

<!-- slug: flaky-tests-under-load -->
