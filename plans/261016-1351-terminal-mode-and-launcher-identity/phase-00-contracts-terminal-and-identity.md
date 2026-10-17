# Phase 00: contract cách `terminal` và mint writer id

Wave 0, Lead. Nhánh `terminal-mode/p00-contracts`, worktree `.claude/worktrees/tm-p00`, từ main sau khi 6.2 và 6.5 land.

## Đọc trước

r6 §9.2, §9.3 (socket attempt), §9.6, §9.11; contract 6.2 `packages/run-supervisor/contracts/*`; contract 6.5 `packages/terminal-control/contracts/terminal-control.port.v1.json`; plan.md D1–D8.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/run-supervisor/contracts/envelope.v3.json` — bổ sung (không đổi trường có sẵn): `slot:{key, groupKey}`, `terminal:{socketPath, exitCommand, orphanSettleMs}`, `steps` cho phép `{stepId: "release-slot", builtin: true, disposition: {onSuccess: close, onFailure: retain}}`; `identity:{writerId, parentWriterId}` |
| sửa | `packages/run-supervisor/contracts/gate-go.v1.json` — đường `terminal`: unix socket, peer kiểm uid; `GO` kèm `SCM_RIGHTS` (thứ tự fd: attempt, cwd?); `BRIEF_DELIVERED`; `ORPHAN{reason}` (gate → file `gate-exit.cause`) |
| sửa | `packages/run-supervisor/contracts/receipt.v1.json` — thêm `outcome: carrier-lost`, `abandoned-before-brief` nếu chưa có |
| tạo | `packages/session-identity/contracts/attempt-writer-id.v1.json` + vector `vectors/attempt-writer-id.v1.json` (`attemptId` → `att-<attemptId>`; ký tự hợp lệ; giới hạn độ dài) |
| tạo | `packages/agent-protocol/contracts/terminal-outcomes.v1.json` — kết quả interactive: `ready`, `blocked(trust-dialog\|login)`, `delivered`, `delivery-unknown`, `completed(resultPath)`, `needs-human` |
| tạo | `test/run-supervisor/contracts-terminal.test.mjs` |

## Tiêu chí nghiệm thu / rollback

Contract đủ để P01–P07 làm độc lập; test contract xanh; vector mint chạy được ở Rust và Node. Rollback: revert.
