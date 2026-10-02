---
phase: 4
title: "herdr transport + fallback quota"
status: pending
priority: P1
effort: "1.5d"
dependencies: [2]
---

# Phase 4: herdr transport + fallback quota

## Overview

Nối `bind().transport` vào spawn thật (G7) và `nextCandidate` vào vòng chạy (X-3). Posture của phase 2 áp **bên trong** pane herdr.

## Requirements

- Functional:
  - `run.mjs`: dùng `bound.transport` + invocation tương ứng; `herdr` khi herdr có mặt (`detectHerdrPresent`) và executor có invocation `herdr-spawn`; `cli` khi headless hoặc không có invocation herdr; ghi `transport` thật vào run record/assignment để nghiệm thu đọc được.
  - `transport.mjs` `herdrSpawnAdapter` (`:912`): lệnh trong pane = argv đã bọc posture (driver confinement của phase 2); TTY/credentials grant tối thiểu tường minh.
  - Fallback quota: `liveness.mjs` nhận màn hình limit → outcome `provider-limit` → pattern/`run.mjs` gọi `bind().nextCandidate` (chưa có caller) → chạy candidate kế (pane mới nếu herdr); **giữ pane cũ**; hết candidate → outcome `provider-limit` có cấu trúc, không đoán bừa. Resume dùng lại binding đã ghi trong `unit.json`.
  - Không đổi D-ADR0033: executor có CLI luôn out-of-process.
- Non-functional: headless (CI, không herdr) chạy cli với cùng posture — test.

## Related Code Files

- Modify: `src/runner/execution/run.mjs`, `src/runner/execution/bind.mjs`, `src/runner/execution/patterns/{solo,reviewed,panel}.mjs` (chỗ xử lý `provider-limit`), `src/runner/dispatch/transport.mjs`, `herdr-round.mjs`, `herdr-agent.mjs`, `liveness.mjs`
- Tests: `test/runner/execution/run.test.mjs`, `test/runner/herdr-spawn-*.test.mjs`, `test/runner/dispatch-liveness.test.mjs`

## Implementation Steps

1. GitNexus `impact` `runUnit`/hàm chính của `run.mjs`, `herdrSpawnAdapter`, `nextCandidate`.
2. Test trước, qua `fgos run` với herdr giả (`resolveHerdrBin` trỏ fake bin ghi lại argv): transport=herdr khi có mặt, cli khi không; argv trong pane chứa posture; executor giả in màn hình limit → candidate kế chạy, pane cũ không bị đóng; hết candidate → `provider-limit`.
3. Sửa code.
4. Guard: `rg -n "nextCandidate\(" src --glob '!src/runner/execution/bind.mjs'` có kết quả; `bound.transport` được đọc trong `run.mjs`.
5. Suite liên quan xanh → commit → merge nhánh plan.

## Success Criteria

- [ ] Test qua `fgos run`: chọn transport đúng; posture trong pane; fallback quota.
- [ ] Run record ghi transport thật.

## Risk Assessment

- Agent tương tác trong pane + bwrap không chạy (TTY/credentials) → thử grant tối thiểu; vẫn không được → **dừng, báo owner** (cổng G7), không lặng lẽ rơi về cli.
