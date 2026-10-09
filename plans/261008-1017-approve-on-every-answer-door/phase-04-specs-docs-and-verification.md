---
phase: 4
title: "Cập nhật Specs, Docs & Kiểm chứng toàn diện"
status: completed
priority: P2
effort: "3h"
dependencies: [1, 2, 3]
---

# Phase 4: Cập nhật Specs, Docs & Kiểm chứng toàn diện

## Overview
Ghi nhận các bất biến mới vào tài liệu đặc tả hệ thống (`docs/specs/runner.md`, `docs/specs/herdr-web-dashboard.md`), cập nhật `CHANGELOG.md`, và chạy toàn bộ các bài test liên quan để đảm bảo tính hồi quy và ổn định.

## Requirements
- Functional:
  - `docs/specs/runner.md`: Bổ sung mục về bất biến của Workflow human gate: mọi consent gate chỉ giải phóng khi có sự đồng thuận tường minh (`--approve`). Câu trả lời không có `--approve` được coi là lời làm rõ và gate giữ trạng thái parked.
  - `docs/specs/herdr-web-dashboard.md`: Bổ sung ghi chú về trường `approve` trong REST API `POST /work/{id}/answer` và MCP function `answer_work`.
  - `CHANGELOG.md`: Thêm ghi chú trong `## [Unreleased]`.
- Non-functional:
  - Tài liệu khớp hoàn toàn với code và test thực tế, không có sự sai lệch thông tin (drift).

## Related Code Files
- Modify: `docs/specs/runner.md`
- Modify: `docs/specs/herdr-web-dashboard.md`
- Modify: `CHANGELOG.md`

## Implementation Steps
1. Cập nhật `docs/specs/runner.md` tại mục liên quan đến Workflow gates (và quyết định 0035 / ADR-0005).
2. Cập nhật `docs/specs/herdr-web-dashboard.md` tại các mục mô tả REST/MCP answer.
3. Cập nhật `CHANGELOG.md` với các thay đổi trên cả Gateway, CLI, và Workflow.
4. Chạy kiểm chứng toàn diện:
   - `cargo test --bin fgos-gateway` trong thư mục `apps/fgos-gateway`
   - `npm test test/cli/`
   - `npm test test/workflow/`
   - Kiểm tra `git status` và diff so với ngân sách `paths` và `budget`.

## Success Criteria
- [x] Docs và specs phản ánh đúng hành vi mới của hệ thống.
- [x] `CHANGELOG.md` đã có mục tương ứng trong Unreleased.
- [x] Tất cả các bài test kiểm chứng đều xanh.
- [x] Số dòng thay đổi tuân thủ nghiêm ngặt khung ngân sách đã duyệt.

## Risk Assessment
- Rủi ro: Tài liệu tham chiếu các quyết định cũ bị trôi lệch mã quyết định.
- Giảm thiểu: Chạy script kiểm tra drift nếu cần (`scripts/check-decision-citation-drift.mjs`).
