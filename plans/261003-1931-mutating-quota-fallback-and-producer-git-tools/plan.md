---
title: "Fallback quota cho Unit ghi file + bỏ quyền git của producer"
description: "Fallback provider-limit hiện chỉ chạy với vai read-only: cổng mutating tính lại bind() không biết candidate trước đã bị bỏ qua nên báo binding mismatch. Sửa để producer cũng fallback được; bỏ Bash(git add/commit) khỏi allowedTools vì runner đã tự commit."
status: completed
priority: P1
effort: "~0.5d"
tags: [quota, fallback, bind, mutating-gate, allowedTools]
created: 2026-10-03
blockedBy: []
blocks: []
---

# Fallback quota cho Unit ghi file + bỏ quyền git của producer

## Overview

Hai mục còn mở sau plan [credential hygiene](../261003-0706-confinement-credential-hygiene-and-pane-safety/plan.md) (báo cáo agent 2026-10-03, discussion lead kiểm `file:line`):

1. **Fallback bị từ chối với Unit ghi file.** `run.mjs:458` gọi `nextCandidate(bound, …)` → `bind(ask, ctx, { skipCandidateIndex: prevIndex })` (`bind.mjs:410-420`, lọc `poolIndex <= skipCandidateIndex` ở `:167`). Nhưng cổng mutating trong `executeAssignment` (`assignment-runner.mjs:501-516`) tính lại `bind()` **không có** `skipCandidateIndex` → ra candidate đầu → lệch executor với binding của fallback → `binding mismatch`, round fail. Vai read-only không qua cổng này nên fallback chạy. Hệ quả: producer — vai chạy lâu, hay chạm quota nhất — không fallback được; đây là đường chính của X-3.
2. **Producer vẫn được phép `git add`/`git commit`.** Runner đã tự commit (`src/runner/execution/commit-unit-work.mjs`), nhưng `allowedTools` của invocation claude vẫn có `Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)` (`.fgos/config.json:19, 526, 566`; mặc định/ví dụ trong `src/runner/dispatch/config.mjs`, `core/skills/_shared/coding-worker-contract.md`, `core/skills/fgos-architecture-panel/SKILL.md`, `docs/specs/runner.md`). Worker confined không ghi được git, nhưng worker không confine thì vẫn có thể → hợp đồng không nhất quán.

Ngoài phạm vi: hai test chập chờn (`fanoutBatchExecutorCli … overlapping execution windows`; `dispatch-production-call-sites.test.mjs:708` `settleClaim: writer identity mismatch`) — theo dõi bằng work item riêng.

## Phases

| # | Phase | Phụ thuộc | Sở hữu file |
|---|---|---|---|
| 1 | [Cổng mutating biết fallback](./phase-01-mutating-gate-knows-fallback.md) | — | `src/runner/execution/{bind,run}.mjs`, `src/runner/dispatch/assignment-runner.mjs` |
| 2 | [Bỏ quyền git của producer](./phase-02-drop-producer-git-tools.md) | — (∥ 1) | `src/runner/dispatch/config.mjs`, `.fgos/config.json`, `core/skills/_shared/coding-worker-contract.md`, `core/skills/fgos-architecture-panel/SKILL.md`, render targets (`npm run build:skills`), `docs/specs/runner.md`, `CHANGELOG.md` |
| 3 | [Nghiệm thu + merge](./phase-03-verify-merge.md) | 1, 2 | `reports/**` |

## Success Criteria

- [x] Producer `workspace-write` chạm `provider-limit` → candidate kế chạy và **qua cổng mutating** (test qua `fgos run`); cổng vẫn từ chối binding giả mạo (executor không thuộc chuỗi fallback đã ghi).
- [x] Chuỗi fallback ≥ 2 bước đúng (candidate 0 → 1 → 2).
- [ ] (ngoại lệ có chủ — xem reports/acceptance.md) Không còn `Bash(git add`/`Bash(git commit` trong allowedTools mặc định, config repo, skill, spec (trừ lịch sử/CHANGELOG); `npm run build:skills` sạch.
- [~] Chạy thật qua pane herdr (harness herdr giả; pane herdr thật NOT RUN) bằng executor giả: producer chạm limit → fallback → runner commit trên nhánh Unit. Không chạy được → NOT RUN + lý do.
- [~] Full `npm test`: các file đỏ khi chạy full đều xanh khi chạy riêng; merge `main` sau bước này.

## Risk Assessment

| Rủi ro | Tín hiệu | Phản ứng |
|---|---|---|
| Nới cổng thành lỗ: caller tự khai `skipCandidateIndex` để ghim executor bất kỳ | test giả mạo qua cổng | cổng **không** tin giá trị từ assignment; chỉ đọc chuỗi attempt runner đã ghi trong `unit.json` (snapshot do runner viết) và kiểm attempt trước của cùng vai có outcome `provider-limit` |
| Bỏ quyền git làm vỡ đường cũ còn dựa vào agent tự commit (Work runner loop) | test loop/coding đỏ | phase 1 refresh tìm caller; đường nào còn cần thì chuyển sang runner commit hoặc giữ grant riêng cho đường đó, ghi rõ |

## Câu hỏi mở

Không có.

<!-- slug: mutating-quota-fallback-and-producer-git-tools -->
