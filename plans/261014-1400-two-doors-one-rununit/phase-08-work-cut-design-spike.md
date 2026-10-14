# Phase 08 — Spike thiết kế cắt Work (chỉ đọc)

Mốc M1, bước A (song song 00, 01) · Lane L8 (phiên interactive, worktree `rununit-spike`, chỉ ghi `reports/`) · Ước lượng 0.75d · Không sửa code

## Vì sao có spike

R3 đụng tới `loop.mjs` và `operation-choice.mjs` (Work loop). Red-team R-C1, R-H1 và R-H2 cho thấy D8 làm theo kiểu ngây thơ sẽ gây ba lỗi: Work mất dấu verdict, hash `plan.md` lấy ở một gốc nhưng so ở gốc khác, và rigor bị hạ. Spike chốt API trên giấy. **P10 không được bắt đầu khi câu 2, 3, 8 chưa có câu trả lời Lead đã duyệt** (Lead sửa plan #4). P09 cần câu 6, 9, 10.

## Context

- Quyết định Lead #5. RUL73 (`docs/specs/runner.md:1077-1081`).
- Inventory thô (grep 2026-10-14, `src/runner/dispatch/**`):

| Chỗ đọc | Dòng | Đọc gì |
|---|---|---|
| `assignment.mjs` `buildAssignment({work,...})` | 255, 396-402, 517 | `work.docsRef` (cộng `plan.md`, `CONTEXT.md`), `work.refs`, `work.domain`, `work?.workflowStep` |
| `assignment-policy.mjs` | 225-229, 235-240, 245-251, 257 | `opPolicy.rigor`, `work.rigor`, `work.risk === 'heavy'` → high (D18), `work.domain` |
| `plan.mjs` `compileDispatchPlan` | 34-164, 417 | `workItem`, `workItem.agentType` |
| `cli.mjs` | 382, 506, 784 (`executeExecutorCli` destructure `work`, `!work`, `work?.id`); 995-1058, 1391 (decide) | `work`, hook `resolveWork` → `workItem` |
| `assignment-runner.mjs` | 257, 1126, 1449-1461, 1531-1541, 1798, 2680 | `opts.work.refs`, `workItem: opts.work`, hash `plan.md` theo `resolveContentRoot`, chuyển tiếp `opts.work` |
| `operation-choice.mjs` (Work, bên dùng) | 104-140, 360, 783-810 | `findLatestAssignmentRunResult` chỉ duyệt layout phẳng `.fgos/assignments/<id>/assignment.json` và lọc theo `workId`/`stage`/`resultKind`; so `planContentHash` |

## Câu hỏi và mặc định

1. **D8 qua runUnit mang ngữ nghĩa operation thế nào?**
   - Mặc định: runUnit nhận tuỳ chọn `declared: {workId, domain, workflow, stage, operation, operations}` (dữ liệu mà RUL73.1 đã cho phép) và lưu vào `unit.json`.
   - `dispatchBound` stamp assignment qua **cùng** `assignment-normalizer.mjs`, để `mutation`, `evidence.required`, `resultKind`, `onAdvance` vẫn theo operation như hôm nay.
   - Dispatch vẫn kiểm `operation ∈ operations` và vẫn render prompt theo operation.
   - Cổng mutating (RUL73.4) vẫn phải khớp.
2. **`pinInputs` tính từ gốc nào (R-H1)?**
   - Mặc định: Work phân giải **đường dẫn tuyệt đối** theo đúng thứ tự `resolveContentRoot` (cwd → worktree item → stateRoot, `src/runner/paths.mjs:223-243`), rồi truyền `pinInputs: [<abs>/plan.md]`.
   - Dispatch chỉ băm đúng đường đó. Gốc được phép: `mainRoot` cộng các worktree mà `git worktree list` liệt kê. Ngoài tập đó thì digest là `null` và có cảnh báo.
   - Work so sánh bằng cùng đường tuyệt đối, cũng theo `resolveContentRoot`.
   - Spike phải trả lời thêm: `fgos plan --validate` chạy với `cwd: contentRoot` (`src/verbs/state/step.mjs:73-79`). Khi đi qua runUnit thì cwd hoặc worktree của Unit read-only là gì?
3. **Rigor đi vào Unit thế nào (R-H2)?**
   - Liệt kê **mọi** nguồn rigor hôm nay: `opPolicy.rigor`, `work.rigor`, `work.risk === 'heavy'` (D18), sàn của capability, `mutatingMinRigor`, và nguồn khác nếu có.
   - Mặc định: Work tính rigor cuối cùng từ mọi nguồn rồi đặt `unit.rigor`. `dispatchBound` ghi `assignment.rigor`. Policy dispatch không bao giờ hạ dưới giá trị đó.
   - Cần nêu rõ nguồn nào ở lại dispatch vì là ngữ nghĩa capability (vd sàn capability), và nguồn nào chuyển sang Work.
4. **`work.refs` và `docsRef` → contextRefs.** Work đưa vào `unit.inputs` dưới dạng đường dẫn đã phân giải.
5. **`decide --work`.** Resolver ở `bin` trả hint generic `{workExecutorId, capabilityHints, agentType, rigor, stage}`.
6. **Helper `workUnitFor(item, {feedback?, operation?})`** đặt trong `work-dispatch.mjs` (V-M4). Đây là chỗ duy nhất dựng `unitData` từ Work item, dùng chung cho fanout, `spawnWorker` và driver. Spike chốt chữ ký của helper.
7. **Phương án B của 00** (reason `validation-correlated-mutation-do-not-advance-work`) vẫn đúng khi kết quả đến từ runUnit (`runResult.warnings` giữ nguyên).
8. **Work tìm lại kết quả validate-plan thế nào (R-C1)?**
   - Liệt kê **mọi walker** đang đọc `.fgos/assignments` để lấy kết quả driver. Ký ức đội: có từ 7 walker trở lên, đọc cả layout phẳng lẫn layout lồng.
   - Mặc định: Work ghi `unitRunId` của mỗi lần chạy operation vào event hoặc state của item, rồi đọc thẳng `.fgos/assignments/<unitRunId>/` (`unit-summary.json` hoặc `result.json` của producer cuối), không quét.
   - Nếu buộc phải quét: walker phải hiểu layout lồng và lọc theo `declared`.
   - Phải định nghĩa test chu trình đầy đủ: driver chạy validate-plan qua runUnit, rồi lượt `decide`/`chooseStageOperation` kế tiếp thấy verdict và tiến cạnh.
9. **Transport herdr trong loop (R-M7).** Khi runUnit chọn herdr thì `stdout.log` có thể không có. Hỏi: loop lấy `lastWorkerOutput` từ đâu (report hay claim)?
10. **Đồng thời trong loop (R-M7).**
    - `reapOrphanedConfinementResources` chạy ở mỗi lần gọi runUnit (`run.mjs:158`). Có dọn nhầm home của worker khác đang chạy không?
    - Khoá cwd treo tới TTL khi runner bị SIGKILL.

## Việc

1. Đọc các chỗ trong bảng, cùng `loop.mjs:978,1077,1102-1130,1505,1614,1902`, `work-dispatch.mjs:96-321`, `operation-choice.mjs:2161-2300`, `step.mjs:73-79`, `paths.mjs:223-243`.
2. Với mỗi câu: xác nhận mặc định, hoặc đưa bằng chứng `file:line` vì sao không dùng được. Ghi API cuối, các test hiện có khoá hành vi (stale-plan: `operation-choice.test.mjs:3140, 3193, 4622, 4686, 4710, 4807`), và file mà mỗi lane 09/10/11 sở hữu.
3. Nếu hai phương án ngang nhau thật thì hỏi `kongming` (đưa task, bằng chứng, các phương án, câu hỏi cụ thể) trước khi chuyển cho Lead.
4. Ghi kết quả vào `reports/r3-work-cut-design-<YYMMDD-HHMM>.md`. Lead duyệt một lượt.

## Xong khi

- Có API cuối cho cả 10 câu.
- Có bảng file × lane.
- Có danh sách test khoá hành vi.
- Lead đã ghi "duyệt" trong báo cáo.
