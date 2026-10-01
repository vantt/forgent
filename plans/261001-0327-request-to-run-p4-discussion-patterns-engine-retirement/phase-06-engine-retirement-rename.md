---
phase: 6
title: "Thu hồi engine + đổi tên"
status: pending
priority: P1
effort: "2d"
dependencies: [2, 3, 4, 5]
---

# Phase 6: Thu hồi engine + đổi tên

## Overview

Khi ca 2, ca 3 và conformance mọi dạng đều đạt: xoá engine coordination và mọi phần chỉ phục vụ nó; đổi tên còn lại sang thuật ngữ đã chốt (`CollaborationPattern`, Workflow); xử lý dữ liệu session cũ theo quyết định owner; cập nhật spec/boundary.

## Requirements

- Functional:
  - **Cổng**: báo cáo ca 2, ca 3, conformance phase 2 và 5 đều đạt; **ledger bất biến an toàn (phase 1) đóng hết**; owner xác nhận xoá (thao tác khó đảo ngược — xin xác nhận tường minh).
  - Xoá: `src/runner/coordination/**`, `src/verbs/coordination/**` (kể cả `launch-master-loop`, `group-thinking-pack` nếu đã chuyển), `src/runner/definitions/**` (vỏ `FlowDefinition`, `protocol-loader`, `schema` — phần profile `Workflow` đã xoá ở P3), `src/runner/team-cognition/**`, `src/runner/deliberation/**`, `core/coordination-protocols/**`, verb `fgos coordination`, `execute --assignment` nếu chỉ engine dùng, test của engine (~170 file nhắc coordination — xoá hoặc chuyển sang test Workflow/preset tương ứng), `packages/coordination-state/rust` **và** mọi tham chiếu Cargo (`Cargo.toml:10`, `apps/fgos/Cargo.toml:12`, `metrics_sources.rs`), nguồn coordination trong `packages/observe/rust` + scorecard `source: "coordination"` (`scorecard.rs:347,870-914`) thay bằng nguồn Unit run (assignments + `unit.json`) + Workflow run; protocol stamp ở cổng mutating (ngoại lệ của P1 kết thúc ở đây).
  - Đổi tên trong code: mọi `CoordinationProtocol`, `FlowDefinition`, `protocolRef`, Protocol Pack, "objector" (~18 chỗ) còn sót → tên mới hoặc xoá; thư mục định nghĩa còn lại (nếu có) → `core/collaboration-patterns/` / `core/workflows/`.
  - Dữ liệu `.fgos/coordination/sessions`: theo quyết định câu hỏi mở 2 (lưu trữ đông lạnh đọc qua một đường, hoặc xuất báo cáo rồi bỏ) — backup trước.
  - Docs: spec area agent-coordination → đánh dấu đã thu hồi + "Lịch sử quyết định"; `docs/platform/component-boundary.md`: bỏ "Agent Coordination Engine", thêm "Collaboration Pattern (trong execution core)" + "Workflow"; `AGENTS.md` nếu còn nhắc coordination; CHANGELOG.
  - Guard từ vựng chết.
- Non-functional: full `npm test` (Node + Rust) xanh.

## Related Code Files

- Delete: như liệt kê; Modify: `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `packages/observe/rust/src/sources/**`, `src/setup/registrations.mjs` (doctor check coordination), docs, CHANGELOG, `test/runner/dead-vocabulary-guard.test.mjs`

## Implementation Steps

1. Kiểm cổng + xin owner xác nhận.
2. GitNexus `impact` + `detect_changes` để chắc không còn caller ngoài danh sách phase 1.
3. Backup dữ liệu session; xử lý theo quyết định.
4. Xoá theo nhóm (runtime → verb → định nghĩa → Rust/Observe → test); suite sau mỗi nhóm.
5. Đổi tên phần còn; guard; docs.
6. Full suite → merge `main` → cập nhật track; dọn worktree P4.

## Success Criteria

- [ ] `rg "session-engine|coordination-protocols|CoordinationProtocol|FlowDefinition|protocolRef|objector|ProtocolPack" src core domains packages bin` rỗng (trừ đường đọc dữ liệu lịch sử nếu giữ).
- [ ] Mọi dạng thảo luận vẫn chạy (conformance xanh sau xoá).
- [ ] Spec/boundary/CHANGELOG; full suite; merge `main`.

## Risk Assessment

- Xoá nhầm phần còn caller → `detect_changes` + suite từng nhóm; rollback = revert merge phase.
- Mất dữ liệu lịch sử → backup trước; quyết định owner.
