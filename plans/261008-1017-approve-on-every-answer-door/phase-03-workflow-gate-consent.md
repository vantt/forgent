---
phase: 3
title: "Cổng Workflow Human Gate: đồng thuận & ngữ nghĩa non-approve"
status: completed
priority: P1
effort: "6h"
dependencies: []
---

# Phase 3: Cổng Workflow Human Gate: đồng thuận & ngữ nghĩa non-approve

## Overview
Đưa cờ `--approve` vào lệnh `fgos workflow answer` và thiết lập cơ chế phân định rõ ràng giữa lời làm rõ (clarification/non-approve) và sự đồng thuận (approval) đối với Workflow human gates.

## Requirements
- Functional:
  - `bin/fgos.mjs` tại `sub === 'answer'` của `workflow`: parse cờ `--approve` (`flags.approve === true || flags.approve === 'true'`) và chuyển vào `answerParams`.
  - `src/workflow/runner.mjs`:
    - `answerWorkflow` và `answerWorkflowDetached` tiếp nhận `params.approved`.
    - `recordGateAnswer` ghi nhận `approved: Boolean(params.approved)` vào payload của `gate.answer`.
    - Ghi chú trong file `gate-answers/<stepId>.md` phản ánh rõ trạng thái: `Approved: yes` hoặc `Approved: no (clarification note)`.
  - `src/workflow/store.mjs`:
    - Chiếu sự kiện `gate.answer`:
      - Khi gate đòi hỏi phê duyệt (consent gate): nếu `p.approved !== true`, câu trả lời được ghi lại vào `step.notes` hoặc `step.lastClarification`, nhưng step **vẫn giữ `status: 'parked'`** và question **không bị xóa khỏi `questions`**. Runner do đó không tiến bước.
      - Khi `p.approved === true` (hoặc với gate thuần thu thập thông tin nếu theo quyết định của Owner): step chuyển sang `status: 'answered'`, câu hỏi được gỡ khỏi `questions`, và nếu không còn câu hỏi treo, run chuyển về `status: 'running'` để runner tiến bước.
- Non-functional:
  - Tái dùng trường `approved` và quy ước boolean, không phát minh cơ chế đồng thuận thứ hai.
  - Bảo lưu toàn bộ lịch sử câu hỏi/lời giải thích làm rõ trong thư mục run.

## Related Code Files
- Modify: `bin/fgos.mjs`
- Modify: `src/workflow/runner.mjs`
- Modify: `src/workflow/store.mjs`
- Modify/Extend: `src/workflow/definition.mjs` (nếu phân loại gate theo quyết định của Owner)
- Create/Modify: `test/workflow/workflow-runner.test.mjs`
- Create/Modify: `test/workflow/discussion-workflows.test.mjs`

## Implementation Steps
1. Sửa `bin/fgos.mjs`:
   Trong khối `sub === 'answer'`, thêm:
   `const approved = flags.approve === true || flags.approve === 'true';`
   và truyền vào `answerParams: { stepId, answer, approved, repoRoot: flags.dir, worktree: flags.worktree }`.
2. Sửa `src/workflow/runner.mjs`:
   - Cập nhật `recordGateAnswer` để ghi nhận `approved: params.approved === true` trong `appendWorkflowEvent`.
   - Cập nhật `writeGateAnswerFile` ghi rõ trạng thái phê duyệt (Approval: granted vs clarification note).
3. Sửa `src/workflow/store.mjs`:
   - Trong `projectWorkflowState`: khi xử lý `gate.answer`, kiểm tra điều kiện phê duyệt của gate. Nếu là gate đòi hỏi đồng thuận và `p.approved !== true`, giữ nguyên `status: 'parked'` cho step và duy trì question trong mảng `questions`.
4. Viết tests trong `test/workflow/workflow-runner.test.mjs`:
   - Test 1: Human gate với câu trả lời thông thường (không `--approve`) → step vẫn `parked`, run vẫn `parked`, file answer ghi nhận lời làm rõ.
   - Test 2: Tiếp tục gửi câu trả lời kèm `--approve` → step chuyển `answered`, run tiếp tục chạy hoàn thành workflow.
   - Test 3: CLI `fgos workflow answer <id> --step <step> --answer "..." --approve` tiến bước thành công.

## Success Criteria
- [x] `fgos workflow answer` hỗ trợ `--approve`.
- [x] Câu trả lời không có `--approve` ở consent gate không làm runner chạy tiếp ngoài ý muốn.
- [x] Câu trả lời kèm `--approve` giải phóng gate và cho phép runner tiến bước.
- [x] Mọi test workflow hiện hữu được cập nhật tương thích và chạy xanh.

## Risk Assessment
- Rủi ro: Có 4 workflow hiện hữu trong repo có khai báo `gate`. Cần đảm bảo các bài test cũ cho các workflow này không bị gãy hoặc được cập nhật rõ ràng nếu gate của chúng đòi `--approve`.
- Giảm thiểu: Rà soát 4 file workflow (`business-discussion.yaml`, `nominal-group.yaml`, `feature.yaml`, `content-publish.yaml`) và các test tương ứng (`test/workflow/*.test.mjs`).
