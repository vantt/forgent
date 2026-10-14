# Phase 05 — `workflow start --units` + `--effort` + persona một đường + nối nhánh cho unit ghi

Mốc M1: phần lõi ở bước B (song song 02, 03, 04; cần 01), phần CLI ở bước C (sau khi 04 merge) · Lane L5 (`feat/rununit-workflow`) · Ước lượng 1d lõi + 0.25d CLI · Rủi ro: trung bình

## Context

- Quyết định Lead #1, #2, #6 (Workflow: có outOfScope thì unit ra `findings`, không tích hợp); Lead sửa plan #6 (H5).
- **`--units` chưa có thật.** Skill `core/skills/fgos-run/SKILL.md:31` và RUL77 dạy cờ này, nhưng `bin/fgos.mjs:2171-2185` chỉ nhận `<workflowId>` hoặc `--plan`. Dòng skill có từ `6527596eb`, chỉ là doc.
- `startWorkflow` nạp định nghĩa từ `planPath` hoặc `workflowId` (`src/workflow/runner.mjs:786-793`). Nó cũng nhận định nghĩa trong bộ nhớ (`:783-785`).
- Worktree của unit ghi được tạo từ `createWorkflowWorktree({ baseRef = 'HEAD' })` (`src/workflow/integrate.mjs:33-56`). Workflow chỉ tích hợp ở step `kind: 'integrate'` (`runner.mjs:373-390`). Unit chưa tích hợp được giữ lại với lý do "branch not integrated" (`runner.mjs:220-262`).
- G2 của Workflow cấm `prefer` (`src/workflow/definition.mjs:14-22`). Persona của template đi qua override có origin `workflow` (`runner.mjs:190-200`).
- 01 đã cho `validateUnit` nhận `prefer` và `persona`, nên phần lõi không phải chờ 04.

## Requirements

### Lõi (bước B)

1. NEW `src/workflow/units-source.mjs`:
   - Đọc YAML hoặc JSON, dạng `{ id?, title?, units: [Unit...] }` hoặc một mảng Unit.
   - Mỗi Unit đi qua `validateUnit`.
   - Dựng định nghĩa tạm `id: units/<basename>`, mỗi Unit thành một step. `dependsOn` của Unit thành phụ thuộc giữa các step.
   - Gọi `validateWorkflow(def, { source: 'units-file' })`. Nguồn là **tham số của validator**, không phải một field trong dữ liệu (V-L10).
2. `definition.mjs`: cho phép `prefer` trong template **chỉ khi** `source === 'units-file'`. Preset và plan vẫn cấm. Lý do (Lead tự quyết): định nghĩa tái dùng được ship sang project khác, và preset đã có `--seats`/persona để chỉnh.
3. `runner.mjs`:
   - `unitData` mang `prefer` và `persona` của template.
   - Bỏ override persona cấp unit trong `unitOverridesOf`, giữ phần ghế `--seats`.
   - `params.effort` thành override `{reasoningEffort, origin:'human-cli'}` cho mọi unit, ghi vào state để resume dùng lại.
   - `commit.outOfScope` không rỗng thì unit ra `findings` (`out-of-scope-writes`) và nhánh không được tích hợp.
4. **Nối nhánh cho unit ghi (H5).** Thiết kế nhỏ nhất, chỉ sửa `runner.mjs` và tận dụng tham số `baseRef` đã có:
   - Unit ghi B phụ thuộc **đúng một** unit ghi A (trực tiếp, hoặc gián tiếp qua các unit chỉ đọc): worktree của B tạo với `baseRef` = nhánh của A, nên B thấy thay đổi của A.
   - B phụ thuộc **hai** unit ghi trở lên: từ chối lúc start, kèm thông điệp "gộp các unit này hoặc thêm step integrate". Không tự merge.
   - Output và `workflow status` liệt kê `branch` và `worktree` của từng unit ghi. Không tự merge vào trunk; người dùng merge nhánh cuối chuỗi.
   - **Lối lùi:** nếu phần này vượt 0.5d, M1 chỉ hứa `--units` chỉ đọc + unit ghi độc lập. Khi đó start từ chối unit ghi phụ thuộc unit ghi, ghi rõ trong CHANGELOG, và chuỗi này chuyển sang M2.
5. `index.mjs`: export `startWorkflow({ unitsPath, effort, ... })`.

### CLI (bước C, rebase sau khi 04 merge)

6. `bin/fgos.mjs` case `workflow start`: nhận `--units <file>` và `--effort <level>`. Dùng `--seats` cùng với `--units` thì báo lỗi.
7. Help trong `command-registry.mjs`, rồi chạy `node scripts/export-command-selectors.mjs --check`.

## Files

- **Lõi:** `src/workflow/{definition,runner,index}.mjs`, NEW `src/workflow/units-source.mjs`, manifest, NEW `test/workflow/units-source.test.mjs`, test runner của workflow. `integrate.mjs` chỉ đọc (đã có `baseRef`).
- **CLI:** `bin/fgos.mjs` (case `workflow`), `command-registry.mjs`, `test/cli/*workflow*`.
- Chỉ đọc: `unit.mjs`, `bind.mjs`, `plan-source.mjs`, `seats.mjs`.

## Bước

1. Test đỏ `units-source`:
   - 2 Unit, có phụ thuộc: ra đúng thứ tự step.
   - Vi phạm G2: báo lỗi.
   - `prefer` được giữ.
   - Preset có `prefer`: lỗi.
   - Dữ liệu tự khai `source`/`origin`: không có tác dụng.
2. Test đỏ runner:
   - `prefer` và `persona` đi vào `unitData`.
   - `--seats` vẫn ghim persona theo ghế.
   - `effort` thành override.
   - outOfScope làm unit ra `findings`.
   - B ghi phụ thuộc A ghi: worktree của B có commit của A, output liệt kê 2 nhánh.
   - Phụ thuộc 2 unit ghi: từ chối lúc start.
3. Code cho xanh, merge lõi.
4. Sau khi 04 merge: rebase, làm phần CLI, thêm test CLI.
5. Chạy `npm test`. Báo cáo: Spec delta (vào decision 0061) và CHANGELOG delta.

## Rủi ro + rollback

- Provenance persona đổi từ `override:workflow` sang `unit`. Test cũ khoá provenance phải cập nhật có chủ đích, kèm lý do.
- `baseRef` là nhánh của A: nếu A bị chạy lại (resume) sau khi B đã tạo worktree, B đang đứng trên tip cũ của A. Ghi residual; `workflow status` hiện sha base của B.
- Rollback: revert commit của lane.

## Xong khi

- Ca ở bước 1-2 xanh; `npm test` exit 0; review pass.
- Ca 4-6 của G-M1 đạt (ở [phase-07a](phase-07a-doctrine-additive.md#cổng-g-m1-lead)).
