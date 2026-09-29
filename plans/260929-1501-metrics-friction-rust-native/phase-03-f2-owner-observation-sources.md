---
phase: F2
title: "Contract observation + source tầng nền"
status: completed
priority: P1
effort: "1d"
dependencies: [F1]
---

# Phase F2: Source tầng nền (thuộc crate của owner)

## Overview
Mỗi owner ở tầng nền implement `ObservationSource` **trong crate của chính mình**, chỉ đọc store của chính mình, và trả ra observation chuẩn. Observe có thêm hai source ngoài fgOS (transcript Claude, git) nằm ngay trong crate của nó. Observe không phụ thuộc crate nào trong số này; composition root (`apps/fgos`) mới là nơi nối chúng lại.

## Requirements
| Crate (owner) | Source id | Đọc | Observation |
|---|---|---|---|
| `packages/run-result/rust` (**mới**, Run Result Evaluator) | `run-result` | `.fgos/assignments/*/runs/*/result.json` | `run.settled` với subject `run:<runId>`; attrs: `executor`, `status`, `classification` (nguyên văn; **chỉ ~103/1.028 run có**), `assignmentId`, `role` và `adapter` **đọc từ `assignment.json`** của cùng assignment (result.json không có hai field này; không có thì `null`, không đoán từ executorId). `durationMs` chỉ ~109/1.028 run có: bỏ khỏi source; F4 tính duration từ timestamp coordination. <!-- Red Team 2026-09-29 --> |
| `packages/coordination-state/rust` (**mới**, Agent Coordination) | `coordination` | `.fgos/coordination/sessions/*/{session.json,events.jsonl}` | `session.opened` / `session.assignment` (attrs `actorId`, `assignmentId`) / `session.disposition` / `session.closed` (attrs `terminal`), với subject `session:<id>` |
| `packages/observe/rust` (source ngoài fgOS) | `claude-transcripts` | `~/.claude/projects/<dir>/*.jsonl` (`CLAUDE_CONFIG_DIR` nếu có); nhận `<dir>` khớp encoding của bất kỳ path nào trong `git worktree list` (project root cộng từng worktree ngoài) hoặc bắt đầu bằng `enc + "--claude-worktrees-"` (không match prefix trần: `-forgentX*` không kéo nhầm `-forgentX-worker-isolation` nếu không phải worktree). Lọc thêm theo field `cwd` của từng record: phải nằm dưới project root hoặc một path trong `git worktree list` | `llm.usage` với subject `case:` (gán ở F4 theo khung thời gian); attrs: 4 loại token, `sessionId`, `model`; **dedupe theo `message.id`** |
| `packages/observe/rust` | `repo` | `git ls-files`, `git rev-list` | dùng trực tiếp cho độ phức tạp và số commit (không cần observation) |

- Non-functional:
  - Chỉ đọc; không lock; không spawn, trừ `git`.
  - Record hỏng thì đếm vào `skipped`, không panic.
  - Transcript: chỉ mở file có `mtime >= since`, và đọc streaming.
- **Không** lọc session test rò (`coord_*`, `policy-test*`) trong source, vì source không có quyền phán. Scorecard chỉ đếm session có `result-linked`, và báo số session bị bỏ qua.

## Architecture
- Chiều phụ thuộc: `run-result` và `coordination-state` phụ thuộc `fgos-observe` (chỉ phần contract). `fgos-observe` không phụ thuộc hai crate này. `apps/fgos` phụ thuộc cả ba và truyền `Vec<Box<dyn ObservationSource>>` vào provider.
- Hai crate mới là **nền cho việc chuyển các component đó sang Rust sau này**. Hiện chúng chỉ có source; writer vẫn ở Node.

## Related Code Files
- Create:
  - nội dung cho `packages/run-result/rust/src/lib.rs` và `packages/coordination-state/rust/src/lib.rs` (crate đã được F1 dựng sẵn)
  - `packages/observe/rust/src/sources/{claude_transcripts.rs,repo.rs}`
  - fixture: `packages/*/rust/tests/fixtures/` (lấy mẫu thật đã lọc bớt, bỏ `controlToken`; chỉ riêng transcript được viết tay theo định dạng thật)
- Modify (làn A2): điền vào crate rỗng đã được F1 dựng sẵn (không sửa `Cargo.toml` gốc); `apps/fgos/src/wiring/metrics_sources.rs` (nối source). <!-- Session 4: file theo làn -->

## Implementation Steps
1. Viết `run-result` source cộng test fixture (4 run: done / failed-exec / failed-verdict (`assessment.verdict: findings`) / no-evidence, cộng một run cũ không có `classification`). <!-- Red Team 2026-09-29 -->
2. Viết `coordination-state` source cộng test fixture (hai session thật đã lọc bớt, trong đó có một session partial).
3. Viết source transcript cộng test dedupe (cùng `message.id` xuất hiện ở hai dòng).
4. Viết test ranh giới: `cargo metadata` kiểm rằng `fgos-observe` không có dependency nội bộ nào ngoài `fgos-host-runtime`.
5. Smoke trên store thật của forgentX: 1.028 run (± run mới) và 602 session (±).

## Success Criteria
- [x] Unit test của từng source xanh.
- [x] Smoke thật khớp số lượng với audit.
- [x] Test chiều phụ thuộc xanh.

## Risk Assessment
- **Định dạng transcript Claude Code đổi.** Dấu hiệu: có file mà tokens = 0. Cách xử lý: source trả `status: unrecognized`, scorecard hiện `unknown`.
- <!-- Red Team 2026-09-29 --> **Phần lớn session không bao giờ tới trạng thái terminal** (thực tế: `active` 512, `partial` 57, `completed` 27 trên 602). Source trả nguyên `status`; F4 định nghĩa lại chỉ số #3 cho phù hợp.
- **Session thật có event không đúng `v:3`** (thực tế có 8 event `v:"1"` dạng string, và 4 thư mục session không có `session-opened`). Bỏ qua kèm `skipped`, và so số lượng với `node bin/fgos.mjs coordination` nếu lệch trên 1%.
