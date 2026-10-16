# Phase 05: crate `fgos-agent-protocol` + adapter `direct` cho 5 CLI

Wave 1. Nhánh `run-supervisor/p05-agent-protocol`, worktree `.claude/worktrees/rs-p05`. Phụ thuộc: P00.

## Đọc trước

r6 §8; plan.md D4; hội đồng dòng 164 (adapter theo CLI × cách khởi động, cạnh supervisor); nguồn hôm nay: [`transport.mjs:151`](../../src/runner/dispatch/transport.mjs) `resolveExecutorCommand` (trả `liveOutput`, `interactiveMode`, `argsTemplate`), [`:540-553`](../../src/runner/dispatch/transport.mjs) (stdin `ignore` vì codex, tsk-3tkc), [`usage-parsers.mjs`](../../src/runner/dispatch/usage-parsers.mjs), [`provider-auth-failure.mjs`](../../src/runner/dispatch/provider-auth-failure.mjs).

## Yêu cầu

- Mô-đun `port.rs`: trait `AgentIo { send, read, activity }` (6.3 nối vào terminal-control; `direct` nối vào file capture), kiểu kết quả có tên theo contract.
- Mô-đun `direct/`: một adapter mỗi CLI (`claude`, `codex`, `agy`, `pi`, `omp`) là máy trạng thái thuần: `stdin_policy()`, `activity_from(capture_delta) -> Activity`, `classify(exit, capture_tail, outbox) -> Outcome` (`completed(resultPath)` khi có `outbox/result-N.json`; `exited(code)`; `blocked(login|usage-limit)` theo mẫu chuyển từ `provider-auth-failure.mjs`/`usage-parsers.mjs` — **chỉ** những mẫu dùng để phân loại lúc chạy, không đụng Run Result Evaluator ở Node).
- Bảng chọn adapter theo tên `cli` trong envelope (`agentProtocol.cli`), Node điền từ `executor.governance.providerFamily` hoặc basename `command`; không biết → adapter `generic` (exit + outbox, không phân loại).
- Không mở tab, không chọn model, không đổi timeout, không quyết retry.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/agent-protocol/rust/src/{port.rs,outcome.rs,direct/mod.rs,direct/claude.rs,direct/codex.rs,direct/agy.rs,direct/pi.rs,direct/omp.rs,direct/generic.rs}` |
| tạo | `packages/agent-protocol/rust/tests/direct_vectors.rs`, `packages/agent-protocol/contracts/fixtures/direct/<cli>/*.json` (đuôi capture thật lấy từ run dir có sẵn trong `.fgos/assignments/*/runs/*/capture` của máy dev, đã xoá bí mật) |
| sửa | `packages/agent-protocol/rust/{Cargo.toml,src/lib.rs}` |

## Test

Vector cho mỗi CLI: xong có outbox → `completed`; thoát không outbox → `exited`; đuôi capture có thông báo hết hạn đăng nhập → `blocked(login)`; usage limit → `blocked(usage-limit)`; codex → `stdin_policy = null-device`. Lệnh: `cargo test -p fgos-agent-protocol`.

## Tiêu chí nghiệm thu / rollback

Vector 5 CLI xanh; crate không phụ thuộc `fgos-terminal-control`. Rollback: revert.
