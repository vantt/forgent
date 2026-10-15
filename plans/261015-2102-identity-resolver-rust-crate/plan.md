# Plan 5.1: chuyển resolver writer identity sang crate Rust `fgos-session-identity`

- Ngày: 2026-10-15. Lead: agent 5.1, worktree `.claude/worktrees/agent-ac970642d8c2e90a0`, nhánh `worktree-agent-ac970642d8c2e90a0`. Tiếp bản nháp của lead trước (bị dừng nhầm).
- Trạng thái: **thiết kế xong, đang phản biện**. Chưa code.
- Đầu việc: 5.1 trong [hội đồng §6.2](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md). Không có work item (anh cấm cho track này).

## Mục tiêu

"Writer này là ai" chỉ có **một** nơi quyết định: crate Rust `fgos-session-identity`. Node gọi sang qua facade mỏng. Bản Node (`src/util/session-identity.mjs` hiện 204 dòng) và hai bản chép trong Observe (`shard.rs`, `friction.rs`) bị xoá.

## Quyết định anh đã duyệt (không tự đảo)

| # | Quyết định |
|---|---|
| O1 | Crate riêng `fgos-session-identity`, route native, phụ thuộc `fgos-host-runtime`, nối ở `apps/fgos`; Observe là tiền lệ |
| O2 | Thứ tự env `FGOS_SESSION_ID → CODEX_THREAD_ID → CLAUDE_CODE_SESSION_ID` |
| O3 | Không env id: leo tới tổ tiên **cao nhất** còn controlling tty, lấy pid của nó (S7) |
| O4 | `writer.source` giữ 4 giá trị `registry\|env\|pid\|unresolved` |
| O5 | Không fallback Node khi thiếu binary; báo lỗi rõ; test build/tìm binary |
| O6 | Facade đủ điều kiện S6: route native, exec thẳng binary, tìm một lần mỗi process, resolve và cache trước mọi lock, truyền pid caller, ≤5 ms p95 warm / ≤6 ms cold; timeout có hợp đồng (B8) |
| O7 | Nửa launcher (mint id, scrub env, lineage) không thuộc 5.1 (thuộc 6.3) |
| O8 | Drain claim trước khi activate |

## Lead tự quyết

D1–D8 ở [phase-00 §13](phase-00-design-and-review.md#13-lead-tự-quyết-d1d8). Điểm chính: không tty thì lấy session id (D1); `--pid` không so với `getppid()` (D2); tìm binary đúng luật của lệnh `fgos` (D5); facade giữ ở `src/util/` (D8, lệch chữ với `{contracts,rust,src,tests}`, có lý do).

## Phase

| Phase | Nội dung | Phụ thuộc | Trạng thái |
|---|---|---|---|
| [00](phase-00-design-and-review.md) | Thiết kế + phản biện | — | đang phản biện |
| [01](phase-01-rust-crate-and-verb.md) | Contract, vector, crate, verb `fgos identity` | 00 | chưa |
| [02](phase-02-observe-uses-crate.md) | Observe dùng crate, xoá bản chép | 01 | chưa |
| [03](phase-03-node-facade-and-callers.md) | Facade Node, prime trước lock, hook, xoá resolver Node | 01 | chưa |
| [04](phase-04-doctor-docs-changelog.md) | Doctor, spec, io-contract, boundary, CHANGELOG | 03 | chưa |
| [05](phase-05-measurement-gate.md) | Đo cổng S6 trên lời gọi thật | 03 | chưa |
| [06](phase-06-landing-drain-activation.md) | Lead tích hợp: full `npm test`, merge, drain, activate | 01–05 | Lead chính |

## Tiêu chí xong

1. `rg "resolve_writer_id|walkAncestors|procPpidOf|MAX_HOPS"` trong `src/`, `packages/`, `bin/`, `.githooks/` không còn kết quả; `friction.rs` không tự đọc `FGOS_SESSION_ID`.
2. `cargo test -p fgos-session-identity -p fgos-observe -p fgos` xanh; vector chung chạy ở cả cargo và Node.
3. Test Node đã chạm xanh với `env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID -u CODEX_THREAD_ID FGOS_HOST_BIN=… node --test …`.
4. Test đa process: không exec identity nào khi `events.lock`/`claims.lock` đang giữ.
5. Cổng S6 trên lời gọi thật: hook thêm ≤5 ms p95 warm và ≤6 ms lần đầu cold so với baseline Node; số ghi trong report.
6. Doctor có `writer-identity-resolvable`; spec, `docs/io-contract.md`, `component-boundary.md`, reading-map, CHANGELOG cập nhật cùng thay đổi.
7. Runbook drain có trong phase 06; Lead chạy trước activate.

## Phản biện

- In-process và red-team Astra: [reports/](reports/). Tối đa 2 vòng red-team, giữ ý kiến trái chiều.
