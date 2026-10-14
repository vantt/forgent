# Phase 11 — Gỡ input mang hình Work khỏi dispatch + guard ngữ nghĩa + cổng G-M2

Mốc M2, bước H (sau khi 06, 09, 10 merge) · Lane L11 (`feat/rununit-guard`) · Ước lượng 1d + 0.25d cổng · Rủi ro: cao · Red-team bắt buộc

## Context

- Quyết định Lead #5; reviewer F1, red-team RT-R4-1, validate V-M7; inventory ở báo cáo spike 08.
- Sau 09/10 không còn caller Work nào gọi thẳng dispatch, nên các tham số Work trong dispatch không còn ai dùng. Nguồn của `opts.work` là `workDispatchContext` (`work-dispatch.mjs:315`), hàm này trả cả object `work`.

## Requirements

1. Xoá khỏi `src/runner/dispatch/**`:
   - Tham số `work` của `buildAssignment` (`assignment.mjs:255,396-402,517`).
   - `work.rigor`, `work.risk`, `work.domain` trong `assignment-policy.mjs:225-257`: đổi sang `assignment.rigor`/`assignment.domain`. 10 đã chuyển D18 và các nguồn rigor khác sang Work; luật monotonic giữ ở dispatch, tức không hạ dưới `assignment.rigor`.
   - `workItem` trong `plan.mjs`: đổi sang hint generic.
   - `resolveWork` trong `cli.mjs:995-1058`: trả hint thay cho object Work.
   - Tham số `work` của `executeExecutorCli` (`cli.mjs:~382,~506,~784`).
   - `opts.work` trong `assignment-runner.mjs` (257, 1126, 1449-1461, 1531-1541, 1798, 2680), kể cả nhánh hash `docsRef`.
2. `workDispatchContext` không trả `work` nữa. `resolveWorkForDispatch` trả hint. Resolver `decide --work` trong `bin` cũng trả hint.
3. Thêm guard ngữ nghĩa vào `test/architecture.test.mjs`, cạnh các test A4.
   - Tập canh gác: `src/runner/dispatch/**`, `src/runner/execution/**`, `src/runner/dispatch.mjs`, `src/workflow/**`. Bỏ qua dòng comment.
   - Mẫu cấm:
     - `\bopts\??\.work\b`, `\bworkItem\b`, `\bdocsRef\b`;
     - `\bwork\??\.` (bắt cả `work?.`, theo V-M7);
     - destructure có `work`: `\{[^}]*\bwork\b[^}]*\}\s*=` và tham số hàm tên `work`;
     - `resolveContentRoot\(`.
   - Kèm fixture vi phạm để chứng minh guard bắt được.
4. Allowlist `R3_PENDING_WORK_CALLERS` phải rỗng, sau đó xoá hằng này. Test call-site chuyển sang dạng tuyệt đối:
   - `commitUnitWork` chỉ được gọi từ `execution/run.mjs`;
   - `executeExecutorCli` chỉ từ `dispatch/assignment-runner.mjs`;
   - `executeAssignment` chỉ từ `execution/run.mjs` và `dispatch/cli.mjs` (probe-account);
   - `executeThroughConfinement` chỉ từ các file dispatch đã ghi đích danh ở 06.
5. Spec + CHANGELOG (L11 giữ): viết decision **0063 — Work chỉ là bên dùng: dispatch nhận input generic**.
   - Thay phần còn lại của RUL73.2, gắn nhãn.
   - Ghi cổng R3 đã đạt kèm bằng chứng.
   - Chạy `npm run fgos:dev -- decision-index`.

## Files

Sở hữu: `src/runner/dispatch/{assignment,assignment-policy,plan,assignment-runner,cli}.mjs`, `src/runner/work-dispatch.mjs`, `bin/fgos.mjs` (resolver), `test/architecture.test.mjs`, các test dispatch liên quan, `docs/specs/runner.md`, `docs/decisions/index.md`, `CHANGELOG.md`.

Chỉ đọc: `operation-choice.mjs`, `loop.mjs`.

## Bước

1. Chạy impact cho `buildAssignment`, `resolveAssignmentDispatchPolicy`, `compileDispatchPlan`, `executeAssignment`, `executeExecutorCli`.
2. Viết test đỏ:
   - guard ngữ nghĩa: đỏ trên main hiện tại, liệt kê đúng các dòng trong inventory;
   - call-site tuyệt đối;
   - rigor qua `assignment.rigor`, có ca `risk: heavy`;
   - `decide --work` trả cùng executor với trước khi đổi.
3. Xoá/đổi code tới khi xanh. Chạy `npm test`.
4. Cập nhật spec, CHANGELOG, index.

## Đòn red-team (sàn)

1. Lách guard bằng các cách sau: `opts['work']`, `const w = opts.work`, `assignment.provenance.work`, re-export qua file nằm ngoài tập canh gác, `import()` động.
2. Dữ liệu cũ trên đĩa (có `workId`/`planContentHash`) vẫn đọc được qua `fgos dispatch inspect` và `reconcile`.
3. Rigor truyền vào thấp hơn sàn của capability: policy không hạ xuống.
4. `decide --work` với item có `agentType` riêng.
5. Chạy lại test của 00 và 10 (stale-plan, Work-advance-B, chu trình đầy đủ).

## Cổng G-M2 (Lead)

1. Kiểm tự động:
   - `rg -n "R3_PENDING_WORK_CALLERS" test` → 0;
   - guard import, call-site, ngữ nghĩa đều xanh;
   - `rg -n "executeThroughConfinement\(|executeAssignment\(|commitUnitWork\(|executeExecutorCli\(" src/runner/loop.mjs src/runner/work-dispatch.mjs src/runner/operation-choice.mjs src/runner/fanout-batch.mjs` → 0.
2. Hồi quy trong `WTP` mới (đọc transcript): ca 1, 4, 6, 7, 8 của G-M1; ca 1 và 4 của G2.
3. Đường Work thật: nếu có Work item an toàn, chạy `npm run fgos:dev -- plan <id> --validate` (V-M9) và `fgos-runner --once` cho một item. Kỳ vọng: có `unit.json`, event có `unitRunId`, runner commit, và lượt kế tiếp thấy verdict. Không có item an toàn thì ghi UNPROVEN cho đường thật.
4. Ghi kết quả vào `reports/gate-m2-<YYMMDD-HHMM>.md`. Chỉ đổi `plan.md` sang `completed` khi bước 1-2 đạt.

## Rủi ro + rollback

- `assignment-runner.mjs` lớn (136K, nhiều luồng): chạy impact trước khi sửa, chạy full suite.
- Rollback: revert commit của lane.

## Xong khi

- Requirements 1-5 xong.
- G-M2 đạt bước 1-2.
- `npm test` exit 0; red-team sạch.
- Báo cáo cuối ghi rõ một trong hai: "N1/N2 delivered, Work separation complete", hoặc ghi phần còn thiếu.
