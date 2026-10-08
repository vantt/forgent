---
title: "Mọi cửa trả lời đều phân biệt đồng thuận và làm rõ (approve on every answer door)"
status: completed
created: 2026-10-08
budget: "src: dòng thêm ≤ 180, dòng xoá không giới hạn; test ≤ 250 dòng; ≤ 1,5 ngày. Vượt thì dừng và hỏi theo mẫu."
paths: [apps/fgos-gateway/src/gateway.rs, apps/fgos-gateway/src/mcp.rs, apps/fgos-gateway/web/src/api/client.ts, docs/contracts/fgos-gateway-api-v1.yaml, src/verbs/state/move.mjs, bin/fgos.mjs, src/cli/command-registry.mjs, src/workflow/runner.mjs, src/workflow/store.mjs, src/workflow/definition.mjs, docs/specs/runner.md, docs/specs/herdr-web-dashboard.md, CHANGELOG.md, test/]
---

# Mọi cửa trả lời đều phân biệt đồng thuận và làm rõ (approve on every answer door)

## Bối cảnh & Vấn đề

Nhánh `plan/261008-decision-question-template` (head `cff70a5f4`) đã chốt quy tắc cho cửa CLI work-item: `fgos answer <id> --approve` mới nhả các consent gate (heavy-risk, blast-radius split gate); trả lời không có `--approve` là lời làm rõ và item tiếp tục đỗ (`awaiting-human`).

Tuy nhiên, các cửa trả lời khác vẫn còn lỗ hổng:
1. **Gateway REST & MCP**: `post_work_answer` (`apps/fgos-gateway/src/gateway.rs` ~946-955) và `answer_work` (`apps/fgos-gateway/src/mcp.rs` ~283-288) gọi `answer <id> --text ... --json` mà không có cờ `--approve`. Khi một heavy-risk gate được trả lời từ dashboard hoặc MCP, nó sẽ bị re-park vĩnh viễn (hoặc không bao giờ mở được gate).
2. **CLI `fgos move --answer`**: `src/verbs/state/move.mjs` (~55) và `bin/fgos.mjs` case `move` không nhận hoặc chuyển tiếp cờ `--approve`, dù FSM và store đã hỗ trợ `approved`.
3. **Workflow human gates**: `recordGateAnswer` (`src/workflow/runner.mjs` ~825-851) ghi nhận bất kỳ câu trả lời nào, đổi step sang `answered` và runner tiến bước. Một câu trả lời "chưa hiểu, giải thích lại" cũng vô tình giải phóng cổng an toàn!

Nguyên tắc: **Một tín hiệu đồng thuận duy nhất cho mọi cửa**. Tái dùng trường `approved` và ngữ nghĩa đã có, không tạo cơ chế đồng thuận thứ hai.

## Các giai đoạn (Phases)

| # | Phase | Trạng thái | File |
|---|---|---|---|
| 01 | Cửa Gateway REST, MCP & Client (`approve: bool` → `--approve`) | Completed | [phase-01-start.md](./phase-01-start.md) |
| 02 | Cửa CLI `fgos move --answer --approve` | Completed | [phase-02-cli-move-door.md](./phase-02-cli-move-door.md) |
| 03 | Cổng Workflow Human Gate: đồng thuận & ngữ nghĩa non-approve | Completed | [phase-03-workflow-gate-consent.md](./phase-03-workflow-gate-consent.md) |
| 04 | Cập nhật Specs, Docs & Kiểm chứng toàn diện | Completed | [phase-04-specs-docs-and-verification.md](./phase-04-specs-docs-and-verification.md) |

## Acceptance Criteria

1. **Gateway REST**: `POST /work/{id}/answer` nhận JSON `{ text: string, approve?: boolean }`. Nếu `approve: true`, CLI child process nhận cờ `--approve`. Hợp đồng OpenAPI `docs/contracts/fgos-gateway-api-v1.yaml` được cập nhật. Client `apps/fgos-gateway/web/src/api/client.ts` hỗ trợ tham số `approve?: boolean`.
2. **Gateway MCP**: Rhai engine cung cấp `answer_work(id, text, approve)` (overload kèm hàm `answer_work(id, text)` hiện tại mặc định approve = false), chuyển tiếp `--approve` khi `approve == true`.
3. **CLI move**: `fgos move <id> --to todo --answer "..." --approve` chuyển tiếp `approved: true` qua `moveUseCase` vào `moveWork`, ghi nhận `approved: true` vào event payload và view gate.
4. **Workflow gate**: `fgos workflow answer <id> --step <stepId> --answer "..." [--approve]` chuyển tiếp `--approve`.
   - Với cổng đòi hỏi đồng thuận (consent gate): trả lời không có `--approve` ghi nhận clarification note vào `gate-answers/<stepId>.md` và event payload, step **giữ trạng thái `parked`** (runner không tiến bước). Chỉ khi có `--approve`, step mới chuyển sang `answered` và runner tiến bước.
5. **Khung đã duyệt & Ngân sách**: Diff không vượt quá `paths` và `budget` (src thêm ≤ 180 dòng; test ≤ 250 dòng; ≤ 1,5 ngày).
6. Toàn bộ test suite liên quan (`cargo test --bin fgos-gateway`, `npm test test/cli/`, `npm test test/workflow/`) xanh.

## Quyết định của Owner (2026-10-08)

| # | Câu hỏi | Quyết định |
|---|---|---|
| D1 | Phân loại Workflow Human Gate | **Phương án 2 (Mặc định fail-closed đòi `--approve`, hỗ trợ `mode: 'input'`)**: Mặc định mọi human gate đều là consent gate và chỉ nhả khi có `--approve`. Trả lời không có `--approve` là lời làm rõ, giữ `parked`. Cổng nào chủ động khai `mode: 'input'` thì câu trả lời nội dung là đủ để tiến bước. |

## Red Team Review

### Findings & Dispositions

1. **Finding 1 (Sev: High) — Lưu trữ lời làm rõ của Workflow gate khi chưa approve**:
   - *Rủi ro*: Hiện tại `writeGateAnswerFile` ghi đè `gate-answers/<stepId>.md`. Nếu có nhiều lượt trao đổi làm rõ trước khi được duyệt, việc ghi đè sẽ làm mất nội dung thảo luận trước đó.
   - *Xử lý*: Giữ toàn bộ lịch sử các lượt làm rõ (append các lượt với timestamp và đánh dấu `Clarification:` vs `Approval: granted`) trong `gate-answers/<stepId>.md`.
2. **Finding 2 (Sev: High) — Tương thích các test workflow hiện hữu**:
   - *Rủi ro*: Các test workflow (`test/workflow/workflow-runner.test.mjs`, `test/workflow/discussion-workflows.test.mjs`) đang gọi `answerWorkflow` hoặc `fgos workflow answer` không có cờ `--approve`. Nếu mọi human gate đều yêu cầu `--approve`, các test này sẽ thất bại.
   - *Xử lý*: Phụ thuộc vào quyết định của Owner ở câu hỏi D1 bên dưới. Nếu mọi gate đều đòi hỏi approve, test sẽ được cập nhật `--approve`. Nếu có phân loại consent gate vs input gate, chỉ các consent gate mới đòi hỏi `--approve`.
3. **Finding 3 (Sev: Medium) — MCP Rhai function overloading**:
   - *Rủi ro*: Rhai trong Rust không hỗ trợ optional parameters trong chữ ký hàm.
   - *Xử lý*: Đăng ký 2 hàm `answer_work` cùng tên nhưng khác số lượng tham số (arity: 2 và 3). Overload 2 tham số gọi mặc định `approve = false`.
4. **Finding 4 (Sev: Low) — Giới hạn ngân sách (Budget guard)**:
   - *Kiểm tra*: Dự kiến thêm ~110 dòng src (ngân sách ≤ 180 dòng) và ~150 dòng test (ngân sách ≤ 250 dòng). An toàn trong khung ngân sách.

## Whole-Plan Consistency Sweep

Đã quét toàn bộ `plan.md` và 4 phase:
- Không có mâu thuẫn thuật ngữ: thống nhất dùng cờ `--approve`, trường `approved: boolean`, trạng thái `parked` và `answered`.
- Nhất quán về một cơ chế đồng thuận duy nhất (không tạo cơ chế đồng thuận thứ hai, tái dùng `approved` của D-ADR0030 / commit `02dd11f59`).
- Đợi quyết định của Owner đối với câu hỏi mở D1 để chốt chi tiết thi công Phase 03.
