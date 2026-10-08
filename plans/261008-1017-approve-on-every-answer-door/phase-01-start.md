---
phase: 1
title: "Cửa Gateway REST, MCP & Client (approve: bool -> --approve)"
status: completed
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Cửa Gateway REST, MCP & Client (approve: bool -> --approve)

## Overview
Mở rộng endpoint REST `POST /work/{id}/answer`, hàm Rhai MCP `answer_work`, và API client của dashboard để tiếp nhận cờ `approve: bool`, chuyển tiếp `--approve` cho CLI fgos bên dưới.

## Requirements
- Functional:
  - Gateway REST `post_work_answer` giải mã body mang trường tùy chọn `approve: Option<bool>`. Nếu `approve == Some(true)`, thêm `"--approve"` vào đối số gọi CLI.
  - OpenAPI spec `docs/contracts/fgos-gateway-api-v1.yaml` bổ sung trường `approve` (boolean) vào request schema của `/work/{id}/answer`.
  - Gateway MCP `apps/fgos-gateway/src/mcp.rs` đăng ký thêm hàm Rhai `answer_work(id, text, approve)` (overload với `answer_work(id, text)` hiện tại, mặc định approve = false). Nếu `approve == true`, thêm `"--approve"` vào đối số gọi CLI.
  - Gateway web client `apps/fgos-gateway/web/src/api/client.ts` cập nhật hàm `answerWork(id: string, text: string, approve?: boolean)`.
- Non-functional:
  - Backward compatibility: callers cũ không truyền `approve` (hoặc truyền `false`) hoạt động nguyên vẹn như trước (không gắn `--approve`).
  - An toàn: `reject_leading_dash` vẫn bảo vệ các đối số id và text.

## Related Code Files
- Modify: `apps/fgos-gateway/src/gateway.rs`
- Modify: `apps/fgos-gateway/src/mcp.rs`
- Modify: `apps/fgos-gateway/web/src/api/client.ts`
- Modify: `docs/contracts/fgos-gateway-api-v1.yaml`

## Implementation Steps
1. Trong `apps/fgos-gateway/src/gateway.rs`, tạo struct `AnswerWorkBody { text: String, #[serde(default)] approve: Option<bool> }` thay thế `TextBody` cho `post_work_answer`.
2. Trong `post_work_answer`, nếu `body.approve == Some(true)` thì thêm `"--approve".to_string()` vào danh sách `args`.
3. Trong `apps/fgos-gateway/src/mcp.rs`, đăng ký thêm overload cho `answer_work` nhận `id: &str, text: &str, approve: bool`.
4. Trong `apps/fgos-gateway/web/src/api/client.ts`, cập nhật `answerWork: (id: string, text: string, approve?: boolean) => ...`.
5. Cập nhật `docs/contracts/fgos-gateway-api-v1.yaml` tại `/work/{id}/answer`.
6. Bổ sung unit tests trong Rust (`gateway.rs` và `mcp.rs`) kiểm tra việc gắn `--approve` khi `approve: true` và không gắn khi `false`/`None`.

## Success Criteria
- [x] `cargo test --bin fgos-gateway` passes toàn bộ suite.
- [x] `POST /work/{id}/answer` với `{"text": "...", "approve": true}` chuyển cờ `--approve` xuống `fgos answer`.
- [x] `answer_work(id, text, true)` trong Rhai chuyển cờ `--approve`.

## Risk Assessment
- Rủi ro: callers hiện tại của `answer_work` trong Rhai chỉ truyền 2 tham số.
- Giảm thiểu: giữ overload 2 tham số `answer_work(id, text)` chuyển tiếp như cũ, thêm overload 3 tham số.
