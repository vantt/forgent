---
phase: 6
title: "Posture trong pane herdr + cli, quota, xoá redirect (gộp plan X)"
status: pending
priority: P1
effort: "2.5d"
dependencies: [5]
---

# Phase 6: Posture trong herdr + cli, quota, xoá redirect

## Overview

Làm phần của plan X (đã gộp) với quyết định owner (§7e): **G7** — out-of-process mặc định qua **pane herdr**; **X-1** — read-only/ghi file là **confinement OS** do fgOS áp, **cho cả pane herdr lẫn cli**, resolve một chỗ lúc spawn (primary + fallback + resume); **X-3** — hết quota phản ứng khi gặp lỗi → `bind().nextCandidate`, pane mới, pane cũ giữ; **X-4** — xoá invocation `*-readonly` (và `*-bwrap` nếu posture áp được cho mọi invocation), không có `readOnlyDefault`. Xoá `readOnlyRedirects` + `placement-policy.mjs`.

## Requirements

- Functional:
  - **Bước 0 — spike herdr + confinement (cổng)**: chứng minh `herdr agent start` (`herdr-agent.mjs`) khởi được agent chạy **bên trong** lệnh có bọc bwrap (posture `host-write-denied` + ngoại lệ ghi run dir/outbox), REPL tương tác vẫn dùng được, `outbox/result-<round>.json` vẫn ghi được, pane vẫn giữ khi lỗi. Báo cáo `reports/spike-herdr-confinement.md`. **Không đạt → dừng, báo owner** (không bỏ herdr lặng lẽ — G7).
  - **Một hàm posture** `resolvePosture(binding, ctx)` → argv/env bọc confinement, dùng chung cho adapter cli (`transport.mjs`) và adapter herdr (`herdrSpawnInteractiveAdapter`, `herdr-round.mjs` — hiện nhận `confinement` nhưng chưa áp); áp cho primary, fallback, resume. `bind().canApplyPosture` dùng hàm này (thay cài đặt tạm của phase 3).
  - Worker read-only vẫn ghi được `agent-result.json`, `agent-report.md`, `outbox/result-<round>.json` (X ràng buộc 1).
  - **Quota (X-3)**: `liveness.mjs` đã nhận màn hình usage-limit → run kết thúc outcome `provider-limit`; pane **giữ** (giờ reset); pattern gọi lại vai với `bind().nextCandidate` → pane mới; provenance `fallbackFrom` + lý do; hết candidate → từ chối có lý do. Không làm lease tài khoản (`runner.providers.*.accounts`).
  - **Xoá (X-4)**: invocation `claude-cli-readonly`, `claude-herdr-readonly`, `codex-cli-readonly-fgovn` (+ `*-bwrap` nếu spike xác nhận) khỏi `.fgos/config.json`, global, test, doc; `runner.placementPolicy.readOnlyRedirects` (config + validator + doctor); `src/runner/dispatch/placement-policy.mjs`; khối redirect trong `assignment-runner.mjs` (~1411-1460 theo nhánh T — kiểm lại ở phase 1).
  - Gộp luật read-only thứ hai `provider-adapter.mjs` ~356-369 (`applied-via-tool-gating`) vào posture.
  - Doctor: herdr có mặt? (nếu không → cảnh báo, cli fallback — G7); mỗi capability có checker read-only có ≥ 2 provider family áp được posture; project khác thiếu executor áp được posture (X ràng buộc 7).
- Non-functional: vai ghi file giữ hành vi, chỉ thêm `workspace-write`.

## Architecture

```text
bind() ─► { executor, invocation, transport, posture }
spawn: transport=herdr ─► herdr agent start ─► lệnh = resolvePosture(argv)   (pane người xem được)
       transport=cli   ─► spawn(resolvePosture(argv))                        (headless fallback)
usage-limit trên màn hình ─► outcome provider-limit ─► bind().nextCandidate ─► pane mới (pane cũ giữ)
```

## Related Code Files

- Modify: `src/runner/dispatch/transport.mjs`, `herdr-round.mjs`, `herdr-agent.mjs` (nếu cần), `liveness.mjs`, `confinement/**`, `provider-adapter.mjs`, `provider-capacity.mjs` (gỡ nhánh chết nếu thành thừa), `assignment-runner.mjs` (khối redirect + chọn invocation fallback ~2318-2353), `src/runner/execution/bind.mjs` (chỉ thay `canApplyPosture`), `src/setup/registrations.mjs`, `src/setup/checks.mjs`, `.fgos/config.json`, `~/.fgos/config.json`
- Delete: `src/runner/dispatch/placement-policy.mjs`, `test/runner/placement-policy*.test.mjs`
- Tham chiếu: nhánh T `plans/260930-1235-readonly-invocation-redesign/plan.md` (9 ràng buộc)

## Implementation Steps

1. Spike (bước 0); báo cáo; cổng.
2. GitNexus `impact`: `selectReadOnlyRedirectExecutor`, `isReadOnlyAssignment`, hàm resolve confinement, `herdrSpawnInteractiveAdapter`, `runHerdrRound`.
3. Test trước: reviewer claude qua pane herdr read-only — ghi repo bị chặn, ghi outbox được; cùng ca qua cli; fallback quota ra candidate kế, pane mới, pane cũ còn; resume giữ posture; không herdr → cli + cảnh báo doctor; config còn `*-readonly`/`readOnlyRedirects` → lỗi có hướng dẫn.
4. Cài đặt; xoá; suite dispatch.
5. Commit → merge nhánh plan.

## Success Criteria

- [ ] Spike đạt (báo cáo); một hàm posture cho herdr + cli; test chứng minh primary/fallback/resume cùng posture.
- [ ] `rg "readOnlyRedirects|placement-policy|selectReadOnlyRedirectExecutor|-readonly\"" src .fgos/config.json` rỗng.
- [ ] 9 ràng buộc của X có test hoặc ghi "đóng bởi phase 5".

## Risk Assessment

- REPL tương tác trong bwrap thiếu quyền (TTY, cache, credentials) → spike phát hiện; grant tối thiểu tường minh (executor-credentials read), không mở rộng ngầm.
- Màn hình limit đổi định dạng → `DEFAULT_USAGE_LIMIT_PATTERNS` cập nhật; outcome mặc định `execution-failure` có lý do, không treo.
