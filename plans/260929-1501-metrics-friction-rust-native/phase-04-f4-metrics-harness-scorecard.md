---
phase: F4
title: "metrics harness + metrics faults; xoá faults, dispatch-report"
status: done
priority: P1
effort: "1d"
dependencies: [F2, F3]
---

# Phase F4: `fgos metrics harness` (mốc M2)

## Overview
Scorecard theo case hoặc theo khung thời gian, tính trên **thực thể tầng nền** (run, session, executor, case). Thứ tự chỉ số đã chốt: #4 → #3 → token/can thiệp tay → #5. Chỉ số của Work (#1/#2) chỉ được gắn vào khi Work source có mặt (F6).

## Requirements
<!-- Updated: Validation Session 2 - single path -->
- **Single path, xoá trong cùng phase:**
  - Thêm `fgos metrics faults [--class <c>] [--since]`. Source `invocation-faults` (thuộc host, đọc `.fgos/logs/invocation-faults.jsonl`) nằm trong `fgos-observe` như một source của host surface.
  - Xoá verb `faults` và `dispatch-report` (đã chết: chỉ 14 dispatch, confidence `missing`) khỏi `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `command-routes.json`, cùng `src/report/dispatch-confidence.mjs` và các test tương ứng. Sửa tham chiếu còn sống trong skills/docs (`docs/explanation/dispatch-result-confidence-reader.md`, `docs/specs/runner.md`, `docs/specs/confinement-authority.md`), code (`src/runner/dispatch-log.mjs:13`) và `test/test-ownership.mjs` (`dispatch-confidence.mjs`); không sửa proof/log lịch sử. <!-- Red Team 2026-09-29 -->
- Functional: `fgos metrics harness [--case <name> | --since <iso> [--until <iso>]] [--dir <root>]`

| Field | Cách tính | Source |
|---|---|---|
| `case` | name, harness, task, verdict, `interventionsManual`, `durationMin` | case_journal |
| `runs` (#4) | theo executor và adapter: đếm `status`; với run có `classification`: `execution.status != completed` → `execFailed`; `assessment.verdict == findings` → `verdictFail`; `inconclusive` / `blocked` → bucket riêng cùng tên; `policy.disposition != allow` → `policyRefused`; `pass` / `not-applicable` → `ok`. Không có classification → `unclassified` (~90% run hiện tại, báo rõ tỉ lệ). Theo `role` và `adapter` chỉ khi source có (từ `assignment.json`). <!-- Red Team 2026-09-29 --> | run-result |
| `sessions` (#3, ước lượng) | Session có `result-linked` trong khung: số assignment p50/p90; thời lượng p50/p90 **tính từ `result-linked` đầu tới cuối** (không phải open→close, vì ~85% session vẫn `active`); `firstPass` = không có assignment của actor `fixer` và status `completed` hoặc `partial`; báo riêng số session `active`. Gắn cờ `estimate: true`. <!-- Red Team 2026-09-29 --> | coordination |
| `tokens` | Tổng 4 loại token, số phiên, số message trong khung, lọc theo project của case. Output **không chứa session id** (baseline được commit) <!-- Red Team 2026-09-29 --> | claude-transcripts |
| `commits` | `headAtOpen..headAtClose` | repo |
| `friction` | Số friction mới trong khung theo `subject.kind` và `layer`; top 5 subject | friction store (F5; trước F5 thì là `n/a`) |
| `complexity` (#5) | LOC theo nhóm glob cố định (`src/runner/**`, `packages/**`, `apps/**`, `herdr-plugin/**`; test tách riêng); `protocolsUsed/protocolsDefined`; `nativeRoutes/totalRoutes` | repo + coordination + routes đã embed |
| `work` (#1/#2) | Có khi Work source được nối (F6); không có thì `n/a` | work (F6) |
| `faults` | Số invocation fault trong khung theo `faultClass` | invocation-faults |
| `warnings` | case mở quá 24 giờ, session rò bị bỏ qua, record bị skip | tất cả |

- Harness `plain`/`cook-plan`: `runs` và `sessions` là `n/a`. Vẫn có đủ `case`, `tokens`, `commits`, `friction`. Đây là **phần chung để bake-off**.
- Non-functional: chạy dưới 5 giây trên forgentX.

## Architecture
`scorecard.rs` gồm các hàm thuần `compute_*(&[Observation], …) -> Section`. Nó nhận observation từ những source đã được nối, không tự đọc file. Test chặn `std::fs` trong `scorecard.rs` bằng cách quét source.

## Related Code Files
- Create: `packages/observe/rust/src/scorecard.rs`, `plans/260929-1501-metrics-friction-rust-native/reports/f4-parity.md`
- Create (làn A): `packages/observe/rust/src/metrics_cli/{harness,faults}.rs` <!-- Session 4: file theo làn -->
- Modify: `docs/specs/observe.md` (công thức; ghi rõ #3 là ước lượng), `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `packages/host-runtime/contracts/command-routes.json`
- Delete: `src/report/dispatch-confidence.mjs` cùng test của `faults` và `dispatch-report`

## Implementation Steps
1. Viết các `compute_*`, mỗi hàm có unit test trên observation tổng hợp với đáp án tính tay.
2. Chọn khung: `--case` → `[openedAt, closedAt|now]` cộng project của case; không có thì dùng `--since/--until`.
3. Chạy parity `--since 2026-09-01` trên forgentX với audit (phân bố run, số session) và ghi `f4-parity.md`.
4. Chạy scorecard cho case M1 đầu tiên. Đây là số liệu thật đầu tiên.
5. Đo thời gian chạy; vượt 5 giây thì tối ưu transcript trước.

## Success Criteria
- [ ] Unit test `compute_*` xanh.
- [ ] Parity phân bố run khớp chính xác trên cùng mốc dữ liệu.
- [ ] `--case` của case M1 trả đủ field (hoặc `n/a` kèm lý do).
- [ ] Chạy dưới 5 giây.
- [ ] `fgos faults` và `fgos dispatch-report` báo unknown verb; `fgos metrics faults` trả cùng số record như `faults` cũ trên cùng store.

## Risk Assessment
- **#3 ước lượng sai bản chất.** Luôn gắn `estimate: true`; định nghĩa thật chờ plan tiếp theo "RunResult status/usage".
- **Token của hai phiên song song trong cùng project bị gộp vào một case.** Một project chỉ có một case mở (F3); ghi rõ giới hạn trong `warnings`.
