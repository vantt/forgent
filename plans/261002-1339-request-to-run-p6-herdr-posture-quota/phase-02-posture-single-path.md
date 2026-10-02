---
phase: 2
title: "Posture một đường"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 2: Posture một đường

## Overview

Một posture (`read-only` | `workspace-write`) do `bind()` quyết, resolve **một lần lúc spawn**, áp bằng driver confinement hiện có — cho cả cli và (phase 4) pane herdr. Xoá đường `bwrapArgs` tự dựng.

## Requirements

- Functional:
  - `resolvePosture` (`src/runner/dispatch/confinement/policies.mjs:645`) chỉ map posture → policy hiện có (`host-write-denied` / `workspace-write`) + grant (runDir/outbox ghi được); **không** tự dựng `bwrapArgs` — driver `confinement/drivers/bwrap.mjs` dựng argv.
  - `canApplyPosture` (`:688`) phản ánh thật: backend confinement của invocation khả dụng trên máy (bwrap có mặt — tái dùng check doctor hiện có), executor hỗ trợ; `false` → `bind()` lọc candidate, hết candidate → từ chối có cấu trúc (G6), không chạy trần.
  - `run.mjs` truyền posture của binding vào Assignment; `executeAssignment` dùng nó thay vì suy từ `isReadOnlyMode` rời rạc (giữ guard mutating fail-closed hiện có, commit `f30818590`).
  - Checker (`reviewer`, `red-team`, `tester`) luôn `read-only`; producer có `writes[]` → `workspace-write` trong worktree của Unit.
- Non-functional: không đổi hành vi dispatch ngoài posture; test hiện có xanh.

## Related Code Files

- Modify: `src/runner/dispatch/confinement/policies.mjs`, `src/runner/dispatch/assignment-runner.mjs` (phần confinement), `src/runner/execution/bind.mjs` (chỉ lời gọi `canApplyPosture` nếu đổi chữ ký)
- Tests: `test/runner/dispatch-confinement-*.test.mjs`, `test/runner/execution/run.test.mjs` (ca đi qua `fgos run`)

## Implementation Steps

1. GitNexus `impact` `resolvePosture`, `canApplyPosture`, `executeAssignment`.
2. Test trước, đi qua `fgos run` với executor giả: reviewer read-only ghi file trong repo → bị chặn (EROFS/EACCES), ghi outbox → được; producer `workspace-write` ghi trong worktree → được, ngoài worktree → bị chặn; bwrap không có → từ chối có cấu trúc.
3. Sửa `policies.mjs`, `assignment-runner.mjs`.
4. Guard: `rg "bwrapArgs" src/runner/dispatch/confinement/policies.mjs` rỗng; `canApplyPosture` không còn `return true` vô điều kiện.
5. Suite liên quan xanh → commit → merge nhánh plan.

## Success Criteria

- [ ] Test qua `fgos run` chứng minh chặn/cho ghi đúng posture (cli).
- [ ] Một đường confinement; guard test.

## Risk Assessment

- Policy hiện có không có grant outbox cho read-only → thêm grant tường minh, test; không nới `hostRead`/`hostWrite` chung.
