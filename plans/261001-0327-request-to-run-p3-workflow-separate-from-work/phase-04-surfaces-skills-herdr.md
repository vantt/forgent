---
phase: 4
title: "P3b — Bề mặt: verb, skill, herdr, web"
status: done
priority: P1
effort: "2d"
dependencies: [3]
---

# Phase 4: P3b — Bề mặt: verb, skill, herdr, web

## Overview

Chuyển mọi bề mặt đang dựa vào `stage` sang Workflow run: verb `discover/plan` và các slash skill theo stage, skill coding, herdr gateway (gồm `pick.rs` gọi verb), web dashboard. Xoá bản cũ trong cùng phase.

## Requirements

- Functional:
  - Verb `fgos discover/plan` → bước của Workflow run (`fgos workflow …`); xoá verb theo stage (một đường; CHANGELOG + lỗi có hướng dẫn).
  - Skill: `/fgOS:discover|plan|discover-loop|plan-loop|discover-next|plan-next`, `fgos-coding-driving`, `fgos-routing` (phần stage), `fgos-coding-*` → dùng Workflow run; xoá bản cũ. Cây skill sinh ra tái sinh khi merge plan.
  - `herdr-plugin`: gateway (`gateway.rs`) trả bước từ Workflow run, key `stage` trong contract JSON → 4xx có hướng dẫn; `pick.rs` (`discover_run_argv` ~167) gọi verb mới; web (`herdr-plugin/web/src/**`) hiển thị bước.
  - Restart gateway sau merge (`fgos gateway stop` / `start`) — ghi trong bước merge.
- Non-functional: test gateway/web xanh.

## Related Code Files

- Modify: `bin/fgos.mjs` + `src/cli/command-registry.mjs` (chỉ mục verb theo stage), skill ở `core/skills/**`, `domains/coding/skills/**`, `herdr-plugin/src/gateway.rs`, `herdr-plugin/src/pick.rs`, `herdr-plugin/web/src/**`

## Implementation Steps

1. Đếm consumer verb/skill (phase 1).
2. Test trước: `discover` một item chạy bước discovery qua runner; gateway trả bước hiện tại; `pick.rs` gọi verb mới.
3. Chuyển + xoá; build skills (không commit cây sinh ra).
4. Suite + Rust + web → commit → merge nhánh plan.

## Success Criteria

- [x] Không còn verb/skill theo stage; herdr gateway/web/pick dùng Workflow run.

## Risk Assessment

- Project khác dùng gateway/verb cũ → CHANGELOG + lỗi hướng dẫn (single user, không alias).
