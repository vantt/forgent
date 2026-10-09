# Semantic CLI Surface for Agent Coordination

```txt
Document type: Architecture Proposal
Audience: Human reviewer, maintainer and implementation agent
Purpose: Navigate preserved design and historical material without asserting a retired runtime
Design status: Candidate
Implementation: Retired engine material is non-authority history; verified retained units remain unchanged
Provenance: Reframed under owner A15; complete previous document preserved in history/retired-engine
Writer type: Human + agent coauthor
Canonical for: Retained-document navigation only; no current engine authority
Use this when: Locating current execution owners or auditing historical claims
Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation
Last reviewed: Pending independent reframe review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
- docs/platform/agent-coordination/history/retired-engine/proposals/semantic-cli-surface.md
Supersedes: Stale current-state framing only; all old claims are preserved verbatim
Superseded by: Runtime ownership in docs/specs/runner.md
Added in candidate: Retirement framing and current-owner navigation
```

## 1. Vấn đề (The Problem)

Historical content moved verbatim to the [retired-engine snapshot](../history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.

Historical content moved verbatim to the [retired-engine snapshot](../history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.

## 2. Giải pháp Kiến trúc (The Solution)

Historical content moved verbatim to the [retired-engine snapshot](../history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.

**Nguyên lý cốt lõi:**
- **Human-Agent Parity:** Cả người và máy đều gọi chung lệnh CLI. Giữ `--json` ở output (`status`) làm contract chuẩn cho máy đọc.
- **Không có MCP Wrapper mới:** Cấm đẻ thêm MCP Tools bọc ngoài cho riêng Agent Coordination (tránh mâu thuẫn với `dispatch.mjs`). CLI là cửa duy nhất.
- **Tính Deterministic:** CLI tự sinh Key an toàn, tuyệt đối không dùng Random UUID.
- **An toàn đột biến (Mutation Safety):** Mọi verb có khả năng ghi/chạy mã đều BẮT BUỘC có cờ `--cwd` tường minh, cấm dùng ambient cwd của shell.

## 3. Các Sửa Đổi Tầng Engine (Core Fixes)

Historical content moved verbatim to the [retired-engine snapshot](../history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.

Historical content moved verbatim to the [retired-engine snapshot](../history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.

## 4. Bề Mặt CLI Mới (10 Verbs + 1 View)

Hệ thống sẽ cung cấp 10 verb cấp cao (Các lệnh thay đổi state bắt buộc có `--cwd`):

1. `start` (Mở session thuần túy)
2. `authorize-and-dispatch` (Gộp 2 bước thành 1 transaction JSON an toàn)
3. `operation` (Thực thi node)
4. `fan-out` (Thực thi song song)
5. `contribution` (Link kết quả)
6. `human-turn` (Ghi nhận input người)
7. `reveal` (Mở khóa Visibility Window)
8. `disposition` (Ghi nhận phán quyết - Phụ thuộc từ vựng YAML)
9. `close` (Đóng tường minh)
10. `recover` (Cứu kẹt session)

Và 1 View: `status` (Trả về `--json` chuẩn cho LLM).

## 5. Lộ trình Triển khai (Execution Order)

Historical content moved verbatim to the [retired-engine snapshot](../history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot). The engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; this retained section is not a current runtime description.
