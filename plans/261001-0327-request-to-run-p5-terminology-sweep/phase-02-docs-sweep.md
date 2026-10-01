---
phase: 2
title: "Quét docs theo area"
status: pending
priority: P2
effort: "1–2d (song song theo area)"
dependencies: [1]
---

# Phase 2: Quét docs theo area

## Overview

Mỗi gói area (do phase 1 chia) được một agent quét trong worktree riêng: thay tên cũ bằng tên mới theo bảng thuật ngữ, sửa mô tả lỗi thời (engine coordination, DemandFacts, stage trên Work), giữ nguyên tài liệu lịch sử.

## Requirements

- Functional:
  - Theo bảng thuật ngữ trong [plan.md](./plan.md); mỗi thay thế đúng ngữ cảnh (không thay máy móc).
  - Không sửa vùng lịch sử; không sửa `docs/platform/component-boundary.md`, `docs/specs/reading-map.md` (phase 3).
  - Link nội bộ vẫn đúng sau khi đổi tên file/thư mục (kiểm bằng script link check hiện có nếu có).
- Non-functional: mỗi gói một commit, merge vào nhánh plan.

## Related Code Files

- Modify: file theo gói area (phase 1 liệt kê).

## Implementation Steps

1. Mỗi agent: worktree từ nhánh plan; quét gói; link check; commit; merge.
2. Lead gom, chạy lại `rg` toàn repo.

## Success Criteria

- [ ] `rg` tên cũ ngoài vùng lịch sử = 0 cho các gói đã xong.

## Risk Assessment

- Hai gói đụng cùng file vì phase 1 chia sai → merge conflict nhỏ; sửa ở bước gom.
