# Phase 08: doctor, spec, io-contract, boundary, CHANGELOG

Wave 1 (docs) và wave 2 (check). Nhánh `terminal-mode/p08-doctor-docs`, worktree `.claude/worktrees/tm-p08`. Phụ thuộc: P00 (docs); P06 (check). Chủ `registrations.mjs`, `checks.test.mjs`, `CHANGELOG.md`, docs.

## Yêu cầu

**Doctor:**
- `herdr` capability: probe qua driver terminal-control (`capabilities`), không gọi herdr thô; Windows → `unsupported` có tên.
- `runtime-socket-dir` (6.2) thêm kiểm: socket attempt mồ côi (supervisor không còn) → báo, fix xoá file socket (không phải lock).
- `run-attempts-stuck` (6.2) phủ cả attempt `terminal`.
- Gỡ check/đoạn doctor nào còn gọi reaper (`registrations.mjs:5332-5460` đã đổi ở 6.2 sang `sweepAttempts`; kiểm lại sau P07).

**Docs:**
- `docs/platform/run-supervisor/spec.md`: mục cách `terminal` (socket, `SCM_RIGHTS`, tty, nhánh mồ côi, `carrier-lost`, `release-slot`); quan hệ job control của shell pane (số đo P01).
- `docs/platform/agent-protocol/spec.md`: bảng CLI × `terminal`.
- `docs/platform/terminal-control/spec.md` (6.5): key = attempt id cho run.
- `docs/platform/session-identity/spec.md`: mint id attempt, scrub, lineage; giới hạn codex daemon (P01).
- [`docs/io-contract.md`](../../docs/io-contract.md): writer id mỗi attempt `att-<attemptId>`, `FGOS_PARENT_WRITER_ID`.
- [`component-boundary.md`](../../docs/platform/component-boundary.md): nửa gate trong pane; session-identity cung cấp mint cho supervisor.
- [`docs/specs/runner.md`](../../docs/specs/runner.md) "Lịch sử quyết định": herdr round không còn canh trong controller.
- `CHANGELOG.md`: herdr round sống qua controller chết (deadline, settle, đóng pane); worker có writer id riêng mỗi attempt; Windows: cách `terminal` `unsupported`.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `CHANGELOG.md`, các docs trên, `docs/specs/reading-map.md` |

## Test

`node --test test/setup/checks.test.mjs`; link docs bấm được, một H1 mỗi file.

## Tiêu chí nghiệm thu / rollback

Check mới xanh; docs khớp code sau P06/P07. Rollback: revert.
