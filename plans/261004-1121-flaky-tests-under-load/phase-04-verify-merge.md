---
phase: 4
title: "Nghiệm thu + merge"
status: pending
priority: P2
effort: "0.25d"
dependencies: [2, 3]
---

# Phase 4: Nghiệm thu + merge

## Overview

Chứng minh hết chập chờn và không còn treo; merge `main`.

## Requirements

- Functional:
  - Full `npm test` xanh khi máy rảnh (kiểm `free -m`, không chạy cùng suite khác).
  - Full `npm test` **dưới tải giả** (cách của phase 1) ít nhất 2 lần: 3 test trên không đỏ/treo; nếu file khác đỏ dưới tải → ghi vào báo cáo làm việc sau (không mở rộng phạm vi).
  - `reports/acceptance.md`: số liệu trước/sau (tỉ lệ đỏ/treo), nguyên nhân từng test `file:line`, thời gian suite.
  - Merge `main` (`--no-ff`) từ checkout chính đang ở `main`; dọn worktree/nhánh.

## Related Code Files

- Create: `reports/acceptance.md`

## Implementation Steps

1. Suite rảnh + dưới tải. 2. Báo cáo. 3. Merge; dọn.

## Success Criteria

- [ ] Số liệu trước/sau; suite xanh; merge `main`.

## Risk Assessment

- Tải giả làm đỏ file khác ngoài phạm vi → ghi lại, không sửa trong plan này.
