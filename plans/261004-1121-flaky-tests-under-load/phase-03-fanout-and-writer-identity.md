---
phase: 3
title: "Sửa fanout + writer identity"
status: completed
priority: P2
effort: "0.25d"
dependencies: [1]
---

# Phase 3: Sửa fanout + writer identity

## Overview

Hai test còn lại: phụ thuộc thời gian (fanout) và identity writer đổi giữa claim và settle.

## Requirements

- Functional:
  - **Fanout** (`test/runner/dispatch.test.mjs`, `fanoutBatchExecutorCli … overlapping execution windows`): tìm assert dựa vào thời gian tuyệt đối (khoảng chồng thời gian giữa executor). Sửa để chứng minh song song bằng tín hiệu xác định (barrier: mỗi executor giả ghi "started" rồi chờ file "go" do test tạo khi tất cả đã started), không bằng đồng hồ.
  - **Writer identity** (`test/runner/dispatch-production-call-sites.test.mjs:708`; `src/state/store.mjs:1123`; `src/util/session-identity.mjs:157`): identity hiện suy ra từ pid nào? Vì sao claim (`fgos` con A) và settle (`fgos return`, con B) mang identity khác chỉ khi chạy song song — biến môi trường session bị rò giữa test, hay identity rơi về pid của tiến trình con? Sửa: test truyền identity tường minh và cô lập env; nếu code chọn sai nguồn identity dưới song song → sửa code có test (đây cũng là lỗi thật khi nhiều agent chạy cùng lúc).
- Non-functional: không thêm retry/sleep để che.

## Related Code Files

- Modify: `test/runner/dispatch.test.mjs`, `test/runner/dispatch-production-call-sites.test.mjs`, `src/util/session-identity.mjs` / `src/state/store.mjs` (nếu cần)

## Implementation Steps

1. Tái hiện bằng cách phase 1; ghi nguyên nhân `file:line`.
2. Sửa; chạy lặp dưới tải N lần: 0 đỏ; commit.

## Success Criteria

- [x] Hai nguyên nhân có `file:line`; chạy lặp dưới tải sạch.

## Risk Assessment

- Identity là contract claim/settle dùng ở nhiều verb → GitNexus `impact`; test claim/settle hiện có xanh.
