---
phase: 1
title: "Vệ sinh credential (M1, M4)"
status: pending
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 1: Vệ sinh credential (M1, M4)

## Overview

Bản sao credential trong private home của pane/cli confined phải: tạo 0700, bị xoá khi không còn ai dùng, không bao giờ bị hạ quyền khi trust store ghi lại.

## Requirements

- Functional:
  - **Quyền**: root `fgos-confinement`, `<dispatchId>/`, `home/` và thư mục trung gian (`.gemini/antigravity-cli/`, `.codex/`…) tạo 0700 — `mkdirSync({mode:0o700})` **cộng** `chmod` (vì `recursive` bỏ qua mode ở cha đã có). Root không do user hiện tại sở hữu → dùng root riêng theo uid.
  - **Dọn**: `authority.mjs:1250-1260` — xoá home + `<dispatchId>/` cả khi adapter throw, **trừ** khi pane được giữ lại (fallback quota giữ pane cũ): khi đó ghi đường dẫn home vào failure record của run; `fgos run` lúc bắt đầu gọi `reapOrphanedConfinementResources` (như `src/runner/loop.mjs:1378`) để dọn home của pane đã đóng.
  - **Trust store** (`trust-store.mjs` 3 chỗ write-tmp-then-rename): tạo temp với mode của file đích (mặc định 0600 nếu đích là file credential/không tồn tại), giữ mode sau rename.
  - **Doctor**: cảnh báo root confinement không 0700, hoặc có home mồ côi chứa file credential (chỉ đếm, không in nội dung).
- Non-functional: không in nội dung credential ở log/test output; CHANGELOG `[Unreleased]` ghi tradeoff pane giữ lại.

## Related Code Files

- Modify: `src/runner/dispatch/confinement/authority.mjs`, `confinement/resources.mjs`, `confinement/cleanup.mjs`, `src/runner/dispatch/trust-store.mjs`, `src/runner/execution/run.mjs` (lời gọi reap), `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `docs/specs/distribution.md` (Data Dictionary nếu check mới)
- Tests: `test/runner/dispatch-confinement-*.test.mjs`, `test/runner/dispatch-trust-store.test.mjs`, `test/runner/execution/run.test.mjs`, `test/setup/*.test.mjs`

## Implementation Steps

1. Worktree `../forgentX-cred-hygiene` từ `main` (nhánh `fix/confinement-credential-hygiene`); symlink `node_modules`, `target`; GitNexus `impact` các hàm sửa.
2. Test trước (umask 002 trong test): home/cha 0700; adapter throw + pane đóng → home + `<dispatchId>/` không còn; pane giữ → path trong failure record, `fgos run` kế reap sau khi pane đóng; trust store giữ 0600; doctor cảnh báo.
3. Sửa; test xanh; commit.

## Success Criteria

- [ ] Các test trên xanh; `stat` trong test xác nhận mode.

## Risk Assessment

- Reap nhầm home của pane còn sống → chỉ reap khi ownership marker (`cleanup.mjs`) cho thấy chủ đã chết/pane đã đóng; test ca pane sống.
