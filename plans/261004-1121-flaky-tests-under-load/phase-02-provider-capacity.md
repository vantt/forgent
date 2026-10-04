---
phase: 2
title: "Sửa provider-capacity"
status: completed
priority: P2
effort: "0.25d"
dependencies: [1]
---

# Phase 2: Sửa provider-capacity

## Overview

Tìm vì sao `provider-capacity.test.mjs` treo cả file dưới tải dù mỗi test có `timeout: 60_000` (`:311`, `:403`), và vì sao lỗi lan sang các file khác.

## Requirements

- Functional:
  - Chẩn đoán bằng tái hiện phase 1: tiến trình con nào còn sống sau timeout (contender spawn ở `:311`/`:403`), có busy-wait trong `withFileLock` (`src/runner/dispatch/provider-capacity.mjs`) ăn CPU không, file lock/marker có nằm ở thư mục dùng chung giữa các test không.
  - Sửa tận gốc:
    - test: mỗi test dùng thư mục tạm riêng; contender con bị kill khi test kết thúc/timeout (`t.after`), không để con mồ côi giữ event loop;
    - code (nếu là nguyên nhân): khoá chờ có backoff/sleep thay vì quay vòng, có hạn chờ rõ ràng và lỗi rõ ràng khi hết hạn — đây cũng là lỗi chạy thật khi máy bận.
  - Nếu test `:403` cho thấy **cấp trùng khoá** (>0 cặp chồng) dưới tải → lỗi an toàn: sửa code, test tái hiện, ghi nổi bật trong báo cáo.
- Non-functional: không tăng timeout, không thêm retry.

## Related Code Files

- Modify: `test/runner/provider-capacity.test.mjs`, `src/runner/dispatch/provider-capacity.mjs` (nếu cần)
- Tests: chính file đó + tái hiện phase 1

## Implementation Steps

1. Tái hiện; ghi `file:line` nguyên nhân vào `reports/repro.md`.
2. Sửa; chạy lặp dưới tải N lần: 0 đỏ/treo; commit.

## Success Criteria

- [x] Nguyên nhân có `file:line`; chạy lặp dưới tải sạch.

## Risk Assessment

- Thay đổi khoá ảnh hưởng dispatch thật → GitNexus `impact` `withFileLock`; test S1/S3 hiện có phải xanh.
