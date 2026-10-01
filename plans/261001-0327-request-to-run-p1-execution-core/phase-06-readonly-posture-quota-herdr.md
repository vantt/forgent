---
phase: 6
title: "Read-only posture, fallback quota, herdr (gộp plan X)"
status: pending
priority: P1
effort: "2d"
dependencies: [5]
---

# Phase 6: Read-only posture, fallback quota, herdr

## Overview

Làm phần việc của plan X (`260930-1235-readonly-invocation-redesign`, đã gộp vào P1) với đích mới: **read-only là một posture** confinement do `bind()` áp, resolve **một chỗ** lúc spawn cho primary + fallback + resume; **fallback theo quota chọn qua `bind()`** với provenance; quyết **pane herdr** cho vai read-only (A5). Xoá `readOnlyRedirects` và `placement-policy.mjs`.

## Requirements

- Functional:
  - **Bước 0 — quyết thiết kế bảo mật (owner)**: chạy `/ak:brainstorm` ngắn trên 4 câu hỏi của X (read-only = chỉ OS confinement hay cờ CLI + ghi giới hạn runDir; herdr pane cho reviewer; trigger quota: `runner.providers.<p>.accounts` hay classifier usage-limit lúc runtime; thứ tự invocation read-only: `readOnlyDefault` tường minh). Gom thành **một bộ câu hỏi** cho owner; phần không phụ thuộc câu trả lời làm trước.
  - Posture read-only: invocation có confinement thật (bwrap `host-write-denied`, ngoại lệ ghi `run-output`), resolve ở **một hàm** lúc spawn, áp cho primary + fallback + resume; `confinement` khai ở invocation không còn là metadata chết (X ràng buộc 2).
  - `bind()` dùng hàm posture thật thay `isReadOnlyCapable` tạm (interface giữ nguyên).
  - Worker read-only vẫn ghi được `agent-result.json`, `agent-report.md`, `outbox/result-<round>.json` (X ràng buộc 1).
  - Fallback quota: `prefer[]` candidate sau là fallback; trigger theo quyết định bước 0; invocation của fallback do `bind()` chọn (không mang pin của primary — X ràng buộc 5); lệch có provenance (G6); hết candidate hợp lệ → từ chối có lý do, không tự hạ.
  - Gộp luật read-only thứ hai (`provider-adapter.mjs` ~356-369, `applied-via-tool-gating`) vào cùng posture (X ràng buộc 8). Đường bypass `executeExecutorCli`/`runDispatchCli` đã bị phase 5 xoá — kiểm lại.
  - Xoá `runner.placementPolicy.readOnlyRedirects` (config + validator + doctor), `src/runner/dispatch/placement-policy.mjs`, khối redirect trong `assignment-runner.mjs`.
  - Doctor: quét step/vai read-only × executor ở config project + global; báo project thiếu executor có posture read-only (X ràng buộc 7); "mỗi capability read-only có ≥ 2 provider family có posture read-only".
- Non-functional: không đổi hành vi vai ghi file.

## Architecture

```text
bind() ─► candidate ─► readOnly? ─► resolveReadOnlyPosture(candidate) (một chỗ) ─► invocation confined
spawn (primary | fallback | resume) ─► cùng posture đã resolve (ghi vào provenance)
```

## Related Code Files

- Modify: `src/runner/dispatch/assignment-runner.mjs` (khối redirect ~1428-1455; chọn invocation fallback ~2318-2353), `src/runner/dispatch/confinement/**`, `src/runner/dispatch/provider-capacity.mjs`, `src/runner/dispatch/provider-adapter.mjs`, `src/runner/dispatch/transport.mjs` (herdr), `src/runner/execution/bind.mjs` (chỉ thay cài đặt posture), `src/setup/registrations.mjs`, `src/setup/checks.mjs`
- Delete: `src/runner/dispatch/placement-policy.mjs`, test tương ứng (`test/runner/placement-policy*.test.mjs`)
- Tham chiếu: nhánh T `plans/260930-1235-readonly-invocation-redesign/plan.md` (9 ràng buộc) + `reference-original-phase-04-draft.md` (bản nháp sai — không dùng nguyên văn)

## Implementation Steps

1. Bước 0 (owner) như trên; ghi quyết định vào `docs/specs/runner.md` (phase 8 hoàn thiện).
2. GitNexus `impact`: `selectReadOnlyRedirectExecutor`, `isReadOnlyAssignment`, `attemptProviderCapacityFallback`, hàm resolve confinement.
3. Test trước: vai read-only chọn claude → chạy claude confined (không đổi sang openai); worker read-only ghi được artefact bắt buộc nhưng không ghi được repo; fallback quota ra executor khác, posture giữ, provenance ghi lý do; không candidate → từ chối; resume giữ posture; herdr theo quyết định bước 0.
4. Cài đặt; xoá redirect + placement-policy.
5. Focused + dispatch suite → commit → merge vào nhánh plan.

## Success Criteria

- [ ] `rg "readOnlyRedirects|placement-policy|selectReadOnlyRedirectExecutor" src .fgos/config.json` rỗng.
- [ ] Một hàm resolve posture; test chứng minh primary/fallback/resume cùng posture.
- [ ] Doctor báo được thiếu posture read-only ở project khác.
- [ ] 9 ràng buộc của X có test hoặc ghi chú "đã đóng bởi phase 5".

## Risk Assessment

- Confinement làm vỡ executor không hỗ trợ bwrap ở máy khác → doctor + fallback có lý do; không hạ về unconfined lặng lẽ.
- Quyết định bước 0 kéo dài → làm phần không phụ thuộc trước; câu hỏi treo không chặn phase 7 (Release con người).
